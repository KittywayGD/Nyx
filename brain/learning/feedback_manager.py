"""
Feedback Manager
Manages user feedback and learning loop
"""

import asyncio

class FeedbackManager:
    def __init__(self, q_learning, core):
        self.q_learning = q_learning
        self.core = core
        
        # Confidence thresholds
        self.THRESHOLD_ASK = 0.70
        self.THRESHOLD_NOTIFY = 0.80
        self.THRESHOLD_CONFIDENT = 0.80
        
        self.pending_feedbacks = {}
        
    def needs_feedback(self, intent, confidence):
        """Decide if we need user feedback"""
        return {
            'should_ask': confidence < self.THRESHOLD_ASK,
            'should_notify': self.THRESHOLD_ASK <= confidence < self.THRESHOLD_NOTIFY,
            'can_execute_direct': confidence >= self.THRESHOLD_CONFIDENT,
            'confidence': confidence
        }
        
    async def request_feedback(self, message, intent, confidence, sid):
        """Request feedback from user"""
        feedback_id = f"feedback_{int(asyncio.get_event_loop().time() * 1000)}"
        
        self.pending_feedbacks[feedback_id] = {
            'message': message,
            'intent': intent,
            'confidence': confidence,
            'timestamp': asyncio.get_event_loop().time()
        }
        
        # Send to frontend
        await self.core.sio.emit('request-feedback', {
            'id': feedback_id,
            'type': 'intent-confirmation',
            'message': message,
            'suggestion': {
                'intent': intent['intent'],
                'confidence': int(confidence * 100)
            }
        }, room=sid)
        
        print(f"❓ Requesting feedback: {message} → {intent['intent']}")
        
    async def process_feedback(self, feedback_id, response):
        """Process user feedback"""
        if feedback_id not in self.pending_feedbacks:
            return
            
        pending = self.pending_feedbacks[feedback_id]
        message = pending['message']
        intent = pending['intent']
        
        reward = 0
        actual_intent = intent['intent']
        
        if response['action'] == 'confirm':
            reward = 1.0
            print(f"✅ User confirmed: {message} → {actual_intent}")
        elif response['action'] == 'reject':
            reward = -0.5
            print(f"❌ User rejected: {message} → {actual_intent}")
        elif response['action'] == 'correct':
            actual_intent = response['correct_intent']
            reward = 1.0
            print(f"✏️  User corrected: {message} → {actual_intent}")
            
        # Update Q-Learning
        await self.q_learning.update_q_value(message, actual_intent, reward)
        
        # Remove from pending
        del self.pending_feedbacks[feedback_id]
