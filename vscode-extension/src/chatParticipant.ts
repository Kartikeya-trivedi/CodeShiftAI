import * as vscode from 'vscode';
import { ApiService } from './api';

export class CodeShiftChatParticipant {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService('http://127.0.0.1:8000');
  }

  // Register the chat participant
  static register(context: vscode.ExtensionContext): void {
    // Register chat participant (if VS Code supports it)
    if (vscode.chat && vscode.chat.createChatParticipant) {
      const participant = vscode.chat.createChatParticipant('codeshift', async (request, context, stream, token) => {
        const chatParticipant = new CodeShiftChatParticipant();
        return chatParticipant.handleChatRequest(request, context, stream, token);
      });

      participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'icon.svg');
      participant.followupProvider = {
        provideFollowups(result, context, token) {
          return [
            {
              prompt: 'Explain this in more detail',
              label: 'More details',
              command: 'explain'
            },
            {
              prompt: 'Show me an example',
              label: 'Show example',
              command: 'example'
            },
            {
              prompt: 'How can I test this?',
              label: 'Testing help',
              command: 'test'
            }
          ];
        }
      };

      context.subscriptions.push(participant);
    }

    // Register slash commands for the chat
    const slashCommands = [
      { command: 'explain', description: 'Explain code or concepts' },
      { command: 'fix', description: 'Fix code issues' },
      { command: 'optimize', description: 'Optimize code performance' },
      { command: 'test', description: 'Generate tests' },
      { command: 'docs', description: 'Generate documentation' },
      { command: 'refactor', description: 'Refactor code' },
      { command: 'review', description: 'Review code quality' }
    ];

    // Register chat commands
    slashCommands.forEach(({ command, description }) => {
      const chatCommand = vscode.commands.registerCommand(`codeShiftAI.chat.${command}`, async (query?: string) => {
        const chatParticipant = new CodeShiftChatParticipant();
        await chatParticipant.handleSlashCommand(command, query || '');
      });
      context.subscriptions.push(chatCommand);
    });
  }

  private async handleChatRequest(
    request: any,
    context: any,
    stream: any,
    token: vscode.CancellationToken
  ): Promise<any> {
    try {
      const prompt = request.prompt;
      const command = request.command;

      // Handle different slash commands
      switch (command) {
        case 'explain':
          return this.handleExplainCommand(prompt, stream, token);
        case 'fix':
          return this.handleFixCommand(prompt, stream, token);
        case 'optimize':
          return this.handleOptimizeCommand(prompt, stream, token);
        case 'test':
          return this.handleTestCommand(prompt, stream, token);
        case 'docs':
          return this.handleDocsCommand(prompt, stream, token);
        case 'refactor':
          return this.handleRefactorCommand(prompt, stream, token);
        case 'review':
          return this.handleReviewCommand(prompt, stream, token);
        default:
          return this.handleGeneralChat(prompt, stream, token);
      }
    } catch (error) {
      stream.markdown(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {};
    }
  }

  private async handleSlashCommand(command: string, query: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    let codeContext = '';
    
    if (editor && editor.selection && !editor.selection.isEmpty) {
      codeContext = editor.document.getText(editor.selection);
    }

    const fullQuery = query || codeContext;
    if (!fullQuery) {
      vscode.window.showInformationMessage(`Please provide code or select text for the ${command} command`);
      return;
    }

    // Show the chat panel and send the command
    await vscode.commands.executeCommand('workbench.panel.chat.view.focus');
    
    // Use the appropriate CodeShiftAI command
    switch (command) {
      case 'explain':
        vscode.commands.executeCommand('codeShiftAI.explainCode');
        break;
      case 'fix':
        vscode.commands.executeCommand('codeShiftAI.fixCode');
        break;
      case 'optimize':
        vscode.commands.executeCommand('codeShiftAI.optimizeCode');
        break;
      case 'test':
        vscode.commands.executeCommand('codeShiftAI.generateTests');
        break;
      case 'docs':
        vscode.commands.executeCommand('codeShiftAI.generateDocs');
        break;
      case 'refactor':
        vscode.commands.executeCommand('codeShiftAI.refactorCode');
        break;
      default:
        // Handle other commands
        break;
    }
  }  private async handleExplainCommand(prompt: string, stream: any, token: vscode.CancellationToken): Promise<any> {
    stream.progress('Analyzing code...');
    
    try {
      // Get workspace folder path
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const explainResponse = await this.apiService.explainCode({
        code: prompt,
        language: 'auto-detect',
        context: 'Explain this code in detail',
        workspacePath: workspacePath
      });
      
      if (explainResponse && explainResponse.result) {
        stream.markdown('## Code Explanation\n\n');
        stream.markdown(explainResponse.result);
        
        if (explainResponse.suggestions && explainResponse.suggestions.length > 0) {
          stream.markdown('\n\n## Additional Notes\n\n');
          explainResponse.suggestions.forEach((suggestion: any, index: number) => {
            stream.markdown(`${index + 1}. ${suggestion}\n`);
          });
        }
      } else {
        stream.markdown('❌ No explanation available. The service might be unavailable.');
      }
    } catch (error) {
      stream.markdown(`❌ Error explaining code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      metadata: {
        command: 'explain'
      }
    };
  }  private async handleFixCommand(prompt: string, stream: any, token: vscode.CancellationToken): Promise<any> {
    stream.progress('Finding and fixing issues...');
    
    try {
      // Get workspace folder path
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const fixResponse = await this.apiService.fixCode({
        code: prompt,
        language: 'auto-detect',
        context: 'Fix any issues or bugs in this code',
        workspacePath: workspacePath
      });
      
      if (fixResponse && fixResponse.result) {
        stream.markdown('## Fixed Code\n\n');
        stream.markdown(`\`\`\`\n${fixResponse.result}\n\`\`\``);
        
        if (fixResponse.suggestions && fixResponse.suggestions.length > 0) {
          stream.markdown('\n\n## Additional Suggestions\n\n');
          fixResponse.suggestions.forEach((suggestion: any, index: number) => {
            stream.markdown(`${index + 1}. ${suggestion}\n`);
          });
        }
      } else {
        stream.markdown('❌ No fix suggestions available. The code might already be correct or the service is unavailable.');
      }
    } catch (error) {
      stream.markdown(`❌ Error fixing code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      metadata: {
        command: 'fix'
      }
    };
  }
  private async handleOptimizeCommand(prompt: string, stream: any, token: vscode.CancellationToken): Promise<any> {
    stream.progress('Optimizing code...');
      try {
      // Get workspace folder path
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const optimizeResponse = await this.apiService.optimizeCode({
        code: prompt,
        language: 'auto-detect',
        context: 'Optimize this code for better performance and readability',
        workspacePath: workspacePath
      });
      
      if (optimizeResponse && optimizeResponse.result) {
        stream.markdown('## Optimized Code\n\n');
        stream.markdown(`\`\`\`\n${optimizeResponse.result}\n\`\`\``);
        
        if (optimizeResponse.suggestions && optimizeResponse.suggestions.length > 0) {
          stream.markdown('\n\n## Optimization Notes\n\n');
          optimizeResponse.suggestions.forEach((suggestion: any, index: number) => {
            stream.markdown(`${index + 1}. ${suggestion}\n`);
          });
        }
      } else {
        stream.markdown('❌ No optimization suggestions available. The code might already be optimal or the service is unavailable.');
      }
    } catch (error) {
      stream.markdown(`❌ Error optimizing code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      metadata: {
        command: 'optimize'
      }
    };
  }
  private async handleTestCommand(prompt: string, stream: any, token: vscode.CancellationToken): Promise<any> {
    stream.progress('Generating tests...');
      try {
      // Get workspace folder path
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const testResponse = await this.apiService.generateTests({
        code: prompt,
        language: 'auto-detect',
        context: 'Generate comprehensive unit tests for this code',
        workspacePath: workspacePath
      });
      
      if (testResponse && testResponse.result) {
        stream.markdown('## Generated Tests\n\n');
        stream.markdown(`\`\`\`\n${testResponse.result}\n\`\`\``);
        
        if (testResponse.suggestions && testResponse.suggestions.length > 0) {
          stream.markdown('\n\n## Testing Recommendations\n\n');
          testResponse.suggestions.forEach((suggestion: any, index: number) => {
            stream.markdown(`${index + 1}. ${suggestion}\n`);
          });
        }
      } else {
        stream.markdown('❌ No test suggestions available. The service might be unavailable.');
      }
    } catch (error) {
      stream.markdown(`❌ Error generating tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      metadata: {
        command: 'test'
      }
    };
  }
  private async handleDocsCommand(prompt: string, stream: any, token: vscode.CancellationToken): Promise<any> {
    stream.progress('Generating documentation...');
      try {
      // Get workspace folder path
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const docsResponse = await this.apiService.generateDocumentation({
        code: prompt,
        language: 'auto-detect',
        context: 'Generate comprehensive documentation for this code',
        workspacePath: workspacePath
      });
      
      if (docsResponse && docsResponse.result) {
        stream.markdown('## Generated Documentation\n\n');
        stream.markdown(docsResponse.result);
        
        if (docsResponse.suggestions && docsResponse.suggestions.length > 0) {
          stream.markdown('\n\n## Documentation Improvements\n\n');
          docsResponse.suggestions.forEach((suggestion: any, index: number) => {
            stream.markdown(`${index + 1}. ${suggestion}\n`);
          });
        }
      } else {
        stream.markdown('❌ No documentation suggestions available. The service might be unavailable.');
      }
    } catch (error) {
      stream.markdown(`❌ Error generating documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      metadata: {
        command: 'docs'
      }
    };
  }
  private async handleRefactorCommand(prompt: string, stream: any, token: vscode.CancellationToken): Promise<any> {
    stream.progress('Refactoring code...');
      try {
      // Get workspace folder path
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const refactorResponse = await this.apiService.refactorCode({
        code: prompt,
        language: 'auto-detect',
        refactorType: 'general',
        context: 'Refactor this code to improve structure and maintainability',
        workspacePath: workspacePath
      });
      
      if (refactorResponse && refactorResponse.result) {
        stream.markdown('## Refactored Code\n\n');
        stream.markdown(`\`\`\`\n${refactorResponse.result}\n\`\`\``);
        
        if (refactorResponse.suggestions && refactorResponse.suggestions.length > 0) {
          stream.markdown('\n\n## Refactoring Notes\n\n');
          refactorResponse.suggestions.forEach((suggestion: any, index: number) => {
            stream.markdown(`${index + 1}. ${suggestion}\n`);
          });
        }
      } else {
        stream.markdown('❌ No refactoring suggestions available. The code might already be well-structured or the service is unavailable.');
      }
    } catch (error) {
      stream.markdown(`❌ Error refactoring code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      metadata: {
        command: 'refactor'
      }
    };
  }  private async handleReviewCommand(prompt: string, stream: any, token: vscode.CancellationToken): Promise<any> {
    stream.progress('Reviewing code...');
    
    try {
      // Get workspace folder path
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const response = await this.apiService.sendChatMessage(
        `Please review this code for quality, best practices, potential issues, and suggestions for improvement: ${prompt}`,
        workspacePath
      );
      
      if (response && typeof response === 'string') {
        stream.markdown('## Code Review\n\n');
        stream.markdown(response);
      } else {
        stream.markdown('❌ No review available. The service might be unavailable.');
      }
    } catch (error) {
      stream.markdown(`❌ Error reviewing code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      metadata: {
        command: 'review'
      }
    };
  }private async handleGeneralChat(prompt: string, stream: any, token: vscode.CancellationToken): Promise<any> {
    stream.progress('Thinking...');
    
    try {
      // Get workspace folder path
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const response = await this.apiService.sendChatMessage(prompt, workspacePath);
      
      if (response && typeof response === 'string') {
        stream.markdown(response);
      } else {
        stream.markdown('❌ No response available. The service might be unavailable.');
      }
    } catch (error) {
      stream.markdown(`❌ Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      metadata: {
        command: 'general'
      }
    };
  }
}
