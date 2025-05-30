import axios from 'axios';
import * as vscode from 'vscode';
import { ConfigurationManager, Logger, ErrorHandler } from './utils';

export interface CodeAnalysisRequest {
  code: string;
  language: string;
  filePath?: string;
  context?: string;
}

export interface CodeAnalysisResponse {
  result: string;
  suggestions?: string[];
}

export interface RefactorRequest extends CodeAnalysisRequest {
  refactorType: 'general' | 'performance' | 'readability' | 'extract-method' | 'rename';
}

export class ApiService {
  private baseUrl: string = '';
  private timeout: number = 30000;
  
  constructor() {
    this.updateConfiguration();
  }

  private updateConfiguration(): void {
    const config = ConfigurationManager.getApiConfig();
    this.baseUrl = config.url;
    this.timeout = config.timeout;
  }

  private async makeRequest<T>(endpoint: string, data: any, context: string): Promise<T> {
    try {
      Logger.debug(`API Request: POST ${endpoint}`);
      const response = await axios.post<T>(`${this.baseUrl}${endpoint}`, data, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CodeShiftAI-VSCode-Extension/1.0.0'
        }
      });
      Logger.debug(`API Response: ${endpoint} completed successfully`);
      return response.data;
    } catch (error: any) {
      const errorMessage = ErrorHandler.handleApiError(error, context);
      Logger.error(`API Error in ${context}:`, error);
      throw new Error(errorMessage);
    }
  }
    async sendChatMessage(message: string, context?: string): Promise<string> {
    const response = await this.makeRequest<{ response: string }>('/chat', {
      message,
      context
    }, 'chat message');
    
    return response.response;
  }
  
  async getInlineCompletion(prefix: string, fileContent: string, language: string): Promise<string> {
    const response = await this.makeRequest<{ completion: string }>('/inline-completion', {
      prefix,
      fileContent,
      language
    }, 'inline completion');
    
    return response.completion;
  }
  async explainCode(request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> {
    return await this.makeRequest<CodeAnalysisResponse>('/explain-code', request, 'code explanation');
  }

  async fixCode(request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> {
    return await this.makeRequest<CodeAnalysisResponse>('/fix-code', request, 'code fix');
  }

  async optimizeCode(request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> {
    return await this.makeRequest<CodeAnalysisResponse>('/optimize-code', request, 'code optimization');
  }

  async generateTests(request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> {
    return await this.makeRequest<CodeAnalysisResponse>('/generate-tests', request, 'test generation');
  }

  async generateDocumentation(request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> {
    return await this.makeRequest<CodeAnalysisResponse>('/generate-docs', request, 'documentation generation');
  }

  async refactorCode(request: RefactorRequest): Promise<CodeAnalysisResponse> {
    return await this.makeRequest<CodeAnalysisResponse>('/refactor-code', request, 'code refactoring');
  }

  // Health check and utility methods
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest<{ status: string }>('/health', {}, 'health check');
      return true;
    } catch (error) {
      return false;
    }
  }

  public updateConfig(): void {
    this.updateConfiguration();
  }
}
