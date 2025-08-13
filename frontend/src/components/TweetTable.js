import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Repeat2, RefreshCw } from 'lucide-react';

const TweetTable = ({ tweets, isLoading, progress }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const tweetsPerPage = 5;
  const safeTweets = tweets || [];
  const totalPages = Math.ceil(safeTweets.length / tweetsPerPage);
  
  const startIndex = (currentPage - 1) * tweetsPerPage;
  const currentTweets = safeTweets.slice(startIndex, startIndex + tweetsPerPage);

  const getSentimentColor = (sentiment) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHateLabel = (hate) => {
    if (hate === 'None') return 'text-green-600 bg-green-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Analyzed Content</h3>
          {isLoading && (
            <div className="flex items-center space-x-2 text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                Processing content... ({progress?.processed || 0}/{progress?.total || 0})
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sentiment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hate Speech
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Engagement
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentTweets.length > 0 ? (
              currentTweets.map((tweet) => (
                <tr key={tweet.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-900 line-clamp-2">{tweet.text}</p>
                      {tweet.author && (
                        <p className="text-xs text-gray-500 mt-1">@{tweet.author}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSentimentColor(tweet.sentiment)}`}>
                      {tweet.sentiment}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHateLabel(tweet.hate)}`}>
                      {tweet.hate}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{tweet.likes || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Repeat2 className="w-4 h-4" />
                        <span>{tweet.retweets || 0}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : isLoading ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                    <p className="text-gray-500">Loading content for analysis...</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {progress?.message || 'Preparing data...'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No content to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {startIndex + 1} to {Math.min(startIndex + tweetsPerPage, safeTweets.length)} of {safeTweets.length} results
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TweetTable;