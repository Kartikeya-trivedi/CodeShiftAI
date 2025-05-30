import axios from 'axios';
import * as vscode from 'vscode';
import { ConfigurationManager, Logger, ErrorHandler } from './utils';

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

  async sendWebSocketMessage(message: string): Promise<void> {
    await this.initWebSocket();
    if (!this.ws || this.ws.readyState !== 1) {
      throw new Error('WebSocket is not open');
    }
    this.ws.send(message);
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
  }

  // Stub: Send chat message to API
  async sendChatMessage(message: string): Promise<string> {
    return Promise.resolve('');
  }

  // Stub: Connect WebSocket (no-op for now)
  connectWebSocket(): void {
    // Optionally call this.initWebSocket() if you want to eagerly connect
  }

  // Stub: Explain code
  async explainCode(request: any): Promise<any> {
    return Promise.resolve({ suggestions: [] });
  }
  // Stub: Fix code
  async fixCode(request: any): Promise<any> {
    return Promise.resolve({ suggestions: [] });
  }
  // Stub: Optimize code
  async optimizeCode(request: any): Promise<any> {
    return Promise.resolve({ suggestions: [] });
  }
  // Stub: Generate tests
  async generateTests(request: any): Promise<any> {
    return Promise.resolve({ suggestions: [] });
  }
  // Stub: Generate documentation
  async generateDocumentation(request: any): Promise<any> {
    return Promise.resolve({ suggestions: [] });
  }
  // Stub: Refactor code
  async refactorCode(request: any): Promise<any> {
    return Promise.resolve({ suggestions: [] });
  }
  // Stub: Health check
  async healthCheck(): Promise<boolean> {
    return Promise.resolve(false);
  }
}