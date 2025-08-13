#!/usr/bin/env python3
"""
HTTP Server for ML Service - serves the corrected hate speech detection pipeline.
"""

import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import sys
import os

# Add the src/services directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'services'))

from ml_service import MLService

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global ML service instance
ml_service = None

class MLRequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Parse the request
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            path = urlparse(self.path).path
            
            if path == '/sentiment':
                result = ml_service.analyze_sentiment(data.get('text', ''))
                self._send_response(200, result)
                
            elif path == '/hate':
                result = ml_service.classify_hate_speech(data.get('text', ''))
                self._send_response(200, result)
                
            elif path == '/batch':
                texts = data.get('texts', [])
                results = []
                for text in texts:
                    sentiment_result = ml_service.analyze_sentiment(text)
                    hate_result = ml_service.classify_hate_speech(text)
                    results.append({
                        'text': text,
                        'sentiment_analysis': sentiment_result,
                        'hate_speech_analysis': hate_result
                    })
                self._send_response(200, results)
                
            else:
                self._send_response(404, {'error': 'Endpoint not found'})
                
        except Exception as e:
            logger.error(f"Request processing error: {e}")
            self._send_response(500, {'error': str(e)})
    
    def _send_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def log_message(self, format, *args):
        # Suppress default HTTP server logs
        pass

def run_server(port=8001):
    global ml_service
    
    # Initialize ML service
    logger.info("Initializing ML service with corrected hate speech pipeline...")
    ml_service = MLService()
    
    # Start HTTP server
    server = HTTPServer(('localhost', port), MLRequestHandler)
    logger.info(f"ML Server running on http://localhost:{port}")
    logger.info("Pipeline: Binary Hate Detection → (if hate) → Toxicity + Categorization")
    server.serve_forever()

if __name__ == "__main__":
    try:
        run_server()
    except KeyboardInterrupt:
        logger.info("ML Server stopped")