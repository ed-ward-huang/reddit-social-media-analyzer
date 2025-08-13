const dummyTweets = require('../dummy_data/tweets.json');

class TwitterScraper {
  async scrapeTweets(handle, query, limit = 100) {
    console.log(`Twitter scraper now returns dummy data only. Requested: ${handle ? `@${handle}` : query} with limit ${limit}`);
    return this.getDummyData(limit);
  }

  getDummyData(limit) {
    // Shuffle and take requested amount, with some randomization
    const shuffled = [...dummyTweets].sort(() => 0.5 - Math.random());
    const tweets = shuffled.slice(0, Math.min(limit, dummyTweets.length));
    
    // Add some time variation to make it look more realistic
    const now = new Date();
    tweets.forEach((tweet) => {
      const hoursAgo = Math.floor(Math.random() * 48) + 1; // 1-48 hours ago
      const randomDate = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));
      tweet.date = randomDate.toISOString();
      
      // Add some randomness to engagement numbers
      tweet.likes = Math.floor(tweet.likes * (0.5 + Math.random()));
      tweet.retweets = Math.floor(tweet.retweets * (0.3 + Math.random() * 0.7));
      tweet.replies_count = Math.floor(tweet.replies_count * (0.4 + Math.random() * 0.8));
      
      // Ensure platform is set for Twitter dummy data
      tweet.platform = 'twitter';
      tweet.post_type = 'post';
    });
    
    return Promise.resolve(tweets);
  }
}

module.exports = new TwitterScraper();