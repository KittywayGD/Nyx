"""
Entity Extractor - NLU Component
Extracts entities from user input
"""

import re

class EntityExtractor:
    def extract(self, text):
        """Extract entities from text"""
        entities = {}
        
        # Numbers
        numbers = re.findall(r'\d+', text)
        if numbers:
            entities['numbers'] = [int(n) for n in numbers]
            
        # Applications
        apps = ['safari', 'chrome', 'spotify', 'music', 'notes', 'mail', 'calendar']
        for app in apps:
            if app in text.lower():
                entities['app'] = app.capitalize()
                break
                
        # Time expressions
        time_patterns = [
            (r'(\d+)\s*minutes?', 'minutes'),
            (r'(\d+)\s*hours?', 'hours'),
            (r'(\d+)\s*seconds?', 'seconds')
        ]
        
        for pattern, unit in time_patterns:
            match = re.search(pattern, text.lower())
            if match:
                entities['duration'] = {
                    'value': int(match.group(1)),
                    'unit': unit
                }
                break
                
        return entities
