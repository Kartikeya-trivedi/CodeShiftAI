import * as vscode from 'vscode';
import * as path from 'path';

export class CodeShiftWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'codeShiftAI.chatView';
  
  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;

  constructor(private readonly context: vscode.ExtensionContext) {
    this._extensionUri = context.extensionUri;
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
        switch (message.command) {
          case 'sendMessage':
            this.handleChatMessage(message.text);
            break;
          case 'clearChat':
            this.clearChat();
            break;
          case 'exportChat':
            this.exportChat();
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  private async handleChatMessage(message: string) {
    if (!this._view) return;

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

    try {
      // Simulate AI response (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiResponse = `I understand you're asking about: "${message}". This is a demo response from CodeShiftAI. In a real implementation, this would connect to your AI backend.`;

      // Add AI response
      this._view.webview.postMessage({
        command: 'addMessage',
        message: {
          type: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      this._view.webview.postMessage({
        command: 'addMessage',
        message: {
          type: 'error',
          content: 'Sorry, there was an error processing your request.',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Hide typing indicator
    this._view.webview.postMessage({
      command: 'hideTyping'
    });
  }

  private clearChat() {
    if (!this._view) return;
    this._view.webview.postMessage({ command: 'clearMessages' });
  }

  private exportChat() {
    if (!this._view) return;
    this._view.webview.postMessage({ command: 'exportMessages' });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
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
        </div>
        <div class="header-actions">
            <button id="clearBtn" class="icon-button" title="Clear Chat">
                <span class="codicon codicon-clear-all"></span>
            </button>
            <button id="exportBtn" class="icon-button" title="Export Chat">
                <span class="codicon codicon-export"></span>
            </button>
            <button id="settingsBtn" class="icon-button" title="Settings">
                <span class="codicon codicon-settings-gear"></span>
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
        
        <div id="typingIndicator" class="typing-indicator" style="display: none;">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span>CodeShiftAI is thinking...</span>
        </div>
    </div>

    <div class="input-container">
        <div class="input-wrapper">
            <textarea 
                id="messageInput" 
                placeholder="Ask CodeShiftAI anything about your code..."
                rows="1"
                maxlength="2000"
            ></textarea>
            <div class="input-actions">
                <button id="sendBtn" class="send-button" disabled>
                    <span class="codicon codicon-send"></span>
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
