# Twitter Hate Speech & Sentiment Analyzer - Backend API

A Node.js/Express backend service that scrapes Twitter data and performs real-time sentiment analysis and hate speech detection.

## Features

- **Twitter Scraping**: Uses `snscrape` to fetch tweets by handle or search query
- **Sentiment Analysis**: Classifies tweets as positive, neutral, or negative
- **Hate Speech Detection**: Identifies and categorizes harmful content
- **Real-time Streaming**: Server-Sent Events for live progress updates
- **Caching**: In-memory caching with 1-hour TTL for faster repeated requests
- **Dummy Mode**: Development mode with fake data for frontend testing

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- Python 3.7+ (for snscrape)

### Installation

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Install snscrape (required for Twitter scraping):**
   ```bash
   pip install snscrape
   ```

3. **Environment Configuration:**
   Copy `.env` file and configure:
   ```bash
   PORT=8000
   USE_DUMMY_DATA=false
   CACHE_TTL=3600
   NODE_ENV=development
   ```

### Running the Application

**Development mode with dummy data:**
```bash
USE_DUMMY_DATA=true npm run dev
```

**Production mode with real scraping:**
```bash
npm start
```

**Development mode with auto-reload:**
```bash
npm run dev
```

## API Documentation

### Main Endpoints

#### `GET /api/analyze`

Scrapes and analyzes Twitter data with real-time streaming updates.

**Query Parameters:**
- `handle` (optional): Twitter handle (e.g., "@username")
- `query` (optional): Search query or hashtag
- `limit` (optional): Number of tweets to fetch (default: 100, max: 500)

**Example Requests:**
```bash
# Analyze user's tweets
GET /api/analyze?handle=@username&limit=200

# Search by keyword
GET /api/analyze?query=climate%20change&limit=150

# Search by hashtag
GET /api/analyze?query=%23AI&limit=100
```

**Response Format:**

The endpoint streams progress updates via Server-Sent Events, then sends final results:

**Progress Updates:**
```json
{
  "type": "progress",
  "message": "Processed 45 of 200 tweets...",
  "processed": 45,
  "total": 200,
  "sentiment_counts": {
    "positive": 15,
    "neutral": 20,
    "negative": 10
  },
  "category_counts": {
    "none": 40,
    "racism": 2,
    "sexism": 1,
    "homophobia": 0,
    "other": 2
  }
}
```

**Final Response:**
```json
{
  "type": "complete",
  "data": {
    "query_info": {
      "handle": "@username",
      "query": null,
      "requested_limit": 200,
      "actual_count": 195,
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "tweets": [
      {
        "id": "1234567890",
        "text": "Original tweet text",
        "date": "2024-01-15T09:00:00Z",
        "likes": 42,
        "retweets": 8,
        "replies_count": 5,
        "is_retweet": false,
        "author": "username",
        "link": "https://twitter.com/username/status/1234567890",
        "preprocessed_text": "cleaned text for analysis",
        "sentiment_analysis": {
          "sentiment": "positive",
          "confidence": 0.85,
          "scores": {
            "positive": 0.75,
            "neutral": 0.20,
            "negative": 0.05
          }
        },
        "hate_speech_analysis": {
          "category": "none",
          "confidence": 0.92,
          "toxicity_score": 0.08,
          "categories": {
            "none": 0.92,
            "racism": 0.02,
            "sexism": 0.02,
            "homophobia": 0.02,
            "other": 0.02
          }
        }
      }
    ],
    "analytics": {
      "overview": {
        "total_tweets": 195,
        "total_likes": 1250,
        "total_retweets": 340,
        "total_replies": 180,
        "average_likes_per_tweet": 6.41,
        "average_retweets_per_tweet": 1.74,
        "average_toxicity_score": 0.12
      },
      "sentiment_analysis": {
        "counts": { "positive": 78, "neutral": 95, "negative": 22 },
        "percentages": { "positive": 40.0, "neutral": 48.7, "negative": 11.3 }
      },
      "hate_speech_analysis": {
        "counts": { "none": 185, "racism": 4, "sexism": 3, "homophobia": 1, "other": 2 },
        "percentages": { "none": 94.9, "racism": 2.1, "sexism": 1.5, "homophobia": 0.5, "other": 1.0 }
      },
      "top_content": {
        "most_liked": [...],
        "most_retweeted": [...]
      }
    }
  }
}
```

**Error Responses:**
```json
{
  "type": "error",
  "message": "Account is private or does not exist"
}
```

#### `GET /api/cache/stats`
Get cache statistics and active keys.

#### `DELETE /api/cache/flush`
Clear all cached data.

#### `GET /api/health`
Health check endpoint.

## Error Handling

- **400 Bad Request**: Missing required parameters
- **404 Not Found**: Invalid Twitter handle or no tweets found
- **500 Internal Server Error**: Scraping failures or processing errors

## Dummy Mode

When `USE_DUMMY_DATA=true`, the API returns pre-defined sample data instead of scraping Twitter. This is **highly recommended** for:
- Frontend development without API limits
- Testing the complete pipeline
- Demonstrations
- **Working around Twitter's anti-scraping measures**

### ⚠️ Important Note About Twitter Scraping

Twitter has implemented strong anti-scraping measures that frequently block `snscrape` and similar tools. You may encounter:
- SSL certificate verification errors
- Connection timeouts
- Rate limiting
- IP blocking

**For development and testing, we strongly recommend using dummy mode** (`USE_DUMMY_DATA=true`). The dummy data includes realistic variety of content including positive/negative sentiment and hate speech examples for testing the ML models.

### Alternative Approaches for Production

For production use, consider:
1. **Twitter API v2** (requires approval and costs money)
2. **Academic Research Track** (free but requires academic institution)
3. **Third-party data providers** (Brandwatch, Sprout Social, etc.)
4. **User-uploaded content** (users paste tweets manually)

## Architecture

```
backend/
├── src/
│   ├── server.js              # Express server entry point
│   ├── config.js              # Environment configuration
│   ├── routes/
│   │   └── analyze.js         # Main API routes
│   ├── services/
│   │   ├── scraper.js         # Twitter scraping with snscrape
│   │   ├── sentiment.js       # Sentiment analysis engine
│   │   ├── hateSpeech.js      # Hate speech classification
│   │   ├── cache.js           # In-memory caching utility
│   │   └── analytics.js       # Data aggregation and metrics
│   ├── utils/
│   │   └── preprocess.js      # Text cleaning and normalization
│   └── dummy_data/
│       └── tweets.json        # Sample data for testing
├── package.json
└── .env
```

## Development

**Run tests:**
```bash
npm test
```

**Enable debug logging:**
```bash
DEBUG=twitter-analytics:* npm run dev
```

## CORS Configuration

The API is configured to accept requests from `http://localhost:3000` by default, making it compatible with the React frontend running on the standard development port.