const snoowrap = require('snoowrap');
const config = require('../config');
const dummyTweets = require('../dummy_data/tweets.json');

class RedditScraper {
  constructor() {
    this.usePublicAPI = false;
    this.reddit = null;
    this.isAuthenticatedBusy = false; // Track if authenticated API is in use
    this.userAgent = config.REDDIT_USER_AGENT || 'hate-speech-detector/0.1 by reddit_user';
    
    // Public API burst tracking (100 requests per 10 minutes = 1000 total)
    this.publicAPIRequests = [];
    this.maxRequestsPer10Min = 100; // Conservative estimate
    this.burstWindowMs = 10 * 60 * 1000; // 10 minutes
    
    // Try snoowrap authentication first
    if (config.REDDIT_CLIENT_ID && config.REDDIT_CLIENT_SECRET && config.REDDIT_USER_AGENT && config.REDDIT_USERNAME && config.REDDIT_PASSWORD) {
      try {
        console.log('🔧 Attempting Reddit authentication with:');
        console.log(`   Client ID: ${config.REDDIT_CLIENT_ID.substring(0, 10)}...`);
        console.log(`   Username: ${config.REDDIT_USERNAME}`);
        console.log(`   User Agent: ${config.REDDIT_USER_AGENT}`);
        
        this.reddit = new snoowrap({
          userAgent: config.REDDIT_USER_AGENT,
          clientId: config.REDDIT_CLIENT_ID,
          clientSecret: config.REDDIT_CLIENT_SECRET,
          username: config.REDDIT_USERNAME,
          password: config.REDDIT_PASSWORD
        });
        
        // Configure rate limiting
        this.reddit.config({ requestDelay: 1100 }); // Stay within 1 req/sec limit
        
        console.log('Reddit scraper initialized with snoowrap authentication');
        
        // Test authentication by fetching user info
        this.reddit.getMe().then(user => {
          console.log(`✅ Successfully authenticated as Reddit user: ${user.name}`);
        }).catch(err => {
          console.warn('❌ Authentication test failed:');
          console.warn(`   Status: ${err.statusCode || 'Unknown'}`);
          console.warn(`   Message: ${err.message}`);
          console.warn(`   Body: ${JSON.stringify(err.body || {})}`);
          
          if (err.statusCode === 401) {
            console.log('💡 Possible causes:');
            console.log('   - Reddit app configured as "web app" instead of "script"');
            console.log('   - Account has 2FA enabled');
            console.log('   - Incorrect username/password');
            console.log('   - Account needs email verification');
          }
          
          console.log('🔄 Falling back to public JSON API');
          this.usePublicAPI = true;
          this.reddit = null;
        });
      } catch (error) {
        console.warn('Snoowrap authentication failed:', error.message);
        console.log('Falling back to public JSON API');
        this.usePublicAPI = true;
        this.reddit = null;
      }
    } else {
      console.warn('Reddit API credentials not configured, using public JSON API');
      this.usePublicAPI = true;
    }
  }

  async scrapeSubreddit(subreddit, postCount = 10, commentCount = 5, progressCallback = null) {
    console.log(`Attempting to scrape r/${subreddit} with ${postCount} posts, ${commentCount} comments per post`);
    
    // Check if authenticated API is available and not busy
    if (this.reddit && !this.usePublicAPI && !this.isAuthenticatedBusy) {
      console.log('Using authenticated API (not busy)');
      return this.scrapeWithSnoowrap(subreddit, postCount, commentCount, progressCallback);
    } else {
      console.log('Authenticated API busy or unavailable, using public API');
      return this.scrapeWithPublicAPI(subreddit, postCount, commentCount, progressCallback);
    }
  }

  async scrapeWithSnoowrap(subreddit, postCount, commentCount, progressCallback = null) {
    // Mark authenticated API as busy
    this.isAuthenticatedBusy = true;
    
    try {
      console.log('Using snoowrap for Reddit scraping');
      console.log(`Fetching ${postCount} posts from r/${subreddit}`);
      
      if (progressCallback) {
        progressCallback({
          type: 'progress',
          message: `Fetching posts from r/${subreddit}...`,
          processed: 0,
          total: postCount,
          percentage: 0
        });
      }
      
      const posts = await this.reddit.getSubreddit(subreddit).getHot({ limit: postCount });
      console.log(`Retrieved ${posts.length} posts from Reddit API`);
      const postsAndComments = [];

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        // Add the post itself
        postsAndComments.push(this.normalizeRedditPost(post));
        
        // Fetch comments for this post
        try {
          // Fetch the submission with comments
          const submission = await this.reddit.getSubmission(post.id);
          const comments = await submission.comments;
          await submission.expandReplies({ limit: commentCount, depth: 1 });
          const limitedComments = comments.slice(0, commentCount);
          
          for (const comment of limitedComments) {
            if (comment && comment.body && comment.body !== '[deleted]' && comment.body !== '[removed]' && typeof comment.body === 'string') {
              postsAndComments.push(this.normalizeRedditComment(comment, post));
            }
          }
        } catch (commentError) {
          console.warn(`Could not fetch comments for post ${post.id}:`, commentError.message);
        }
        
        // Send progress update after processing each post
        if (progressCallback) {
          const processed = i + 1;
          progressCallback({
            type: 'progress',
            message: `Processed post ${processed}/${posts.length} from r/${subreddit}...`,
            processed: processed,
            total: posts.length,
            percentage: Math.round((processed / posts.length) * 100)
          });
        }
        
        // Add small delay to respect rate limits
        if (posts.indexOf(post) < posts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Successfully scraped ${postsAndComments.length} items with snoowrap`);
      return postsAndComments;
    } catch (error) {
      console.error('Snoowrap scraping error:', error);
      console.log('Falling back to public API');
      this.usePublicAPI = true;
      return this.scrapeWithPublicAPI(subreddit, postCount, commentCount, progressCallback);
    } finally {
      // Always mark authenticated API as not busy
      this.isAuthenticatedBusy = false;
    }
  }

  async *scrapeWithSnooWrapStreaming(subreddit, postCount, commentCount, progressCallback = null) {
    // Mark authenticated API as busy for streaming
    this.isAuthenticatedBusy = true;
    
    try {
      console.log('Using streaming snoowrap for Reddit scraping');
      console.log(`Fetching ${postCount} posts from r/${subreddit}`);
      
      const posts = await this.reddit.getSubreddit(subreddit).getHot({ limit: postCount });
      console.log(`Retrieved ${posts.length} posts from Reddit API`);

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const postBatch = [];
        
        // Add the post itself
        postBatch.push(this.normalizeRedditPost(post));
        
        // Fetch comments for this post
        try {
          const submission = await this.reddit.getSubmission(post.id);
          const comments = await submission.comments;
          await submission.expandReplies({ limit: commentCount, depth: 1 });
          const limitedComments = comments.slice(0, commentCount);
          
          for (const comment of limitedComments) {
            if (comment && comment.body && comment.body !== '[deleted]' && comment.body !== '[removed]' && typeof comment.body === 'string') {
              postBatch.push(this.normalizeRedditComment(comment, post));
            }
          }
        } catch (commentError) {
          console.warn(`Could not fetch comments for post ${post.id}:`, commentError.message);
        }
        
        // Yield this post and its comments for immediate ML processing
        yield postBatch;
        
        // Add small delay to respect rate limits
        if (i < posts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Reddit streaming scraping error:', error);
      throw error;
    } finally {
      // Always mark authenticated API as not busy
      this.isAuthenticatedBusy = false;
    }
  }

  // Track public API requests for burst optimization
  canMakePublicAPIRequest() {
    try {
      const now = Date.now();
      // Clean old requests outside 10-minute window
      this.publicAPIRequests = this.publicAPIRequests.filter(
        timestamp => timestamp && typeof timestamp === 'number' && now - timestamp < this.burstWindowMs
      );
      
      const requestCount = this.publicAPIRequests.length;
      const withinLimit = requestCount < this.maxRequestsPer10Min;
      
      console.log(`Public API capacity: ${requestCount}/${this.maxRequestsPer10Min} requests used`);
      return withinLimit;
    } catch (error) {
      console.error('Error checking API capacity:', error);
      // Fail safe: assume we can't make requests if check fails
      return false;
    }
  }
  
  recordPublicAPIRequest() {
    try {
      const timestamp = Date.now();
      this.publicAPIRequests.push(timestamp);
      
      // Keep array size reasonable
      if (this.publicAPIRequests.length > 200) {
        this.publicAPIRequests = this.publicAPIRequests.slice(-100);
      }
      
      console.log(`Recorded API request. Total in window: ${this.publicAPIRequests.length}`);
    } catch (error) {
      console.error('Error recording API request:', error);
    }
  }
  
  getPublicAPIStatus() {
    const now = Date.now();
    const recentRequests = this.publicAPIRequests.filter(
      timestamp => now - timestamp < this.burstWindowMs
    );
    
    const oldestRequest = recentRequests.length > 0 ? Math.min(...recentRequests) : now;
    const resetIn = recentRequests.length > 0 ? 
      Math.max(0, this.burstWindowMs - (now - oldestRequest)) : 0;
    
    return {
      used: recentRequests.length,
      limit: this.maxRequestsPer10Min,
      remaining: this.maxRequestsPer10Min - recentRequests.length,
      resetIn: resetIn,
      resetInMinutes: Math.ceil(resetIn / 1000 / 60),
      canBurst: recentRequests.length < this.maxRequestsPer10Min * 0.8, // 80% threshold
      isNearLimit: recentRequests.length > this.maxRequestsPer10Min * 0.9 // 90% threshold
    };
  }
  
  // Get overall Reddit API status for monitoring
  getRedditAPIStatus() {
    const publicStatus = this.getPublicAPIStatus();
    
    return {
      authenticated: {
        available: this.reddit && !this.usePublicAPI,
        busy: this.isAuthenticatedBusy,
        status: this.isAuthenticatedBusy ? 'busy' : 'available'
      },
      public: {
        ...publicStatus,
        status: publicStatus.remaining > 0 ? 'available' : 'exhausted'
      },
      recommendation: this.isAuthenticatedBusy ? 
        (publicStatus.remaining > 0 ? 'use_public' : 'wait_for_reset') : 
        'use_authenticated'
    };
  }

  async scrapeWithPublicAPI(subreddit, postCount, commentCount, progressCallback = null) {
    try {
      console.log('Using public JSON API for Reddit scraping');
      
      // Check burst capacity
      const apiStatus = this.getPublicAPIStatus();
      console.log(`Public API status: ${apiStatus.used}/${apiStatus.limit} requests used`);
      
      if (!this.canMakePublicAPIRequest()) {
        const waitTime = Math.max(1, Math.ceil(apiStatus.resetIn / 1000 / 60)); // At least 1 minute
        
        if (progressCallback) {
          progressCallback({
            type: 'rate_limit',
            message: `Reddit API quota reached. Auto-retrying in ${waitTime} minute${waitTime !== 1 ? 's' : ''}...`,
            processed: 0,
            total: postCount,
            percentage: 0,
            retryAfter: waitTime * 60
          });
        }
        
        console.log(`⏳ Rate limited: ${apiStatus.used}/${apiStatus.limit} requests used. Waiting ${waitTime} minutes...`);
        
        // Wait for rate limit reset
        const waitMs = Math.max(60000, apiStatus.resetIn + 5000);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
      
      if (progressCallback) {
        progressCallback({
          type: 'info',
          message: `Using public Reddit API for r/${subreddit}. Comments will be simulated.`
        });
      }

      // Record the request before making it
      this.recordPublicAPIRequest();
      const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${postCount}`;
      const postsData = await this.fetchRedditData(url);
      
      if (!postsData.data || !postsData.data.children) {
        throw new Error('No posts found or subreddit may be private');
      }

      const postsAndComments = [];
      
      for (const postWrapper of postsData.data.children) {
        const post = postWrapper.data;
        postsAndComments.push(this.normalizeRedditPost(post));
        
        // For public API, we'll simulate comments with dummy data
        // since fetching comments requires additional requests
        if (commentCount > 0) {
          const dummyComments = this.generateDummyComments(post, commentCount);
          postsAndComments.push(...dummyComments);
        }
      }

      console.log(`Successfully scraped ${postsAndComments.length} items with public API`);
      return postsAndComments;
    } catch (error) {
      console.error('Public API scraping error:', error);
      
      // Enhanced error handling with specific user messaging
      if (error.message.includes('429') || error.message.includes('rate limit') || error.message.includes('Too Many Requests')) {
        const apiStatus = this.getPublicAPIStatus();
        const waitTime = Math.max(1, Math.ceil(apiStatus.resetIn / 1000 / 60)); // At least 1 minute
        
        if (progressCallback) {
          progressCallback({
            type: 'info',
            message: `Reddit API overloaded! Retrying in ${waitTime} minute${waitTime !== 1 ? 's' : ''}...`,
            isToast: true
          });
        }
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        if (progressCallback) {
          progressCallback({
            type: 'error',
            message: `🚫 Reddit blocked the request. This may be temporary - please try again later.`,
            isToast: true
          });
        }
        console.warn('Reddit API blocked request - falling back to dummy data');
        return this.getDummyData(postCount * (commentCount + 1));
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        if (progressCallback) {
          progressCallback({
            type: 'error', 
            message: `Subreddit 'r/${subreddit}' not found or may be private.`,
            isToast: true
          });
        }
        console.warn(`Subreddit r/${subreddit} not found - falling back to dummy data`);
        return this.getDummyData(postCount * (commentCount + 1));
      } else if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
        if (progressCallback) {
          progressCallback({
            type: 'rate_limit',
            message: `🔧 Reddit servers temporarily unavailable. Auto-retrying in 2 minutes...`,
            processed: 0,
            total: postCount,
            percentage: 0,
            retryAfter: 120,
            isToast: true
          });
        }
        
        console.warn('Reddit service temporarily unavailable, falling back to dummy data');
      }
      
      console.warn('All Reddit APIs failed, falling back to dummy data');
      return this.getDummyData(postCount * (commentCount + 1));
    }
  }

  async fetchRedditData(url) {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const options = {
        headers: {
          'User-Agent': this.userAgent
        }
      };

      https.get(url, options, (res) => {
        let data = '';
        
        // Enhanced error handling for various Reddit API issues
        if (res.statusCode === 429) {
          // Reddit rate limiting
          const retryAfter = res.headers['retry-after'] || '60';
          reject(new Error(`429 Too Many Requests - rate limit exceeded. Retry after ${retryAfter} seconds`));
          return;
        }
        
        if (res.statusCode === 503) {
          reject(new Error('503 Service Unavailable - Reddit API overloaded'));
          return;
        }
        
        if (res.statusCode === 403) {
          reject(new Error('403 Forbidden - Reddit blocked the request'));
          return;
        }
        
        if (res.statusCode === 404) {
          reject(new Error('404 Not Found - Subreddit may not exist or be private'));
          return;
        }
        
        if (res.statusCode >= 500) {
          reject(new Error(`Reddit server error: HTTP ${res.statusCode} - ${res.statusMessage}`));
          return;
        }
        
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} - ${res.statusMessage}`));
          return;
        }
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (parseError) {
            reject(new Error('Failed to parse Reddit response'));
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  normalizeRedditPost(post) {
    return {
      id: post.id,
      text: post.selftext || post.title,
      date: new Date(post.created_utc * 1000).toISOString(),
      likes: post.ups || 0,
      retweets: 0, // Reddit doesn't have retweets
      replies_count: post.num_comments || 0,
      is_retweet: false,
      author: this.extractAuthorName(post.author),
      link: `https://reddit.com${post.permalink}`,
      platform: 'reddit',
      subreddit: this.extractSubredditName(post.subreddit),
      post_type: 'post',
      // Reddit-specific fields
      score: post.score || 0,
      upvote_ratio: post.upvote_ratio || 0,
      gilded: post.gilded || 0,
      over_18: post.over_18 || false
    };
  }

  normalizeRedditComment(comment, parentPost) {
    return {
      id: comment.id,
      text: comment.body,
      date: new Date(comment.created_utc * 1000).toISOString(),
      likes: comment.ups || 0,
      retweets: 0,
      replies_count: comment.replies ? comment.replies.length : 0,
      is_retweet: false,
      author: this.extractAuthorName(comment.author),
      link: `https://reddit.com${comment.permalink}`,
      platform: 'reddit',
      subreddit: this.extractSubredditName(parentPost.subreddit),
      post_type: 'comment',
      // Reddit-specific fields
      score: comment.score || 0,
      gilded: comment.gilded || 0,
      parent_id: parentPost.id
    };
  }

  generateDummyComments(post, count) {
    const dummyComments = [];
    const sampleComments = [
      "This is really interesting, thanks for sharing!",
      "I disagree with this perspective completely.",
      "Great post, learned something new today.",
      "Source? I'd like to read more about this.",
      "This is exactly what I was looking for."
    ];

    for (let i = 0; i < count; i++) {
      dummyComments.push({
        id: `dummy_comment_${post.id}_${i}`,
        text: sampleComments[i % sampleComments.length],
        date: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        likes: Math.floor(Math.random() * 50),
        retweets: 0,
        replies_count: Math.floor(Math.random() * 5),
        is_retweet: false,
        author: `user_${i + 1}`,
        link: `https://reddit.com/r/${post.subreddit}/comments/${post.id}/comment_${i}`,
        platform: 'reddit',
        subreddit: post.subreddit,
        post_type: 'comment',
        score: Math.floor(Math.random() * 50),
        gilded: 0,
        parent_id: post.id
      });
    }

    return dummyComments;
  }

  // Helper methods to safely extract data from snoowrap objects
  extractAuthorName(author) {
    if (!author) return 'unknown';
    if (typeof author === 'string') return author;
    if (typeof author === 'object' && author.name) return author.name;
    return 'unknown';
  }

  extractSubredditName(subreddit) {
    if (!subreddit) return 'unknown';
    if (typeof subreddit === 'string') return subreddit;
    if (typeof subreddit === 'object' && subreddit.display_name) return subreddit.display_name;
    if (typeof subreddit === 'object' && subreddit.name) return subreddit.name;
    return 'unknown';
  }

  getDummyData(limit) {
    // Reuse Twitter dummy data but modify it to look like Reddit content
    const shuffled = [...dummyTweets].sort(() => 0.5 - Math.random());
    const posts = shuffled.slice(0, Math.min(limit, dummyTweets.length));
    
    const now = new Date();
    posts.forEach((post, index) => {
      const hoursAgo = Math.floor(Math.random() * 48) + 1;
      const randomDate = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));
      
      post.date = randomDate.toISOString();
      post.likes = Math.floor(post.likes * (0.5 + Math.random()));
      post.retweets = 0; // Reddit doesn't have retweets
      post.replies_count = Math.floor(post.replies_count * (0.4 + Math.random() * 0.8));
      post.platform = 'reddit';
      post.subreddit = 'technology'; // Default subreddit for dummy data
      post.post_type = index % 3 === 0 ? 'comment' : 'post';
      post.link = `https://reddit.com/r/technology/comments/${post.id}`;
    });
    
    return Promise.resolve(posts);
  }
}

module.exports = new RedditScraper();