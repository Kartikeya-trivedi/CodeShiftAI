"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeShiftCompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
const api_1 = require("./api");
class CodeShiftCompletionProvider {
    apiService;
    constructor() {
        this.apiService = new api_1.ApiService();
    }
    async provideInlineCompletionItems(document, position, context, token) {
        // Get text before cursor position
        const prefix = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
        // Get the whole file content for context
        const fileContent = document.getText();
        // Get language ID
        const language = document.languageId;
        try {
            // Call API to get completion
            const completion = await this.apiService.getInlineCompletion(prefix, fileContent, language);
            if (completion) {
                return [
                    new vscode.InlineCompletionItem(completion, new vscode.Range(position, position))
                ];
            }
        }
        catch (error) {
            console.error('Error providing inline completion:', error);
        }
        return null;
    }
}
exports.CodeShiftCompletionProvider = CodeShiftCompletionProvider;
//# sourceMappingURL=completionProvider.js.map