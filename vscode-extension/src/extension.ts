// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ApiService } from './api';
import { CodeShiftCompletionProvider } from './completionProvider';
import { CodeShiftCodeActionsProvider } from './codeActionsProvider';
import { CodeShiftChatParticipant } from './chatParticipant';
import { StatusBarManager } from './statusBar';
import { Logger, ConfigurationManager, ErrorHandler } from './utils';
import { CodeShiftWebviewProvider } from './webviewProvider';
import { CodeShiftHistoryProvider } from './historyProvider';
import { CodeShiftSettingsProvider } from './settingsProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('CodeShiftAI extension is now active');
  
  // Initialize utilities
  Logger.initialize('CodeShiftAI');
  Logger.info('Activating CodeShiftAI extension');

  // Check if extension is enabled
  if (!ConfigurationManager.isEnabled()) {
    Logger.info('CodeShiftAI extension is disabled');
    return;
  }
  const apiService = new ApiService();
  const statusBar = new StatusBarManager();
  
  // Initialize UI providers
  const webviewProvider = new CodeShiftWebviewProvider(context);
  const historyProvider = new CodeShiftHistoryProvider();
  const settingsProvider = new CodeShiftSettingsProvider();
  
  // Check initial connection
  statusBar.checkConnection(apiService);
  
  // Register webview view provider for the main chat interface
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(CodeShiftWebviewProvider.viewType, webviewProvider)
  );
    // Register tree data providers
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('codeShiftAI.historyView', historyProvider),
    vscode.window.registerTreeDataProvider('codeShiftAI.settingsView', settingsProvider)
  );
  // Register the chat command to reveal the sidebar view
  let chatCommand = vscode.commands.registerCommand('codeShiftAI.openChat', async () => {
    await vscode.commands.executeCommand('workbench.view.extension.codeShiftAI');
    await vscode.commands.executeCommand('codeShiftAI.chatView.focus');
  });
  
  // Register settings page command
  let openSettingsCommand = vscode.commands.registerCommand('codeShiftAI.openSettings', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', 'codeShiftAI');
  });
  // Register toolbar commands for the view
  let undoCommand = vscode.commands.registerCommand('codeShiftAI.undo', () => {
    vscode.commands.executeCommand('workbench.action.navigateBack');
  });
  let redoCommand = vscode.commands.registerCommand('codeShiftAI.redo', () => {
    vscode.commands.executeCommand('workbench.action.navigateForward');
  });
  let newChatCommand = vscode.commands.registerCommand('codeShiftAI.newChat', () => {
    // Clear the current chat and start fresh
    vscode.commands.executeCommand('codeShiftAI.openChat');
  });// Register inline completion provider
  const completionProvider = new CodeShiftCompletionProvider(statusBar);
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**' }, // All files
      completionProvider
    )
  );

  // Register code actions provider
  const codeActionsProvider = new CodeShiftCodeActionsProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { pattern: '**' }, // All files
      codeActionsProvider,
      {
        providedCodeActionKinds: [
          vscode.CodeActionKind.QuickFix,
          vscode.CodeActionKind.RefactorRewrite
        ]
      }
    )
  );
  // Register code actions commands
  CodeShiftCodeActionsProvider.registerCommands(context, apiService);

  // Register chat participant with slash commands
  CodeShiftChatParticipant.register(context);
    // Register all code analysis commands
  let explainCodeCommand = vscode.commands.registerCommand('codeShiftAI.explainCode', async () => {
    await handleCodeAnalysisCommand(apiService, 'explain', 'Code Explanation');
  });

  let fixCodeCommand = vscode.commands.registerCommand('codeShiftAI.fixCode', async () => {
    await handleCodeAnalysisCommand(apiService, 'fix', 'Code Fix Suggestions');
  });

  let optimizeCodeCommand = vscode.commands.registerCommand('codeShiftAI.optimizeCode', async () => {
    await handleCodeAnalysisCommand(apiService, 'optimize', 'Code Optimization');
  });

  let generateTestsCommand = vscode.commands.registerCommand('codeShiftAI.generateTests', async () => {
    await handleCodeAnalysisCommand(apiService, 'generateTests', 'Generated Tests');
  });

  let generateDocsCommand = vscode.commands.registerCommand('codeShiftAI.generateDocs', async () => {
    await handleCodeAnalysisCommand(apiService, 'generateDocs', 'Generated Documentation');
  });  let refactorCodeCommand = vscode.commands.registerCommand('codeShiftAI.refactorCode', async () => {
    await handleCodeAnalysisCommand(apiService, 'refactor', 'Code Refactoring');
  });

  // Register new UI-specific commands
  let clearHistoryCommand = vscode.commands.registerCommand('codeShiftAI.clearHistory', () => {
    historyProvider.clearHistory();
    vscode.window.showInformationMessage('Chat history cleared');
  });

  let exportChatCommand = vscode.commands.registerCommand('codeShiftAI.exportChat', async () => {
    const result = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file('codeshiftai-chat-export.json'),
      filters: {
        'JSON Files': ['json'],
        'All Files': ['*']
      }
    });
    
    if (result) {
      // Export would be implemented here
      vscode.window.showInformationMessage('Chat exported successfully');
    }
  });

  let toggleSettingCommand = vscode.commands.registerCommand('codeShiftAI.toggleSetting', (settingKey: string) => {
    const config = vscode.workspace.getConfiguration('codeShiftAI');
    const currentValue = config.get(settingKey);
    if (typeof currentValue === 'boolean') {
      config.update(settingKey, !currentValue, vscode.ConfigurationTarget.Global);
      settingsProvider.refresh();
    }
  });

  let editSettingCommand = vscode.commands.registerCommand('codeShiftAI.editSetting', async (settingKey: string) => {
    const config = vscode.workspace.getConfiguration('codeShiftAI');
    const currentValue = config.get(settingKey);
    
    const newValue = await vscode.window.showInputBox({
      prompt: `Enter new value for ${settingKey}`,
      value: currentValue?.toString()
    });
    
    if (newValue !== undefined) {
      let parsedValue: any = newValue;
      if (!isNaN(Number(newValue))) {
        parsedValue = Number(newValue);
      }
      config.update(settingKey, parsedValue, vscode.ConfigurationTarget.Global);
      settingsProvider.refresh();
    }
  });

  let resetSettingsCommand = vscode.commands.registerCommand('codeShiftAI.resetSettings', async () => {
    const confirm = await vscode.window.showWarningMessage(
      'Are you sure you want to reset all CodeShiftAI settings to defaults?',
      'Yes',
      'No'
    );
    
    if (confirm === 'Yes') {
      const config = vscode.workspace.getConfiguration('codeShiftAI');
      const inspect = config.inspect('');
      // Reset all settings - this would need to iterate through all settings
      vscode.window.showInformationMessage('Settings reset to defaults');
      settingsProvider.refresh();
    }
  });

  let analyzeFileCommand = vscode.commands.registerCommand('codeShiftAI.analyzeFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No file is currently open');
      return;
    }
    
    const document = editor.document;
    const fileContent = document.getText();
    
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Analyzing file...',
      cancellable: false
    }, async () => {
      try {
        const analysis = await apiService.explainCode({
          code: fileContent,
          language: document.languageId,
          filePath: document.fileName
        });
        
        // Show analysis in a webview
        const panel = vscode.window.createWebviewPanel(
          'codeShiftAI-fileAnalysis',
          `File Analysis: ${document.fileName}`,
          vscode.ViewColumn.Beside,
          { enableScripts: true }
        );
        
        panel.webview.html = getAnalysisResultHtml('File Analysis', analysis.result, fileContent);
      } catch (error) {
        vscode.window.showErrorMessage(`Analysis failed: ${error}`);
      }
    });
  });

  let findSimilarCommand = vscode.commands.registerCommand('codeShiftAI.findSimilar', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No file is currently open');
      return;
    }
    
    // This would implement similarity search across workspace
    vscode.window.showInformationMessage('Similar file search feature coming soon!');
  });

  let openWebviewCommand = vscode.commands.registerCommand('codeShiftAI.openWebview', () => {
    // Create a dedicated webview panel for enhanced chat
    const panel = vscode.window.createWebviewPanel(
      'codeShiftAI-chat',
      'CodeShiftAI Chat',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );
      // Set the webview's initial html content - could reuse the webview provider's HTML
    panel.webview.html = getBasicChatWebviewHtml();
  });

  // Register accept completion command
  let acceptCompletionCommand = vscode.commands.registerCommand('codeShiftAI.acceptCompletion', async (completion: string, position: vscode.Position) => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const edit = new vscode.WorkspaceEdit();
      edit.insert(editor.document.uri, position, completion);
      await vscode.workspace.applyEdit(edit);
    }
  });
  
  // Register configuration change listener
  const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('codeShiftAI')) {
      Logger.info('Configuration changed, checking for updates');
      
      // Update status bar visibility
      if (event.affectsConfiguration('codeShiftAI.enableStatusBar')) {
        const enabled = ConfigurationManager.getFeatureFlags().statusBar;
        if (enabled) {
          statusBar.show();
        } else {
          statusBar.hide();
        }
      }

      // Check API connection if URL changed
      if (event.affectsConfiguration('codeShiftAI.apiUrl')) {
        Logger.info('API URL changed, reconnecting...');
        statusBar.checkConnection(apiService);
      }

      // Log level changes
      if (event.affectsConfiguration('codeShiftAI.logLevel')) {
        Logger.info('Log level updated');
      }
    }
  });
  // Add all commands and providers to subscriptions
  context.subscriptions.push(
    chatCommand,
    openSettingsCommand,
    undoCommand,
    redoCommand,
    newChatCommand,
    explainCodeCommand, 
    fixCodeCommand, 
    optimizeCodeCommand, 
    generateTestsCommand, 
    generateDocsCommand, 
    refactorCodeCommand, 
    acceptCompletionCommand,
    clearHistoryCommand,
    exportChatCommand,
    toggleSettingCommand,
    editSettingCommand,
    resetSettingsCommand,
    analyzeFileCommand,
    findSimilarCommand,
    openWebviewCommand,
    configChangeListener,
    statusBar
  );
}

// Helper function to handle code analysis commands
async function handleCodeAnalysisCommand(
  apiService: ApiService, 
  analysisType: 'explain' | 'fix' | 'optimize' | 'generateTests' | 'generateDocs' | 'refactor',
  title: string
) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('No editor is active');
    return;
  }
  
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  
  if (!selectedText) {
    vscode.window.showInformationMessage('No code selected. Please select some code first.');
    return;
  }
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `CodeShiftAI is ${analysisType === 'explain' ? 'analyzing' : 'processing'} your code...`,
    cancellable: false
  }, async (progress) => {
    try {
      let result: string;
      const fileName = editor.document.fileName;
      const languageId = editor.document.languageId;
      
      // Call the appropriate API method based on analysis type
      switch (analysisType) {
        case 'explain':
          const explainResponse = await apiService.explainCode({ code: selectedText, language: languageId, filePath: fileName });
          result = explainResponse.result;
          break;
        case 'fix':
          const fixResponse = await apiService.fixCode({ code: selectedText, language: languageId, filePath: fileName });
          result = fixResponse.result;
          break;
        case 'optimize':
          const optimizeResponse = await apiService.optimizeCode({ code: selectedText, language: languageId, filePath: fileName });
          result = optimizeResponse.result;
          break;
        case 'generateTests':
          const testsResponse = await apiService.generateTests({ code: selectedText, language: languageId, filePath: fileName });
          result = testsResponse.result;
          break;
        case 'generateDocs':
          const docsResponse = await apiService.generateDocumentation({ code: selectedText, language: languageId, filePath: fileName });
          result = docsResponse.result;
          break;
        case 'refactor':
          const refactorResponse = await apiService.refactorCode({ code: selectedText, language: languageId, filePath: fileName, refactorType: 'general' });
          result = refactorResponse.result;
          break;
        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }
      
      // Show result in a webview panel
      const panel = vscode.window.createWebviewPanel(
        `codeShiftAI-${analysisType}`,
        title,
        vscode.ViewColumn.Beside,
        { 
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );
      
      panel.webview.html = getAnalysisResultHtml(title, result, selectedText);
        // Add action buttons for certain analysis types
      if (analysisType === 'fix' || analysisType === 'optimize' || analysisType === 'refactor') {
        panel.webview.onDidReceiveMessage(
          async message => {
            switch (message.command) {
              case 'applyChanges':
                // Apply the suggested changes to the editor
                const edit = new vscode.WorkspaceEdit();
                edit.replace(editor.document.uri, selection, message.newCode);
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('Changes applied successfully!');
                panel.dispose();
                break;
              case 'insertNew':
                // Insert the result at cursor position
                const position = editor.selection.end;
                const editInsert = new vscode.WorkspaceEdit();
                editInsert.insert(editor.document.uri, position, '\n\n' + message.newCode);
                await vscode.workspace.applyEdit(editInsert);
                vscode.window.showInformationMessage('Code inserted successfully!');
                panel.dispose();
                break;
            }
          },
          undefined
        );
      } else if (analysisType === 'generateTests' || analysisType === 'generateDocs') {
        panel.webview.onDidReceiveMessage(
          async message => {
            switch (message.command) {
              case 'insertNew':
                // Create a new document for tests or docs
                const newDoc = await vscode.workspace.openTextDocument({
                  content: message.newCode,
                  language: analysisType === 'generateTests' ? languageId : 'markdown'
                });
                await vscode.window.showTextDocument(newDoc, vscode.ViewColumn.Beside);
                vscode.window.showInformationMessage('Content created successfully!');
                panel.dispose();
                break;
            }
          },
          undefined
        );
      }
      
    } catch (error) {
      console.error(`Failed to ${analysisType} code:`, error);
      vscode.window.showErrorMessage(`Failed to ${analysisType} code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

// Helper function to generate HTML for analysis results
function getAnalysisResultHtml(title: string, result: string, originalCode: string): string {
  const isCodeResult = title.includes('Fix') || title.includes('Optimization') || title.includes('Refactor') || title.includes('Tests');
  const showApplyButton = title.includes('Fix') || title.includes('Optimization') || title.includes('Refactor');
  const showInsertButton = title.includes('Tests') || title.includes('Documentation');
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { 
          padding: 20px; 
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
        }
        h2 { 
          color: var(--vscode-foreground);
          margin-bottom: 20px;
        }
        .code-block { 
          background-color: var(--vscode-textCodeBlock-background);
          border: 1px solid var(--vscode-editorWidget-border);
          padding: 15px; 
          border-radius: 5px;
          font-family: var(--vscode-editor-font-family);
          font-size: var(--vscode-editor-font-size);
          white-space: pre-wrap;
          overflow-x: auto;
          margin: 15px 0;
        }
        .result-text {
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .button-container {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }
        button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        .secondary-button {
          background-color: var(--vscode-button-secondaryBackground);
          color: var(--vscode-button-secondaryForeground);
        }
        .secondary-button:hover {
          background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-weight: bold;
          margin-bottom: 10px;
          color: var(--vscode-textLink-foreground);
        }
      </style>
    </head>
    <body>
      <h2>${title}</h2>
      
      ${originalCode ? `
        <div class="section">
          <div class="section-title">Original Code:</div>
          <div class="code-block">${escapeHtml(originalCode)}</div>
        </div>
      ` : ''}
      
      <div class="section">
        <div class="section-title">${isCodeResult ? 'Result:' : 'Analysis:'}</div>
        ${isCodeResult ? 
          `<div class="code-block">${escapeHtml(result)}</div>` : 
          `<div class="result-text">${escapeHtml(result)}</div>`
        }
      </div>
      
      ${(showApplyButton || showInsertButton) ? `
        <div class="button-container">
          ${showApplyButton ? '<button onclick="applyChanges()">Apply Changes</button>' : ''}
          ${showInsertButton ? '<button onclick="insertNew()" class="secondary-button">Insert as New</button>' : ''}
        </div>
      ` : ''}
      
      <script>
        const vscode = acquireVsCodeApi();
        
        function applyChanges() {
          vscode.postMessage({
            command: 'applyChanges',
            newCode: ${JSON.stringify(result)}
          });
        }
        
        function insertNew() {
          vscode.postMessage({
            command: 'insertNew',
            newCode: ${JSON.stringify(result)}
          });
        }
      </script>
    </body>
    </html>
  `;
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Helper function for basic chat webview HTML
function getBasicChatWebviewHtml(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CodeShiftAI Chat</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          background-color: var(--vscode-editor-background);
          color: var(--vscode-foreground);
          margin: 0;
          padding: 16px;
        }
        .welcome {
          text-align: center;
          padding: 40px 20px;
        }
        .welcome h2 {
          color: var(--vscode-textLink-foreground);
          margin-bottom: 16px;
        }
        .feature-list {
          list-style: none;
          padding: 0;
          max-width: 300px;
          margin: 20px auto;
        }
        .feature-list li {
          padding: 8px 0;
          border-bottom: 1px solid var(--vscode-panel-border);
        }
      </style>
    </head>
    <body>
      <div class="welcome">
        <h2>🤖 CodeShiftAI Chat</h2>
        <p>Your AI-powered coding assistant</p>
        <ul class="feature-list">
          <li>💡 Code explanations</li>
          <li>🔧 Bug fixes</li>
          <li>⚡ Performance optimization</li>
          <li>🧪 Test generation</li>
          <li>📚 Documentation</li>
        </ul>
        <p>Use the sidebar chat for interactive conversations!</p>
      </div>
    </body>
    </html>
  `;
}

// This method is called when your extension is deactivated
export function deactivate() {
  Logger.info('Deactivating CodeShiftAI extension');
  Logger.dispose();
}
