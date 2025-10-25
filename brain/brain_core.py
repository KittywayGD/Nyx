"""
Nyx Brain - Central Intelligence System
"""

import asyncio
from .nlu.intent_classifier import IntentClassifier
from .nlu.entity_extractor import EntityExtractor
from .learning.q_learning import QLearningSystem
from .learning.feedback_manager import FeedbackManager

class NyxBrain:
    def __init__(self, core):
        self.core = core
        self.intent_classifier = IntentClassifier()
        self.entity_extractor = EntityExtractor()
        self.q_learning = QLearningSystem()
        self.feedback_manager = None
        
        self.initialized = False
        self.conversation_context = []
        
    async def initialize(self):
        """Initialize brain components"""
        print("🧠 Initializing Nyx Brain...")
        
        # Initialize Q-Learning
        await self.q_learning.initialize()
        print(f"✓ Q-Learning loaded with {self.q_learning.get_stats()['known_messages']} patterns")
        
        # Initialize feedback manager
        self.feedback_manager = FeedbackManager(self.q_learning, self.core)
        
        self.initialized = True
        
    async def process(self, message, context=None):
        """
        Main processing pipeline
        Input → Perception → Reasoning → Decision
        """
        if not self.initialized:
            await self.initialize()
            
        # PERCEPTION: Understand the input
        perception = await self.perceive(message)
        
        # REASONING: Make decision
        decision = await self.reason(perception)
        
        # LEARNING: Update from interaction
        await self.learn(perception, decision)
        
        return decision
        
    async def perceive(self, message):
        """Analyze and understand the input"""
        perception = {
            'raw_input': message,
            'timestamp': asyncio.get_event_loop().time()
        }
        
        # Classify intent
        intent = self.intent_classifier.classify(message)
        perception['intent'] = intent
        
        # Apply Q-Learning confidence boost
        q_boost = self.q_learning.get_confidence_boost(message, intent['intent'])
        if q_boost != 0:
            old_conf = intent['confidence']
            intent['confidence'] = max(0, min(1, intent['confidence'] + q_boost))
            print(f"🎓 Q-Boost: {int(old_conf*100)}% → {int(intent['confidence']*100)}%")
        
        # Extract entities
        entities = self.entity_extractor.extract(message)
        perception['entities'] = entities
        
        return perception
        
    async def reason(self, perception):
        """Make intelligent decision based on perception"""
        intent = perception['intent']
        
        # Map intent to module
        module = self.map_intent_to_module(intent['intent'])
        
        decision = {
            'module': module,
            'intent': intent,
            'entities': perception['entities'],
            'confidence': intent['confidence'],
            'perception': perception
        }
        
        print(f"🎯 Intent: {intent['intent']} ({int(intent['confidence']*100)}%) → {module}")
        
        return decision
        
    def map_intent_to_module(self, intent):
        """Route intent to appropriate module"""
        intent_map = {
            'system.open': 'system',
            'system.close': 'system',
            'system.volume': 'system',
            'system.brightness': 'system',
            'time.timer': 'time',
            'time.reminder': 'time',
            'info.time': 'time',
            'info.date': 'time',
            'info.weather': 'weather',
            'math.calculate': 'math',
            'math.derivative': 'math',
            'notes.create': 'notes',
            'notes.read': 'notes',
            'music.play': 'music',
            'music.control': 'music',
            'unknown': 'ai'
        }
        
        # Try exact match
        if intent in intent_map:
            return intent_map[intent]
            
        # Try prefix match
        for prefix, module in intent_map.items():
            if intent.startswith(prefix.split('.')[0]):
                return module
                
        return 'ai'
        
    async def learn(self, perception, decision):
        """Learning from interaction"""
        # Store context for future reference
        self.conversation_context.append({
            'perception': perception,
            'decision': decision,
            'timestamp': asyncio.get_event_loop().time()
        })
        
        # Keep only last 10 interactions
        if len(self.conversation_context) > 10:
            self.conversation_context = self.conversation_context[-10:]
