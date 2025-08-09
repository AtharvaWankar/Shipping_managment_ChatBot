// Main Application Script
import awsConfig from './aws-config.js';
import themeManager from './theme-manager.js';
import chatManager from './chat-manager.js';

class App {
    constructor() {
        this.isInitialized = false;
        this.sidePanel = null;
        this.overlay = null;
        this.hamburgerBtn = null;
        this.closePanelBtn = null;
        this.clearAllBtn = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    setupApp() {
        this.setupElements();
        this.setupEventListeners();
        this.initializeFeatherIcons();
        this.promptForCredentials();
    }

    setupElements() {
        this.sidePanel = document.getElementById('sidePanel');
        this.overlay = document.getElementById('overlay');
        this.hamburgerBtn = document.getElementById('hamburgerBtn');
        this.closePanelBtn = document.getElementById('closePanelBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
    }

    setupEventListeners() {
        // Hamburger menu toggle
        if (this.hamburgerBtn) {
            this.hamburgerBtn.addEventListener('click', () => this.toggleSidePanel());
        }

        // Close panel button
        if (this.closePanelBtn) {
            this.closePanelBtn.addEventListener('click', () => this.closeSidePanel());
        }

        // Overlay click to close panel
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeSidePanel());
        }

        // Clear all chat history
        if (this.clearAllBtn) {
            this.clearAllBtn.addEventListener('click', () => this.clearAllChatHistory());
        }

        // Escape key to close panel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.sidePanel?.classList.contains('open')) {
                this.closeSidePanel();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    toggleSidePanel() {
        if (!this.sidePanel) return;

        const isOpen = this.sidePanel.classList.contains('open');
        if (isOpen) {
            this.closeSidePanel();
        } else {
            this.openSidePanel();
        }
    }

    openSidePanel() {
        if (!this.sidePanel || !this.overlay) return;

        this.sidePanel.classList.add('open');
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Add animation classes
        this.sidePanel.style.transform = 'translateX(0)';
    }

    closeSidePanel() {
        if (!this.sidePanel || !this.overlay) return;

        this.sidePanel.classList.remove('open');
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';

        // Add animation classes
        this.sidePanel.style.transform = 'translateX(-100%)';
    }

    handleResize() {
        // Close side panel on mobile when rotating to landscape
        if (window.innerWidth > 768 && this.sidePanel?.classList.contains('open')) {
            this.closeSidePanel();
        }
    }

    async promptForCredentials() {
        // Try to get credentials from environment variables first
        const accessKey = prompt('Please enter your AWS Access Key ID:') || '';
        const secretKey = prompt('Please enter your AWS Secret Access Key:') || '';
        const region = prompt('Please enter your AWS Region (default: us-east-1):') || 'us-east-1';

        if (!accessKey || !secretKey) {
            this.showError('AWS credentials are required to use the chatbot.');
            return;
        }

        try {
            await awsConfig.initialize(accessKey, secretKey, region);
            this.isInitialized = true;
            console.log('Application initialized successfully');
            
            // Update model info in sidebar
            this.updateModelInfo();
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize AWS services. Please check your credentials and try again.');
        }
    }

    updateModelInfo() {
        const modelInfo = awsConfig.getModelInfo();
        const modelNameElement = document.querySelector('.model-name');
        const modelStatusElement = document.querySelector('.model-status');

        if (modelNameElement) {
            modelNameElement.textContent = modelInfo.modelName;
        }

        if (modelStatusElement) {
            modelStatusElement.textContent = awsConfig.isInitialized() ? 'Active' : 'Inactive';
            modelStatusElement.style.background = awsConfig.isInitialized() ? 'var(--color-teal)' : 'var(--color-accent)';
        }
    }

    async clearAllChatHistory() {
        try {
            await chatManager.deleteAllChatHistory();
        } catch (error) {
            console.error('Error clearing chat history:', error);
            this.showError('Failed to clear chat history');
        }
    }

    initializeFeatherIcons() {
        // Initialize Feather icons when they're available
        if (typeof feather !== 'undefined') {
            feather.replace();
        } else {
            // Retry after a short delay
            setTimeout(() => {
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            }, 100);
        }
    }

    showError(message) {
        const errorToast = document.getElementById('errorToast');
        if (!errorToast) {
            alert(message); // Fallback if error toast is not available
            return;
        }

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

    // Public method to check initialization status
    isAppInitialized() {
        return this.isInitialized && awsConfig.isInitialized();
    }

    // Public method to get app status
    getAppStatus() {
        return {
            initialized: this.isInitialized,
            awsConfigured: awsConfig.isInitialized(),
            currentTheme: themeManager.getCurrentTheme(),
            currentSession: chatManager.getCurrentSession()
        };
    }
}

// Initialize the application
const app = new App();

// Export for debugging purposes
window.app = app;
window.awsConfig = awsConfig;
window.themeManager = themeManager;
window.chatManager = chatManager;

console.log('Professional Chatbot Application Loaded');
console.log('Use window.app.getAppStatus() to check application status');
