"""
Intent Classifier - NLU Component
Classifies user intent from natural language
"""

import re

class IntentClassifier:
    def __init__(self):
        self.patterns = self._init_patterns()
        
    def _init_patterns(self):
        """Initialize intent patterns"""
        return {
            'system.open': [
                r'open\s+(\w+)',
                r'launch\s+(\w+)',
                r'start\s+(\w+)',
                r'ouvre\s+(\w+)',
                r'lance\s+(\w+)'
            ],
            'system.close': [
                r'close\s+(\w+)',
                r'quit\s+(\w+)',
                r'ferme\s+(\w+)'
            ],
            'system.volume': [
                r'volume\s+(\d+)',
                r'set volume to\s+(\d+)',
                r'volume à\s+(\d+)'
            ],
            'time.timer': [
                r'timer\s+(\d+)',
                r'set timer for\s+(\d+)',
                r'minuteur\s+(\d+)'
            ],
            'info.weather': [
                r'weather',
                r'météo',
                r'what.*weather',
                r'quel temps'
            ],
            'info.time': [
                r'what time',
                r'quelle heure',
                r'current time'
            ],
            'math.calculate': [
                r'\d+\s*[\+\-\*/]\s*\d+',
                r'calculate',
                r'calcul',
                r'combien fait'
            ],
            'math.derivative': [
                r'dérivée',
                r'derivative',
                r"dérive\s+"
            ],
            'notes.create': [
                r'create note',
                r'make note',
                r'note:',
                r'crée note',
                r'nouvelle note'
            ],
            'notes.read': [
                r'read note',
                r'show note',
                r'list notes',
                r'lis note',
                r'montre note'
            ],
            'music.play': [
                r'play music',
                r'play\s+(\w+)',
                r'lance musique',
                r'joue'
            ]
        }
        
    def classify(self, text):
        """Classify intent from text"""
        text_lower = text.lower()
        
        best_match = {
            'intent': 'unknown',
            'confidence': 0.3
        }
        
        for intent, patterns in self.patterns.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    # Calculate confidence based on pattern match quality
                    confidence = 0.85 if re.match(f'^{pattern}$', text_lower) else 0.70
                    
                    if confidence > best_match['confidence']:
                        best_match = {
                            'intent': intent,
                            'confidence': confidence
                        }
                        
        return best_match
