import axios from 'axios';
import * as vscode from 'vscode';
import { ConfigurationManager, Logger, ErrorHandler } from './utils';

// API Response interfaces
interface ChatResponse {
  response: string;
}

interface CodeResponse {
  result: string;
}

interface HealthResponse {
  status: string;
}

export class ApiService {
  private baseUrl: string;
  private ws?: any;
  private wsOpenPromise?: Promise<void>;
  private messageCallback?: (msg: string) => void;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getWebSocketImpl(): any {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      try {
        return require('ws');
      } catch (e) {
        throw new Error('WebSocket package (ws) could not be loaded in Node.js environment.');
      }
    } else if (typeof globalThis !== 'undefined' && typeof (globalThis as any).WebSocket !== 'undefined') {
      return (globalThis as any).WebSocket;
    } else {
      throw new Error('WebSocket is not available in this environment.');
    }
  }

  private initWebSocket(): Promise<void> {
    if (this.ws && this.ws.readyState === 1) {
      return Promise.resolve();
    }
    if (this.wsOpenPromise) {
      return this.wsOpenPromise;
    }
    const WSImpl = this.getWebSocketImpl();
    if (!WSImpl || typeof WSImpl !== 'function') {
      throw new Error('WebSocket implementation is not a constructor.');
    }
    const wsUrl = this.baseUrl.replace('localhost', '127.0.0.1').replace(':3000', ':8000').replace(/^http/, 'ws') + '/ws/chat';
    this.ws = new WSImpl(wsUrl);
    if (!this.ws) {
      throw new Error('WebSocket instance could not be created.');
    }
    this.wsOpenPromise = new Promise((resolve, reject) => {
      if (!this.ws) {
        return reject(new Error('WebSocket initialization failed'));
      }
      if (typeof this.ws.on === 'function') {
        this.ws.on('open', () => {
          console.log('WebSocket connected');
          resolve();
        });
        this.ws.on('error', (event: any) => {
          console.error('WebSocket error', event);
          reject(new Error('WebSocket error'));
        });
        this.ws.on('close', () => {
          console.log('WebSocket closed');
          this.ws = undefined;
          this.wsOpenPromise = undefined;
        });
        this.ws.on('message', (data: any) => {
          console.log('WebSocket message received:', data);
          if (this.messageCallback) {
            this.messageCallback(typeof data === 'string' ? data : data.toString());
          }
        });
      } else {
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          resolve();
        };
        this.ws.onerror = (event: any) => {
          console.error('WebSocket error', event);
          reject(new Error('WebSocket error'));
        };
        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.ws = undefined;
          this.wsOpenPromise = undefined;
        };
        this.ws.onmessage = (event: any) => {
          console.log('WebSocket message received:', event.data);
          if (this.messageCallback) {
            this.messageCallback(event.data);
          }
        };
      }
    });
    return this.wsOpenPromise;
  }
  async sendWebSocketMessage(message: string, workspacePath?: string): Promise<void> {
    await this.initWebSocket();
    if (!this.ws || this.ws.readyState !== 1) {
      throw new Error('WebSocket is not open');
    }
    
    const messageData = workspacePath ? 
      JSON.stringify({ message, workspacePath }) : 
      message;
    
    this.ws.send(messageData);
  }

  onWebSocketMessage(callback: (msg: string) => void): void {
    this.messageCallback = callback;
  }

  // Example HTTP GET request method
  async fetchData(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  // Stub: Get inline completion from API
  async getInlineCompletion(prefix: string, fileContent: string, language: string): Promise<string> {
    return Promise.resolve('');
  }  // Send chat message to API
  async sendChatMessage(message: string, workspacePath?: string): Promise<string> {
    try {
      if (!message || typeof message !== 'string') {
        throw new Error('Invalid message provided');
      }
      
      const requestData: any = {
        message: message
      };
      
      if (workspacePath) {
        requestData.workspacePath = workspacePath;
      }
      
      const response = await axios.post<ChatResponse>(`${this.baseUrl}/chat`, requestData);
      
      if (response && response.data && typeof response.data.response === 'string') {
        return response.data.response;
      } else if (response && response.data && response.data.response !== undefined) {
        return String(response.data.response);
      } else {
        return 'No response received from the service';
      }
    } catch (error) {
      Logger.error('Failed to send chat message:', error);
      throw new Error(ErrorHandler.handleApiError(error, 'Chat message'));
    }
  }

  // Connect WebSocket
  connectWebSocket(): void {
    this.initWebSocket().catch(error => {
      Logger.error('Failed to connect WebSocket:', error);
    });
  }

  // Explain code
  async explainCode(request: any): Promise<any> {
    try {
      const response = await axios.post<CodeResponse>(`${this.baseUrl}/explain-code`, request);
      return { result: response.data.result, suggestions: [] };
    } catch (error) {
      Logger.error('Failed to explain code:', error);
      throw new Error(ErrorHandler.handleApiError(error, 'Code explanation'));
    }
  }

  // Fix code
  async fixCode(request: any): Promise<any> {
    try {
      const response = await axios.post<CodeResponse>(`${this.baseUrl}/fix-code`, request);
      return { result: response.data.result, suggestions: [] };
    } catch (error) {
      Logger.error('Failed to fix code:', error);
      throw new Error(ErrorHandler.handleApiError(error, 'Code fix'));
    }
  }

  // Optimize code
  async optimizeCode(request: any): Promise<any> {
    try {
      const response = await axios.post<CodeResponse>(`${this.baseUrl}/optimize-code`, request);
      return { result: response.data.result, suggestions: [] };
    } catch (error) {
      Logger.error('Failed to optimize code:', error);
      throw new Error(ErrorHandler.handleApiError(error, 'Code optimization'));
    }
  }

  // Generate tests
  async generateTests(request: any): Promise<any> {
    try {
      const response = await axios.post<CodeResponse>(`${this.baseUrl}/generate-tests`, request);
      return { result: response.data.result, suggestions: [] };
    } catch (error) {
      Logger.error('Failed to generate tests:', error);
      throw new Error(ErrorHandler.handleApiError(error, 'Test generation'));
    }
  }

  // Generate documentation
  async generateDocumentation(request: any): Promise<any> {
    try {
      const response = await axios.post<CodeResponse>(`${this.baseUrl}/generate-docs`, request);
      return { result: response.data.result, suggestions: [] };
    } catch (error) {
      Logger.error('Failed to generate documentation:', error);
      throw new Error(ErrorHandler.handleApiError(error, 'Documentation generation'));
    }
  }

  // Refactor code
  async refactorCode(request: any): Promise<any> {
    try {
      const response = await axios.post<CodeResponse>(`${this.baseUrl}/refactor-code`, request);
      return { result: response.data.result, suggestions: [] };
    } catch (error) {
      Logger.error('Failed to refactor code:', error);
      throw new Error(ErrorHandler.handleApiError(error, 'Code refactoring'));
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get<HealthResponse>(`${this.baseUrl}/health`);
      return response.status === 200;
    } catch (error) {
      Logger.error('Health check failed:', error);
      return false;
    }
  }
}