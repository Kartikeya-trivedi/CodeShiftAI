import * as vscode from 'vscode';
import { ApiService } from './api';
import { StatusBarManager } from './statusBar';

export class CodeShiftCompletionProvider implements vscode.InlineCompletionItemProvider {
  private apiService: ApiService;
  private statusBar?: StatusBarManager;
  private lastCompletionTime: number = 0;
  private completionCache = new Map<string, string>();
  
  constructor(statusBar?: StatusBarManager) {
    this.apiService = new ApiService();
    this.statusBar = statusBar;
  }
  
  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[] | null> {
    // Check if completions are enabled
    const config = vscode.workspace.getConfiguration('codeShiftAI');
    const enableAutoCompletion = config.get('enableAutoCompletion', true);
    
    if (!enableAutoCompletion) {
      return null;
    }

    // Check if user is actively typing (debounce)
    const completionDelay = config.get('completionDelay', 300);
    const now = Date.now();
    
    if (now - this.lastCompletionTime < completionDelay) {
      return null;
    }
    
    this.lastCompletionTime = now;

    // Get current line content
    const currentLine = document.lineAt(position.line);
    const textBeforeCursor = currentLine.text.substring(0, position.character);
    const textAfterCursor = currentLine.text.substring(position.character);
    
    // Skip if cursor is in the middle of a word (unless it's a special case)
    if (textAfterCursor.length > 0 && /\w/.test(textAfterCursor[0]) && !/[.([]/.test(textBeforeCursor.slice(-1))) {
      return null;
    }

    // Get surrounding context (more lines for better context)
    const contextLines = config.get('contextLines', 50);
    const startLine = Math.max(0, position.line - contextLines);
    const endLine = Math.min(document.lineCount - 1, position.line + contextLines);
    
    const contextBefore = document.getText(new vscode.Range(
      new vscode.Position(startLine, 0),
      position
    ));
    
    const contextAfter = document.getText(new vscode.Range(
      position,
      new vscode.Position(endLine, document.lineAt(endLine).text.length)
    ));
    
    // Get recent file content for additional context
    const recentContext = this.getRecentContext(document, position);
    
    // Create cache key for this completion request
    const cacheKey = this.createCacheKey(contextBefore, textAfterCursor, document.languageId);
    
    // Check cache first
    if (this.completionCache.has(cacheKey)) {
      const cachedCompletion = this.completionCache.get(cacheKey)!;
      return this.createCompletionItems(cachedCompletion, position);
    }    try {
      // Cancel if token is already cancelled
      if (token.isCancellationRequested) {
        return null;
      }

      // Show processing status
      this.statusBar?.setProcessing(true);

      // Call API to get completion with enhanced context
      const completion = await this.apiService.getInlineCompletion(
        contextBefore,
        document.getText(),
        document.languageId
      );
      
      // Reset processing status
      this.statusBar?.setProcessing(false);
      
      if (completion && completion.trim()) {
        // Cache the result
        this.completionCache.set(cacheKey, completion);
          // Clean cache if it gets too large
        if (this.completionCache.size > 100) {
          const entries = Array.from(this.completionCache.keys());
          if (entries.length > 0) {
            this.completionCache.delete(entries[0]);
          }
        }
        
        // Show completion ready status
        this.statusBar?.showCompletionReady();
        
        return this.createCompletionItems(completion, position);
      }
    } catch (error) {
      console.error('Error providing inline completion:', error);
      
      // Reset processing status
      this.statusBar?.setProcessing(false);
      
      // Show error in status bar
      this.statusBar?.showError('Completion failed');
      
      // Show error message only if it's a network issue
      if (error instanceof Error && error.message.includes('Failed to get completion')) {
        vscode.window.showErrorMessage('CodeShiftAI: Unable to connect to completion service', { modal: false });
      }
    }
    
    return null;
  }

  private createCompletionItems(completion: string, position: vscode.Position): vscode.InlineCompletionItem[] {
    const items: vscode.InlineCompletionItem[] = [];
    
    // Handle multi-line completions
    const lines = completion.split('\n');
    
    if (lines.length === 1) {
      // Single line completion
      items.push(new vscode.InlineCompletionItem(
        completion,
        new vscode.Range(position, position)
      ));
    } else {
      // Multi-line completion
      const multiLineCompletion = new vscode.InlineCompletionItem(
        completion,
        new vscode.Range(position, position)
      );
      
      // Add command to accept the completion
      multiLineCompletion.command = {
        command: 'codeShiftAI.acceptCompletion',
        title: 'Accept Completion',
        arguments: [completion, position]
      };
      
      items.push(multiLineCompletion);
    }
    
    return items;
  }

  private getRecentContext(document: vscode.TextDocument, position: vscode.Position): string {
    // Get function/class context
    const functionContext = this.getFunctionContext(document, position);
    const importContext = this.getImportContext(document);
    
    return `${importContext}\n${functionContext}`.trim();
  }

  private getFunctionContext(document: vscode.TextDocument, position: vscode.Position): string {
    // Simple heuristic to find current function/method context
    let currentLine = position.line;
    let functionStart = -1;
    
    // Look backwards for function declaration
    for (let i = currentLine; i >= 0; i--) {
      const line = document.lineAt(i).text;
      
      // Match function declarations in various languages
      if (/^\s*(function|def|public|private|protected|static|async|\w+\s*\(|\w+:\s*\(|class\s+\w+|interface\s+\w+)/.test(line)) {
        functionStart = i;
        break;
      }
    }
    
    if (functionStart >= 0) {
      return document.getText(new vscode.Range(
        new vscode.Position(functionStart, 0),
        position
      ));
    }
    
    return '';
  }

  private getImportContext(document: vscode.TextDocument): string {
    // Get imports/requires from the beginning of the file
    const maxLines = Math.min(20, document.lineCount);
    let importLines: string[] = [];
    
    for (let i = 0; i < maxLines; i++) {
      const line = document.lineAt(i).text.trim();
      
      if (/^(import|from|require|#include|using|package)/.test(line)) {
        importLines.push(line);
      } else if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
        // Stop at first non-import/non-comment line
        break;
      }
    }
    
    return importLines.join('\n');
  }

  private createCacheKey(contextBefore: string, textAfter: string, languageId: string): string {
    // Create a hash-like key from the context
    const contextHash = this.simpleHash(contextBefore.slice(-200) + textAfter.slice(0, 50) + languageId);
    return contextHash.toString();
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Clear cache when needed
  public clearCache(): void {
    this.completionCache.clear();
  }
}
