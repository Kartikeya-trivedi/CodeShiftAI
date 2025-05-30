// Utility functions for VS Code extension
import * as vscode from 'vscode';

/**
 * Configuration utility class for managing extension settings
 */
export class ConfigurationManager {
  private static readonly CONFIG_SECTION = 'codeShiftAI';

  /**
   * Get a configuration value with type safety
   */
  static get<T>(key: string, defaultValue?: T): T {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<T>(key, defaultValue as T);
  }

  /**
   * Update a configuration value
   */
  static async set(key: string, value: any, target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    await config.update(key, value, target);
  }

  /**
   * Check if extension is enabled
   */
  static isEnabled(): boolean {
    return this.get<boolean>('enable', true);
  }

  /**
   * Get API configuration
   */
  static getApiConfig() {
    return {
      url: this.get<string>('apiUrl', 'http://localhost:8000'),
      timeout: this.get<number>('apiTimeout', 30000)
    };
  }

  /**
   * Get completion configuration
   */
  static getCompletionConfig() {
    return {
      enabled: this.get<boolean>('enableAutoCompletion', true),
      delay: this.get<number>('completionDelay', 500),
      maxCompletions: this.get<number>('maxCompletions', 3),
      maxLength: this.get<number>('maxCompletionLength', 100)
    };
  }

  /**
   * Get feature flags
   */
  static getFeatureFlags() {
    return {
      chat: this.get<boolean>('enableChat', true),
      codeActions: this.get<boolean>('enableCodeActions', true),
      statusBar: this.get<boolean>('enableStatusBar', true)
    };
  }
}

/**
 * Logger utility with configurable levels
 */
export class Logger {
  private static readonly LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };

  private static outputChannel: vscode.OutputChannel;

  static initialize(channelName: string = 'CodeShiftAI') {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
  }

  private static getLogLevel(): number {
    const level = ConfigurationManager.get<string>('logLevel', 'info');
    return this.LOG_LEVELS[level as keyof typeof this.LOG_LEVELS] ?? this.LOG_LEVELS.info;
  }

  private static shouldLog(level: number): boolean {
    return level <= this.getLogLevel();
  }

  static error(message: string, ...args: any[]) {
    if (this.shouldLog(this.LOG_LEVELS.error)) {
      const logMessage = `[ERROR] ${message}`;
      console.error(logMessage, ...args);
      this.outputChannel?.appendLine(`${new Date().toISOString()} ${logMessage}`);
      if (args.length > 0) {
        this.outputChannel?.appendLine(JSON.stringify(args, null, 2));
      }
    }
  }

  static warn(message: string, ...args: any[]) {
    if (this.shouldLog(this.LOG_LEVELS.warn)) {
      const logMessage = `[WARN] ${message}`;
      console.warn(logMessage, ...args);
      this.outputChannel?.appendLine(`${new Date().toISOString()} ${logMessage}`);
      if (args.length > 0) {
        this.outputChannel?.appendLine(JSON.stringify(args, null, 2));
      }
    }
  }

  static info(message: string, ...args: any[]) {
    if (this.shouldLog(this.LOG_LEVELS.info)) {
      const logMessage = `[INFO] ${message}`;
      console.info(logMessage, ...args);
      this.outputChannel?.appendLine(`${new Date().toISOString()} ${logMessage}`);
      if (args.length > 0) {
        this.outputChannel?.appendLine(JSON.stringify(args, null, 2));
      }
    }
  }

  static debug(message: string, ...args: any[]) {
    if (this.shouldLog(this.LOG_LEVELS.debug)) {
      const logMessage = `[DEBUG] ${message}`;
      console.debug(logMessage, ...args);
      this.outputChannel?.appendLine(`${new Date().toISOString()} ${logMessage}`);
      if (args.length > 0) {
        this.outputChannel?.appendLine(JSON.stringify(args, null, 2));
      }
    }
  }

  static show() {
    this.outputChannel?.show();
  }

  static dispose() {
    this.outputChannel?.dispose();
  }
}

/**
 * Debounce utility for performance optimization
 */
export class DebounceManager {
  private static timers = new Map<string, NodeJS.Timeout>();

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    key: string = 'default'
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimer = this.timers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        func(...args);
        this.timers.delete(key);
      }, delay);

      this.timers.set(key, timer);
    };
  }

  static cancel(key: string = 'default') {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  static cancelAll() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}

/**
 * Cache utility for performance optimization
 */
export class CacheManager<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private readonly ttl: number;

  constructor(ttlMs: number = 5 * 60 * 1000) { // Default 5 minutes
    this.ttl = ttlMs;
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) {
      return undefined;
    }

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Error handling utilities
 */
export class ErrorHandler {
  static handleApiError(error: any, context: string = 'API call'): string {
    Logger.error(`${context} failed:`, error);

    if (error.code === 'ECONNREFUSED') {
      return 'Unable to connect to CodeShiftAI service. Please check if the service is running and the API URL is correct.';
    }

    if (error.response?.status === 401) {
      return 'Authentication failed. Please check your API credentials.';
    }

    if (error.response?.status === 429) {
      return 'Rate limit exceeded. Please try again later.';
    }

    if (error.response?.status >= 500) {
      return 'Server error occurred. Please try again later.';
    }

    if (error.message) {
      return `Error: ${error.message}`;
    }

    return `An unexpected error occurred during ${context}`;
  }

  static async showErrorWithActions(
    message: string, 
    actions: { title: string; action: () => void | Promise<void> }[] = []
  ): Promise<void> {
    const actionTitles = actions.map(a => a.title);
    const selection = await vscode.window.showErrorMessage(message, ...actionTitles);

    if (selection) {
      const selectedAction = actions.find(a => a.title === selection);
      if (selectedAction) {
        await selectedAction.action();
      }
    }
  }
}

/**
 * Context utilities for better AI understanding
 */
export class ContextAnalyzer {
  static getDocumentContext(document: vscode.TextDocument, position: vscode.Position) {
    const lines = document.getText().split('\n');
    const currentLine = position.line;
    
    // Get surrounding context (5 lines before and after)
    const contextStart = Math.max(0, currentLine - 5);
    const contextEnd = Math.min(lines.length - 1, currentLine + 5);
    const context = lines.slice(contextStart, contextEnd + 1).join('\n');

    // Get imports/requires at the top of the file
    const imports = lines
      .slice(0, Math.min(20, lines.length))
      .filter(line => 
        line.trim().startsWith('import ') || 
        line.trim().startsWith('const ') || 
        line.trim().startsWith('require(') ||
        line.trim().startsWith('from ') ||
        line.trim().startsWith('#include')
      )
      .join('\n');

    return {
      context,
      imports,
      language: document.languageId,
      fileName: document.fileName,
      currentLine: lines[currentLine] || '',
      lineNumber: currentLine + 1
    };
  }

  static getFunctionContext(document: vscode.TextDocument, position: vscode.Position) {
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Simple function detection (can be enhanced for specific languages)
    const beforeCursor = text.substring(0, offset);
    const afterCursor = text.substring(offset);

    // Find function start
    const functionPattern = /(?:function\s+\w+|class\s+\w+|\w+\s*\([^)]*\)\s*{)/g;
    let match;
    let lastFunctionStart = -1;

    while ((match = functionPattern.exec(beforeCursor)) !== null) {
      lastFunctionStart = match.index;
    }

    if (lastFunctionStart !== -1) {
      const functionStart = lastFunctionStart;
      const functionText = beforeCursor.substring(functionStart);
      
      return {
        inFunction: true,
        functionText: functionText.substring(0, Math.min(200, functionText.length)),
        functionStart
      };
    }

    return {
      inFunction: false,
      functionText: '',
      functionStart: -1
    };
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();

  static start(label: string): void {
    this.measurements.set(label, performance.now());
  }

  static end(label: string): number | undefined {
    const startTime = this.measurements.get(label);
    if (startTime === undefined) {
      Logger.warn(`Performance measurement '${label}' was not started`);
      return undefined;
    }

    const duration = performance.now() - startTime;
    this.measurements.delete(label);
    
    Logger.debug(`Performance: ${label} took ${duration.toFixed(2)}ms`);
    return duration;
  }

  static measure<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    this.start(label);
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result.finally(() => this.end(label));
      } else {
        this.end(label);
        return result;
      }
    } catch (error) {
      this.end(label);
      throw error;
    }
  }
}

/**
 * Validation utilities
 */
export class Validator {
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidCode(code: string): boolean {
    return code.trim().length > 0 && code.length < 10000; // Reasonable limits
  }

  static sanitizeInput(input: string): string {
    return input.replace(/[<>]/g, '').trim();
  }
}
