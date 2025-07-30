'use client';

import { useState } from 'react';
import { VideoInfo, DownloadOptions } from '@/types/youtube';
import URLInput from './URLInput';
import VideoInfoDisplay from './VideoInfoDisplay';
import LoadingSpinner from './LoadingSpinner';

export default function YouTubeDownloader() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleURLSubmit = async (url: string) => {
    setLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      const response = await fetch('/api/video-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch video information');
      }

      const data = await response.json();
      setVideoInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (options: DownloadOptions) => {
    if (!videoInfo) return;

    setDownloading(true);
    setError(null);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: videoInfo.videoId,
          ...options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download video');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 
                      `video.${options.format}`;

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during download');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <URLInput onSubmit={handleURLSubmit} disabled={loading || downloading} />
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      
      {loading && (
        <div className="mt-6 flex justify-center">
          <LoadingSpinner text="Fetching video information..." />
        </div>
      )}
      
      {videoInfo && !loading && (
        <VideoInfoDisplay 
          videoInfo={videoInfo} 
          onDownload={handleDownload}
          downloading={downloading}
        />
      )}
    </div>
  );
}
