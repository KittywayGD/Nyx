"""
AI Module
Fallback module for general conversation
"""

class AiModule:
    def __init__(self, core):
        self.core = core
        self.name = 'ai'
        self.description = 'General AI conversation'
        
    async def execute(self, message, decision):
        """Execute AI response"""
        # For now, simple fallback responses
        responses = {
            'greeting': "Hello! How can I help you today?",
            'thanks': "You're welcome!",
            'unknown': "I'm not sure how to help with that. Try asking me to open an app, set a timer, or create a note."
        }
        
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['hello', 'hi', 'hey', 'bonjour', 'salut']):
            text = responses['greeting']
        elif any(word in message_lower for word in ['thank', 'thanks', 'merci']):
            text = responses['thanks']
        else:
            text = responses['unknown']
            
        return {'text': text, 'type': 'info'}
