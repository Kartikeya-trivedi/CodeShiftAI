import * as vscode from 'vscode';
import { ApiService } from './api';
import { CodeShiftCompletionProvider } from './completionProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('CodeShiftAI extension is now active');
  
  const apiService = new ApiService('http://127.0.0.1:8000'); // Updated to match FastAPI backend port

  // Register the chat view provider for the sidebar
  const chatViewProvider = new CodeShiftAIChatViewProvider(context, apiService);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('codeShiftAIView', chatViewProvider)
  );

  // Register the chat command to reveal the sidebar view
  let chatCommand = vscode.commands.registerCommand('codeShiftAI.openChat', async () => {
    await vscode.commands.executeCommand('workbench.view.extension.codeShiftAIViewContainer');
  });

  // Register settings page command
  let openSettingsCommand = vscode.commands.registerCommand('codeShiftAI.openSettings', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', 'codeShiftAI');
  });

  // Register inline completion provider
  const completionProvider = new CodeShiftCompletionProvider();
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**' },
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
    }, async () => {
      try {
        const explanation = await apiService.sendChatMessage(
          `Explain this code: ${selectedText}`
        );
        
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

class CodeShiftAIChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _context: vscode.ExtensionContext,
    private readonly _apiService: ApiService
  ) {}

  resolveWebviewView(
    view: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this._view = view;

    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, 'resources')],
    };

    const iconPath = view.webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'resources', 'icon.svg')
    );

    view.webview.html = getChatWebviewContent(iconPath);

    // Connect WebSocket for real-time chat
    this._apiService.connectWebSocket();
    this._apiService.onWebSocketMessage((msg: string) => {
      if (this._view) {
        this._view.webview.postMessage({ command: 'addResponse', text: msg });
      }
    });

    view.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'sendMessage') {
        // Send message via WebSocket instead of REST
        this._apiService.sendWebSocketMessage(message.text);
      }
    });
  }
}

function getChatWebviewContent(iconPath: vscode.Uri) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
      }
      #branding-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 0.6;
        z-index: 0;
        pointer-events: none;
      }
      #branding-icon {
        width: 300px;
        height: 300px;
        margin-bottom: 15px;
      }
      #branding-text {
        text-align: center;
        font-size: 0.9em;
        font-weight: 500;
      }
      #chat-container {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        position: relative;
        z-index: 1;
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
        position: relative;
        z-index: 1;
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
    <div id="branding-overlay">
      <img id="branding-icon" src="${iconPath}" alt="CodeShiftAI Icon" />
      <div id="branding-text">CodeShiftAI - Your Personal Code Buddy</div>
    </div>
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

      function sendMessage() {
        const text = messageInput.value.trim();
        if (text) {
          addMessage(text, 'user');
          vscode.postMessage({ command: 'sendMessage', text });
          messageInput.value = '';
        }
      }

      function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'assistant-message');
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

      window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.command === 'addResponse') {
          addMessage(message.text, 'assistant');
        }
      });
    </script>
  </body>
  </html>`;
}

// Deactivate hook
export function deactivate() {}
