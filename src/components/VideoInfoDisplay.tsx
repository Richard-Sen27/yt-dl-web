'use client';

import { useState } from 'react';
import { VideoInfo, DownloadOptions } from '@/types/youtube';
import Image from 'next/image';

interface VideoInfoDisplayProps {
  videoInfo: VideoInfo;
  onDownload: (options: DownloadOptions) => void;
  downloading: boolean;
}

export default function VideoInfoDisplay({ videoInfo, onDownload, downloading }: VideoInfoDisplayProps) {
  const [selectedFormat, setSelectedFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [selectedQuality, setSelectedQuality] = useState<string>('');

  // Filter formats based on selected format
  const availableFormats = videoInfo.formats.filter(format => {
    if (selectedFormat === 'mp3') {
      return format.hasAudio && !format.hasVideo;
    } else {
      return format.hasVideo && format.hasAudio;
    }
  });

  // Get unique quality options
  const qualityOptions = Array.from(
    new Set(
      availableFormats
        .map(format => selectedFormat === 'mp3' 
          ? `${format.audioBitrate || 128}kbps` 
          : format.qualityLabel || format.quality)
        .filter(Boolean)
    )
  ).sort((a, b) => {
    if (selectedFormat === 'mp3') {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      return bNum - aNum; // Descending order for audio bitrate
    } else {
      // Video quality sorting (720p, 1080p, etc.)
      const getResolution = (quality: string) => {
        const match = quality.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      return getResolution(b) - getResolution(a);
    }
  });

  // Set default quality when format changes
  if ((!selectedQuality || !qualityOptions.includes(selectedQuality)) && qualityOptions.length > 0) {
    setSelectedQuality(qualityOptions[0]);
  }

  const handleDownload = () => {
    if (!selectedQuality) return;

    // Find the specific format
    const selectedItag = availableFormats.find(format => {
      if (selectedFormat === 'mp3') {
        return `${format.audioBitrate || 128}kbps` === selectedQuality;
      } else {
        return (format.qualityLabel || format.quality) === selectedQuality;
      }
    })?.itag;

    onDownload({
      format: selectedFormat,
      quality: selectedQuality,
      itag: selectedItag,
    });
  };

  const formatDuration = (duration: string) => {
    const seconds = parseInt(duration);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (viewCount: string) => {
    const count = parseInt(viewCount);
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Video Information */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-shrink-0">
          <Image
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            width={320}
            height={180}
            className="rounded-lg shadow-md"
          />
        </div>
        
        <div className="flex-1 space-y-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {videoInfo.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            By {videoInfo.author}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{formatViewCount(videoInfo.viewCount)}</span>
            <span>Duration: {formatDuration(videoInfo.duration)}</span>
          </div>
        </div>
      </div>

      {/* Download Options */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
          Download Options
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => {
                setSelectedFormat(e.target.value as 'mp3' | 'mp4');
                setSelectedQuality(''); // Reset quality when format changes
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                       dark:bg-gray-700 dark:text-white"
            >
              <option value="mp4">Video (MP4)</option>
              <option value="mp3">Audio (MP3)</option>
            </select>
          </div>

          {/* Quality Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quality
            </label>
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                       dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select quality</option>
              {qualityOptions.map((quality) => (
                <option key={quality} value={quality}>
                  {quality}
                </option>
              ))}
            </select>
          </div>

          {/* Download Button */}
          <div className="flex items-end">
            <button
              onClick={handleDownload}
              disabled={!selectedQuality || downloading}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 
                       text-white rounded-md transition-colors duration-200
                       disabled:cursor-not-allowed"
            >
              {downloading ? 'Downloading...' : `Download ${selectedFormat.toUpperCase()}`}
            </button>
          </div>
        </div>

        {/* Available Formats Info */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>
            {selectedFormat === 'mp4' ? 'Video formats' : 'Audio formats'}: {availableFormats.length} available
          </p>
        </div>
      </div>
    </div>
  );
}
