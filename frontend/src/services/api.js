const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Simple toast notification system
  showToastNotification(message, type = 'info', duration = 5000) {
    // Try using existing toast system first
    if (window.showToast && typeof window.showToast === 'function') {
      window.showToast(message, type, duration);
      return;
    }

    // Create our own simple toast
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform ${
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-amber-500 text-white' :
      type === 'success' ? 'bg-green-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium">${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
          <span class="text-lg">×</span>
        </button>
      </div>
    `;
    
    // Add toast with slide-in animation
    toast.style.transform = 'translateX(100%)';
    document.body.appendChild(toast);
    
    // Trigger slide-in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remove after duration
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (toast.parentElement) {
            toast.remove();
          }
        }, 300);
      }
    }, duration);
  }


  async analyzeWithProgress(handle, query, limit = 100, onProgress, onError, platform = 'twitter', postCount = 10, commentCount = 5) {
    const params = new URLSearchParams();
    if (platform === 'twitter') {
      if (handle) params.append('handle', handle.startsWith('@') ? handle : `@${handle}`);
      if (query) params.append('query', query);
    } else if (platform === 'reddit') {
      if (handle) params.append('subreddit', handle);
      params.append('postCount', postCount.toString());
      params.append('commentCount', commentCount.toString());
    }
    params.append('limit', limit.toString());
    params.append('platform', platform);

    const url = `${this.baseUrl}/api/analyze?${params.toString()}`;
    
    // First, try a regular HTTP request to check for cached data
    try {
      const response = await fetch(url, { 
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // If we get a JSON response, it means cached data
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        if (result.success && result.source === 'cache') {
          console.log('Retrieved cached data');
          return result.data;
        }
      }
    } catch (error) {
      console.log('No cached data, proceeding with SSE:', error.message);
    }
    
    // If no cached data, use SSE for live analysis
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(url);

      const cleanup = () => {
        eventSource.close();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'progress':
              if (onProgress) onProgress(data);
              break;
            
            case 'info':
              // Handle informational messages (like API fallback notifications)
              if (onProgress) onProgress({ ...data, type: 'progress' });
              
              // Show toast notification if flagged
              if (data.isToast) {
                this.showToastNotification(data.message, 'warning');
              }
              break;
            
            case 'rate_limit':
              // Handle rate limiting messages
              if (onProgress) onProgress({ 
                ...data, 
                type: 'progress',
                isRateLimit: true 
              });
              
              this.showToastNotification(data.message, 'warning');
              break;
            
            case 'complete':
              cleanup();
              resolve(data.data);
              break;
            
            case 'error':
              // For certain errors, show toast instead of breaking the flow
              if (data.isToast) {
                this.showToastNotification(data.message, 'error');
                // Don't reject for API-related errors that have fallbacks
                if (data.message?.includes('API') || data.message?.includes('blocked') || data.message?.includes('not found')) {
                  break; // Continue processing, don't reject
                }
              }
              
              cleanup();
              const error = new Error(data.message || 'Analysis failed');
              error.isPrivateAccount = data.message?.includes('private') || 
                                       data.message?.includes('not exist');
              reject(error);
              break;
            
            default:
              console.warn('Unknown message type:', data.type);
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        cleanup();
        if (onError) onError(error);
        reject(new Error('Connection to server lost'));
      };

      return {
        cancel: () => {
          cleanup();
          reject(new Error('Analysis cancelled'));
        }
      };
    });
  }

  async getCacheStats() {
    try {
      const response = await fetch(`${this.baseUrl}/api/cache/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      throw error;
    }
  }

  async clearCache() {
    try {
      const response = await fetch(`${this.baseUrl}/api/cache/flush`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  transformToChartFormat(analyticsData) {
    if (!analyticsData) return null;

    const { sentiment_analysis, hate_speech_analysis, overview } = analyticsData;

    return {
      sentimentData: {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [{
          label: 'Sentiment Distribution',
          data: [
            sentiment_analysis.percentages.positive,
            sentiment_analysis.percentages.neutral,
            sentiment_analysis.percentages.negative
          ],
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
          borderColor: ['#059669', '#D97706', '#DC2626'],
          borderWidth: 1
        }]
      },
      hateSpeechData: {
        labels: ['None', 'Racism', 'Religion', 'Sexism', 'Sexual Orientation', 'Nationality', 'Political Leaning', 'Disability', 'Other'],
        datasets: [{
          label: 'Hate Speech Categories',
          data: [
            hate_speech_analysis.percentages.none,
            hate_speech_analysis.percentages.racism,
            hate_speech_analysis.percentages.religion || 0,
            hate_speech_analysis.percentages.sexism || 0,
            hate_speech_analysis.percentages.sexual_orientation || 0,
            hate_speech_analysis.percentages.nationality || 0,
            hate_speech_analysis.percentages.political_leaning || 0,
            hate_speech_analysis.percentages.disability || 0,
            hate_speech_analysis.percentages.other
          ],
          backgroundColor: ['#10B981', '#EF4444', '#F97316', '#8B5CF6', '#EC4899', '#F59E0B', '#6B7280', '#3B82F6', '#9333EA'],
          borderColor: ['#059669', '#DC2626', '#EA580C', '#7C3AED', '#DB2777', '#D97706', '#4B5563', '#2563EB', '#7C2D12'],
          borderWidth: 1
        }]
      },
      stats: {
        totalTweets: overview.total_tweets,
        avgSentiment: this.getOverallSentiment(sentiment_analysis.percentages),
        hateBreakdown: {
          Racism: hate_speech_analysis.counts.racism,
          Religion: hate_speech_analysis.counts.religion || 0,
          Sexism: hate_speech_analysis.counts.sexism || 0,
          'Sexual Orientation': hate_speech_analysis.counts.sexual_orientation || 0,
          Nationality: hate_speech_analysis.counts.nationality || 0,
          'Political Leaning': hate_speech_analysis.counts.political_leaning || 0,
          Disability: hate_speech_analysis.counts.disability || 0,
          Other: hate_speech_analysis.counts.other
        },
        engagement: {
          likes: overview.total_likes,
          reposts: overview.total_retweets,
          replies: overview.total_replies
        }
      }
    };
  }

  getOverallSentiment(percentages) {
    const max = Math.max(
      percentages.positive,
      percentages.neutral,
      percentages.negative
    );
    
    if (max === percentages.positive) return 'Positive';
    if (max === percentages.negative) return 'Negative';
    return 'Neutral';
  }

  transformTweetsForTable(tweets) {
    if (!tweets || !Array.isArray(tweets)) return [];
    
    return tweets.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      sentiment: tweet.sentiment_analysis?.sentiment?.charAt(0).toUpperCase() + 
                tweet.sentiment_analysis?.sentiment?.slice(1) || 'Unknown',
      hate: tweet.hate_speech_analysis?.category === 'none' ? 'None' :
            tweet.hate_speech_analysis?.category === 'sexual_orientation' ? 'Sexual Orientation' :
            tweet.hate_speech_analysis?.category === 'political_leaning' ? 'Political Leaning' :
            tweet.hate_speech_analysis?.category?.charAt(0).toUpperCase() +
            tweet.hate_speech_analysis?.category?.slice(1) || 'Unknown',
      likes: tweet.likes || 0,
      retweets: tweet.retweets || 0,
      date: tweet.date,
      author: tweet.author,
      link: tweet.link,
      post_type: tweet.post_type // Preserve post_type for filtering
    }));
  }
}

const apiService = new ApiService();
export default apiService;