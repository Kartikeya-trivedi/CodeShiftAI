from dotenv import load_dotenv
load_dotenv()
import os

key= os.getenv("GOOGLE_API_KEY")
print(key)