import * as vscode from 'vscode';

export class CodeShiftHistoryProvider implements vscode.TreeDataProvider<HistoryItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<HistoryItem | undefined | null | void> = new vscode.EventEmitter<HistoryItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<HistoryItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private historyItems: HistoryItem[] = [];

  constructor() {
    // Load history from workspace state
    this.loadHistory();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: HistoryItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: HistoryItem): Thenable<HistoryItem[]> {
    if (!element) {
      // Return top-level items (conversations)
      return Promise.resolve(this.historyItems);
    } else {
      // Return messages in a conversation
      return Promise.resolve(element.messages || []);
    }
  }

  addConversation(title: string, messages: Array<{type: string, content: string, timestamp: string}>): void {
    const conversation = new HistoryItem(
      title,
      vscode.TreeItemCollapsibleState.Collapsed,
      'conversation',
      {
        command: 'codeShiftAI.openConversation',
        title: 'Open Conversation',
        arguments: [title]
      }
    );
      conversation.messages = messages.map(msg => 
      new HistoryItem(
        `${msg.type === 'user' ? 'You' : 'AI'}: ${msg.content.substring(0, 50)}...`,
        vscode.TreeItemCollapsibleState.None,
        msg.type === 'user' ? 'user' : 'assistant',
        {
          command: 'codeShiftAI.viewMessage',
          title: 'View Message',
          arguments: [msg]
        }
      )
    );

    this.historyItems.unshift(conversation);
    this.saveHistory();
    this.refresh();
  }

  clearHistory(): void {
    this.historyItems = [];
    this.saveHistory();
    this.refresh();
  }

  private loadHistory(): void {
    // In a real implementation, load from workspace state or file
    // For demo purposes, add some sample data
    this.addSampleHistory();
  }

  private saveHistory(): void {
    // In a real implementation, save to workspace state or file
  }

  private addSampleHistory(): void {
    const sampleConversation = new HistoryItem(
      'Code Review Session',
      vscode.TreeItemCollapsibleState.Collapsed,
      'conversation'
    );
    
    sampleConversation.messages = [
      new HistoryItem(
        'You: Can you review this function?',
        vscode.TreeItemCollapsibleState.None,
        'user'
      ),
      new HistoryItem(
        'AI: I\'d be happy to review your function...',
        vscode.TreeItemCollapsibleState.None,
        'assistant'
      )
    ];

    this.historyItems.push(sampleConversation);
  }
}

export class HistoryItem extends vscode.TreeItem {
  public messages?: HistoryItem[];

  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly type: 'conversation' | 'user' | 'assistant',
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    this.tooltip = this.label;
    this.contextValue = type;

    // Set icons based on type
    switch (type) {
      case 'conversation':
        this.iconPath = new vscode.ThemeIcon('comment-discussion');
        break;
      case 'user':
        this.iconPath = new vscode.ThemeIcon('account');
        break;
      case 'assistant':
        this.iconPath = new vscode.ThemeIcon('robot');
        break;
    }
  }
}
