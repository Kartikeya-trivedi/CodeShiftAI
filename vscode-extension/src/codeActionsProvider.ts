import * as vscode from 'vscode';
import { ApiService } from './api';

export class CodeShiftCodeActionsProvider implements vscode.CodeActionProvider {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService('http://127.0.0.1:8000');
  }

  async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];
    
    // Get selected text or current line
    const selectedText = document.getText(range);
    const hasSelection = !range.isEmpty;
    
    if (!hasSelection && context.diagnostics.length === 0) {
      return actions;
    }

    // Quick fix actions for diagnostics
    if (context.diagnostics.length > 0) {
      for (const diagnostic of context.diagnostics) {
        const quickFix = this.createQuickFixAction(document, range, diagnostic);
        if (quickFix) {
          actions.push(quickFix);
        }
      }
    }

    // Code improvement actions for selected text
    if (hasSelection && selectedText.trim()) {
      actions.push(
        this.createCodeAction('🔧 Fix Code Issues', 'Fix code issues and bugs', 'codeShiftAI.fixCode'),
        this.createCodeAction('⚡ Optimize Code', 'Optimize code for better performance', 'codeShiftAI.optimizeCode'),
        this.createCodeAction('♻️ Refactor Code', 'Refactor and improve code structure', 'codeShiftAI.refactorCode'),
        this.createCodeAction('📝 Explain Code', 'Get explanation of selected code', 'codeShiftAI.explainCode'),
        this.createCodeAction('🧪 Generate Tests', 'Generate unit tests for this code', 'codeShiftAI.generateTests'),
        this.createCodeAction('📚 Generate Documentation', 'Generate documentation for this code', 'codeShiftAI.generateDocs')
      );
    }

    // General code suggestions
    if (!hasSelection) {
      const currentLine = document.lineAt(range.start.line);
      const lineText = currentLine.text.trim();
      
      if (lineText) {
        actions.push(
          this.createCodeAction('💡 Suggest Improvements', 'Get AI suggestions for this line', 'codeShiftAI.suggestImprovements')
        );
      }
    }

    return actions;
  }

  private createQuickFixAction(
    document: vscode.TextDocument,
    range: vscode.Range,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction | null {
    const action = new vscode.CodeAction(
      `CodeShiftAI: Fix "${diagnostic.message}"`,
      vscode.CodeActionKind.QuickFix
    );
    
    action.command = {
      command: 'codeShiftAI.quickFix',
      title: 'Apply AI Fix',
      arguments: [document.uri, range, diagnostic]
    };
    
    action.diagnostics = [diagnostic];
    action.isPreferred = true;
    
    return action;
  }

  private createCodeAction(title: string, description: string, command: string): vscode.CodeAction {
    const action = new vscode.CodeAction(title, vscode.CodeActionKind.RefactorRewrite);
    action.command = {
      command: command,
      title: description
    };
    return action;
  }

  // Register additional commands for code actions
  static registerCommands(context: vscode.ExtensionContext, apiService: ApiService) {
    // Quick fix command
    const quickFixCommand = vscode.commands.registerCommand(
      'codeShiftAI.quickFix',
      async (uri: vscode.Uri, range: vscode.Range, diagnostic: vscode.Diagnostic) => {
        const document = await vscode.workspace.openTextDocument(uri);
        const problemText = document.getText(range);
        
        try {
          await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'CodeShiftAI is fixing the issue...',
            cancellable: false
          }, async () => {
            const fixResponse = await apiService.fixCode({
              code: problemText,
              language: document.languageId,
              filePath: document.fileName,
              context: `Error: ${diagnostic.message}`
            });
            
            if (fixResponse.result) {
              const edit = new vscode.WorkspaceEdit();
              edit.replace(uri, range, fixResponse.result);
              await vscode.workspace.applyEdit(edit);
              vscode.window.showInformationMessage('Code fixed successfully!');
            }
          });
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to fix code: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    );

    // Suggest improvements command
    const suggestImprovementsCommand = vscode.commands.registerCommand(
      'codeShiftAI.suggestImprovements',
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }

        const line = editor.document.lineAt(editor.selection.active.line);
        const lineText = line.text.trim();
        
        if (!lineText) {
          vscode.window.showInformationMessage('No code to analyze on current line');
          return;
        }

        try {
          await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'CodeShiftAI is analyzing code...',
            cancellable: false
          }, async () => {
            const response = await apiService.explainCode({
              code: lineText,
              language: editor.document.languageId,
              filePath: editor.document.fileName,
              context: 'Provide suggestions for improvement'
            });
            
            if (response.result) {
              // Show suggestions in an information message with actions
              const action = await vscode.window.showInformationMessage(
                `Suggestions: ${response.result}`,
                'Apply Optimization',
                'Dismiss'
              );
              
              if (action === 'Apply Optimization') {
                vscode.commands.executeCommand('codeShiftAI.optimizeCode');
              }
            }
          });
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to get suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    );

    context.subscriptions.push(quickFixCommand, suggestImprovementsCommand);
  }
}
