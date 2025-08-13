const axios = require('axios');

class SentimentAnalyzer {
  constructor() {
    this.mlServerUrl = 'http://localhost:8001';
  }

  async analyzeSentiment(text) {
    if (!text || typeof text !== 'string') {
      return { sentiment: 'neutral', confidence: 0, scores: { positive: 0, negative: 0, neutral: 1 } };
    }

    try {
      const response = await axios.post(`${this.mlServerUrl}/sentiment`, 
        { text }, 
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error('Sentiment analysis error:', error.message);
      // Fallback to neutral
      return { sentiment: 'neutral', confidence: 0, scores: { positive: 0, negative: 0, neutral: 1 } };
    }
  }

  async analyzeBatch(texts) {
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return [];
    }

    try {
      const response = await axios.post(`${this.mlServerUrl}/batch`, 
        { texts }, 
        { timeout: 30000 }
      );
      return response.data.map(r => r.sentiment_analysis);
    } catch (error) {
      console.error('Batch sentiment analysis error:', error.message);
      // Fallback to individual processing
      return Promise.all(texts.map(text => this.analyzeSentiment(text)));
    }
  }
}

module.exports = new SentimentAnalyzer();