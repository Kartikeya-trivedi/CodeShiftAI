<<<<<<< HEAD
export async function callGenerateAPI(prompt: string): Promise<string> {
    try {
        const response = await fetch('http://localhost:8000/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });
        const data = await response.json();
        return data.result;
    } catch (error) {
        return 'Error calling backend API';
    }
}
=======
import axios from 'axios';
import * as vscode from 'vscode';

export class ApiService {
  private baseUrl: string;
  
  constructor() {
    // Get the API URL from configuration
    const config = vscode.workspace.getConfiguration('codeShiftAI');
    this.baseUrl = config.get('apiUrl') || 'http://localhost:8000';
  }
  
  async sendChatMessage(message: string, context?: string): Promise<string> {
    try {
      const response = await axios.post<{ response: string }>(`${this.baseUrl}/chat`, {
        message,
        context
      });
      
      return response.data.response;
    } catch (error) {
      console.error('Error calling API:', error);
      throw new Error('Failed to get response from CodeShiftAI server');
    }
  }
  
  async getInlineCompletion(prefix: string, fileContent: string, language: string): Promise<string> {
    try {
      const response = await axios.post<{ completion: string }>(`${this.baseUrl}/inline-completion`, {
        prefix,
        fileContent,
        language
      });
      
      return response.data.completion;
    } catch (error) {
      console.error('Error getting completion:', error);
      throw new Error('Failed to get completion from CodeShiftAI server');
    }
  }
}
>>>>>>> c854bf7b9a4e6fc64ae81d9e0cb87788a9b936a0
