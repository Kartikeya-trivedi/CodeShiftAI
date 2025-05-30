import * as vscode from 'vscode';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private isConnected: boolean = false;
  private isProcessing: boolean = false;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'codeShiftAI.openSettings';
    this.updateStatusBar();
    this.statusBarItem.show();
  }

  public setConnected(connected: boolean): void {
    this.isConnected = connected;
    this.updateStatusBar();
  }

  public setProcessing(processing: boolean): void {
    this.isProcessing = processing;
    this.updateStatusBar();
  }

  public showError(message: string): void {
    this.statusBarItem.text = `$(error) CodeShiftAI: ${message}`;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    this.statusBarItem.tooltip = `CodeShiftAI Error: ${message}`;
    
    // Reset after 5 seconds
    setTimeout(() => {
      this.updateStatusBar();
    }, 5000);
  }

  public showSuccess(message: string): void {
    this.statusBarItem.text = `$(check) CodeShiftAI: ${message}`;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
    this.statusBarItem.tooltip = `CodeShiftAI: ${message}`;
    
    // Reset after 3 seconds
    setTimeout(() => {
      this.updateStatusBar();
    }, 3000);
  }

  private updateStatusBar(): void {
    this.statusBarItem.backgroundColor = undefined;
    
    if (this.isProcessing) {
      this.statusBarItem.text = '$(loading~spin) CodeShiftAI: Processing...';
      this.statusBarItem.tooltip = 'CodeShiftAI is processing your request';
    } else if (this.isConnected) {
      this.statusBarItem.text = '$(check) CodeShiftAI: Ready';
      this.statusBarItem.tooltip = 'CodeShiftAI is ready to assist';
    } else {
      this.statusBarItem.text = '$(warning) CodeShiftAI: Disconnected';
      this.statusBarItem.tooltip = 'CodeShiftAI: Click to open settings';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
  }
  public dispose(): void {
    this.statusBarItem.dispose();
  }

  public show(): void {
    this.statusBarItem.show();
  }

  public hide(): void {
    this.statusBarItem.hide();
  }

  // Methods to show different states
  public showCompletionReady(): void {
    this.statusBarItem.text = '$(lightbulb) CodeShiftAI: Completion Ready';
    this.statusBarItem.tooltip = 'CodeShiftAI: Inline completion available';
    
    setTimeout(() => {
      this.updateStatusBar();
    }, 2000);
  }

  public showAnalyzing(): void {
    this.statusBarItem.text = '$(search) CodeShiftAI: Analyzing...';
    this.statusBarItem.tooltip = 'CodeShiftAI: Analyzing your code';
  }

  public showGenerating(): void {
    this.statusBarItem.text = '$(gear~spin) CodeShiftAI: Generating...';
    this.statusBarItem.tooltip = 'CodeShiftAI: Generating code suggestions';
  }

  // Update connection status based on API health
  public async checkConnection(apiService: any): Promise<void> {
    try {
      // Simple health check - try to make a basic API call
      await apiService.sendChatMessage('ping');
      this.setConnected(true);
    } catch (error) {
      this.setConnected(false);
    }
  }
}
