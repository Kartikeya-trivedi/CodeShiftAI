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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
const axios_1 = __importDefault(require("axios"));
const vscode = __importStar(require("vscode"));
class ApiService {
    baseUrl;
    constructor() {
        // Get the API URL from configuration
        const config = vscode.workspace.getConfiguration('codeShiftAI');
        this.baseUrl = config.get('apiUrl') || 'http://localhost:8000';
    }
    async sendChatMessage(message, context) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/chat`, {
                message,
                context
            });
            return response.data.response;
        }
        catch (error) {
            console.error('Error calling API:', error);
            throw new Error('Failed to get response from CodeShiftAI server');
        }
    }
    async getInlineCompletion(prefix, fileContent, language) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/inline-completion`, {
                prefix,
                fileContent,
                language
            });
            return response.data.completion;
        }
        catch (error) {
            console.error('Error getting completion:', error);
            throw new Error('Failed to get completion from CodeShiftAI server');
        }
    }
}
exports.ApiService = ApiService;
//# sourceMappingURL=api.js.map