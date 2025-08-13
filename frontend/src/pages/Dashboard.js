import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PieChart, 
  Pie, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  Tooltip, 
  Cell, 
  ResponsiveContainer 
} from 'recharts';
import { 
  ArrowLeft, 
  MessageSquare, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  Heart,
  MessageCircle,
  Download,
  RefreshCw,
  Target,
  Activity,
  Eye,
  BarChart3
} from 'lucide-react';
import PrivateAccountError from '../components/PrivateAccountError';
import apiService from '../services/api';

// Modern color schemes
const SENTIMENT_COLORS = {
  positive: '#10B981', // Green
  neutral: '#6B7280',  // Gray (keep neutral gray as requested)
  negative: '#EF4444'  // Red
};

const HATE_SPEECH_COLORS = {
  racism: '#EF4444',           // Red
  religion: '#F97316',         // Orange
  sexism: '#EC4899',           // Pink
  sexual_orientation: '#8B5CF6', // Purple
  nationality: '#10B981',      // Green
  political_leaning: '#F59E0B', // Amber
  disability: '#6B7280',       // Gray
  other: '#3B82F6'            // Blue
};

const Dashboard = () => {
  const { handle } = useParams();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [progress, setProgress] = useState({ 
    processed: 0, 
    total: 100, 
    message: 'Starting analysis...',
    posts_processed: 0,
    comments_processed: 0,
    toxic_content: []
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTwitterFailureOverlay, setShowTwitterFailureOverlay] = useState(false);
  
  // Get platform and Reddit-specific params from URL
  const urlParams = new URLSearchParams(window.location.search);
  const platform = urlParams.get('platform') || 'twitter';
  const postCount = parseInt(urlParams.get('postCount')) || 10;
  const commentCount = parseInt(urlParams.get('commentCount')) || 5;

  useEffect(() => {
    if (handle) {
      startAnalysis();
    }
  }, [handle]); // eslint-disable-line react-hooks/exhaustive-deps

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setIsPrivateAccount(false);
    setAnalysisData(null);
    setShowTwitterFailureOverlay(false);
    setProgress({ processed: 0, total: 100, message: 'Starting analysis...' });

    try {
      const data = await apiService.analyzeWithProgress(
        handle,
        null,
        200,
        (progressData) => {
          setProgress({
            processed: progressData.processed || 0,
            total: progressData.total || 100,
            message: progressData.message || 'Processing...',
            sentiment_counts: progressData.sentiment_counts,
            category_counts: progressData.category_counts,
            posts_processed: progressData.posts_processed || 0,
            comments_processed: progressData.comments_processed || 0,
            toxic_content: progressData.toxic_content || []
          });
          
          // Update partial analysis data as we get progress
          if (progressData.processed > 0) {
            const partialData = {
              analytics: {
                overview: {
                  total_tweets: progressData.processed || 0,
                  total_likes: 0,
                  total_retweets: 0,
                  total_replies: 0,
                  average_likes_per_tweet: 0,
                  average_retweets_per_tweet: 0,
                  average_toxicity_score: 0
                },
                sentiment_analysis: {
                  counts: progressData.sentiment_counts || { positive: 0, neutral: 0, negative: 0 },
                  percentages: {
                    positive: progressData.sentiment_counts ? (progressData.sentiment_counts.positive / progressData.processed * 100) : 0,
                    neutral: progressData.sentiment_counts ? (progressData.sentiment_counts.neutral / progressData.processed * 100) : 0,
                    negative: progressData.sentiment_counts ? (progressData.sentiment_counts.negative / progressData.processed * 100) : 0
                  }
                },
                hate_speech_analysis: {
                  counts: progressData.category_counts || { none: 0, racism: 0, religion: 0, sexism: 0, sexual_orientation: 0, nationality: 0, political_leaning: 0, disability: 0, other: 0 },
                  percentages: {
                    none: progressData.category_counts ? (progressData.category_counts.none / progressData.processed * 100) : 0,
                    racism: progressData.category_counts ? (progressData.category_counts.racism / progressData.processed * 100) : 0,
                    religion: progressData.category_counts ? (progressData.category_counts.religion / progressData.processed * 100) : 0,
                    sexism: progressData.category_counts ? (progressData.category_counts.sexism / progressData.processed * 100) : 0,
                    sexual_orientation: progressData.category_counts ? (progressData.category_counts.sexual_orientation / progressData.processed * 100) : 0,
                    nationality: progressData.category_counts ? (progressData.category_counts.nationality / progressData.processed * 100) : 0,
                    political_leaning: progressData.category_counts ? (progressData.category_counts.political_leaning / progressData.processed * 100) : 0,
                    disability: progressData.category_counts ? (progressData.category_counts.disability / progressData.processed * 100) : 0,
                    other: progressData.category_counts ? (progressData.category_counts.other / progressData.processed * 100) : 0
                  }
                },
                top_content: { most_liked: [], most_retweeted: [] }
              },
              tweets: [],
              query_info: {
                handle: handle,
                requested_limit: platform === 'reddit' ? postCount : progressData.total,
                actual_count: progressData.processed,
                timestamp: new Date().toISOString()
              }
            };
            
            setAnalysisData(partialData);
          }
        },
        (error) => {
          console.error('Analysis error:', error);
        },
        platform,
        postCount,
        commentCount
      );

      setAnalysisData(data);
      // Keep analyzing state for a brief moment to show completion
      setTimeout(() => setIsAnalyzing(false), 1500);
    } catch (error) {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
      setError(error.message);
      
      if (error.isPrivateAccount) {
        setIsPrivateAccount(true);
      } else if (platform === 'twitter' && error.message.includes('Failed to fetch tweets')) {
        setShowTwitterFailureOverlay(true);
      }
    }
  };

  const handleRetryAnalysis = () => {
    startAnalysis();
  };

  const transformedData = analysisData ? apiService.transformToChartFormat(analysisData.analytics) : null;
  const transformedTweets = analysisData ? apiService.transformTweetsForTable(analysisData.tweets) : [];

  // Transform data for Recharts (with progressive updates during analysis)
  const getSentimentChartData = () => {
    // Use progressive data during analysis if available
    if (isAnalyzing && progress.sentiment_counts) {
      const total = progress.processed || 1;
      return [
        { 
          name: 'Positive', 
          value: Math.round((progress.sentiment_counts.positive / total) * 100), 
          color: SENTIMENT_COLORS.positive 
        },
        { 
          name: 'Neutral', 
          value: Math.round((progress.sentiment_counts.neutral / total) * 100), 
          color: SENTIMENT_COLORS.neutral 
        },
        { 
          name: 'Negative', 
          value: Math.round((progress.sentiment_counts.negative / total) * 100), 
          color: SENTIMENT_COLORS.negative 
        }
      ];
    }
    
    // Use final data when analysis is complete
    if (!transformedData) return [];
    return [
      { name: 'Positive', value: transformedData.sentimentData.datasets[0].data[0], color: SENTIMENT_COLORS.positive },
      { name: 'Neutral', value: transformedData.sentimentData.datasets[0].data[1], color: SENTIMENT_COLORS.neutral },
      { name: 'Negative', value: transformedData.sentimentData.datasets[0].data[2], color: SENTIMENT_COLORS.negative }
    ];
  };

  const getHateSpeechRadarData = () => {
    if (isAnalyzing && progress.category_counts) {
      const total = progress.processed || 1;
      return [
        { 
          category: 'Racism', 
          value: Math.max(0.1, Math.round(((progress.category_counts.racism || 0) / total) * 100)),
          fullMark: 100
        },
        { 
          category: 'Religion', 
          value: Math.max(0.1, Math.round(((progress.category_counts.religion || 0) / total) * 100)),
          fullMark: 100
        },
        { 
          category: 'Sexism', 
          value: Math.max(0.1, Math.round(((progress.category_counts.sexism || 0) / total) * 100)),
          fullMark: 100
        },
        { 
          category: 'Sexual Orientation', 
          value: Math.max(0.1, Math.round(((progress.category_counts.sexual_orientation || 0) / total) * 100)),
          fullMark: 100
        },
        { 
          category: 'Nationality', 
          value: Math.max(0.1, Math.round(((progress.category_counts.nationality || 0) / total) * 100)),
          fullMark: 100
        },
        { 
          category: 'Political Leaning', 
          value: Math.max(0.1, Math.round(((progress.category_counts.political_leaning || 0) / total) * 100)),
          fullMark: 100
        },
        { 
          category: 'Disability', 
          value: Math.max(0.1, Math.round(((progress.category_counts.disability || 0) / total) * 100)),
          fullMark: 100
        },
        { 
          category: 'Other', 
          value: Math.max(0.1, Math.round(((progress.category_counts.other || 0) / total) * 100)),
          fullMark: 100
        }
      ];
    }

    if (!transformedData) {
      // Return minimum values to show chart structure
      return [
        { category: 'Racism', value: 0.1, fullMark: 100 },
        { category: 'Religion', value: 0.1, fullMark: 100 },
        { category: 'Sexism', value: 0.1, fullMark: 100 },
        { category: 'Sexual Orientation', value: 0.1, fullMark: 100 },
        { category: 'Nationality', value: 0.1, fullMark: 100 },
        { category: 'Political Leaning', value: 0.1, fullMark: 100 },
        { category: 'Disability', value: 0.1, fullMark: 100 },
        { category: 'Other', value: 0.1, fullMark: 100 }
      ];
    }
    
    const data = transformedData.hateSpeechData.datasets[0].data;
    return [
      { 
        category: 'Racism', 
        value: Math.max(0.1, data[1] || 0),
        fullMark: 100
      },
      { 
        category: 'Religion', 
        value: Math.max(0.1, data[2] || 0),
        fullMark: 100
      },
      { 
        category: 'Sexism', 
        value: Math.max(0.1, data[3] || 0),
        fullMark: 100
      },
      { 
        category: 'Sexual Orientation', 
        value: Math.max(0.1, data[4] || 0),
        fullMark: 100
      },
      { 
        category: 'Nationality', 
        value: Math.max(0.1, data[5] || 0),
        fullMark: 100
      },
      { 
        category: 'Political Leaning', 
        value: Math.max(0.1, data[6] || 0),
        fullMark: 100
      },
      { 
        category: 'Disability', 
        value: Math.max(0.1, data[7] || 0),
        fullMark: 100
      },
      { 
        category: 'Other', 
        value: Math.max(0.1, data[8] || 0),
        fullMark: 100
      }
    ];
  };

  const getHateSpeechChartData = () => {
    if (!transformedData) return [];
    return [
      { name: 'Racism', value: transformedData.hateSpeechData.datasets[0].data[1] || 0, color: HATE_SPEECH_COLORS.racism },
      { name: 'Religion', value: transformedData.hateSpeechData.datasets[0].data[2] || 0, color: HATE_SPEECH_COLORS.religion },
      { name: 'Sexism', value: transformedData.hateSpeechData.datasets[0].data[3] || 0, color: HATE_SPEECH_COLORS.sexism },
      { name: 'LGBT+', value: transformedData.hateSpeechData.datasets[0].data[4] || 0, color: HATE_SPEECH_COLORS.sexual_orientation },
      { name: 'Nationality', value: transformedData.hateSpeechData.datasets[0].data[5] || 0, color: HATE_SPEECH_COLORS.nationality },
      { name: 'Political', value: transformedData.hateSpeechData.datasets[0].data[6] || 0, color: HATE_SPEECH_COLORS.political_leaning },
      { name: 'Disabled', value: transformedData.hateSpeechData.datasets[0].data[7] || 0, color: HATE_SPEECH_COLORS.disability },
      { name: 'Other', value: transformedData.hateSpeechData.datasets[0].data[8] || 0, color: HATE_SPEECH_COLORS.other }
    ];
  };

  const getHateSpeechContent = () => {
    // During analysis, use progress data if available
    if (isAnalyzing && progress.toxic_content) {
      return progress.toxic_content.slice(0, 10);
    }
    
    // After analysis, use final data
    if (!analysisData?.tweets) return [];
    return analysisData.tweets
      .filter(tweet => tweet.hate_speech_analysis?.category !== 'none')
      .map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        author: tweet.author,
        type: tweet.post_type,
        category: tweet.hate_speech_analysis.category,
        toxicity_score: tweet.hate_speech_analysis.toxicity_score,
        platform: tweet.platform,
        likes: tweet.likes,
        link: tweet.link
      }))
      .sort((a, b) => b.toxicity_score - a.toxicity_score)
      .slice(0, 10);
  };

  if (isPrivateAccount) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
            <div className="ml-6">
              <h1 className="text-xl font-bold text-gray-900">
                Analysis Failed for {platform === 'twitter' ? '@' : 'r/'}{handle}
              </h1>
            </div>
          </div>
        </nav>
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <PrivateAccountError 
            handle={handle} 
            onRetry={handleRetryAnalysis}
            onGoHome={() => navigate('/')}
          />
        </main>
      </div>
    );
  }

  if (error && !isPrivateAccount) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
            <div className="ml-6">
              <h1 className="text-xl font-bold text-gray-900">
                Analysis Failed for {platform === 'twitter' ? '@' : 'r/'}{handle}
              </h1>
            </div>
          </div>
        </nav>
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Analysis Failed</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={handleRetryAnalysis}
                  className="mt-4 flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Analysis</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show loading screen when no data and not analyzing
  if (!analysisData && !isAnalyzing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
            <div className="ml-6">
              <h1 className="text-xl font-bold text-gray-900">
                Initializing Analysis for {platform === 'twitter' ? '@' : 'r/'}{handle}
              </h1>
            </div>
          </div>
        </nav>
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Starting Analysis</h3>
                <p className="text-blue-700 mt-1">Click "Start Analysis" to begin analyzing {platform === 'twitter' ? '@' : 'r/'}{handle}...</p>
                <button
                  onClick={startAnalysis}
                  className="mt-4 flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Activity className="w-4 h-4" />
                  <span>Start Analysis</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const exportToPDF = async () => {
    try {
      // Create a comprehensive report object
      const reportData = {
        title: `${platform === 'twitter' ? 'Twitter' : 'Reddit'} Analysis Report`,
        subject: `Analysis of ${platform === 'twitter' ? '@' : 'r/'}${handle}`,
        generated: new Date().toISOString(),
        platform,
        handle,
        stats: transformedData?.stats || {},
        sentiment: getSentimentChartData(),
        hateSpeech: getHateSpeechChartData(),
        toxicContent: getHateSpeechContent().slice(0, 5),
        totalItems: analysisData?.analytics?.overview?.total_tweets || 0
      };

      // Convert to formatted text for now (future: implement proper PDF generation)
      const reportText = `
=== ${reportData.title} ===
Generated: ${new Date(reportData.generated).toLocaleString()}
Target: ${reportData.subject}
Total Items Analyzed: ${reportData.totalItems}

=== SENTIMENT ANALYSIS ===
${reportData.sentiment.map(s => `${s.name}: ${s.value.toFixed(1)}%`).join('\n')}

=== HATE SPEECH DETECTION ===
${reportData.hateSpeech.map(h => `${h.name}: ${h.value.toFixed(1)}%`).join('\n')}

=== TOP TOXIC CONTENT ===
${reportData.toxicContent.map((item, i) => `${i+1}. [${item.category}] Score: ${item.toxicity_score.toFixed(3)}\n   "${item.text.substring(0, 100)}..."\n   Author: ${item.author}\n`).join('\n')}
      `.trim();

      // Create downloadable text file
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${platform}_analysis_${handle}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="font-medium">Back to Home</span>
              </button>
              <div className="h-8 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    platform === 'reddit' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {platform === 'reddit' ? <BarChart3 className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                  </div>
                  <span>{platform === 'twitter' ? '@' : 'r/'}{handle}</span>
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {platform === 'reddit' ? `${postCount} posts, ${commentCount} comments per post` : 'Twitter Analysis'}
                </p>
              </div>
            </div>
            <button 
              onClick={exportToPDF}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">Export Report</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Compact Progress Bar */}
        {isAnalyzing && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    Analyzing {platform === 'reddit' ? `r/${handle}` : `@${handle}`}
                  </span>
                  <span className="text-sm text-gray-500">
                    {platform === 'reddit' 
                      ? `Post ${Math.min(progress.posts_processed || 0, postCount)}/${postCount} (${Math.min(Math.round(((progress.posts_processed || 0) / postCount) * 100), 100)}%)`
                      : `${progress.processed}/${progress.total} (${Math.round((progress.processed / progress.total) * 100)}%)`
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="h-full bg-gray-900 rounded-full transition-all duration-300"
                    style={{ width: `${platform === 'reddit' ? Math.min(Math.round(((progress.posts_processed || 0) / postCount) * 100), 100) : Math.round((progress.processed / progress.total) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {platform === 'reddit' 
                    ? `${progress.processed || 0} items analyzed from ${progress.posts_processed || 0} posts`
                    : progress.message
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {showTwitterFailureOverlay && platform === 'twitter' && (
          <div className="bg-amber-50/90 backdrop-blur-sm border border-amber-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-800">Twitter Web Scraper Issue</h3>
                <p className="text-amber-700 mt-1">
                  Live Twitter data unavailable. Showing sample data for demonstration.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {isAnalyzing 
                  ? (progress.posts_processed || 0)
                  : transformedTweets.filter(t => t.post_type === 'post' || !t.post_type).length || 0}
              </div>
            </div>
            <h3 className="font-medium text-gray-900">{platform === 'twitter' ? 'Tweets' : 'Posts'} Analyzed</h3>
            <p className="text-sm text-gray-500 mt-1">Posts only (excluding comments)</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {isAnalyzing 
                  ? (progress.comments_processed || 0)
                  : transformedTweets.filter(t => t.post_type === 'comment').length || 0}
              </div>
            </div>
            <h3 className="font-medium text-gray-900">Comments Analyzed</h3>
            <p className="text-sm text-gray-500 mt-1">Reddit comments processed</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {transformedData?.stats.avgSentiment || 'Unknown'}
              </div>
            </div>
            <h3 className="font-medium text-gray-900">Average Sentiment</h3>
            <p className="text-sm text-gray-500 mt-1">Overall emotional tone</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {Object.values(transformedData?.stats.hateBreakdown || {}).reduce((a, b) => a + b, 0)}
              </div>
            </div>
            <h3 className="font-medium text-gray-900">Hate Speech Detected</h3>
            <p className="text-sm text-gray-500 mt-1">
              {transformedData?.stats.totalTweets > 0 ? 
                `${((Object.values(transformedData.stats.hateBreakdown).reduce((a, b) => a + b, 0) / transformedData.stats.totalTweets) * 100).toFixed(1)}% of total` : 
                '0% of total'
              }
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {((transformedData?.stats.engagement.likes + transformedData?.stats.engagement.reposts + transformedData?.stats.engagement.replies) || 0).toLocaleString()}
              </div>
            </div>
            <h3 className="font-medium text-gray-900">Total Engagement</h3>
            <p className="text-sm text-gray-500 mt-1">Likes, shares, comments</p>
          </div>
        </div>


        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sentiment Distribution - Single Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <span>Sentiment Distribution</span>
              </h3>
            </div>
            <div className="h-96">
              {(transformedData?.sentimentData || (isAnalyzing && progress.sentiment_counts)) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getSentimentChartData()}
                      cx="50%"
                      cy="40%"
                      outerRadius={125}
                      dataKey="value"
                    >
                      {getSentimentChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Percentage']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                    <RefreshCw className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <p className="text-gray-600 font-medium">Analyzing Sentiment...</p>
                  <p className="text-gray-500 text-sm mt-1">Processing emotions and tone</p>
                </div>
              ) : null}
            
            {/* Legend */}
            {(transformedData?.sentimentData || (isAnalyzing && progress.sentiment_counts)) && (
              <div className="flex justify-center space-x-6 mt-[-1.5rem]">
                {getSentimentChartData().map((entry, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                    <span className="text-sm text-gray-500">{entry.value}%</span>
                  </div>
                ))}
              </div>
            )}
          
            {!transformedData?.sentimentData && !isAnalyzing && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No data available</p>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Hate Speech Radar Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-red-600" />
                </div>
                <span>Hate Speech Distribution</span>
              </h3>
            </div>
            <div className="h-96">
              {(transformedData?.hateSpeechData || (isAnalyzing && progress.category_counts)) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={getHateSpeechRadarData()} cx="50%" cy="40%">
                    <PolarGrid gridType="polygon" />
                    <PolarAngleAxis dataKey="category" className="text-sm" />
                    <PolarRadiusAxis 
                      domain={[0, 'dataMax']}
                      angle={-90}
                      orientation="middle"
                      tick={false}
                    />
                    <Radar
                      name="Percentage"
                      dataKey="value"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.2}
                      strokeWidth={3}
                    />
                    <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Percentage']} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-4">
                    <RefreshCw className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <p className="text-gray-700 font-medium">Detecting hate speech...</p>
                  {progress.processed > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      {progress.processed} {platform === 'twitter' ? 'tweets' : 'posts'} analyzed
                    </p>
                  )}
                </div>
              ) : !transformedData?.hateSpeechData && !isAnalyzing && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hate Speech Content Showcase */}
        {getHateSpeechContent().length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-red-900 flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <span>Detected Hate Speech Content</span>
              </h3>
              <div className="flex items-center space-x-2">
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                  Top {getHateSpeechContent().length} Most Toxic
                </span>
                {isAnalyzing && progress.toxic_content && progress.toxic_content.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Live Updates</span>
                  </span>
                )}
              </div>
            </div>
            <div className="grid gap-4">
              {getHateSpeechContent().map((item, index) => (
                <div key={item.id} className="bg-white rounded-xl p-6 border border-red-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          item.type === 'post' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {item.type === 'post' ? 'POST' : 'COMMENT'}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          item.category === 'racism' ? 'bg-red-100 text-red-700' :
                          item.category === 'religion' ? 'bg-orange-100 text-orange-700' :
                          item.category === 'sexism' ? 'bg-pink-100 text-pink-700' :
                          item.category === 'sexual_orientation' ? 'bg-purple-100 text-purple-700' :
                          item.category === 'nationality' ? 'bg-green-100 text-green-700' :
                          item.category === 'political_leaning' ? 'bg-amber-100 text-amber-700' :
                          item.category === 'disability' ? 'bg-gray-100 text-gray-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {item.category === 'sexual_orientation' ? 'LGBT+' :
                           item.category === 'political_leaning' ? 'POLITICAL' :
                           item.category.toUpperCase().replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        {(item.toxicity_score * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Toxicity Score</div>
                    </div>
                  </div>
                  <p className="text-gray-800 mb-3 leading-relaxed">{item.text}</p>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      <span>@{item.author}</span>
                      {item.likes > 0 && (
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4 text-red-400" />
                          <span>{item.likes}</span>
                        </div>
                      )}
                    </div>
                    {item.link && (
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-xs underline"
                      >
                        View Original
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Analysis Summary</h3>
              <p className="text-blue-800 mb-6 text-lg leading-relaxed">
                This analysis processed {transformedData?.stats.totalTweets || 0} {platform === 'twitter' ? 'tweets' : 'posts'} and detected potential hate speech in {Object.values(transformedData?.stats.hateBreakdown || {}).reduce((a, b) => a + b, 0)} items. 
                The content shows a generally <strong>{(transformedData?.stats.avgSentiment || 'unknown').toLowerCase()}</strong> sentiment with{' '}
                <strong>
                  {(analysisData?.analytics?.overview?.average_toxicity_score || 0) < 0.1 ? 'low' : 
                   (analysisData?.analytics?.overview?.average_toxicity_score || 0) < 0.3 ? 'moderate' : 'high'}
                </strong> toxicity levels.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {Object.entries(transformedData?.stats.hateBreakdown || {}).map(([category, count]) => (
                  <div key={category} className="bg-white rounded-xl p-4 border border-blue-100">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-blue-700 capitalize">{category}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;