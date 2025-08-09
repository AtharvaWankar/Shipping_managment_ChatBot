# Professional Chatbot Application

A professional chatbot web interface that integrates with AWS Bedrock Claude Sonnet 3.7 and stores chat history in AWS S3. Built with vanilla HTML, CSS, and JavaScript for optimal performance and simplicity.

## Features

- 🤖 **AI-Powered Chat**: Integrates with AWS Bedrock Claude Sonnet 3.7 for intelligent responses
- 💾 **Persistent Storage**: Chat history automatically saved to AWS S3
- 🎨 **Professional Design**: Modern glass-morphism UI with custom color palette
- 🌙 **Theme Support**: Smooth dark/light mode toggle with animations
- 🎙️ **Voice Input**: Speech-to-text functionality using Web Speech API
- 📱 **Responsive**: Mobile-friendly design with hamburger menu navigation
- ⚡ **Real-time**: Live typing indicators and smooth animations

## Color Palette

The application uses a carefully selected color palette:
- Primary: `#0F1108` (Dark Green)
- Secondary: `#562C2C` (Dark Red)
- Accent: `#F2542D` (Orange Red)
- Light: `#F5DFBB` (Cream)
- Teal: `#127475` (Dark Teal)
- Background: `#ECF8F8` (Light Cyan)

Colors automatically invert in dark mode with smooth transitions.

## Prerequisites

- Modern web browser with JavaScript enabled
- AWS account with Bedrock access
- Internet connection for CDN resources

## Quick Start

### 1. Start the Application

```bash
# Navigate to the project directory
cd your-chatbot-directory

# Start the Python HTTP server
python -m http.server 5000
```

The application will be available at: `http://localhost:5000`

### 2. Alternative Server Options

If you don't have Python, you can use other servers:

```bash
# Using Node.js (if available)
npx http-server -p 5000

# Using PHP (if available)
php -S localhost:5000
```

### 3. AWS Configuration

The AWS credentials are pre-configured in the application:
- **Access Key**: AKIARHJJMTTSEY2U6XQF
- **Secret Key**: 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
- **Model**: Claude 3.7 Sonnet (anthropic.claude-3-7-sonnet-20250219-v1:0)
- **Knowledge Base ID**: P33K9CRFWL
- **Region**: us-east-1

## How to Use

1. **Start Chatting**: Type your message in the glass input bar at the bottom
2. **Voice Input**: Click the microphone button to speak your message
3. **Theme Toggle**: Use the side panel to switch between light/dark themes
4. **Chat History**: Access previous conversations from the side panel
5. **Settings**: Click the hamburger menu (top-left) to open the side panel

## Features Overview

### Side Panel
- **Current Model**: Shows active AI model information
- **Theme Toggle**: Switch between light and dark modes
- **Chat History**: Browse and load previous conversations
- **Delete Options**: Remove individual chats or clear all history

### Chat Interface
- **Glass Input Bar**: Modern translucent input with smooth animations
- **Voice Recognition**: Click microphone to dictate messages
- **Typing Indicator**: Shows when AI is processing your request
- **Auto-Save**: Conversations automatically saved to AWS S3
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### AWS Integration
- **Bedrock Runtime**: Direct integration with Claude Sonnet 3.7
- **S3 Storage**: Automatic chat history backup with date/time naming
- **Error Handling**: Comprehensive error messages and retry logic

## File Structure

```
chatbot/
├── index.html          # Main HTML structure
├── styles.css          # Styling and theme management
├── script.js           # Main application logic
├── aws-config.js       # AWS service configuration
├── theme-manager.js    # Light/dark theme handling
├── chat-manager.js     # Chat functionality and voice input
└── README.md          # This file
```

## Troubleshooting

### Common Issues

1. **Voice Input Not Working**
   - Ensure you're using Chrome, Edge, or Safari
   - Check browser permissions for microphone access
   - Voice recognition may not work in Firefox

2. **AWS Connection Issues**
   - Verify your AWS account has Bedrock access
   - Check that the specified model is available in your region
   - Ensure S3 permissions are properly configured

3. **Chat History Not Loading**
   - Check AWS S3 permissions
   - Verify the chat-history bucket exists
   - Look for console errors in browser developer tools

### Browser Support

- **Chrome**: Full support (recommended)
- **Safari**: Full support
- **Edge**: Full support
- **Firefox**: Limited (no voice input)

## Stopping the Application

To stop the server:

1. Go to your terminal where the server is running
2. Press `Ctrl + C` (Windows/Linux) or `Cmd + C` (Mac)
3. The server will shut down and the application will be inaccessible

## Security Notes

- AWS credentials are hardcoded for development purposes
- In production, use environment variables or AWS IAM roles
- Consider implementing user authentication for multi-user scenarios
- Chat history is stored in AWS S3 with default encryption

## Technical Details

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Icons**: Feather Icons (loaded via CDN)
- **AWS SDK**: v3 (loaded via Skypack CDN)
- **Storage**: AWS S3 for chat history
- **AI Model**: Anthropic Claude 3.7 Sonnet via AWS Bedrock
- **Speech Recognition**: Web Speech API (browser native)

## Development

The application uses modern JavaScript modules and is organized into logical components:

- `AWSConfig`: Handles all AWS service interactions
- `ThemeManager`: Manages light/dark theme switching
- `ChatManager`: Handles messaging, voice input, and history
- `App`: Main application controller and UI management

For modifications, simply edit the relevant files and refresh the browser.