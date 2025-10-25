"""
Notes Module  
Apple Notes integration
"""

import asyncio
import re

class NotesModule:
    def __init__(self, core):
        self.core = core
        self.name = 'notes'
        self.description = 'Apple Notes integration'
        
    async def execute(self, message, decision):
        """Execute notes command"""
        message_lower = message.lower()
        
        try:
            if 'create' in message_lower or 'make' in message_lower:
                content = self._extract_content(message)
                if content:
                    await self._run_applescript(f'''
                        tell application "Notes"
                            tell account "iCloud"
                                make new note at folder "Notes" with properties {{body:"{content}"}}
                            end tell
                        end tell
                    ''')
                    return {'text': f'Note created: {content}', 'type': 'success'}
                    
            elif 'read' in message_lower or 'show' in message_lower or 'list' in message_lower:
                notes = await self._run_applescript('''
                    tell application "Notes"
                        tell account "iCloud"
                            get name of notes in folder "Notes"
                        end tell
                    end tell
                ''')
                return {'text': f'Recent notes: {notes}', 'type': 'success'}
                
            return {'text': 'Could not understand notes command', 'type': 'error'}
            
        except Exception as e:
            return {'text': f'Error: {str(e)}', 'type': 'error'}
            
    async def _run_applescript(self, script):
        """Run AppleScript command"""
        escaped_script = script.replace("'", "'\\''")
        process = await asyncio.create_subprocess_shell(
            f"osascript -e '{escaped_script}'",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if stderr:
            raise Exception(stderr.decode())
            
        return stdout.decode().strip()
        
    def _extract_content(self, message):
        """Extract note content from message"""
        patterns = [
            r'note:(.+)',
            r'create\s+(.+)',
            r'make\s+(.+)',
            r'add\s+(.+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                return match.group(1).strip().replace('"', '\\"')
                
        return None
