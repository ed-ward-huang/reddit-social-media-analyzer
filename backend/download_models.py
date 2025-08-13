#!/usr/bin/env python3
"""
Pre-download all ML models to avoid startup hangs.
Run this before starting the ML server.
"""

import logging
from transformers import pipeline
import torch

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_models():
    """Download and cache all models."""
    
    models_to_download = [
        {
            'name': 'Sentiment Analysis',
            'task': 'sentiment-analysis',
            'model': 'cardiffnlp/twitter-roberta-base-sentiment-latest'
        },
        {
            'name': 'Hate Speech Detection', 
            'task': 'text-classification',
            'model': 'Hate-speech-CNERG/dehatebert-mono-english'
        },
        {
            'name': 'Toxicity Scoring',
            'task': 'text-classification', 
            'model': 'Hate-speech-CNERG/bert-base-uncased-hatexplain'
        },
        {
            'name': 'Zero-shot Classification',
            'task': 'zero-shot-classification',
            'model': 'valhalla/distilbart-mnli-12-1'
        }
    ]
    
    device = 0 if torch.cuda.is_available() else -1
    logger.info(f"Using device: {'GPU' if device == 0 else 'CPU'}")
    
    for model_config in models_to_download:
        try:
            logger.info(f"Downloading {model_config['name']} ({model_config['model']})...")
            
            # Download and cache the model
            model = pipeline(
                model_config['task'],
                model=model_config['model'],
                device=device
            )
            
            # Test the model with a simple input
            if model_config['task'] == 'zero-shot-classification':
                result = model("test text", ["category1", "category2"])
            else:
                result = model("test text")
            
            logger.info(f"✅ {model_config['name']} downloaded and tested successfully")
            
            # Clear from memory
            del model
            
        except Exception as e:
            logger.error(f"❌ Failed to download {model_config['name']}: {e}")
            return False
    
    logger.info("🎉 All models downloaded successfully!")
    return True

if __name__ == "__main__":
    success = download_models()
    if not success:
        exit(1)