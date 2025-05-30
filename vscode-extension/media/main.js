// Main chat interface JavaScript
(function() {
    const vscode = acquireVsCodeApi();
    
    // Get DOM elements
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const clearBtn = document.getElementById('clearBtn');
    const exportBtn = document.getElementById('exportBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const typingIndicator = document.getElementById('typingIndicator');

    let messages = [];

    // Initialize event listeners
    function init() {
        // Auto-resize textarea
        messageInput.addEventListener('input', handleInputChange);
        messageInput.addEventListener('keydown', handleKeyDown);
        
        // Button event listeners
        sendBtn.addEventListener('click', sendMessage);
        clearBtn.addEventListener('click', clearChat);
        exportBtn.addEventListener('click', exportChat);
        settingsBtn.addEventListener('click', openSettings);
        
        // Focus input
        messageInput.focus();
        
        // Listen for messages from extension
        window.addEventListener('message', handleExtensionMessage);
    }

    function handleInputChange() {
        // Auto-resize textarea
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        
        // Enable/disable send button
        const isEmpty = messageInput.value.trim().length === 0;
        sendBtn.disabled = isEmpty;
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!sendBtn.disabled) {
                sendMessage();
            }
        }
    }

    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        sendBtn.disabled = true;

        // Send message to extension
        vscode.postMessage({
            command: 'sendMessage',
            text: text
        });
    }

    function clearChat() {
        if (messages.length === 0) return;
        
        if (confirm('Are you sure you want to clear the chat history?')) {
            messages = [];
            messagesContainer.innerHTML = getWelcomeMessage();
            vscode.postMessage({ command: 'clearChat' });
        }
    }

    function exportChat() {
        if (messages.length === 0) {
            vscode.postMessage({
                command: 'showInformation',
                message: 'No messages to export'
            });
            return;
        }

        const chatData = {
            timestamp: new Date().toISOString(),
            messages: messages
        };

        vscode.postMessage({
            command: 'exportChat',
            data: chatData
        });
    }

    function openSettings() {
        vscode.postMessage({ command: 'openSettings' });
    }

    function handleExtensionMessage(event) {
        const message = event.data;
        
        switch (message.command) {
            case 'addMessage':
                addMessage(message.message);
                break;
            case 'showTyping':
                showTypingIndicator();
                break;
            case 'hideTyping':
                hideTypingIndicator();
                break;
            case 'clearMessages':
                clearMessages();
                break;
            case 'exportMessages':
                exportMessages();
                break;
        }
    }

    function addMessage(message) {
        messages.push(message);
        
        // Remove welcome message if it exists
        const welcomeMsg = messagesContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
        // Create message element
        const messageEl = createMessageElement(message);
        messagesContainer.appendChild(messageEl);
        
        // Scroll to bottom
        scrollToBottom();
    }

    function createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        let avatarIcon = '';
        switch (message.type) {
            case 'user':
                avatarIcon = '<span class="codicon codicon-account"></span>';
                break;
            case 'assistant':
                avatarIcon = '<span class="codicon codicon-robot"></span>';
                break;
            case 'error':
                avatarIcon = '<span class="codicon codicon-error"></span>';
                break;
        }
        avatar.innerHTML = avatarIcon;
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        // Format message content (handle code blocks, etc.)
        const formattedContent = formatMessageContent(message.content);
        content.innerHTML = formattedContent;
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = formatTimestamp(message.timestamp);
        content.appendChild(timestamp);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        return messageDiv;
    }

    function formatMessageContent(content) {
        // Basic markdown-like formatting
        content = content.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function showTypingIndicator() {
        typingIndicator.style.display = 'flex';
        scrollToBottom();
    }

    function hideTypingIndicator() {
        typingIndicator.style.display = 'none';
    }

    function clearMessages() {
        messages = [];
        messagesContainer.innerHTML = getWelcomeMessage();
    }

    function exportMessages() {
        // This would be handled by the extension
    }

    function scrollToBottom() {
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 10);
    }

    function getWelcomeMessage() {
        return `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <span class="codicon codicon-robot"></span>
                </div>
                <h3>Welcome to CodeShiftAI!</h3>
                <p>I'm your AI coding assistant. I can help you with:</p>
                <ul>
                    <li><span class="codicon codicon-lightbulb"></span> Code explanations and suggestions</li>
                    <li><span class="codicon codicon-tools"></span> Bug fixes and optimizations</li>
                    <li><span class="codicon codicon-beaker"></span> Test generation</li>
                    <li><span class="codicon codicon-book"></span> Documentation writing</li>
                </ul>
                <p>What would you like help with today?</p>
            </div>
        `;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
