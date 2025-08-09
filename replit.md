# Professional Chatbot Application

## Overview

This is a professional chatbot application built as a single-page web application that integrates with AWS services. The application provides an AI-powered chat interface using Claude Sonnet 3.7 through AWS Bedrock, with persistent chat history stored in AWS S3. It features a modern, responsive design with glass morphism effects, dark/light theme support, and a clean user experience optimized for professional use.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Pure JavaScript ES6+ modules**: The application uses modern JavaScript with ES6 modules for better code organization and maintainability
- **Component-based structure**: Code is organized into logical modules (chat-manager, theme-manager, aws-config) that handle specific responsibilities
- **Glass morphism UI design**: Modern visual design using CSS custom properties and glassmorphic effects for a professional appearance
- **Responsive design**: Mobile-first approach with hamburger menu navigation and adaptive layouts

### Backend Architecture
- **Serverless approach**: No traditional backend server; relies entirely on client-side JavaScript and AWS services
- **AWS SDK v3 integration**: Uses the latest AWS SDK with tree-shaking support via Skypack CDN for efficient loading
- **Modular service architecture**: Separate classes handle different concerns (AWS configuration, chat management, theme management)

### Data Storage Solutions
- **AWS S3 for persistence**: Chat histories are stored as JSON objects in S3 buckets, providing scalable and reliable storage
- **Local storage for preferences**: User preferences like theme settings are stored in browser localStorage for quick access
- **Session-based chat management**: Each chat session gets a unique identifier for organizing conversation history

### Authentication and Authorization
- **AWS credential-based auth**: Users provide AWS access keys and secret keys for service authentication
- **Environment variable support**: Credentials can be provided via environment variables or direct input
- **No user accounts**: The application operates with direct AWS credential authentication rather than user account management

### Design Patterns
- **Singleton pattern**: AWS configuration and theme management use singleton-like patterns to maintain global state
- **Observer pattern**: Event-driven architecture with DOM event listeners for user interactions
- **Module pattern**: Each JavaScript file exports a single class or configuration object with clear interfaces

## External Dependencies

### Cloud Services
- **AWS Bedrock Runtime**: AI model inference service using Claude Sonnet 3.7 for generating chat responses
- **AWS S3**: Object storage for persistent chat history and session management

### CDN Dependencies
- **AWS SDK v3**: Loaded via Skypack CDN for Bedrock and S3 client libraries
- **Feather Icons**: Icon library loaded from CDN for consistent UI iconography

### AI Model Integration
- **Claude Sonnet 3.7**: Anthropic's language model accessed through AWS Bedrock
- **Model ID**: `anthropic.claude-3-5-sonnet-20241022-v2:0` configured as the default inference model

### Browser APIs
- **Local Storage API**: For persisting user preferences and theme settings
- **Fetch API**: For HTTP requests to AWS services (abstracted through AWS SDK)
- **DOM APIs**: For dynamic UI manipulation and event handling