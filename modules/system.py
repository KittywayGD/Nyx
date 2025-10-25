"""
System Module
Controls macOS system functions via AppleScript
"""

import asyncio
import subprocess
import re

class SystemModule:
    def __init__(self, core):
        self.core = core
        self.name = 'system'
        self.description = 'System control and information'
        
    async def execute(self, message, decision):
        """Execute system command"""
        message_lower = message.lower()
        entities = decision.get('entities', {})
        
        try:
            if 'open' in message_lower:
                app = entities.get('app', self._extract_app_name(message))
                if app:
                    await self._run_applescript(f'tell application "{app}" to activate')
                    return {'text': f'Opening {app}', 'type': 'success'}
                    
            elif 'close' in message_lower:
                app = entities.get('app', self._extract_app_name(message))
                if app:
                    await self._run_applescript(f'tell application "{app}" to quit')
                    return {'text': f'Closing {app}', 'type': 'success'}
                    
            elif 'volume' in message_lower:
                numbers = entities.get('numbers', [])
                if numbers:
                    volume = numbers[0]
                    await self._run_applescript(f'set volume output volume {volume}')
                    return {'text': f'Volume set to {volume}%', 'type': 'success'}
                    
            elif 'screenshot' in message_lower:
                await self._run_applescript('do shell script "screencapture -c"')
                return {'text': 'Screenshot taken to clipboard', 'type': 'success'}
                
            elif 'lock' in message_lower:
                await self._run_applescript('do shell script "/System/Library/CoreServices/Menu\\\\ Extras/User.menu/Contents/Resources/CGSession -suspend"')
                return {'text': 'Locking screen', 'type': 'success'}
                
            return {'text': 'Could not understand system command', 'type': 'error'}
            
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
        
    def _extract_app_name(self, message):
        """Extract application name from message"""
        apps = ['Safari', 'Chrome', 'Firefox', 'Spotify', 'Music', 'Notes', 'Mail', 'Calendar', 'Finder']
        message_lower = message.lower()
        
        for app in apps:
            if app.lower() in message_lower:
                return app
                
        return None
