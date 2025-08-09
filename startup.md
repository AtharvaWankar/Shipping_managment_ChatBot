
# Professional Chatbot - Startup Procedure

## Quick Start Commands

### Start the Project

```bash
# Start the Python HTTP server on port 5000
python -m http.server 5000
```

### Stop the Project

```bash
# Press Ctrl+C (Windows/Linux) or Cmd+C (Mac) in the terminal where the server is running
# Alternative: Find and kill the process
pkill -f "python -m http.server"
```

## Alternative Server Options

If Python is not available, you can use these alternatives:

### Node.js HTTP Server
```bash
# Install http-server globally (if needed)
npm install -g http-server

# Start server
npx http-server -p 5000
```

### PHP Built-in Server
```bash
# Start PHP server
php -S 0.0.0.0:5000
```

## Project Structure Check

### Verify all files are present
```bash
# List all project files
ls -la

# Check specific required files
ls index.html aws-config.js chat-manager.js script.js styles.css theme-manager.js
```

## Development Commands

### View Server Logs
```bash
# Server logs are displayed in the terminal where you started the server
# Look for HTTP request logs and error messages
```

### Check Running Processes
```bash
# See what's running on port 5000
lsof -i :5000

# See all Python processes
ps aux | grep python
```

### Clear Browser Cache (if needed)
- **Chrome/Edge**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- **Firefox**: Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (Mac)
- **Safari**: Cmd+Option+R (Mac)

## Troubleshooting Commands

### Port Already in Use
```bash
# Kill process using port 5000
sudo kill -9 $(lsof -t -i:5000)

# Or use a different port
python -m http.server 8000
```

### Check Network Connectivity
```bash
# Test if server is accessible
curl http://localhost:5000

# Check if external dependencies are reachable
ping google.com
```

### View File Permissions
```bash
# Check if files are readable
ls -la *.html *.js *.css

# Fix permissions if needed
chmod 644 *.html *.js *.css
```

## Production Deployment on Replit

### Using Replit Deployments
1. Click the "Deploy" button in Replit
2. Configure these settings:
   - **Build Command**: (leave empty - no build needed)
   - **Run Command**: `python -m http.server 5000`
   - **Port**: 5000

### Environment Variables (if needed)
```bash
# Set AWS credentials in Replit Secrets
# Go to Tools → Secrets in Replit interface
# Add these keys:
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY
# AWS_REGION
```

## Daily Workflow

### 1. Start Development
```bash
python -m http.server 5000
```

### 2. Open Browser
Navigate to: `http://localhost:5000` or use Replit's webview

### 3. Test Features
- Chat functionality
- Theme toggle
- Voice input (Chrome/Safari only)
- Chat history

### 4. Stop Development
```bash
# Press Ctrl+C to stop the server
```

## Replit-Specific Commands

### Run Button Configuration
The Run button in Replit is already configured to execute:
```bash
python -m http.server 5000
```

### Console Access
- Use Replit's built-in console for all commands
- Terminal is accessible via the Shell tab

## Emergency Recovery

### Reset Everything
```bash
# Stop all Python processes
pkill -f python

# Clear any cached data
rm -rf __pycache__

# Restart with fresh server
python -m http.server 5000
```

### Check Application Status
Open browser console (F12) and run:
```javascript
window.app.getAppStatus()
```

## Notes

- **Port 5000** is the recommended port for Replit web applications
- The application uses **0.0.0.0** binding for external accessibility
- **No build step** required - pure HTML/CSS/JavaScript
- **AWS credentials** are hardcoded for development (change for production)
- **Chat history** falls back to localStorage if S3 is unavailable
