#!/usr/bin/env python3
"""
Nyx Brain - Main AI Backend
Handles intent classification, reasoning, and learning
"""

import sys
import json
import asyncio
from datetime import datetime

from nlu.intent_classifier import IntentClassifier
from nlu.entity_extractor import EntityExtractor
from reasoning.reasoner import Reasoner
from reasoning.task_planner import TaskPlanner
from learning.q_learning import QLearningSystem
from memory import MemoryManager
from context import ContextAnalyzer

class NyxBrain:
    def __init__(self):
        self.intent_classifier = IntentClassifier()
        self.entity_extractor = EntityExtractor()
        self.reasoner = Reasoner()
        self.task_planner = TaskPlanner()
        self.q_learning = QLearningSystem()
        self.memory = MemoryManager()
        self.context_analyzer = ContextAnalyzer()
        
        self.conversation_history = []
        self.initialized = False
        
    async def initialize(self):
        """Initialize all brain components"""
        print("Initializing Nyx Brain...", file=sys.stderr)
        
        await self.memory.load()
        await self.q_learning.load()
        
        self.initialized = True
        print("Brain initialized successfully", file=sys.stderr)
    
    async def process(self, message):
        """Main processing pipeline"""
        if not self.initialized:
            await self.initialize()
        
        # Perception layer
        perception = await self.perceive(message)
        
        # Reasoning layer
        decision = await self.reason(perception)
        
        # Learning layer
        await self.learn(perception, decision)
        
        return decision
    
    async def perceive(self, message):
        """Perception: Understand the input"""
        perception = {
            'raw_input': message,
            'timestamp': datetime.now().isoformat()
        }
        
        # Classify intent
        intent = self.intent_classifier.classify(message)
        perception['intent'] = intent
        
        # Apply Q-Learning boost
        q_boost = self.q_learning.get_confidence_boost(message, intent['intent'])
        if q_boost != 0:
            old_conf = intent['confidence']
            intent['confidence'] = max(0, min(1, intent['confidence'] + q_boost))
            print(f"Q-Boost: {old_conf:.2f} -> {intent['confidence']:.2f}", file=sys.stderr)
        
        # Extract entities
        entities = self.entity_extractor.extract(message)
        perception['entities'] = entities
        
        # Analyze context
        context = self.context_analyzer.analyze(message, self.conversation_history)
        perception['context'] = context
        
        return perception
    
    async def reason(self, perception):
        """Reasoning: Make decisions"""
        decision = {
            'action': None,
            'module': None,
            'confidence': 0,
            'perception': perception
        }
        
        # Map intent to module
        module = self.map_intent_to_module(perception['intent'])
        decision['module'] = module
        decision['confidence'] = perception['intent']['confidence']
        
        # Create execution plan if needed
        if perception['intent']['confidence'] < 0.7:
            plan = await self.task_planner.create_plan(perception)
            decision['plan'] = plan
        
        return decision
    
    def map_intent_to_module(self, intent):
        """Map intent to appropriate module"""
        intent_name = intent.get('intent', 'unknown')
        
        intent_map = {
            'system.': 'system',
            'time.': 'time',
            'math.': 'calculator',
            'info.weather': 'weather',
            'music.': 'music',
            'notes.': 'notes',
            'unknown': 'ai'
        }
        
        # Check for exact or prefix match
        for prefix, module in intent_map.items():
            if intent_name.startswith(prefix):
                return module
        
        return 'ai'
    
    async def learn(self, perception, decision):
        """Learning: Update from interaction"""
        self.conversation_history.append({
            'message': perception['raw_input'],
            'intent': perception['intent'],
            'timestamp': perception['timestamp']
        })
        
        # Keep only last 50 messages
        if len(self.conversation_history) > 50:
            self.conversation_history = self.conversation_history[-50:]
        
        await self.memory.store_interaction(perception, decision)
    
    def send_response(self, response):
        """Send response to Node.js via stdout"""
        output = {
            'type': 'response',
            'data': response
        }
        print(json.dumps(output), flush=True)

async def main():
    brain = NyxBrain()
    await brain.initialize()
    
    print("Brain ready, listening for commands...", file=sys.stderr)
    
    # Read commands from stdin
    loop = asyncio.get_event_loop()
    
    while True:
        try:
            line = await loop.run_in_executor(None, sys.stdin.readline)
            if not line:
                break
            
            data = json.loads(line.strip())
            
            if data.get('type') == 'command':
                message = data.get('message', '')
                
                # Process the message
                decision = await brain.process(message)
                
                # Send response back
                response = {
                    'text': f"Processed: {message}",
                    'type': 'info',
                    'module': decision['module'],
                    'intent': decision['perception']['intent'],
                    'confidence': decision['confidence'],
                    'timestamp': datetime.now().isoformat()
                }
                
                brain.send_response(response)
                
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error processing command: {e}", file=sys.stderr)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Brain shutting down...", file=sys.stderr)
