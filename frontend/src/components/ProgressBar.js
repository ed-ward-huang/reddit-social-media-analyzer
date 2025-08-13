import React from 'react';
import { RefreshCw, AlertCircle, Clock } from 'lucide-react';

const ProgressBar = ({ progress, onRetry }) => {
  const progressPercentage = progress?.total > 0 
    ? Math.round((progress.processed / progress.total) * 100)
    : 0;
  
  const currentMessage = progress?.message || 'Starting analysis...';
  const isRateLimit = progress?.isRateLimit;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Progress</h3>
      <div className="space-y-4">
        {isRateLimit ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <div className="text-sm font-medium text-amber-800">Reddit API Overloaded</div>
                <div className="text-sm text-amber-700">{currentMessage}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{currentMessage}</span>
            <span className="text-sm font-medium text-gray-900">{progressPercentage}%</span>
          </div>
        )}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        {progress?.processed > 0 && (
          <div className="text-sm text-gray-600">
            Processed {progress.processed} of {progress.total} items
          </div>
        )}
        
        {progress?.sentiment_counts && (
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="bg-green-50 p-2 rounded border">
              <div className="font-medium text-green-800">Positive</div>
              <div className="text-green-600">{progress.sentiment_counts.positive || 0}</div>
            </div>
            <div className="bg-yellow-50 p-2 rounded border">
              <div className="font-medium text-yellow-800">Neutral</div>
              <div className="text-yellow-600">{progress.sentiment_counts.neutral || 0}</div>
            </div>
            <div className="bg-red-50 p-2 rounded border">
              <div className="font-medium text-red-800">Negative</div>
              <div className="text-red-600">{progress.sentiment_counts.negative || 0}</div>
            </div>
          </div>
        )}
        
        {progress?.category_counts && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Hate Speech Detection</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded border">
                <div className="font-medium">Safe: {progress.category_counts.none || 0}</div>
              </div>
              <div className="bg-red-50 p-2 rounded border">
                <div className="font-medium text-red-700">
                  Issues: {(progress.category_counts.racism || 0) + 
                          (progress.category_counts.sexism || 0) + 
                          (progress.category_counts.homophobia || 0) + 
                          (progress.category_counts.other || 0)}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {progressPercentage < 100 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Please wait while we analyze the content...
            </p>
            <button
              onClick={onRetry}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              disabled={progressPercentage > 10}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-green-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Analysis complete!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;