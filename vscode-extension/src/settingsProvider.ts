import * as vscode from 'vscode';

export class CodeShiftSettingsProvider implements vscode.TreeDataProvider<SettingItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SettingItem | undefined | null | void> = new vscode.EventEmitter<SettingItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SettingItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private settings: SettingItem[] = [];

  constructor() {
    this.loadSettings();
  }

  refresh(): void {
    this.loadSettings();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SettingItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SettingItem): Thenable<SettingItem[]> {
    if (!element) {
      return Promise.resolve(this.settings);
    }
    return Promise.resolve([]);
  }

  private loadSettings(): void {
    const config = vscode.workspace.getConfiguration('codeShiftAI');
    
    this.settings = [
      new SettingItem(
        'Auto Completion',
        config.get('enableAutoCompletion', true) ? 'Enabled' : 'Disabled',
        'enableAutoCompletion',
        'boolean',
        {
          command: 'codeShiftAI.toggleSetting',
          title: 'Toggle Setting',
          arguments: ['enableAutoCompletion']
        }
      ),
      new SettingItem(
        'Completion Delay',
        `${config.get('completionDelay', 300)}ms`,
        'completionDelay',
        'number',
        {
          command: 'codeShiftAI.editSetting',
          title: 'Edit Setting',
          arguments: ['completionDelay']
        }
      ),
      new SettingItem(
        'Context Lines',
        `${config.get('contextLines', 50)} lines`,
        'contextLines',
        'number',
        {
          command: 'codeShiftAI.editSetting',
          title: 'Edit Setting',
          arguments: ['contextLines']
        }
      ),
      new SettingItem(
        'API Endpoint',
        config.get('apiEndpoint', 'Not configured'),
        'apiEndpoint',
        'string',
        {
          command: 'codeShiftAI.editSetting',
          title: 'Edit Setting',
          arguments: ['apiEndpoint']
        }
      ),
      new SettingItem(
        'Max Tokens',
        `${config.get('maxTokens', 2048)} tokens`,
        'maxTokens',
        'number',
        {
          command: 'codeShiftAI.editSetting',
          title: 'Edit Setting',
          arguments: ['maxTokens']
        }
      ),
      new SettingItem(
        'Temperature',
        `${config.get('temperature', 0.7)}`,
        'temperature',
        'number',
        {
          command: 'codeShiftAI.editSetting',
          title: 'Edit Setting',
          arguments: ['temperature']
        }
      )
    ];
  }
}

export class SettingItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly value: string,
    public readonly key: string,
    public readonly type: 'boolean' | 'string' | 'number',
    public readonly command?: vscode.Command
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);

    this.tooltip = `${this.label}: ${this.value}`;
    this.description = this.value;
    this.contextValue = 'setting';

    // Set icon based on type
    switch (type) {
      case 'boolean':
        this.iconPath = new vscode.ThemeIcon('symbol-boolean');
        break;
      case 'string':
        this.iconPath = new vscode.ThemeIcon('symbol-string');
        break;
      case 'number':
        this.iconPath = new vscode.ThemeIcon('symbol-number');
        break;
    }
  }
}
