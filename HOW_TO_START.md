
# How to Start and Stop the Professional Chatbot

## Starting the Project

### Option 1: Use the Run Button (Recommended)
1. Click the **"Run"** button at the top of Replit
2. Your chatbot will be available at the provided URL

### Option 2: Manual Command
```bash
python -m http.server 5000 --bind 0.0.0.0
```

## Stopping the Project

### If using Run Button:
1. Click the **"Stop"** button in Replit console
2. Or press `Ctrl+C` in the console

### If using manual command:
1. Press `Ctrl+C` (Windows/Linux) or `Cmd+C` (Mac) in the terminal
2. Or kill the process:
```bash
pkill -f "python -m http.server"
```

## Alternative Port (if 5000 is busy)
```bash
python -m http.server 8000 --bind 0.0.0.0
```

## Accessing Your Chatbot
- **Local**: `http://localhost:5000`
- **External**: Use the Replit-provided URL (appears when server starts)

## Quick Troubleshooting
- **Port busy error**: Use the alternative port command above
- **Not loading**: Check browser console for errors (F12)
- **AWS errors**: Chat history will save locally instead of S3

## Project Files
- `index.html` - Main interface
- `aws-config.js` - AI and storage configuration  
- `chat-manager.js` - Chat functionality
- `styles.css` - Visual styling
- `script.js` - Main application logic
