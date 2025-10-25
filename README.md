# Nyx - AI Assistant for macOS

Nyx is an intelligent, modular AI assistant for macOS that can control your system, manage tasks, and help you be more productive.

## Features

### Core Capabilities
- Modular architecture with hot-reloadable plugins
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

## Installation

### Prerequisites
- macOS 10.15 or later
- Node.js 16+ and npm

### Setup

1. Install dependencies:
```bash
npm install
cd app
npm install
cd ..
```

2. Start the backend:
```bash
npm start
```

3. In another terminal, start the Electron app:
```bash
npm run electron
```

Or run in development mode:
```bash
npm run dev
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

### Keyboard Shortcuts
- `Cmd + Shift + N` - Show/hide Nyx window

## Creating Custom Modules

Modules are JavaScript files in the `modules/` directory.

### Module Template

```javascript
class MyModule {
  constructor(core) {
    this.core = core;
    this.name = 'mymodule';
    this.description = 'What this module does';
  }

  canHandle(message) {
    const lower = message.toLowerCase();
    return lower.includes('keyword');
  }

  async execute(message) {
    try {
      // Your logic here
      
      return {
        text: 'Response to user',
        type: 'success'
      };
    } catch (error) {
      return { 
        text: `Error: ${error.message}`, 
        type: 'error' 
      };
    }
  }
}

module.exports = MyModule;
```


### Using AppleScript in Modules

```javascript
await this.core.executeAppleScript(`
  tell application "Finder"
    activate
  end tell
`);
```

### Module Response Types
- `success` - Successful operation
- `error` - Error occurred
- `info` - Informational message

## Project Structure

```
Nyx/
├── core/
│   └── index.js          # Core engine with module loader
├── modules/
│   ├── system.js         # System control
│   └── notes.js          # Apple Notes integration
├── app/
│   ├── src/              # React source files
│   ├── public/           # Static assets
│   ├── electron.js       # Electron main process
│   └── package.json      # App dependencies
├── package.json          # Core dependencies
├── .env                  # Configuration
└── README.md             # Documentation
```

## Development

### Running in Development Mode
```bash
# Terminal 1: Core with auto-reload
npm run dev

# Terminal 2: React app
cd app && npm start

# Terminal 3: Electron
npm run electron
```

### Building
```bash
cd app
npm run build
npm run dist:mac
```

### Module Hot Reload
Modules automatically reload when you save changes.

## Troubleshooting

### Permission denied errors
Grant accessibility permissions to Terminal/Electron in:
System Preferences > Security & Privacy > Privacy > Accessibility

### Port already in use
Change the port in `.env`:
```
PORT=3002
```

### Modules not loading
- Check syntax errors in module files
- Verify all modules export a class
- Check console for error messages

## Security Notes

- Nyx has system-level permissions through AppleScript
- Never run untrusted modules
- Review module code before loading

## License

MIT License

---

Built for productivity and automation on macOS.
