const express = require('express');
const scraper = require('../services/scraper');
const redditScraper = require('../services/redditScraper');
const sentimentAnalyzer = require('../services/sentiment');
const hateSpeechClassifier = require('../services/hateSpeech');
const analyticsService = require('../services/analytics');
const cacheService = require('../services/cache');
const { preprocessText } = require('../utils/preprocess');

const router = express.Router();

router.get('/analyze', async (req, res) => {
  const { handle, query, subreddit, platform = 'twitter', limit = 100, postCount = 25, commentCount = 5 } = req.query;
  
  console.log(`📋 Received request - Platform: ${platform}, PostCount: ${postCount}, CommentCount: ${commentCount}`);
  
  if (platform === 'twitter' && !handle && !query) {
    return res.status(400).json({
      error: 'Either handle or query parameter is required for Twitter'
    });
  }
  
  if (platform === 'reddit' && !subreddit) {
    return res.status(400).json({
      error: 'Subreddit parameter is required for Reddit'
    });
  }

  const requestLimit = Math.min(parseInt(limit) || 100, 500);
  const postsLimit = Math.min(parseInt(postCount) || 25, 25);
  const commentsLimit = Math.min(parseInt(commentCount) || 5, 20);
  
  try {
    // Generate cache key based on platform and parameters
    const cacheKey = platform === 'reddit' 
      ? `${subreddit}_${postsLimit}_${commentsLimit}` 
      : (handle || query);
    const cached = cacheService.get(cacheKey, platform, requestLimit);
    if (cached) {
      console.log('Returning cached results');
      return res.json({
        success: true,
        source: 'cache',
        data: cached
      });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true'
    });

    const sendSSE = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const platformName = platform === 'reddit' ? 'Reddit' : 'Twitter';
    const contentType = platform === 'reddit' ? 'posts and comments' : 'tweets';
    
    // Calculate expected total items
    const expectedTotal = platform === 'reddit' 
      ? postsLimit * (1 + commentsLimit) // posts + comments per post
      : requestLimit;
    
    sendSSE({ 
      type: 'progress', 
      message: `Starting ${platformName} ${contentType} collection...`, 
      processed: 0, 
      total: expectedTotal 
    });

    const processedPosts = [];
    const scrapingStart = Date.now();
    
    try {
      if (platform === 'reddit') {
        // Streaming approach for Reddit - process as we fetch
        let postIndex = 0;
        try {
          for await (const batch of redditScraper.scrapeWithSnooWrapStreaming(subreddit, postsLimit, commentsLimit, sendSSE)) {
            postIndex++;
            
            // Process this batch through ML immediately (async)
            const batchStart = Date.now();
            for (const post of batch) {
              const preprocessedText = preprocessText(post.text);
              const sentimentResult = await sentimentAnalyzer.analyzeSentiment(post.text);
              const hateSpeechResult = await hateSpeechClassifier.classifyHateSpeech(post.text);

              const processedPost = {
                ...post,
                preprocessed_text: preprocessedText,
                sentiment_analysis: sentimentResult,
                hate_speech_analysis: hateSpeechResult
              };

              processedPosts.push(processedPost);
            }
          
          const batchTime = Date.now() - batchStart;
          const progressStats = analyticsService.calculateProgressStats(processedPosts, postsLimit * (1 + commentsLimit));
          
          console.log(`📊 Processed post ${postIndex}/${postsLimit} with ${batch.length} items in ${batchTime}ms`);
          
          // Send live progress with updated charts data
          sendSSE({
            type: 'progress',
            message: `Analyzed post ${postIndex}/${postsLimit} from r/${subreddit}...`,
            processed: processedPosts.length,
            total: postsLimit * (1 + commentsLimit),
            percentage: Math.round((processedPosts.length / (postsLimit * (1 + commentsLimit))) * 100),
            ...progressStats
          });
          
          // Small delay for better UX
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (streamError) {
        console.error('Streaming error occurred, preserving partial results:', streamError);
        
        // Send notification about partial results
        sendSSE({
          type: 'info',
          message: `Analysis partially completed. Showing ${processedPosts.length} results.`,
          processed: processedPosts.length,
          total: postsLimit * (1 + commentsLimit),
          percentage: Math.round((processedPosts.length / (postsLimit * (1 + commentsLimit))) * 100),
          isToast: true
        });
      }
      } else {
        // Twitter: Keep existing batch approach since it's already fast
        const posts = await scraper.scrapeTweets(handle, query, requestLimit);
        
        if (!posts || posts.length === 0) {
          sendSSE({ 
            type: 'error', 
            message: 'No tweets found or account may be private'
          });
          return res.end();
        }

        sendSSE({ 
          type: 'progress', 
          message: `Found ${posts.length} tweets. Starting analysis...`, 
          processed: 0, 
          total: posts.length 
        });

        const batchSize = Math.max(1, Math.min(5, Math.ceil(posts.length / 10)));
        const mlProcessingStart = Date.now();
        console.log(`🧠 Starting ML processing of ${posts.length} items in batches of ${batchSize}`);

        for (let i = 0; i < posts.length; i += batchSize) {
          const batchStart = Date.now();
          const batch = posts.slice(i, i + batchSize);
          
          for (const post of batch) {
            const preprocessedText = preprocessText(post.text);
            const sentimentResult = await sentimentAnalyzer.analyzeSentiment(post.text);
            const hateSpeechResult = await hateSpeechClassifier.classifyHateSpeech(post.text);

            const processedPost = {
              ...post,
              preprocessed_text: preprocessedText,
              sentiment_analysis: sentimentResult,
              hate_speech_analysis: hateSpeechResult
            };

            processedPosts.push(processedPost);
          }

          const batchTime = Date.now() - batchStart;
          const progressStats = analyticsService.calculateProgressStats(processedPosts, posts.length);
          
          console.log(`📊 Batch ${Math.ceil((i + 1) / batchSize)}/${Math.ceil(posts.length / batchSize)}: Processed ${batch.length} items in ${batchTime}ms`);
          
          sendSSE({
            type: 'progress',
            message: `Processed ${Math.min(i + batchSize, posts.length)} of ${posts.length} tweets...`,
            processed: processedPosts.length,
            total: posts.length,
            percentage: Math.round((processedPosts.length / posts.length) * 100),
            ...progressStats
          });

          const delay = posts.length < 10 ? 500 : 200;
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const totalMLTime = Date.now() - mlProcessingStart;
        console.log(`🧠 Total ML processing time: ${totalMLTime}ms for ${posts.length} items`);
      }
      
      const scrapingTime = Date.now() - scrapingStart;
      console.log(`⏱️  Total processing took: ${scrapingTime}ms`);
      
      if (processedPosts.length === 0) {
        const errorMsg = platform === 'reddit' 
          ? 'No posts found or subreddit may be private' 
          : 'No tweets found or account may be private';
        sendSSE({ 
          type: 'error', 
          message: errorMsg
        });
        return res.end();
      }

    } catch (scraperError) {
      console.error('Scraper error:', scraperError);
      
      if (scraperError.message.includes('private') || scraperError.message.includes('not exist')) {
        const errorMsg = platform === 'reddit' 
          ? 'Subreddit is private or does not exist' 
          : 'Account is private or does not exist';
        sendSSE({ 
          type: 'error', 
          message: errorMsg
        });
      } else {
        const errorMsg = platform === 'reddit' 
          ? `Failed to fetch Reddit posts. ${scraperError.message}` 
          : 'Failed to fetch tweets. Please try again later.';
        sendSSE({ 
          type: 'error', 
          message: errorMsg
        });
      }
      return res.end();
    }

    sendSSE({ 
      type: 'progress', 
      message: 'Computing final analytics...', 
      processed: processedPosts.length, 
      total: processedPosts.length 
    });

    const analytics = analyticsService.computeAnalytics(processedPosts);

    const finalResult = {
      query_info: {
        platform: platform,
        handle: handle || null,
        query: query || null,
        subreddit: subreddit || null,
        requested_limit: requestLimit,
        actual_count: processedPosts.length,
        timestamp: new Date().toISOString()
      },
      tweets: processedPosts, // Keep the same field name for frontend compatibility
      analytics
    };

    cacheService.set(cacheKey, platform, requestLimit, finalResult);

    sendSSE({
      type: 'complete',
      message: 'Analysis complete!',
      data: finalResult
    });

    res.end();

  } catch (error) {
    console.error('Analysis error:', error);
    
    try {
      const errorResponse = {
        type: 'error',
        message: 'An unexpected error occurred during analysis'
      };
      
      res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
      res.end();
    } catch (writeError) {
      console.error('Error writing error response:', writeError);
    }
  }
});

router.get('/cache/stats', (_, res) => {
  try {
    const stats = cacheService.getStats();
    const entries = cacheService.getCacheEntries();
    res.json({
      success: true,
      cache_stats: stats,
      entries: entries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache stats'
    });
  }
});

router.delete('/cache/flush', (_, res) => {
  try {
    cacheService.flush();
    res.json({
      success: true,
      message: 'Cache flushed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to flush cache'
    });
  }
});

// Reddit API Status endpoint
router.get('/reddit/status', (_, res) => {
  try {
    const redditStatus = redditScraper.getRedditAPIStatus();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      reddit_api: redditStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Reddit API status'
    });
  }
});

router.get('/health', (_, res) => {
  res.json({
    success: true,
    status: 'healthy',
    services: {
      scraper: 'operational',
      sentiment_analyzer: 'operational',
      hate_speech_classifier: 'operational',
      cache: 'operational'
    }
  });
});

module.exports = router;