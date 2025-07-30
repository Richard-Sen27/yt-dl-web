'use client';

import { useState } from 'react';

interface URLInputProps {
  onSubmit: (url: string) => void;
  disabled: boolean;
}

export default function URLInput({ onSubmit, disabled }: URLInputProps) {
  const [url, setUrl] = useState('');

  const isValidYouTubeURL = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      return;
    }

    if (!isValidYouTubeURL(url)) {
      alert('Please enter a valid YouTube URL');
      return;
    }

    onSubmit(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label 
          htmlFor="youtube-url" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          YouTube URL
        </label>
        <div className="flex space-x-2">
          <input
            id="youtube-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={disabled}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                     dark:bg-gray-700 dark:text-white
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={disabled || !url.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                     text-white rounded-md transition-colors duration-200
                     disabled:cursor-not-allowed"
          >
            {disabled ? 'Loading...' : 'Get Info'}
          </button>
        </div>
      </div>
      
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Paste a YouTube video URL to get started. Supports youtube.com and youtu.be links.
      </p>
    </form>
  );
}
