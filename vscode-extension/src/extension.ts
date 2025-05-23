<<<<<<< HEAD
import * as vscode from 'vscode';
import { callGenerateAPI } from './api';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('codeshiftaai.generateCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Open a file first to use CodeShiftAI!');
            return;
        }
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        if (!text) {
            vscode.window.showInformationMessage('Select some code or prompt to generate!');
            return;
        }

        const result = await callGenerateAPI(text);
        vscode.window.showInformationMessage('CodeShiftAI result: ' + result);
    });

    context.subscriptions.push(disposable);
}

=======
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ApiService } from './api';
import { CodeShiftCompletionProvider } from './completionProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('CodeShiftAI extension is now active');
  
  const apiService = new ApiService();
  
  // Register the chat command
  let chatCommand = vscode.commands.registerCommand('codeShiftAI.openChat', () => {
    const panel = createChatPanel(context);
    context.subscriptions.push(panel);
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

  // Register the activity bar view
  registerActivityBarView(context);
}

function registerActivityBarView(context: vscode.ExtensionContext) {
  // Create and register a TreeDataProvider for the view
  const treeDataProvider = new CodeShiftAITreeProvider();
  const treeView = vscode.window.createTreeView('codeShiftAIView', {
    treeDataProvider,
    showCollapseAll: false
  });
  context.subscriptions.push(treeView);
}

class CodeShiftAITreeProvider implements vscode.TreeDataProvider<TreeItem> {
  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }
  getChildren(): Thenable<TreeItem[]> {
    const items = [
      new TreeItem('Open Chat', 'codeShiftAI.openChat'),
      new TreeItem('Settings', 'codeShiftAI.openSettings')
    ];
    return Promise.resolve(items);
  }
}

class TreeItem extends vscode.TreeItem {
  constructor(label: string, command?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    if (command) {
      this.command = {
        command: command,
        title: ''
      };
    }
  }
}

function createChatPanel(context: vscode.ExtensionContext) {
	// Create and show a webview panel
	const panel = vscode.window.createWebviewPanel(
		'codeShiftAIChat',
		'CodeShiftAI Chat',
		vscode.ViewColumn.Beside,
		{
			enableScripts: true,
			retainContextWhenHidden: true
		}
	);

	// Set HTML content
	panel.webview.html = getChatWebviewContent();

	// Handle messages from webview
	panel.webview.onDidReceiveMessage(
		message => {
			switch (message.command) {
				case 'sendMessage':
					handleUserMessage(panel.webview, message.text);
					return;
			}
		},
		undefined,
		context.subscriptions
	);

	return panel;
}

function getChatWebviewContent() {
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>CodeShiftAI Chat</title>
		<style>
			body {
				font-family: var(--vscode-font-family);
				color: var(--vscode-foreground);
				background-color: var(--vscode-editor-background);
				padding: 0;
				margin: 0;
				display: flex;
				flex-direction: column;
				height: 100vh;
			}
			#chat-container {
				flex: 1;
				overflow-y: auto;
				padding: 12px;
			}
			.message {
				margin-bottom: 12px;
				padding: 8px 12px;
				border-radius: 6px;
			}
			.user-message {
				background-color: var(--vscode-editor-inactiveSelectionBackground);
				align-self: flex-end;
			}
			.assistant-message {
				background-color: var(--vscode-editor-selectionBackground);
			}
			#input-container {
				display: flex;
				padding: 12px;
				border-top: 1px solid var(--vscode-editorWidget-border);
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
	</head>
	<body>
		<div id="chat-container"></div>
		<div id="input-container">
			<textarea id="message-input" placeholder="Ask CodeShiftAI..."></textarea>
			<button id="send-button">Send</button>
		</div>
		<script>
			const vscode = acquireVsCodeApi();
			const chatContainer = document.getElementById('chat-container');
			const messageInput = document.getElementById('message-input');
			const sendButton = document.getElementById('send-button');
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
			}
			function addMessage(text, sender) {
				const messageDiv = document.createElement('div');
				messageDiv.classList.add('message');
				messageDiv.classList.add(sender === 'user' ? 'user-message' : 'assistant-message');
				messageDiv.textContent = text;
				chatContainer.appendChild(messageDiv);
				chatContainer.scrollTop = chatContainer.scrollHeight;
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
>>>>>>> c854bf7b9a4e6fc64ae81d9e0cb87788a9b936a0
export function deactivate() {}
