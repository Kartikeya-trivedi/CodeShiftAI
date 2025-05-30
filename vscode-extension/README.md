# CodeShiftAI VS Code Extension

🤖 **An advanced AI-powered VS Code extension with comprehensive Copilot-like features and enhanced modern UI**

## ✨ Features Overview

### 🎨 **Modern UI Components**
- **Activity Bar Integration**: Custom CodeShiftAI view container with dedicated icon
- **Advanced Chat Interface**: Professional chat UI with message bubbles, typing indicators, and VS Code theme integration
- **Tree View Providers**: Interactive history and settings management with expandable nodes
- **Panel Integration**: Flexible layouts - works in sidebar and bottom panel
- **Welcome Views**: Onboarding content and empty state handling

### 🚀 **Intelligent Code Completion**
- **Real-time AI completions**: Get context-aware code suggestions as you type
- **Multi-line suggestions**: Complete entire functions, classes, and code blocks
- **Smart context detection**: Understands your current coding context including imports, functions, and classes
- **Configurable delays**: Customize completion timing to match your coding speed
- **Caching system**: Improved performance with intelligent suggestion caching

### 💬 **Interactive AI Chat**
- **Sidebar chat interface**: Dedicated chat panel with beautiful, responsive UI
- **Message bubbles**: User and assistant messages with avatars and timestamps
- **Typing indicators**: Animated dots during AI response generation
- **Slash commands**: Use `/explain`, `/fix`, `/optimize`, `/test`, `/docs`, `/refactor`, `/review`
- **Chat history**: Undo/redo functionality with persistent chat states
- **Context-aware responses**: AI understands your current workspace and code

### 📊 **History & Settings Management**
- **Conversation History**: Tree view showing all past conversations with expand/collapse
- **Settings Tree View**: Interactive configuration management with toggle and edit capabilities
- **Export Features**: Save chat history as JSON files
- **Context Menu Actions**: Right-click options for history and settings management
- **Real-time Updates**: Settings changes apply immediately

### 🔧 **Code Analysis & Actions**
- **Explain Code** (`Ctrl+Shift+E`): Get detailed explanations of selected code
- **Fix Code** (`Ctrl+Shift+F`): Receive AI-powered bug fixes and improvements
- **Optimize Code** (`Ctrl+Shift+O`): Get performance optimization suggestions
- **Generate Tests** (`Ctrl+Shift+T`): Automatically create unit tests for your code
- **Generate Documentation** (`Ctrl+Shift+D`): Create comprehensive documentation
- **Refactor Code** (`Ctrl+Shift+R`): Intelligent code refactoring suggestions

### ⚡ **Enhanced Quick Actions**
- **Context menu integration**: Right-click on code for instant AI assistance
- **Code actions provider**: Automatic quick fixes and improvement suggestions
- **Diagnostic integration**: Smart fixes based on VS Code error detection
- **One-click application**: Apply AI suggestions directly to your code
- **File analysis**: Analyze entire files for patterns and improvements

### 🎯 **Command Palette Integration**
- **15+ Commands**: Full command palette integration with `CodeShiftAI:` prefix
- **Keyboard shortcuts**: Customizable hotkeys for all actions
- **Quick access**: Open chat, clear history, export data, and more
- **Context-aware commands**: Commands adapt based on current editor state

## Requirements

- VS Code 1.100.0 or higher
- Active internet connection for AI features
- CodeShiftAI API service running (configure endpoint in settings)

## Extension Settings

This extension contributes the following settings:

* `codeShiftAI.enable`: Enable/disable the extension
* `codeShiftAI.apiUrl`: API endpoint URL for CodeShiftAI service
* `codeShiftAI.enableAutoCompletion`: Enable/disable auto-completion features
* `codeShiftAI.completionDelay`: Delay before showing completions (ms)
* `codeShiftAI.maxCompletions`: Maximum number of completions to show
* `codeShiftAI.enableChat`: Enable/disable chat functionality
* `codeShiftAI.enableCodeActions`: Enable/disable code actions provider
* `codeShiftAI.enableStatusBar`: Show/hide status bar indicator

## Keyboard Shortcuts

| Command | Windows/Linux | macOS | Description |
|---------|---------------|-------|-------------|
| Open Chat | `Ctrl+Shift+C` | `Cmd+Shift+C` | Open the AI chat panel |
| Explain Code | `Ctrl+Shift+E` | `Cmd+Shift+E` | Explain selected code |
| Fix Code | `Ctrl+Shift+F` | `Cmd+Shift+F` | Get code fixes |
| Optimize Code | `Ctrl+Shift+O` | `Cmd+Shift+O` | Optimize selected code |
| Generate Tests | `Ctrl+Shift+T` | `Cmd+Shift+T` | Generate unit tests |
| Refactor Code | `Ctrl+Shift+R` | `Cmd+Shift+R` | Refactor selected code |

## Getting Started

1. **Install the extension** from the VS Code marketplace
2. **Configure the API endpoint** in settings (`codeShiftAI.apiUrl`)
3. **Open the chat panel** with `Ctrl+Shift+C` or click the chat icon
4. **Select code** and use context menu options or keyboard shortcuts
5. **Start coding** and enjoy intelligent completions!

## Usage Examples

### Chat Commands
- `/explain` - Explain the current code selection
- `/fix` - Suggest fixes for problematic code
- `/optimize` - Provide optimization recommendations
- `/test` - Generate unit tests for functions/classes
- `/docs` - Create documentation for code
- `/refactor` - Suggest refactoring improvements
- `/review` - Perform code review and analysis

### Code Actions
1. Right-click on any code selection
2. Choose from AI-powered context menu options
3. View results in a dedicated panel
4. Apply suggestions with one click

### Intelligent Completions
1. Start typing code in any file
2. Watch for AI completion suggestions
3. Accept with `Tab` or `Enter`
4. Enjoy context-aware multi-line completions

## Known Issues

- API connection required for all AI features
- Large files may experience slower completion times
- Some language-specific features may vary in accuracy

## Release Notes

### 0.0.1

Initial release featuring:
- Intelligent code completion with context awareness
- Interactive AI chat with slash commands
- Comprehensive code analysis tools
- Quick actions and code fixes
- Status bar integration
- Keyboard shortcuts for all major features

---

## Architecture

The extension consists of several key components:

- **Completion Provider**: Handles real-time code completions
- **Chat Participant**: Manages interactive AI conversations
- **Code Actions Provider**: Provides context-aware quick fixes
- **Status Bar Manager**: Shows real-time extension status
- **API Service**: Handles communication with AI backend

## Contributing

We welcome contributions! Please see our contributing guidelines for more information.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

**Enjoy coding with AI assistance!**
