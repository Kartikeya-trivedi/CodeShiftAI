import * as vscode from 'vscode';
import * as path from 'path';

export class CodeShiftWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'codeShiftAI.chatView';
  
  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;
  private _onDidReceiveMessageListeners: Array<(msg: any) => void> = [];

  constructor(private readonly context: vscode.ExtensionContext) {
    this._extensionUri = context.extensionUri;
  }

  public postMessageToWebview(message: any) {
    if (this._view) {
      this._view.webview.postMessage(message);
    }
  }

  public onDidReceiveMessage(listener: (msg: any) => void) {
    this._onDidReceiveMessageListeners.push(listener);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      message => {
        // Call all registered listeners (for WebSocket integration)
        this._onDidReceiveMessageListeners.forEach(listener => listener(message));        // Existing logic (for legacy/demo):
        switch (message.command) {
          case 'sendMessage':
            this.handleChatMessage(message.text);
            break;
          case 'clearChat':
            this.clearChat();
            break;
          case 'exportChat':
            this.exportChat(message.data);
            break;
          case 'newChat':
            this.newChat();
            break;
          case 'undo':
            this.handleUndo();
            break;
          case 'redo':
            this.handleRedo();
            break;
          case 'openSettings':
            this.openSettings();
            break;
          case 'showInformation':
            if (message.message) {
              vscode.window.showInformationMessage(message.message);
            }
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  private async handleChatMessage(message: string) {
    if (!this._view) {
      return;
    }

    // Add user message to chat
    this._view.webview.postMessage({
      command: 'addMessage',
      message: {
        type: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }
    });

    // Show typing indicator
    this._view.webview.postMessage({
      command: 'showTyping'
    });
    // Do not add any AI response here; WebSocket will handle it
  }

  // Add this method to handle assistant message and hide typing indicator
  public postAssistantMessage(content: string) {
    if (!this._view) {
      return;
    }
    this._view.webview.postMessage({
      command: 'addMessage',
      message: {
        type: 'assistant',
        content,
        timestamp: new Date().toISOString()
      }
    });
    this._view.webview.postMessage({ command: 'hideTyping' });
  }

  private clearChat() {
    if (!this._view) { return; }
    this._view.webview.postMessage({ command: 'clearMessages' });
  }

  private newChat() {
    if (!this._view) { return; }
    this._view.webview.postMessage({ command: 'newChat' });
    // Optionally clear extension-side chat state here if needed
  }

  private handleUndo() {
    if (!this._view) {
      return;
    }
    this._view.webview.postMessage({ command: 'undo' });
    // Execute VS Code undo command
    vscode.commands.executeCommand('codeShiftAI.undo');
  }

  private handleRedo() {
    if (!this._view) {
      return;
    }
    this._view.webview.postMessage({ command: 'redo' });
    // Execute VS Code redo command
    vscode.commands.executeCommand('codeShiftAI.redo');
  }
  private exportChat(data?: any) {
    if (!this._view) {
      return;
    }
    
    // If data is provided, handle export with that data
    if (data) {
      // Create a blob with the chat data and trigger download
      const chatJson = JSON.stringify(data, null, 2);
      const fileName = `codeshift-chat-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      
      // Show save dialog
      vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(fileName),
        filters: {
          'JSON files': ['json'],
          'All files': ['*']
        }
      }).then(fileUri => {
        if (fileUri) {
          vscode.workspace.fs.writeFile(fileUri, Buffer.from(chatJson)).then(() => {
            vscode.window.showInformationMessage(`Chat exported to ${fileUri.fsPath}`);
          });
        }
      });
    } else {
      // Trigger export from webview
      this._view.webview.postMessage({ command: 'exportMessages' });
    }
  }

  private openSettings() {
    vscode.commands.executeCommand('codeShiftAI.openSettings');
  }
  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
      // Custom icon URIs
    const undoIconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'undo-icon.svg'));
    const redoIconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'redo-icon.svg'));
    const newChatIconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'new-chat-icon.svg'));
    const clearIconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'clear-icon.svg'));
    const exportIconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'export-icon.svg'));
    const settingsIconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'settings-icon.svg'));
    const sendIconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'send-icon.svg'));

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleResetUri}" rel="stylesheet">
    <link href="${styleVSCodeUri}" rel="stylesheet">
    <link href="${styleMainUri}" rel="stylesheet">
    <title>CodeShiftAI Chat</title>
</head>
<body>
    <div class="chat-header">
        <div class="header-title">
            <span class="codicon codicon-robot"></span>
            <span>CodeShiftAI Assistant</span>
        </div>        <div class="header-actions">            <button id="undoBtn" class="icon-button" title="Undo">
                <img src="${undoIconUri}" alt="Undo" class="custom-icon">
            </button>
            <button id="redoBtn" class="icon-button" title="Redo">
                <img src="${redoIconUri}" alt="Redo" class="custom-icon">
            </button>
            <button id="newChatBtn" class="icon-button" title="New Chat">
                <img src="${newChatIconUri}" alt="New Chat" class="custom-icon">
            </button>            <div class="header-separator"></div>
            <button id="clearBtn" class="icon-button" title="Clear Chat">
                <img src="${clearIconUri}" alt="Clear Chat" class="custom-icon">
            </button>
            <button id="exportBtn" class="icon-button" title="Export Chat">
                <img src="${exportIconUri}" alt="Export Chat" class="custom-icon">
            </button>
            <button id="settingsBtn" class="icon-button" title="Settings">
                <img src="${settingsIconUri}" alt="Settings" class="custom-icon">
            </button>
        </div>
    </div>

    <div class="chat-container">
        <div id="messagesContainer" class="messages-container">
            <div class="welcome-message">
                <div class="welcome-icon">
                    <span class="codicon codicon-robot"></span>
                </div>
                <h3>Welcome to CodeShiftAI!</h3>
                <p>I'm your AI coding assistant. I can help you with:</p>
                <ul>
                    <li><span class="codicon codicon-lightbulb"></span> Code explanations and suggestions</li>
                    <li><span class="codicon codicon-tools"></span> Bug fixes and optimizations</li>
                    <li><span class="codicon codicon-beaker"></span> Test generation</li>
                    <li><span class="codicon codicon-book"></span> Documentation writing</li>
                </ul>
                <p>What would you like help with today?</p>
            </div>
        </div>
        <!-- Remove the static typing indicator here -->
    </div>

    <div class="input-container">
        <div class="input-wrapper">
            <textarea 
                id="messageInput" 
                placeholder="Ask CodeShiftAI anything about your code..."
                rows="1"
                maxlength="2000"
            ></textarea>
            <div class="input-actions">                <button id="sendBtn" class="send-button" disabled>
                    <img src="${sendIconUri}" alt="Send" class="custom-icon">
                </button>
            </div>
        </div>
        <div class="input-footer">
            <span class="hint">Tip: Select code in your editor and ask me to explain or improve it!</span>
        </div>
    </div>

    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
