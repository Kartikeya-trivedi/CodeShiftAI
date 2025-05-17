import * as vscode from 'vscode';
import { callGenerateAPI } from './api';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('codeshiftaai.generateCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Open a file first to use CodeShiftAI!');
            return;
        }
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        if (!text) {
            vscode.window.showInformationMessage('Select some code or prompt to generate!');
            return;
        }

        const result = await callGenerateAPI(text);
        vscode.window.showInformationMessage('CodeShiftAI result: ' + result);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
