import React from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivateAccountError = ({ handle, onRetry, onGoHome }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Private Account</h2>
        <p className="text-gray-600 mb-6">
          The account <span className="font-medium text-gray-900">@{handle}</span> is private and cannot be analyzed. 
          Please try a different public account.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onGoHome || (() => navigate('/'))}
            className="flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Try Another Account</span>
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retry Analysis
            </button>
          )}
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivateAccountError;