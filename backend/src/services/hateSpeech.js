const axios = require('axios');

class HateSpeechClassifier {
  constructor() {
    this.mlServerUrl = 'http://localhost:8001';
  }

  async classifyHateSpeech(text) {
    if (!text || typeof text !== 'string') {
      return { 
        category: 'none', 
        confidence: 0, 
        toxicity_score: 0,
        categories: {
          none: 1,
          racism: 0,
          religion: 0,
          sexism: 0,
          sexual_orientation: 0,
          nationality: 0,
          political_leaning: 0,
          disability: 0,
          other: 0
        }
      };
    }

    try {
      const response = await axios.post(`${this.mlServerUrl}/hate`, 
        { text }, 
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error('Hate speech classification error:', error.message);
      // Fallback to no hate speech detected
      return { 
        category: 'none', 
        confidence: 0, 
        toxicity_score: 0,
        categories: {
          none: 1,
          racism: 0,
          religion: 0,
          sexism: 0,
          sexual_orientation: 0,
          nationality: 0,
          political_leaning: 0,
          disability: 0,
          other: 0
        }
      };
    }
  }

  async classifyBatch(texts) {
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return [];
    }

    try {
      const response = await axios.post(`${this.mlServerUrl}/batch`, 
        { texts }, 
        { timeout: 30000 }
      );
      return response.data.map(r => r.hate_speech_analysis);
    } catch (error) {
      console.error('Batch hate speech classification error:', error.message);
      // Fallback to individual processing
      return Promise.all(texts.map(text => this.classifyHateSpeech(text)));
    }
  }
}

module.exports = new HateSpeechClassifier();