"""
Q-Learning System
Learns from user feedback to improve intent classification
"""

import json
import os
from pathlib import Path

class QLearningSystem:
    def __init__(self, data_dir='data'):
        self.data_dir = Path(data_dir)
        self.data_file = self.data_dir / 'q_learning.json'
        self.q_table = {}
        self.learning_rate = 0.1
        self.discount_factor = 0.9
        
    async def initialize(self):
        """Load Q-table from disk"""
        self.data_dir.mkdir(exist_ok=True)
        
        if self.data_file.exists():
            with open(self.data_file, 'r') as f:
                self.q_table = json.load(f)
        else:
            self.q_table = {}
            
    def get_confidence_boost(self, message, intent):
        """Get confidence boost based on learned patterns"""
        key = f"{message.lower()}:{intent}"
        
        if key in self.q_table:
            q_value = self.q_table[key]
            # Convert Q-value to confidence boost (-0.2 to +0.2)
            return min(0.2, max(-0.2, q_value * 0.2))
            
        return 0
        
    async def update_q_value(self, message, intent, reward):
        """Update Q-value based on feedback"""
        key = f"{message.lower()}:{intent}"
        
        # Get current Q-value
        current_q = self.q_table.get(key, 0)
        
        # Q-learning update rule
        new_q = current_q + self.learning_rate * (reward - current_q)
        
        self.q_table[key] = new_q
        
        # Save to disk
        await self.save()
        
        print(f"📚 Q-Learning updated: {key} → {new_q:.2f}")
        
    async def save(self):
        """Save Q-table to disk"""
        with open(self.data_file, 'w') as f:
            json.dump(self.q_table, f, indent=2)
            
    def get_stats(self):
        """Get statistics"""
        return {
            'known_messages': len(self.q_table),
            'avg_q_value': sum(self.q_table.values()) / len(self.q_table) if self.q_table else 0
        }
