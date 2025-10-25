# Nyx - AI Assistant for macOS

Nyx is an intelligent, modular AI assistant for macOS with a Python backend and Electron frontend.

## Features

### Core Capabilities
- Python backend with asyncio and Socket.IO
- Modular architecture with hot-reloadable plugins
- Q-Learning system for adaptive intelligence
- System control for macOS applications
- Real-time communication via WebSocket
- Modern Electron interface with dark theme

### Built-in Modules

**System Module**
- Open and close applications
- Control volume and brightness
- Lock screen and take screenshots
- Example: "Open Spotify", "Set volume to 50"

**Notes Module**
- Create and read Apple Notes
- Quick note taking
- Example: "Create a note: Buy groceries"

**AI Module**
- General conversation
- Fallback for unknown commands

## Installation

### Prerequisites
- macOS 10.15 or later
- Python 3.8+
- Node.js 16+ and npm

### Setup

1. Install Python dependencies:
```bash
cd /Users/alecfaccioli/Documents/Nyx
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Install app dependencies:
```bash
cd app
npm install
cd ..
```

3. Run Nyx:
```bash
chmod +x start-nyx.sh
./start-nyx.sh
```

Or manually:
```bash
# Terminal 1: Python backend
source venv/bin/activate
python3 core/server.py

# Terminal 2: Electron app
cd app
npm run electron
```

## Usage

### Example Commands

**System Control**
- "Open Safari"
- "Close Chrome"
- "Set volume to 30"
- "Take a screenshot"
- "Lock screen"

**Notes**
- "Create a note: Meeting notes for project X"
- "Show my notes"

**Conversation**
- "Hello"
- "Thanks"

### Keyboard Shortcuts
- `Cmd + Shift + N` - Show/hide Nyx window

## Architecture

### Python Backend
```
core/
  server.py          # Main server with Socket.IO
brain/
  brain_core.py      # Central intelligence
  nlu/
    intent_classifier.py
    entity_extractor.py
  learning/
    q_learning.py
    feedback_manager.py
modules/
  system.py          # System control
  notes.py           # Apple Notes
  ai.py              # General AI
```

### Electron Frontend
```
app/
  electron.js        # Main process
  src/               # React components
  public/            # Static assets
```

## Creating Custom Modules

Create a new Python file in `modules/` directory:

```python
class MyModule:
    def __init__(self, core):
        self.core = core
        self.name = 'mymodule'
        self.description = 'What this module does'
        
    async def execute(self, message, decision):
        try:
            # Your logic here
            
            return {
                'text': 'Response to user',
                'type': 'success'
            }
        except Exception as e:
            return { 
                'text': f'Error: {str(e)}', 
                'type': 'error' 
            }
```

Module response types:
- `success` - Successful operation
- `error` - Error occurred
- `info` - Informational message

## Development

### Running in Development Mode
```bash
# Python backend with auto-reload
source venv/bin/activate
python3 core/server.py

# React app
cd app && npm start

# Electron
cd app && npm run electron
```

### Building
```bash
cd app
npm run build
npm run dist:mac
```

## Troubleshooting

### Permission denied errors
Grant accessibility permissions to Terminal/Python in:
System Preferences > Security & Privacy > Privacy > Accessibility

### Port already in use
The server runs on port 3001. Change it in `core/server.py` if needed.

### Module not loading
- Check syntax errors in module files
- Ensure module class name follows convention: `ModuleName + 'Module'`
- Check Python console for error messages

### Python dependencies issues
```bash
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

## Security Notes

- Nyx has system-level permissions through AppleScript
- Never run untrusted modules
- Review module code before loading

## License

MIT License

---

Built with Python (backend) and Electron (frontend) for productivity on macOS.
