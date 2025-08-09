// Chat Management and Message Handling

class ChatManager {
    constructor() {
        this.messages = [];
        this.currentSessionId = null;
        this.isTyping = false;
        this.messagesContainer = null;
        this.messageInput = null;
        this.sendBtn = null;
        this.typingIndicator = null;
        this.inputContainer = null;
        this.charCount = null;
        this.chatHistoryList = null;
        this.voiceBtn = null;
        this.micIcon = null;
        this.recognition = null;
        this.isListening = false;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
        
        this.createNewSession();
    }

    setupEventListeners() {
        this.messagesContainer = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.inputContainer = document.getElementById('inputContainer');
        this.charCount = document.getElementById('charCount');
        this.chatHistoryList = document.getElementById('chatHistoryList');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.micIcon = document.getElementById('micIcon');

        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            this.messageInput.addEventListener('input', () => {
                this.updateCharCount();
                this.updateSendButton();
            });
        }

        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Voice input setup
        if (this.voiceBtn) {
            this.voiceBtn.addEventListener('click', () => this.toggleVoiceRecognition());
            this.setupVoiceRecognition();
        }

        // Load chat history
        this.loadChatHistory();
    }

    updateCharCount() {
        if (this.charCount && this.messageInput) {
            const count = this.messageInput.value.length;
            this.charCount.textContent = `${count}/2000`;
            
            if (count > 1800) {
                this.charCount.style.color = 'var(--color-accent)';
            } else {
                this.charCount.style.color = 'var(--color-text-secondary)';
            }
        }
    }

    updateSendButton() {
        if (this.sendBtn && this.messageInput) {
            const hasText = this.messageInput.value.trim().length > 0;
            this.sendBtn.disabled = !hasText || this.isTyping;
        }
    }

    createNewSession() {
        this.currentSessionId = this.generateSessionId();
        this.messages = [];
        this.clearChatDisplay();
    }

    generateSessionId() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `chat_${year}${month}${day}_${hours}${minutes}${seconds}`;
    }

    async sendMessage() {
        if (!this.messageInput || this.isTyping) return;

        const messageText = this.messageInput.value.trim();
        if (!messageText) return;

        // Check if AWS is initialized
        if (!window.awsConfig || !window.awsConfig.isInitialized()) {
            this.showError('Please configure AWS credentials first.');
            return;
        }

        // Add user message
        const userMessage = {
            role: 'user',
            content: messageText,
            timestamp: new Date().toISOString()
        };

        this.messages.push(userMessage);
        this.displayMessage(userMessage);
        
        // Clear input and hide input container
        this.messageInput.value = '';
        this.updateCharCount();
        this.updateSendButton();
        this.hideInputContainer();
        this.showTypingIndicator();

        try {
            // Get response from Claude
            const response = await window.awsConfig.invokeClaude(messageText);
            
            // Add assistant message
            const assistantMessage = {
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString()
            };

            this.messages.push(assistantMessage);
            this.displayMessage(assistantMessage);

            // Save session to S3
            await this.saveChatSession();
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError(error.message || 'Failed to send message. Please try again.');
        } finally {
            this.hideTypingIndicator();
            this.showInputContainer();
        }
    }

    displayMessage(message) {
        if (!this.messagesContainer) return;

        // Remove welcome message if present
        const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.role === 'user' ? 'U' : 'AI';

        const content = document.createElement('div');
        content.className = 'message-content';

        const text = document.createElement('p');
        text.className = 'message-text';
        text.textContent = message.content;

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.formatMessageTime(message.timestamp);

        content.appendChild(text);
        content.appendChild(time);

        messageElement.appendChild(avatar);
        messageElement.appendChild(content);

        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();

        // Add entrance animation
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        });
    }

    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    showTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.classList.add('show');
            this.isTyping = true;
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.classList.remove('show');
            this.isTyping = false;
        }
    }

    hideInputContainer() {
        if (this.inputContainer) {
            this.inputContainer.classList.add('hidden');
        }
    }

    showInputContainer() {
        if (this.inputContainer) {
            this.inputContainer.classList.remove('hidden');
        }
    }

    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    clearChatDisplay() {
        if (!this.messagesContainer) return;

        this.messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i data-feather="message-circle"></i>
                </div>
                <h2>Welcome to your AI Assistant</h2>
                <p>Start a conversation by typing a message below.</p>
            </div>
        `;
        
        // Re-initialize feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    async saveChatSession() {
        if (!window.awsConfig || !window.awsConfig.isInitialized() || this.messages.length === 0) return;

        try {
            await window.awsConfig.saveChatSession(this.currentSessionId, this.messages);
            this.loadChatHistory(); // Refresh chat history
        } catch (error) {
            console.error('Error saving chat session:', error);
        }
    }

    async loadChatHistory() {
        if (!window.awsConfig || !window.awsConfig.isInitialized() || !this.chatHistoryList) return;

        try {
            const sessions = await window.awsConfig.listChatSessions();
            this.displayChatHistory(sessions);
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    displayChatHistory(sessions) {
        if (!this.chatHistoryList) return;

        if (sessions.length === 0) {
            this.chatHistoryList.innerHTML = '<div class="no-history">No chat history available</div>';
            return;
        }

        this.chatHistoryList.innerHTML = sessions.map(session => {
            const date = new Date(session.lastModified);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return `
                <div class="history-item" data-session-id="${session.sessionId}">
                    <div class="history-info">
                        <div class="history-date">${formattedDate}</div>
                        <div class="history-preview">Chat session</div>
                    </div>
                    <button class="delete-history-btn" data-session-id="${session.sessionId}" title="Delete this chat">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            `;
        }).join('');

        // Add event listeners for history items
        this.chatHistoryList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-history-btn')) {
                    this.loadChatSession(item.dataset.sessionId);
                }
            });
        });

        // Add event listeners for delete buttons
        this.chatHistoryList.querySelectorAll('.delete-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteChatSession(btn.dataset.sessionId);
            });
        });

        // Re-initialize feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    async loadChatSession(sessionId) {
        if (!window.awsConfig || !window.awsConfig.isInitialized()) return;

        try {
            const sessionData = await window.awsConfig.loadChatSession(sessionId);
            if (sessionData) {
                this.currentSessionId = sessionId;
                this.messages = sessionData.messages || [];
                this.displayLoadedMessages();
            }
        } catch (error) {
            console.error('Error loading chat session:', error);
            this.showError('Failed to load chat session');
        }
    }

    displayLoadedMessages() {
        this.clearChatDisplay();
        
        if (this.messages.length === 0) return;

        this.messages.forEach(message => {
            this.displayMessage(message);
        });
    }

    async deleteChatSession(sessionId) {
        if (!window.awsConfig || !window.awsConfig.isInitialized()) return;

        if (!confirm('Are you sure you want to delete this chat session?')) return;

        try {
            await window.awsConfig.deleteChatSession(sessionId);
            
            // If we're deleting the current session, create a new one
            if (sessionId === this.currentSessionId) {
                this.createNewSession();
            }
            
            this.loadChatHistory();
        } catch (error) {
            console.error('Error deleting chat session:', error);
            this.showError('Failed to delete chat session');
        }
    }

    async deleteAllChatHistory() {
        if (!window.awsConfig || !window.awsConfig.isInitialized()) return;

        if (!confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) return;

        try {
            await window.awsConfig.deleteAllChatSessions();
            this.createNewSession();
            this.loadChatHistory();
        } catch (error) {
            console.error('Error deleting all chat history:', error);
            this.showError('Failed to delete all chat history');
        }
    }

    showError(message) {
        const errorToast = document.getElementById('errorToast');
        if (!errorToast) return;

        const errorMessage = errorToast.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.textContent = message;
        }

        errorToast.classList.add('show');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorToast.classList.remove('show');
        }, 5000);

        // Add close button functionality
        const closeBtn = errorToast.querySelector('.error-close');
        if (closeBtn) {
            closeBtn.onclick = () => errorToast.classList.remove('show');
        }
    }

    // Get current session info
    getCurrentSession() {
        return {
            sessionId: this.currentSessionId,
            messageCount: this.messages.length,
            messages: [...this.messages]
        };
    }

    // Check if there are unsaved messages
    hasUnsavedMessages() {
        return this.messages.length > 0;
    }

    // Voice recognition setup
    setupVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            if (this.voiceBtn) {
                this.voiceBtn.style.display = 'none';
            }
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.voiceBtn.classList.add('listening');
            if (this.micIcon) {
                this.micIcon.setAttribute('data-feather', 'mic-off');
                feather.replace();
            }
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (this.messageInput) {
                this.messageInput.value = transcript;
                this.updateCharCount();
                this.updateSendButton();
                this.messageInput.focus();
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.stopListening();
            this.showError('Voice recognition error: ' + event.error);
        };

        this.recognition.onend = () => {
            this.stopListening();
        };
    }

    toggleVoiceRecognition() {
        if (!this.recognition) return;

        if (this.isListening) {
            this.recognition.stop();
        } else {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error starting speech recognition:', error);
                this.showError('Could not start voice recognition. Please try again.');
            }
        }
    }

    stopListening() {
        this.isListening = false;
        if (this.voiceBtn) {
            this.voiceBtn.classList.remove('listening');
        }
        if (this.micIcon) {
            this.micIcon.setAttribute('data-feather', 'mic');
            feather.replace();
        }
    }
}

// Create and expose singleton instance globally
const chatManager = new ChatManager();
window.chatManager = chatManager;
