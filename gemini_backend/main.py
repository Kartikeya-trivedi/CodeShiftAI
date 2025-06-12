import asyncio
import sys
from prompts import instructions
from pathlib import Path
from agno.agent import Agent
from agno.tools.file import FileTools
from agno.models.google import Gemini
from agno.tools.python import PythonTools
from agno.tools.mcp import MCPTools
from dotenv import load_dotenv
import os
import io
import contextlib
import re
from agno.vectordb.pineconedb import PineconeDb
from agno.embedder.google import GeminiEmbedder
from agno.storage.sqlite import SqliteStorage

def clean_response(raw_text: str) -> str:
    # Remove ANSI escape sequences
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    text = ansi_escape.sub('', raw_text)

    # Optionally remove box-drawing characters (┏━┃┗ etc.)
    text = re.sub(r'[┏━┓┃┗┛]', '', text)

    # Trim extra whitespace
    text = "\n".join([line.strip() for line in text.splitlines() if line.strip()])
    return text

load_dotenv()

api_key = os.getenv("PINECONE_API_KEY")
index_name = "CODESHIFTAI_VDB"

# Create a storage backend using the Sqlite database
storage = SqliteStorage(
    # store sessions in the ai.sessions table
    table_name="agent_sessions",
    # db_file: Sqlite database file
    db_file="tmp/data.db",
)

# Initialize Gemini Embedder once for the whole application
gemini_embedder = GeminiEmbedder(api_key=os.getenv("GEMINI_API_KEY"))

vector_db = PineconeDb(
    name=index_name,
    dimension=768,  # Gemini embeddings are 768-dimensional
    metric="cosine",
    spec={"serverless": {"cloud": "aws", "region": "us-east-1"}},
    api_key=api_key,
    use_hybrid_search=True,
    hybrid_alpha=0.5,
    embedder=gemini_embedder  # Explicitly pass the embedder
)

def load_files_to_vector_db(directory_path, file_extensions=None):
    """
    Load files from a local directory into the vector database using Gemini embeddings.

    Args:
        directory_path: Path to the directory containing files
        file_extensions: List of file extensions to include (defaults to common source files)
    """
    if file_extensions is None:
        file_extensions = ['.py', '.js', '.ts', '.html', '.css', '.jsx', '.tsx', '.json', '.md']

    # Use the global embedder instance
    global gemini_embedder

    files_added = 0
    batch_ids = []
    batch_texts = []
    batch_metadata = []

    for root, _, files in os.walk(directory_path):
        for file in files:            # Skip hidden files and directories
            if file.startswith('.') or any(part.startswith('.') for part in Path(root).parts):
                continue

            if not any(file.endswith(ext) for ext in file_extensions):
                continue

            file_path = os.path.join(root, file)
            try:
                # Try UTF-8 first, but fall back to Latin-1 which should always work
                # (may not decode correctly but won't raise an error)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                except UnicodeDecodeError:
                    with open(file_path, 'r', encoding='latin-1') as f:
                        content = f.read()
                        print(f"Warning: File {file_path} required fallback encoding.")

                # Chunking
                chunks = [content[i:i+4000] for i in range(0, len(content), 4000)] or [content]

                for i, chunk in enumerate(chunks):
                    uid = f"{file_path}_{i}"
                    batch_ids.append(uid)
                    batch_texts.append(chunk)
                    batch_metadata.append({
                        "source": file_path,
                        "chunk": i,
                        "content_type": file.split('.')[-1]
                    })

                files_added += 1
                if files_added % 10 == 0:
                    print(f"Prepared {files_added} files for embedding...")

            except Exception as e:
                print(f"Error processing file {file_path}: {e}")
                
    # Embed all chunks in batch
    if batch_texts:
        print(f"Embedding {len(batch_texts)} chunks with Gemini...")

        # Try different method name - embed_documents is commonly used in embedders
        embeddings = gemini_embedder.get_embedding(batch_texts)

        vector_db.add(
            ids=batch_ids,
            texts=batch_texts,
            embeddings=embeddings,
            metadatas=batch_metadata
        )
    print(f"✅ Successfully added {len(batch_ids)} chunks from {files_added} files to Pinecone.")

    return files_added

# Initialize with the current working directory
# This ensures only relevant context is used from where the script is run
current_directory = os.getcwd()  # Get the current working directory
print(f"Default working directory: {current_directory}")

# Function to load files only when requested
def load_context(workspace_path=None):
    """Load the specified workspace directory or current working directory into the vector database."""
    target_directory = workspace_path if workspace_path and os.path.exists(workspace_path) else current_directory
    print(f"Loading files from {target_directory} into vector database...")
    return load_files_to_vector_db(target_directory)

def clear_vector_db():
    """Clear all files from the vector database to start fresh in next session."""
    try:
        print("Clearing vector database...")
        # Delete all vectors from the index
        vector_db.delete(delete_all=True)
        print("✅ Vector database cleared successfully.")
    except Exception as e:
        print(f"Error clearing vector database: {e}")

# Only connect the vector database as knowledge base after user requests it
knowledge_base = None

async def run_agent(message: str, workspace_path: str = None) -> str:
    """Run the universal coding assistant agent and return the response as string."""

    global knowledge_base
    file_path = str(Path(__file__).parent)

    # Check if the user wants to use codebase context
    if any(keyword in message.lower() for keyword in ["use context", "need context", "with context", "load context"]):
        # Load context from files if not already loaded        if knowledge_base is None:
            print("Loading code context as requested...")
            load_context(workspace_path)
            knowledge_base = vector_db
            print("Context loaded and ready to use.")

    tools = [
        FileTools(base_dir=Path(workspace_path) if workspace_path else Path(file_path)),
        PythonTools(base_dir=Path(workspace_path) if workspace_path else Path(file_path)),
        MCPTools(f'npx -y "@modelcontextprotocol/server-filesystem" "{workspace_path if workspace_path else file_path}"'),
    ]

    agent = Agent(
        model=Gemini(id="gemini-2.0-flash", api_key=os.getenv("GEMINI_API_KEY")),
        tools=tools,
        instructions=instructions,
        markdown=True,
        show_tool_calls=True,
        knowledge=knowledge_base,
        storage=storage,
    )

    output_buffer = io.StringIO()
    try:
        with contextlib.redirect_stdout(output_buffer):
            await agent.aprint_response(message, stream=True)  # capture the output as string
        return output_buffer.getvalue()
    finally:
        # Clear the vector database after each session
        if knowledge_base is not None:
            clear_vector_db()
            knowledge_base = None
            print("Vector database cleared for next session.")

# for CLI use
if __name__ == "__main__":
    workspace_arg = None
    message_arg = "analyse the project directory and suggest some things?"
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1].startswith("--workspace="):
            workspace_arg = sys.argv[1].split("=", 1)[1]
            message_arg = sys.argv[2] if len(sys.argv) > 2 else message_arg
        else:
            message_arg = sys.argv[1]
            workspace_arg = sys.argv[2] if len(sys.argv) > 2 else None
    
    print(asyncio.run(run_agent(message_arg, workspace_arg)))
