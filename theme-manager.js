// Theme Management for Light/Dark Mode
class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themeToggleBtn = null;
        this.themeText = null;
        this.init();
    }

    init() {
        // Get saved theme from localStorage or default to light
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        // Apply the theme immediately
        this.applyTheme(this.currentTheme);
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        this.themeToggleBtn = document.getElementById('themeToggle');
        this.themeText = this.themeToggleBtn?.querySelector('.theme-text');
        
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
            this.updateThemeButton();
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        this.updateThemeButton();
        this.saveTheme();
        
        // Add a subtle animation effect
        this.addToggleAnimation();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
    }

    updateThemeButton() {
        if (!this.themeText) return;
        
        this.themeText.textContent = this.currentTheme === 'light' ? 'Light Mode' : 'Dark Mode';
    }

    addToggleAnimation() {
        const body = document.body;
        body.style.transition = 'none';
        
        // Force a reflow
        body.offsetHeight;
        
        body.style.transition = 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Add a ripple effect to the theme button
        if (this.themeToggleBtn) {
            this.createRippleEffect(this.themeToggleBtn);
        }
    }

    createRippleEffect(element) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            width: ${size}px;
            height: ${size}px;
            left: 50%;
            top: 50%;
            margin-left: ${-size / 2}px;
            margin-top: ${-size / 2}px;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        // Add ripple animation CSS if not already present
        if (!document.querySelector('#ripple-animation')) {
            const style = document.createElement('style');
            style.id = 'ripple-animation';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    saveTheme() {
        localStorage.setItem('theme', this.currentTheme);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    // Get theme-aware colors for dynamic elements
    getThemeColors() {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        return {
            primary: computedStyle.getPropertyValue('--color-primary').trim(),
            secondary: computedStyle.getPropertyValue('--color-secondary').trim(),
            accent: computedStyle.getPropertyValue('--color-accent').trim(),
            background: computedStyle.getPropertyValue('--color-background').trim(),
            text: computedStyle.getPropertyValue('--color-text').trim(),
            surface: computedStyle.getPropertyValue('--color-surface').trim()
        };
    }

    // Add smooth transition to elements
    addTransitionToElement(element, duration = '0.3s') {
        element.style.transition = `all ${duration} cubic-bezier(0.4, 0, 0.2, 1)`;
    }

    // Remove transition from elements (useful for immediate changes)
    removeTransitionFromElement(element) {
        element.style.transition = 'none';
        // Force reflow
        element.offsetHeight;
        // Re-add transition
        element.style.transition = '';
    }
}

// Create and expose singleton instance globally
const themeManager = new ThemeManager();
window.themeManager = themeManager;
