import * as vscode from 'vscode';
import { ApiService } from './api';

export class CodeShiftCompletionProvider implements vscode.InlineCompletionItemProvider {
  private apiService: ApiService;
  
  constructor() {
    this.apiService = new ApiService('http://127.0.0.1:8000'); // Updated to match FastAPI backend port
  }
  
  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[] | null> {
    // Get text before cursor position
    const prefix = document.getText(new vscode.Range(
      new vscode.Position(0, 0),
      position
    ));
    
    // Get the whole file content for context
    const fileContent = document.getText();
    
    // Get language ID
    const language = document.languageId;
    
    try {
      // Call API to get completion
      const completion = await this.apiService.getInlineCompletion(
        prefix,
        fileContent,
        language
      );
      
      if (completion) {
        return [
          new vscode.InlineCompletionItem(
            completion,
            new vscode.Range(position, position)
          )
        ];
      }
    } catch (error) {
      console.error('Error providing inline completion:', error);
    }
    
    return null;
  }
}
