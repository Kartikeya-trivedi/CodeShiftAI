// src/api.ts
export class ApiService {
  private baseUrl: string;
  private ws?: any;
  private wsOpenPromise?: Promise<void>;
  private messageCallback?: (msg: string) => void;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getWebSocketImpl(): any {
    // Use 'ws' in VS Code extension host (Node.js), global WebSocket in browser/webview
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      try {
        // Only use ws if not running in a webview
        // VS Code extension host: ws is available
        return require('ws');
      } catch (e) {
        throw new Error('WebSocket package (ws) could not be loaded in Node.js environment.');
      }
    } else if (typeof globalThis !== 'undefined' && typeof (globalThis as any).WebSocket !== 'undefined') {
      // Webview/browser or any environment with WebSocket
      return (globalThis as any).WebSocket;
    } else {
      throw new Error('WebSocket is not available in this environment. You may be running in the VS Code extension host where ws is not available, or in a context without WebSocket support.');
    }
  }

  /**
   * Initialize the WebSocket connection and set event handlers once.
   * Returns a Promise that resolves when the connection opens successfully.
   */
  private initWebSocket(): Promise<void> {
    // If socket is already open, resolve immediately
    if (this.ws && this.ws.readyState === 1) { // 1 = OPEN for both ws and browser
      return Promise.resolve();
    }

    // If socket connection is in progress, return existing promise
    if (this.wsOpenPromise) {
      return this.wsOpenPromise;
    }

    // Create new WebSocket connection
    const WSImpl = this.getWebSocketImpl();
    if (!WSImpl || typeof WSImpl !== 'function') {
      throw new Error('WebSocket implementation is not a constructor.');
    }
    // Use 127.0.0.1 instead of localhost for compatibility and ensure correct port
    const wsUrl = this.baseUrl.replace('localhost', '127.0.0.1').replace(':3000', ':8000').replace(/^http/, 'ws') + '/ws/chat';
    this.ws = new WSImpl(wsUrl);
    if (!this.ws) {
      throw new Error('WebSocket instance could not be created.');
    }

    this.wsOpenPromise = new Promise((resolve, reject) => {
      if (!this.ws) {
        return reject(new Error('WebSocket initialization failed'));
      }

      // Detect ws (Node.js) vs browser WebSocket
      if (typeof this.ws.on === 'function') {
        // ws package (Node.js)
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
        // Browser/WebView WebSocket
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

  /**
   * Send a message via WebSocket.
   * If the socket isn't connected, initialize it first.
   */
  async sendWebSocketMessage(message: string): Promise<void> {
    await this.initWebSocket();

    if (!this.ws || this.ws.readyState !== 1) { // 1 = OPEN for both ws and browser
      throw new Error('WebSocket is not open');
    }

    this.ws.send(message);
  }

  /**
   * Example HTTP GET request method.
   */
  async fetchData(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  // Stub: Get inline completion from API
  async getInlineCompletion(prefix: string, fileContent: string, language: string): Promise<string> {
    // TODO: Implement actual API call
    return Promise.resolve('');
  }

  // Stub: Send chat message to API
  async sendChatMessage(message: string): Promise<string> {
    // TODO: Implement actual API call
    return Promise.resolve('');
  }

  // Stub: Connect WebSocket (no-op for now)
  connectWebSocket(): void {
    // TODO: Implement WebSocket connection logic if needed
  }

  // Stub: Register WebSocket message handler
  onWebSocketMessage(callback: (msg: string) => void): void {
    this.messageCallback = callback;
  }

  // Add other API HTTP methods (POST, PUT, DELETE) as needed
}
