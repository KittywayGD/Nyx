class SystemModule {
  constructor(core) {
    this.core = core;
    this.name = 'system';
    this.description = 'System control and information';
  }

  canHandle(message) {
    const lower = message.toLowerCase();
    return lower.includes('open') || 
           lower.includes('close') || 
           lower.includes('volume') ||
           lower.includes('brightness') ||
           lower.includes('screenshot') ||
           lower.includes('lock') ||
           lower.includes('sleep');
  }

  async execute(message) {
    const lower = message.toLowerCase();

    try {
      if (lower.includes('open')) {
        const app = this.extractAppName(message);
        if (app) {
          await this.core.executeAppleScript(`tell application "${app}" to activate`);
          return { text: `Opening ${app}`, type: 'success' };
        }
      }

      if (lower.includes('close')) {
        const app = this.extractAppName(message);
        if (app) {
          await this.core.executeAppleScript(`tell application "${app}" to quit`);
          return { text: `Closing ${app}`, type: 'success' };
        }
      }

      if (lower.includes('volume')) {
        const volume = this.extractNumber(message);
        if (volume !== null) {
          await this.core.executeAppleScript(`set volume output volume ${volume}`);
          return { text: `Volume set to ${volume}%`, type: 'success' };
        }
      }

      if (lower.includes('screenshot')) {
        await this.core.executeAppleScript(`do shell script "screencapture -c"`);
        return { text: 'Screenshot taken to clipboard', type: 'success' };
      }

      if (lower.includes('lock')) {
        await this.core.executeAppleScript(`do shell script "/System/Library/CoreServices/Menu\\\\ Extras/User.menu/Contents/Resources/CGSession -suspend"`);
        return { text: 'Locking screen', type: 'success' };
      }

      return { text: 'Could not understand system command', type: 'error' };
    } catch (error) {
      return { text: `Error: ${error.message}`, type: 'error' };
    }
  }

  extractAppName(message) {
    const apps = ['Safari', 'Chrome', 'Firefox', 'Spotify', 'Music', 'Notes', 'Mail', 'Calendar', 'Messages', 'Finder', 'Terminal'];
    const lower = message.toLowerCase();
    
    for (const app of apps) {
      if (lower.includes(app.toLowerCase())) {
        return app;
      }
    }
    
    return null;
  }

  extractNumber(message) {
    const match = message.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }
}

module.exports = SystemModule;
