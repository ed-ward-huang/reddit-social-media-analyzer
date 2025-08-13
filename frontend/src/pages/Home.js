import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Shield, BarChart3, Clock, ArrowRight, Zap } from 'lucide-react';

const Home = () => {
  const [searchHandle, setSearchHandle] = useState('');
  const [platform, setPlatform] = useState('reddit'); // Default to Reddit
  const [subreddit, setSubreddit] = useState('');
  const [commentCount, setCommentCount] = useState(5);
  const [cachedSearches, setCachedSearches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCachedSearches();
  }, []);

  const fetchCachedSearches = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/cache/stats');
      const data = await response.json();
      if (data.success && data.entries) {
        // Transform cache entries into displayable searches
        const searches = data.entries.map((entry, index) => ({
          id: index,
          cacheKey: entry.cacheKey,
          platform: entry.platform,
          limit: entry.limit,
          timestamp: entry.timestamp || new Date().toISOString()
        }));
        setCachedSearches(searches);
      }
    } catch (error) {
      console.error('Failed to fetch cached searches:', error);
    }
  };

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (platform === 'twitter' && searchHandle.trim()) {
      const handle = searchHandle.replace('@', '');
      navigate(`/dashboard/${handle}?platform=twitter`);
    } else if (platform === 'reddit' && subreddit.trim()) {
      const cleanSubreddit = subreddit.replace('r/', '');
      navigate(`/dashboard/${cleanSubreddit}?platform=reddit&postCount=25&commentCount=${commentCount}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-gray-100">
        
        <div className="relative px-6 pt-14 pb-16">
          <div className="mx-auto max-w-2xl text-center">
            {/* Logo & Title */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI-Powered</span>
              <span className="text-gray-700"> Social Media</span>
              <br />Analysis Platform
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Detect hate speech, analyze sentiment, and understand engagement patterns across Reddit and Twitter using advanced machine learning.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        {/* Analysis Form */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Your Analysis</h2>
            <p className="text-gray-600">Choose your platform and configure your analysis parameters</p>
          </div>
          
          {/* Platform Selection */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-50 rounded-2xl p-2 border border-gray-200">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setPlatform('twitter')}
                  className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 ${
                    platform === 'twitter' 
                      ? 'bg-blue-500 text-white shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Twitter</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('reddit')}
                  className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 ${
                    platform === 'reddit' 
                      ? 'bg-orange-500 text-white shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Reddit</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Twitter Warning */}
          {platform === 'twitter' && (
            <div className="mb-8 max-w-lg mx-auto">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-amber-900" />
                  </div>
                  <p className="text-amber-800 text-sm">
                    Twitter scraper may be blocked. Dummy data might be shown if scraping fails.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Post/Comment Count Selectors for Reddit */}
          {platform === 'reddit' && (
            <div className="flex justify-center space-x-6 mb-8">
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-3">Posts to Analyze</label>
                <div className="flex justify-center">
                  <button
                    type="button"
                    className="w-16 h-12 rounded-xl font-semibold bg-blue-500 text-white shadow-lg"
                    disabled
                  >
                    25
                  </button>
                </div>
              </div>
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-3">Comments per Post</label>
                <div className="flex space-x-2">
                  {[5, 10, 20].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setCommentCount(count)}
                      className={`w-12 h-12 rounded-xl font-semibold transition-all duration-300 ${
                        commentCount === count
                          ? 'bg-orange-500 text-white shadow-lg'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleAnalyze} className="max-w-lg mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-500" />
              </div>
              {platform === 'twitter' ? (
                <input
                  type="text"
                  value={searchHandle}
                  onChange={(e) => setSearchHandle(e.target.value)}
                  placeholder="Enter Twitter handle (e.g., @username)"
                  className="w-full pl-12 pr-32 py-4 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                />
              ) : (
                <input
                  type="text"
                  value={subreddit}
                  onChange={(e) => setSubreddit(e.target.value)}
                  placeholder="Enter subreddit (e.g., technology)"
                  className="w-full pl-12 pr-32 py-4 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm"
                />
              )}
              <button
                type="submit"
                className={`absolute inset-y-0 right-0 px-6 m-1 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  platform === 'twitter' 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>Analyze</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </form>
        </div>

        {/* Cached Searches */}
        {cachedSearches.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recent Analyses</h3>
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cachedSearches.map((search) => (
                <button
                  key={search.id}
                  onClick={() => {
                    if (search.platform === 'reddit') {
                      const parts = search.cacheKey.split('_');
                      const subreddit = parts[0];
                      const commentCount = parts[2] || 5;
                      navigate(`/dashboard/${subreddit}?platform=reddit&postCount=25&commentCount=${commentCount}`);
                    } else {
                      navigate(`/dashboard/${search.cacheKey}?platform=twitter`);
                    }
                  }}
                  className="group bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-xl p-4 transition-all duration-300 text-left hover:transform hover:scale-105"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      search.platform === 'reddit' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {search.platform === 'reddit' ? <BarChart3 className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium truncate">
                        {search.platform === 'reddit' ? `r/${search.cacheKey.split('_')[0]}` : `@${search.cacheKey}`}
                      </p>
                      <p className="text-gray-500 text-xs">{new Date(search.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/50 p-8 hover:shadow-lg transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Sentiment Analysis</h3>
            <p className="text-gray-600 leading-relaxed">
              Advanced AI models analyze emotional tone and sentiment patterns in real-time across thousands of posts and comments.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl border border-red-200/50 p-8 hover:shadow-lg transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Hate Speech Detection</h3>
            <p className="text-gray-600 leading-relaxed">
              Sophisticated ML classifiers identify and categorize harmful content including racism, sexism, homophobia, and other forms of hate speech.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl border border-green-200/50 p-8 hover:shadow-lg transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Engagement Analytics</h3>
            <p className="text-gray-600 leading-relaxed">
              Comprehensive analysis of likes, comments, shares, and engagement patterns to understand content performance and audience response.
            </p>
          </div>
        </div>

        {/* Footer with Edward Huang Credit */}
        <div className="text-center py-12 border-t border-gray-100">
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-50 rounded-full border border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">EH</span>
            </div>
            <span className="text-gray-700 font-medium">Made by Edward Huang</span>
          </div>
          <p className="text-gray-500 text-sm mt-4">Built for educational and research purposes</p>
        </div>
      </div>
    </div>
  );
};

export default Home;