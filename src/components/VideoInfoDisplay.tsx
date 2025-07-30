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
  const [combineStreams, setCombineStreams] = useState<boolean>(true);

  // Filter formats based on selected format
  const availableFormats = videoInfo.formats.filter(format => {
    if (selectedFormat === 'mp3') {
      return format.hasAudio && !format.hasVideo;
    } else {
      // For MP4, include all video formats
      // If combineStreams is enabled, include video-only formats too
      if (combineStreams) {
        return format.hasVideo;
      } else {
        // Only show formats with both video and audio
        return format.hasVideo && format.hasAudio;
      }
    }
  });

  // Sort formats to prioritize those with both video and audio
  const sortedFormats = availableFormats.sort((a, b) => {
    if (selectedFormat === 'mp4') {
      // Prioritize formats with audio
      if (a.hasAudio && !b.hasAudio) return -1;
      if (!a.hasAudio && b.hasAudio) return 1;
      
      // Then sort by quality
      const aHeight = parseInt(a.qualityLabel?.replace('p', '') || '0');
      const bHeight = parseInt(b.qualityLabel?.replace('p', '') || '0');
      return bHeight - aHeight;
    }
    return 0;
  });

  // Get unique quality options with additional info
  const qualityOptions = Array.from(
    new Set(
      sortedFormats
        .map(format => {
          if (selectedFormat === 'mp3') {
            return `${format.audioBitrate || 128}kbps`;
          } else {
            const quality = format.qualityLabel || format.quality;
            if (combineStreams && !format.hasAudio) {
              return `${quality} (will combine with audio)`;
            } else if (!format.hasAudio) {
              return `${quality} (no audio)`;
            } else {
              return quality;
            }
          }
        })
        .filter(Boolean)
    )
  );

  // Set default quality when format changes
  if ((!selectedQuality || !qualityOptions.includes(selectedQuality)) && qualityOptions.length > 0) {
    setSelectedQuality(qualityOptions[0]);
  }

  const handleDownload = () => {
    if (!selectedQuality) return;

    // Find the specific format - remove suffixes for comparison
    const cleanQuality = selectedQuality
      .replace(' (will combine with audio)', '')
      .replace(' (no audio)', '');
    
    const selectedItag = sortedFormats.find(format => {
      if (selectedFormat === 'mp3') {
        return `${format.audioBitrate || 128}kbps` === selectedQuality;
      } else {
        return (format.qualityLabel || format.quality) === cleanQuality;
      }
    })?.itag;

    onDownload({
      format: selectedFormat,
      quality: selectedQuality,
      itag: selectedItag,
      combineStreams: selectedFormat === 'mp4' ? combineStreams : undefined,
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* Combine Streams Option (only for MP4) */}
          {selectedFormat === 'mp4' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Audio Handling
              </label>
              <select
                value={combineStreams ? 'combine' : 'existing'}
                onChange={(e) => {
                  setCombineStreams(e.target.value === 'combine');
                  setSelectedQuality(''); // Reset quality when option changes
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         dark:bg-gray-700 dark:text-white"
              >
                <option value="combine">Combine with audio (HD)</option>
                <option value="existing">Use existing audio only</option>
              </select>
            </div>
          )}

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
          <div className={`flex items-end ${selectedFormat === 'mp4' ? 'md:col-span-1' : 'md:col-span-2'}`}>
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
          {selectedFormat === 'mp4' && combineStreams && (
            <p className="mt-1">
              ✨ <strong>HD Mode:</strong> High-quality video will be combined with the best available audio using FFmpeg. 
              This may take longer but provides the best quality.
            </p>
          )}
          {selectedFormat === 'mp4' && !combineStreams && (
            <p className="mt-1">
              ⚡ <strong>Fast Mode:</strong> Only formats with pre-combined video and audio. 
              Quality may be limited but downloads are faster.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
