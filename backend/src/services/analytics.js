class AnalyticsService {
  computeAnalytics(processedTweets) {
    if (!processedTweets || !Array.isArray(processedTweets) || processedTweets.length === 0) {
      return this.getEmptyAnalytics();
    }

    const totalTweets = processedTweets.length;
    const totalLikes = processedTweets.reduce((sum, tweet) => sum + (tweet.likes || 0), 0);
    const totalRetweets = processedTweets.reduce((sum, tweet) => sum + (tweet.retweets || 0), 0);
    const totalReplies = processedTweets.reduce((sum, tweet) => sum + (tweet.replies_count || 0), 0);

    const sentimentCounts = this.countSentiments(processedTweets);
    const categoryCounts = this.countCategories(processedTweets);
    
    const sentimentPercentages = this.calculatePercentages(sentimentCounts, totalTweets);
    const categoryPercentages = this.calculatePercentages(categoryCounts, totalTweets);

    const topLikedTweets = this.getTopTweets(processedTweets, 'likes', 5);
    const topRetweetedTweets = this.getTopTweets(processedTweets, 'retweets', 5);

    const averageToxicityScore = this.calculateAverageToxicity(processedTweets);
    const engagementStats = this.calculateEngagementStats(processedTweets);
    const timeDistribution = this.analyzeTimeDistribution(processedTweets);

    return {
      overview: {
        total_tweets: totalTweets,
        total_likes: totalLikes,
        total_retweets: totalRetweets,
        total_replies: totalReplies,
        average_likes_per_tweet: Math.round((totalLikes / totalTweets) * 100) / 100,
        average_retweets_per_tweet: Math.round((totalRetweets / totalTweets) * 100) / 100,
        average_toxicity_score: averageToxicityScore
      },
      sentiment_analysis: {
        counts: sentimentCounts,
        percentages: sentimentPercentages
      },
      hate_speech_analysis: {
        counts: categoryCounts,
        percentages: categoryPercentages
      },
      top_content: {
        most_liked: topLikedTweets,
        most_retweeted: topRetweetedTweets
      },
      engagement_stats: engagementStats,
      time_distribution: timeDistribution
    };
  }

  getEmptyAnalytics() {
    return {
      overview: {
        total_tweets: 0,
        total_likes: 0,
        total_retweets: 0,
        total_replies: 0,
        average_likes_per_tweet: 0,
        average_retweets_per_tweet: 0,
        average_toxicity_score: 0
      },
      sentiment_analysis: {
        counts: { positive: 0, neutral: 0, negative: 0 },
        percentages: { positive: 0, neutral: 0, negative: 0 }
      },
      hate_speech_analysis: {
        counts: { none: 0, racism: 0, religion: 0, sexism: 0, sexual_orientation: 0, nationality: 0, political_leaning: 0, disability: 0, other: 0 },
        percentages: { none: 0, racism: 0, religion: 0, sexism: 0, sexual_orientation: 0, nationality: 0, political_leaning: 0, disability: 0, other: 0 }
      },
      top_content: {
        most_liked: [],
        most_retweeted: []
      },
      engagement_stats: {
        high_engagement_tweets: 0,
        low_engagement_tweets: 0,
        viral_tweets: 0
      },
      time_distribution: {}
    };
  }

  countSentiments(tweets) {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    
    tweets.forEach(tweet => {
      if (tweet.sentiment_analysis && tweet.sentiment_analysis.sentiment) {
        const sentiment = tweet.sentiment_analysis.sentiment.toLowerCase();
        if (counts.hasOwnProperty(sentiment)) {
          counts[sentiment]++;
        }
      }
    });

    return counts;
  }

  countCategories(tweets) {
    const counts = { none: 0, racism: 0, religion: 0, sexism: 0, sexual_orientation: 0, nationality: 0, political_leaning: 0, disability: 0, other: 0 };
    
    tweets.forEach(tweet => {
      if (tweet.hate_speech_analysis && tweet.hate_speech_analysis.category) {
        const category = tweet.hate_speech_analysis.category.toLowerCase();
        if (counts.hasOwnProperty(category)) {
          counts[category]++;
        }
      }
    });

    return counts;
  }

  calculatePercentages(counts, total) {
    if (total === 0) return counts;
    
    const percentages = {};
    Object.keys(counts).forEach(key => {
      percentages[key] = Math.round((counts[key] / total) * 100 * 100) / 100;
    });
    
    return percentages;
  }

  getTopTweets(tweets, metric, limit = 5) {
    return tweets
      .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
      .slice(0, limit)
      .map(tweet => ({
        id: tweet.id,
        text: tweet.text.substring(0, 100) + (tweet.text.length > 100 ? '...' : ''),
        author: tweet.author,
        [metric]: tweet[metric] || 0,
        link: tweet.link
      }));
  }

  calculateAverageToxicity(tweets) {
    if (tweets.length === 0) return 0;
    
    const totalToxicity = tweets.reduce((sum, tweet) => {
      return sum + (tweet.hate_speech_analysis?.toxicity_score || 0);
    }, 0);
    
    return Math.round((totalToxicity / tweets.length) * 100) / 100;
  }

  calculateEngagementStats(tweets) {
    if (tweets.length === 0) {
      return { high_engagement_tweets: 0, low_engagement_tweets: 0, viral_tweets: 0 };
    }

    const engagementScores = tweets.map(tweet => {
      return (tweet.likes || 0) + (tweet.retweets || 0) + (tweet.replies_count || 0);
    });

    const averageEngagement = engagementScores.reduce((sum, score) => sum + score, 0) / tweets.length;
    const highThreshold = averageEngagement * 1.5;
    const viralThreshold = averageEngagement * 3;

    let highEngagement = 0;
    let lowEngagement = 0;
    let viral = 0;

    engagementScores.forEach(score => {
      if (score >= viralThreshold) {
        viral++;
      } else if (score >= highThreshold) {
        highEngagement++;
      } else if (score < averageEngagement * 0.5) {
        lowEngagement++;
      }
    });

    return {
      high_engagement_tweets: highEngagement,
      low_engagement_tweets: lowEngagement,
      viral_tweets: viral
    };
  }

  analyzeTimeDistribution(tweets) {
    const distribution = {};
    
    tweets.forEach(tweet => {
      if (tweet.date) {
        try {
          const date = new Date(tweet.date);
          const hour = date.getHours();
          const timeSlot = this.getTimeSlot(hour);
          
          if (!distribution[timeSlot]) {
            distribution[timeSlot] = 0;
          }
          distribution[timeSlot]++;
        } catch (error) {
          console.error('Error parsing date:', tweet.date);
        }
      }
    });

    return distribution;
  }

  getTimeSlot(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'night';
  }

  calculateProgressStats(processedTweets, totalExpected) {
    const processed = processedTweets.length;
    const sentimentCounts = this.countSentiments(processedTweets);
    const categoryCounts = this.countCategories(processedTweets);
    
    // Calculate post/comment breakdown
    const posts = processedTweets.filter(t => t.post_type === 'post' || !t.post_type);
    const comments = processedTweets.filter(t => t.post_type === 'comment');
    
    // Get toxic content for live display
    const toxicContent = processedTweets
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
    
    return {
      processed,
      total: totalExpected,
      percentage: totalExpected > 0 ? Math.round((processed / totalExpected) * 100) : 0,
      sentiment_counts: sentimentCounts,
      category_counts: categoryCounts,
      posts_processed: posts.length,
      comments_processed: comments.length,
      toxic_content: toxicContent
    };
  }
}

module.exports = new AnalyticsService();