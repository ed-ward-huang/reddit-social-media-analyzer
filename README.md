# Reddit/Twitter Hate Speech Analyzer

A full-stack web application that analyzes social media content for hate speech detection and sentiment analysis using machine learning models. This tool helps identify and categorize toxic content across Reddit and Twitter platforms, providing real-time analytics and visualizations.

<img width="642" height="739" alt="Screenshot 2025-08-13 at 12 53 56 AM" src="https://github.com/user-attachments/assets/f0eb17c2-ea3f-4b12-9562-688a0673a81a" />
<img width="648" height="742" alt="Screenshot 2025-08-13 at 12 56 42 AM" src="https://github.com/user-attachments/assets/0f616655-c0c7-4d7b-aea7-4d2e54ec2736" />



## Problem Statement

Online hate speech and toxic content pose significant challenges for content moderation and community safety. Manual review is time-consuming and doesn't scale, while basic keyword filtering misses nuanced hate speech. This application solves these problems by:

- **Automated Detection**: Uses state-of-the-art NLP models to identify hate speech across multiple categories
- **Real-time Analysis**: Processes social media content with live progress tracking and immediate results
- **Comprehensive Categorization**: Detects specific types of hate speech (racism, sexism, religious bias, etc.)
- **Sentiment Analysis**: Provides emotional tone analysis alongside toxicity detection
- **Scalable Processing**: Handles large volumes of posts and comments efficiently

## Design & Architecture

The application follows a modern three-tier architecture designed for performance and maintainability:

**Frontend Design**:
- Clean, responsive React interface with real-time progress indicators
- Interactive charts (pie charts for sentiment, radar charts for hate speech categories)
- Live updates during analysis with progressive data loading

**Backend Design**:
- RESTful API with Express.js for handling requests and data processing
- Separate Python ML service for model inference to isolate heavy computations
- In-memory caching layer for improved performance and reduced API calls
- Rate limiting and error handling for production reliability

**Key Design Decisions**:
- **Microservices approach**: Separate ML processing from web API for better resource management
- **Progressive loading**: Shows partial results during analysis to improve user experience
- **Caching strategy**: Stores analysis results to avoid redundant API calls and ML inference
- **Platform abstraction**: Unified interface for both Reddit and Twitter data sources

## Technology Stack

**Primary Language**: JavaScript (Node.js, React)

**Additional Languages**: Python (Machine Learning components)

**Frontend**:
- React 18 with hooks and modern patterns
- Tailwind CSS for responsive styling
- Recharts for data visualization
- React Router for navigation
- Lucide React for icons

**Backend**:
- Node.js with Express.js framework
- Python with Flask for ML service
- node-cache for in-memory caching
- express-rate-limit for API protection
- axios for HTTP requests
- CORS for cross-origin requests

**Machine Learning Models**:
- [cardiffnlp/twitter-roberta-base-sentiment-latest](https://huggingface.co/cardiffnlp/twitter-roberta-base-sentiment-latest) - Sentiment analysis
- [Hate-speech-CNERG/dehatebert-mono-english](https://huggingface.co/Hate-speech-CNERG/dehatebert-mono-english) - Hate speech detection
- [Hate-speech-CNERG/bert-base-uncased-hatexplain](https://huggingface.co/Hate-speech-CNERG/bert-base-uncased-hatexplain) - Toxicity scoring
- [facebook/bart-large-mnli](https://huggingface.co/facebook/bart-large-mnli) - Zero-shot classification for hate speech categorization
- Hugging Face Transformers library for model loading and inference

**Data Sources**:
- Reddit API via snoowrap
- Twitter/X web scraping (with fallback dummy data)

## Setup / Installation Instructions

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/twitter-analytics.git
cd twitter-analytics
```

### 2. Backend Setup
```bash
cd backend

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

### 3. Configure Environment Variables
Edit `backend/.env` with your credentials:
```env
PORT=8000
NODE_ENV=development
CACHE_TTL=3600
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=your_app_name/1.0
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
```

### 4. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install
```

### 5. Download ML Models
```bash
cd ../backend

# Download required models (first run only)
python download_models.py
```

## Usage / How to Run

### Start the Application

1. **Start the ML Service** (Terminal 1):
```bash
cd backend
python ml_server.py
```

2. **Start the Backend API** (Terminal 2):
```bash
cd backend
npm run dev
# or for production: npm start
```

3. **Start the Frontend** (Terminal 3):
```bash
cd frontend
npm start
```

4. **Access the Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - ML Service: http://localhost:8001

### Environment Configuration

**Development Mode**:
- Set `USE_DUMMY_DATA=true` in backend/.env to use sample data
- Enables hot reloading and detailed error messages

**Production Mode**:
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Use environment variables for all secrets

### Example Usage

1. Navigate to http://localhost:3000
2. Enter a Reddit username (e.g., `spez`) or Twitter handle (e.g., `elonmusk`)
3. Select platform and configure analysis parameters
4. Watch real-time progress as content is analyzed
5. Review sentiment distribution and hate speech categorization
6. Export results as a text report

## Features / Highlights

### Core Functionality
- **Multi-platform Analysis**: Supports both Reddit and Twitter content analysis
- **Real-time Processing**: Live progress updates with incremental result display
- **Advanced ML Models**: Uses BERT-based models for accurate hate speech detection
- **Comprehensive Categorization**: Identifies 8 categories of hate speech (racism, sexism, religious bias, etc.)
- **Sentiment Analysis**: Three-category sentiment classification (positive, negative, neutral)
- **Interactive Visualizations**: Dynamic pie charts and radar charts with responsive design

### Technical Highlights
- **Microservices Architecture**: Separate services for web API and ML processing
- **Progressive Data Loading**: Shows partial results during analysis for better UX
- **Intelligent Caching**: Reduces redundant API calls and model inference
- **Error Resilience**: Graceful handling of API failures with fallback mechanisms
- **Performance Optimization**: Efficient batch processing and memory management
- **Production Ready**: Rate limiting, CORS, environment-based configuration

### Unique Implementation Details
- **Custom Progress Tracking**: Real-time updates showing posts processed and toxic content found
- **Platform Abstraction**: Unified data processing pipeline for different social media APIs
- **Responsive Chart Design**: Charts automatically adjust to screen size and data availability
- **Export Functionality**: Generate downloadable reports with analysis summaries

## Code Structure Overview

```
twitter-analytics/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Main application pages
│   │   └── services/          # API communication layer
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── routes/            # Express.js route handlers
│   │   ├── services/          # Business logic and external APIs
│   │   └── utils/             # Utility functions
│   ├── ml_server.py           # Python ML service
│   └── requirements.txt       # Python dependencies
└── README.md
```

### Key Files
- `frontend/src/pages/Dashboard.js` - Main analysis interface with charts and progress tracking
- `backend/src/routes/analyze.js` - Primary API endpoint for content analysis
- `backend/src/services/cache.js` - Caching layer implementation
- `backend/ml_server.py` - Machine learning model service
- `backend/src/services/redditScraper.js` - Reddit API integration
- `frontend/src/services/api.js` - Frontend API client with progress handling

## Future Improvements

### API Expansion
- **Enhanced Rate Limits**: Implement user authentication to increase API quotas
- **Premium Features**: Allow authenticated users to analyze larger datasets
- **Batch Processing**: Support for analyzing multiple users or subreddits simultaneously

### Advanced Analytics
- **Deeper Statistical Analysis**: Add trend analysis, temporal patterns, and comparative metrics
- **Additional ML Models**: Integrate emotion detection, sarcasm detection, and political bias analysis
- **Custom Model Training**: Allow users to train models on domain-specific data
- **Network Analysis**: Analyze interaction patterns and community toxicity spread
- **Historical Tracking**: Monitor accounts over time to identify behavioral changes

### Platform & Performance
- **Additional Platforms**: Expand to Instagram, TikTok, YouTube comments
- **Real-time Monitoring**: Set up alerts for sudden spikes in toxic content
- **Database Integration**: Add persistent storage for analysis history and user preferences
- **API Rate Optimization**: Implement smarter caching and request batching strategies

---

*Built as a demonstration of full-stack development skills, machine learning integration, and modern web application architecture.*
