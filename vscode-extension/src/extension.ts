// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ApiService } from './api';
import { CodeShiftCompletionProvider } from './completionProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('CodeShiftAI extension is now active');
  
  const apiService = new ApiService();

  // Register the chat view provider for the sidebar
  const chatViewProvider = new CodeShiftAIChatViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('codeShiftAIView', chatViewProvider)
  );

  // Register the chat command to reveal the sidebar view
  let chatCommand = vscode.commands.registerCommand('codeShiftAI.openChat', async () => {
    await vscode.commands.executeCommand('workbench.view.extension.codeShiftAIViewContainer');
    // No need to call a non-existent command for the view itself
  });

  // Register settings page command
  let openSettingsCommand = vscode.commands.registerCommand('codeShiftAI.openSettings', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', 'codeShiftAI');
  });

  // Register inline completion provider
  const completionProvider = new CodeShiftCompletionProvider();
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**' }, // All files
      completionProvider
    )
  );
  
  // Register right-click context menu command
  let explainCodeCommand = vscode.commands.registerCommand('codeShiftAI.explainCode', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No editor is active');
      return;
    }
    
    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    
    if (!selectedText) {
      vscode.window.showInformationMessage('No code selected');
      return;
    }
    
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'CodeShiftAI is analyzing your code...',
      cancellable: false
    }, async (progress) => {
      try {
        const explanation = await apiService.sendChatMessage(
          `Explain this code: ${selectedText}`
        );
        
        // Show explanation in a webview panel
        const panel = vscode.window.createWebviewPanel(
          'codeExplanation',
          'Code Explanation',
          vscode.ViewColumn.Beside,
          { enableScripts: true }
        );
        
        panel.webview.html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <style>
              body { padding: 15px; font-family: var(--vscode-font-family); }
              pre { background-color: var(--vscode-editor-background); padding: 10px; }
            </style>
          </head>
          <body>
            <h2>Code Explanation</h2>
            <pre>${explanation}</pre>
          </body>
          </html>
        `;
      } catch (error) {
        vscode.window.showErrorMessage('Failed to explain code');
      }
    });
  });
  
  context.subscriptions.push(chatCommand, explainCodeCommand, openSettingsCommand);
}


// WebviewViewProvider for chat in the sidebar
class CodeShiftAIChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  resolveWebviewView(
    view: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this._view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, 'resources')]
    };

    const iconPath = view.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'resources', 'icon.svg'));

    view.webview.html = getChatWebviewContent(iconPath);
    view.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'sendMessage':
            handleUserMessage(view.webview, message.text);
            return;
        }
      },
      undefined,
      this._context.subscriptions
    );
  }
}

function getChatWebviewContent(iconPath: vscode.Uri) { // Added iconPath parameter
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>CodeShiftAI</title>
		<style>
			body {
				font-family: var(--vscode-font-family);
				color: var(--vscode-foreground);
				background-color: var(--vscode-sideBar-background, #333333);
				padding: 0;
				margin: 0;
				display: flex;
				flex-direction: column;
				height: 100vh;
				position: relative; /* For z-index context */
			}
			#branding-overlay {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				display: flex; 
				flex-direction: column; 
				align-items: center; /* Center children horizontally */
				justify-content: center; /* Center icon-text group vertically */
				/* padding-top removed */
				opacity: 0.6; 
				z-index: 0; 
				pointer-events: none; 
			}
			#branding-icon {
				width: 300px; /* Fixed width */
				height: 300px; /* Fixed height */
				/* max-width removed as width is fixed */
				margin-bottom: 15px; /* Space between icon and text */
			}
			#branding-text {
				color: var(--vscode-foreground); 
				text-align: center;
				font-size: 0.9em;
				font-weight: 500;
			}			#toolbar {
				display: flex;
				justify-content: flex-end;
				align-items: center;
				padding: 4px 12px;
				border-bottom: 1px solid var(--vscode-editorWidget-border);
				background-color: var(--vscode-sideBar-background);
				position: relative;
				z-index: 1;
			}
			#toolbar-buttons {
				display: flex;
				gap: 4px;
			}
			.toolbar-button {
				background-color: transparent;
				border: none;
				color: var(--vscode-foreground);
				width: 28px;
				height: 28px;
				border-radius: 4px;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 16px;
				font-weight: bold;
			}
			.toolbar-button:hover {
				background-color: var(--vscode-toolbar-hoverBackground);
			}
			.toolbar-button:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
			#chat-container {
				flex: 1;
				overflow-y: auto;
				padding: 12px;
				position: relative; 
				z-index: 1; /* Above branding overlay */
			}.message {
				margin-bottom: 12px;
				padding: 8px 12px;
				border-radius: 6px;
				background-color: transparent;
			}
			.user-message {
				background-color: transparent;
				align-self: flex-end;
			}
			.assistant-message {
				background-color: transparent;
			}
			.message-header {
				display: flex;
				align-items: center;
				margin-bottom: 6px;
				font-weight: 600;
				font-size: 0.85em;
			}
			.message-icon {
				width: 20px;
				height: 20px;
				margin-right: 8px;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 12px;
				font-weight: bold;
			}
			.user-icon {
				background-color: var(--vscode-button-background);
				color: var(--vscode-button-foreground);
			}			.assistant-icon {
				background-color: var(--vscode-inputValidation-infoBackground);
				color: var(--vscode-inputValidation-infoForeground);
				background-image: url('${iconPath}');
				background-size: 14px 14px;
				background-repeat: no-repeat;
				background-position: center;
			}
			.message-content {
				margin-left: 28px;
			}
			#input-container {
				display: flex;
				padding: 12px;
				border-top: 1px solid var(--vscode-editorWidget-border);
				position: relative;
				z-index: 1; /* Above branding overlay */
			}
			#message-input {
				flex: 1;
				padding: 8px;
				background-color: var(--vscode-input-background);
				color: var(--vscode-input-foreground);
				border: 1px solid var(--vscode-input-border);
				border-radius: 4px;
			}
			#send-button {
				margin-left: 8px;
				background-color: var(--vscode-button-background);
				color: var(--vscode-button-foreground);
				border: none;
				padding: 0 12px;
				border-radius: 4px;
				cursor: pointer;
			}
		</style>
	</head>	<body>		<div id="toolbar">
			<div id="toolbar-buttons">
				<button class="toolbar-button" id="undo-button" title="Undo">↶</button>
				<button class="toolbar-button" id="redo-button" title="Redo">↷</button>
				<button class="toolbar-button" id="new-chat-button" title="New Chat">+</button>
			</div>
		</div>
		<div id="branding-overlay">
			<img id="branding-icon" src="${iconPath}" alt="CodeShiftAI Icon">
			<div id="branding-text"></div>
		</div>
		<div id="chat-container"></div>
		<div id="input-container">
			<textarea id="message-input" placeholder="Ask CodeShiftAI..."></textarea>
			<button id="send-button">Send</button>
		</div>		<script>
			const vscode = acquireVsCodeApi();
			const chatContainer = document.getElementById('chat-container');
			const messageInput = document.getElementById('message-input');
			const sendButton = document.getElementById('send-button');
			const undoButton = document.getElementById('undo-button');
			const redoButton = document.getElementById('redo-button');
			const newChatButton = document.getElementById('new-chat-button');
			
			// Chat history management
			let chatHistory = [];
			let historyIndex = -1;
			
			// Toolbar button event listeners
			undoButton.addEventListener('click', () => {
				if (historyIndex > 0) {
					historyIndex--;
					restoreChatState();
				}
			});
			
			redoButton.addEventListener('click', () => {
				if (historyIndex < chatHistory.length - 1) {
					historyIndex++;
					restoreChatState();
				}
			});
			
			newChatButton.addEventListener('click', () => {
				if (confirm('Start a new chat? This will clear the current conversation.')) {
					clearChat();
				}
			});
			
			function saveChatState() {
				const state = {
					messages: Array.from(chatContainer.children).map(msg => ({
						text: msg.querySelector('.message-content').textContent,
						sender: msg.classList.contains('user-message') ? 'user' : 'assistant'
					}))
				};
				
				// Remove any states after current index (when undoing and then adding new message)
				chatHistory = chatHistory.slice(0, historyIndex + 1);
				chatHistory.push(state);
				historyIndex = chatHistory.length - 1;
				updateToolbarButtons();
			}
			
			function restoreChatState() {
				if (historyIndex >= 0 && historyIndex < chatHistory.length) {
					const state = chatHistory[historyIndex];
					chatContainer.innerHTML = '';
					
					state.messages.forEach(msg => {
						addMessage(msg.text, msg.sender, false); // false = don't save state
					});
					updateToolbarButtons();
				}
			}
			
			function clearChat() {
				chatContainer.innerHTML = '';
				chatHistory = [];
				historyIndex = -1;
				saveChatState(); // Save empty state
			}
			
			function updateToolbarButtons() {
				undoButton.disabled = historyIndex <= 0;
				redoButton.disabled = historyIndex >= chatHistory.length - 1;
			}
			
			// Send message function
			function sendMessage() {
				const text = messageInput.value.trim();
				if (text) {
					addMessage(text, 'user');
					vscode.postMessage({
						command: 'sendMessage',
						text: text
					});
					messageInput.value = '';
				}
			}			function addMessage(text, sender, saveState = true) {
				const messageDiv = document.createElement('div');
				messageDiv.classList.add('message');
				messageDiv.classList.add(sender === 'user' ? 'user-message' : 'assistant-message');
				
				// Create message header
				const headerDiv = document.createElement('div');
				headerDiv.classList.add('message-header');
						const iconDiv = document.createElement('div');
				iconDiv.classList.add('message-icon');
				iconDiv.classList.add(sender === 'user' ? 'user-icon' : 'assistant-icon');
				iconDiv.textContent = sender === 'user' ? 'U' : ''; // Empty for assistant since we use SVG background
				
				const nameSpan = document.createElement('span');
				nameSpan.textContent = sender === 'user' ? 'User' : 'CodeShiftAI';
				
				headerDiv.appendChild(iconDiv);
				headerDiv.appendChild(nameSpan);
				
				// Create message content
				const contentDiv = document.createElement('div');
				contentDiv.classList.add('message-content');
				contentDiv.textContent = text;
				
				messageDiv.appendChild(headerDiv);
				messageDiv.appendChild(contentDiv);
				chatContainer.appendChild(messageDiv);
				chatContainer.scrollTop = chatContainer.scrollHeight;
				
				if (saveState) {
					saveChatState();
				}
			}
			sendButton.addEventListener('click', sendMessage);
			messageInput.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault();
					sendMessage();
				}
			});
			window.addEventListener('message', event => {
				const message = event.data;
				switch (message.command) {
					case 'addResponse':
						addMessage(message.text, 'assistant');
						break;
				}
			});
		</script>
	</body>
	</html>`;
}

// Dummy handler for user messages (replace with real logic)
function handleUserMessage(webview: vscode.Webview, text: string) {
	// For now, just echo the message back as a response
	webview.postMessage({
		command: 'addResponse',
		text: `Echo: ${text}`
	});
}

// This method is called when your extension is deactivated
export function deactivate() {}
