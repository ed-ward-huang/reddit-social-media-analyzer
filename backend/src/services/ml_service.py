#!/usr/bin/env python3
"""
ML Service for sentiment analysis and hate speech detection using Hugging Face transformers.
"""

import sys
import json
import logging
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLService:
    def __init__(self):
        self.sentiment_model = None
        self.hate_detection_model = None
        self.hate_category_model = None
        self.target_group_model = None
        self._load_models()
    
    def _load_models(self):
        """Load and cache all models locally."""
        try:
            logger.info("Loading sentiment analysis model...")
            self.sentiment_model = pipeline(
                "sentiment-analysis", 
                model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                device=0 if torch.cuda.is_available() else -1
            )
            
            logger.info("Loading binary hate speech detection model...")
            self.hate_detection_model = pipeline(
                "text-classification",
                model="Hate-speech-CNERG/dehatebert-mono-english",
                device=0 if torch.cuda.is_available() else -1
            )
            
            logger.info("Loading toxicity scoring model...")
            self.hate_category_model = pipeline(
                "text-classification",
                model="Hate-speech-CNERG/bert-base-uncased-hatexplain",
                device=0 if torch.cuda.is_available() else -1
            )
            
            logger.info("Loading zero-shot target group classifier...")
            try:
                self.target_group_model = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli",
                    device=0 if torch.cuda.is_available() else -1
                )
                logger.info("Zero-shot target group classifier loaded successfully!")
                self.use_keyword_fallback = False
                
                # Define target group categories for zero-shot classification
                self.target_categories = [
                    "race or ethnicity",
                    "religion",
                    "sex or gender",
                    "sexual orientation",
                    "nationality",
                    "politics",
                    "disability",
                    "other"
                ]
                
            except Exception as e:
                logger.error(f"Failed to load zero-shot classifier: {e}")
                raise Exception("Zero-shot classifier is required for target group classification")
            
            logger.info("All models loaded successfully!")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise
    
    
    def analyze_sentiment(self, text):
        """Analyze sentiment using Twitter RoBERTa model."""
        if not text or not isinstance(text, str):
            return {
                'sentiment': 'neutral',
                'confidence': 0.0,
                'scores': {'positive': 0.0, 'negative': 0.0, 'neutral': 1.0}
            }
        
        try:
            # Truncate text to model's max length (512 tokens)
            text = text[:512]
            result = self.sentiment_model(text)[0]
            
            # Map cardiffnlp labels to our format
            label_mapping = {
                'LABEL_0': 'negative',
                'LABEL_1': 'neutral', 
                'LABEL_2': 'positive'
            }
            
            sentiment = label_mapping.get(result['label'], result['label'].lower())
            confidence = result['score']
            
            # Create scores distribution (simplified)
            scores = {'positive': 0.0, 'negative': 0.0, 'neutral': 0.0}
            scores[sentiment] = confidence
            
            # Distribute remaining probability
            remaining = 1.0 - confidence
            for key in scores:
                if key != sentiment:
                    scores[key] = remaining / 2
            
            return {
                'sentiment': sentiment,
                'confidence': round(confidence, 3),
                'scores': {k: round(v, 3) for k, v in scores.items()}
            }
            
        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return {
                'sentiment': 'neutral',
                'confidence': 0.0,
                'scores': {'positive': 0.0, 'negative': 0.0, 'neutral': 1.0}
            }
    
    def classify_hate_speech(self, text):
        """Classify hate speech using binary detection first, then toxicity and categorization."""
        if not text or not isinstance(text, str):
            return {
                'category': 'none',
                'confidence': 0.0,
                'toxicity_score': 0.0,
                'categories': {
                    'none': 1.0,
                    'racism': 0.0,
                    'religion': 0.0,
                    'sexism': 0.0,
                    'sexual_orientation': 0.0,
                    'nationality': 0.0,
                    'political_leaning': 0.0,
                    'disability': 0.0,
                    'other': 0.0
                }
            }
        
        try:
            # Truncate text to model's max length
            text = text[:512]
            
            # Step 1: Binary hate speech detection
            hate_result = self.hate_detection_model(text)[0]
            
            # Check if the result indicates hate speech
            is_hate_speech = (
                hate_result['label'] in ['HATE', 'HATEFUL', '1', 'LABEL_1'] or
                (hate_result['label'] in ['NOT_HATE', 'NOT_HATEFUL', '0', 'LABEL_0'] and hate_result['score'] < 0.5)
            )
            
            hate_confidence = hate_result['score'] if is_hate_speech else 1.0 - hate_result['score']
            
            # If not classified as hate speech, return 'none' category
            if not is_hate_speech or hate_confidence < 0.5:
                return {
                    'category': 'none',
                    'confidence': round(1.0 - hate_confidence, 3),
                    'toxicity_score': 0.0,
                    'categories': {
                        'none': round(1.0 - hate_confidence, 3),
                        'racism': 0.0,
                        'religion': 0.0,
                        'sexism': 0.0,
                        'sexual_orientation': 0.0,
                        'nationality': 0.0,
                        'political_leaning': 0.0,
                        'disability': 0.0,
                        'other': round(hate_confidence, 3)
                    }
                }
            
            # Step 2: For hate speech, run toxicity scoring
            toxicity_score = 0.0
            try:
                category_result = self.hate_category_model(text)[0]
                toxicity_score = category_result['score'] if category_result['label'] in ['HATEFUL', 'TOXIC', '1'] else 1.0 - category_result['score']
            except Exception as e:
                logger.warning(f"Toxicity scoring failed: {e}")
                toxicity_score = hate_confidence
            
            # Step 3: Zero-shot categorization for hate speech
            zeroshot_result = self.target_group_model(
                text, 
                self.target_categories,
                hypothesis_template="This text is about {}",
                multi_label=False
            )
            
            predicted_category = zeroshot_result['labels'][0]
            category_confidence = zeroshot_result['scores'][0]
            
            # Map zero-shot labels to our categories
            category_mapping = {
                "race or ethnicity": "racism",
                "religion": "religion",
                "sex or gender": "sexism",
                "sexual orientation": "sexual_orientation",
                "nationality": "nationality",
                "politics": "political_leaning",
                "disability": "disability",
                "other": "other"
            }
            
            category = category_mapping.get(predicted_category, "other")
            
            # Use the binary detection confidence as the primary confidence
            final_confidence = min(0.95, hate_confidence * category_confidence)
            
            # Create category distribution
            categories = {
                'none': 0.0,
                'racism': 0.0,
                'religion': 0.0,
                'sexism': 0.0,
                'sexual_orientation': 0.0,
                'nationality': 0.0,
                'political_leaning': 0.0,
                'disability': 0.0,
                'other': 0.0
            }
            
            categories[category] = final_confidence
            categories['none'] = 1.0 - final_confidence
            
            return {
                'category': category,
                'confidence': round(final_confidence, 3),
                'toxicity_score': round(toxicity_score, 3),
                'categories': {k: round(v, 3) for k, v in categories.items()}
            }
            
        except Exception as e:
            logger.error(f"Hate speech classification error: {e}")
            return {
                'category': 'none',
                'confidence': 0.0,
                'toxicity_score': 0.0,
                'categories': {
                    'none': 1.0,
                    'racism': 0.0,
                    'religion': 0.0,
                    'sexism': 0.0,
                    'sexual_orientation': 0.0,
                    'nationality': 0.0,
                    'political_leaning': 0.0,
                    'disability': 0.0,
                    'other': 0.0
                }
            }
    
    def process_batch(self, texts):
        """Process a batch of texts for both sentiment and hate speech."""
        results = []
        for text in texts:
            sentiment_result = self.analyze_sentiment(text)
            hate_result = self.classify_hate_speech(text)
            
            results.append({
                'text': text,
                'sentiment_analysis': sentiment_result,
                'hate_speech_analysis': hate_result
            })
        
        return results

def main():
    """Main function to handle command line interface."""
    if len(sys.argv) < 2:
        print("Usage: python3 ml_service.py <command> [args]")
        print("Commands:")
        print("  sentiment <text>     - Analyze sentiment of text")
        print("  hate <text>          - Classify hate speech in text")
        print("  batch <json_texts>   - Process batch of texts")
        sys.exit(1)
    
    # Initialize ML service
    ml_service = MLService()
    
    command = sys.argv[1]
    
    if command == "sentiment":
        if len(sys.argv) < 3:
            print("Error: Text required for sentiment analysis")
            sys.exit(1)
        text = sys.argv[2]
        result = ml_service.analyze_sentiment(text)
        print(json.dumps(result))
        
    elif command == "hate":
        if len(sys.argv) < 3:
            print("Error: Text required for hate speech classification")
            sys.exit(1)
        text = sys.argv[2]
        result = ml_service.classify_hate_speech(text)
        print(json.dumps(result))
        
    elif command == "batch":
        if len(sys.argv) < 3:
            print("Error: JSON texts required for batch processing")
            sys.exit(1)
        try:
            texts = json.loads(sys.argv[2])
            results = ml_service.process_batch(texts)
            print(json.dumps(results))
        except json.JSONDecodeError:
            print("Error: Invalid JSON format for texts")
            sys.exit(1)
            
    else:
        print(f"Error: Unknown command '{command}'")
        sys.exit(1)

if __name__ == "__main__":
    main()