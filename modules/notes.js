class NotesModule {
  constructor(core) {
    this.core = core;
    this.name = 'notes';
    this.description = 'Apple Notes integration';
  }

  canHandle(message) {
    const lower = message.toLowerCase();
    return lower.includes('note') || lower.includes('reminder');
  }

  async execute(message) {
    const lower = message.toLowerCase();

    try {
      if (lower.includes('create') || lower.includes('make') || lower.includes('add')) {
        const content = this.extractContent(message);
        if (content) {
          await this.core.executeAppleScript(`
            tell application "Notes"
              tell account "iCloud"
                make new note at folder "Notes" with properties {body:"${content.replace(/"/g, '\\"')}"}
              end tell
            end tell
          `);
          return { text: `Note created: ${content}`, type: 'success' };
        }
      }

      if (lower.includes('read') || lower.includes('show') || lower.includes('list')) {
        const notes = await this.core.executeAppleScript(`
          tell application "Notes"
            tell account "iCloud"
              get name of notes in folder "Notes"
            end tell
          end tell
        `);
        return { text: `Recent notes: ${notes}`, type: 'success' };
      }

      return { text: 'Could not understand notes command', type: 'error' };
    } catch (error) {
      return { text: `Error: ${error.message}`, type: 'error' };
    }
  }

  extractContent(message) {
    const patterns = [
      /note:(.+)/i,
      /create\s+(.+)/i,
      /make\s+(.+)/i,
      /add\s+(.+)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }
}

module.exports = NotesModule;
