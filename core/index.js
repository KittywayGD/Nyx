const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

class NyxCore {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    
    this.modules = new Map();
    this.modulesDir = path.join(__dirname, '..', 'modules');
    this.port = process.env.PORT || 3001;
  }

  async executeAppleScript(script) {
    try {
      const { stdout, stderr } = await execPromise(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
      if (stderr) console.error('AppleScript error:', stderr);
      return stdout.trim();
    } catch (error) {
      throw new Error(`AppleScript execution failed: ${error.message}`);
    }
  }

  async loadModules() {
    console.log('Loading modules...');
    
    if (!fs.existsSync(this.modulesDir)) {
      console.log('Modules directory not found, creating...');
      fs.mkdirSync(this.modulesDir, { recursive: true });
      return;
    }

    const files = fs.readdirSync(this.modulesDir)
      .filter(file => file.endsWith('.js'));

    for (const file of files) {
      try {
        const modulePath = path.join(this.modulesDir, file);
        delete require.cache[require.resolve(modulePath)];
        
        const ModuleClass = require(modulePath);
        const module = new ModuleClass(this);
        
        if (module.initialize) {
          await module.initialize();
        }
        
        this.modules.set(module.name, module);
        console.log(`Loaded module: ${module.name}`);
      } catch (error) {
        console.error(`Failed to load module ${file}:`, error);
      }
    }
  }

  async processMessage(message) {
    console.log('Processing:', message);
    
    for (const [name, module] of this.modules) {
      try {
        if (module.canHandle && module.canHandle(message)) {
          const result = await module.execute(message);
          return {
            ...result,
            module: name,
            timestamp: new Date().toISOString()
          };
        }
      } catch (error) {
        console.error(`Module ${name} error:`, error);
      }
    }
    
    return {
      text: "I'm not sure how to help with that.",
      type: 'info',
      module: 'core',
      timestamp: new Date().toISOString()
    };
  }

  setupRoutes() {
    this.app.get('/', (req, res) => {
      res.json({ status: 'Nyx Core is running' });
    });

    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok',
        modules: Array.from(this.modules.keys())
      });
    });
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log('Client connected');
      
      socket.emit('modules-list', Array.from(this.modules.keys()));
      
      socket.on('message', async (data) => {
        const response = await this.processMessage(data.message);
        socket.emit('response', response);
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }

  async start() {
    await this.loadModules();
    this.setupRoutes();
    this.setupSocketIO();
    
    this.server.listen(this.port, () => {
      console.log(`Nyx Core listening on port ${this.port}`);
    });
  }
}

const core = new NyxCore();
core.start().catch(console.error);

module.exports = NyxCore;
