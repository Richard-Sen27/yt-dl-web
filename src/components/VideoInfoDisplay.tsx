'use client';

import { useState } from 'react';
import { VideoInfo, DownloadOptions } from '@/types/youtube';
import Image from 'next/image';

interface VideoInfoDisplayProps {
  videoInfo: VideoInfo;
  onDownload: (options: DownloadOptions) => void;
  downloading: boolean;
  cookies?: string;
}

export default function VideoInfoDisplay({ videoInfo, onDownload, downloading, cookies }: VideoInfoDisplayProps) {
  const [selectedFormat, setSelectedFormat] = useState<'mp3' | 'mp4' | 'video-only'>('mp4');
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [combineStreams, setCombineStreams] = useState<boolean>(true);

  // Filter formats based on selected format
  const availableFormats = videoInfo.formats.filter(format => {
    if (selectedFormat === 'mp3') {
      // For MP3, include any format with audio
      return format.hasAudio;
    } else if (selectedFormat === 'video-only') {
      return format.hasVideo && !format.hasAudio;
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
    } else if (selectedFormat === 'video-only') {
      // Sort video-only by quality
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
        .filter(format => format.qualityLabel || format.audioBitrate)
        .map(format => {
          if (selectedFormat === 'mp3') {
            // For MP3, show audio bitrate info
            const audioBitrate = format.audioBitrate ? `${format.audioBitrate}kbps` : 'Unknown bitrate';
            const sourceInfo = format.hasVideo ? ' (from video)' : ' (audio only)';
            return `${audioBitrate}${sourceInfo}`;
          } else if (selectedFormat === 'video-only') {
            // For video-only, just show quality
            return format.qualityLabel || 'Unknown quality';
          } else {
            // For MP4, show different info based on combine mode
            if (combineStreams) {
              // In HD mode, all formats will be combined with best audio
              const qualityLabel = format.qualityLabel || 'Unknown';
              return `${qualityLabel} (HD: Video + Best Audio)`;
            } else {
              // In fast mode, show what the format actually contains
              const hasAudioInfo = format.hasAudio ? '(Audio + Video)' : '(Video Only)';
              return `${format.qualityLabel} ${hasAudioInfo}`;
            }
          }
        })
    )
  );

  const handleDownload = () => {
    if (!selectedQuality) {
      alert('Please select a quality');
      return;
    }

    // Find the format that matches the selected quality
    let selectedFormatObj;
    
    if (selectedFormat === 'mp3') {
      // For MP3, find by audio bitrate
      const bitrateMatch = selectedQuality.match(/(\d+)kbps/);
      if (bitrateMatch) {
        const bitrate = parseInt(bitrateMatch[1]);
        selectedFormatObj = sortedFormats.find(f => f.audioBitrate === bitrate);
      }
      if (!selectedFormatObj) {
        selectedFormatObj = sortedFormats[0];
      }
    } else {
      // For MP4 and video-only, find by quality label
      let qualityLabel = selectedQuality;
      
      // Extract quality label from different formats
      if (selectedFormat === 'mp4' && combineStreams) {
        // Format: "1080p (HD: Video + Best Audio)"
        qualityLabel = selectedQuality.split(' ')[0];
      } else if (selectedFormat === 'mp4') {
        // Format: "1080p (Audio + Video)" or "1080p (Video Only)"
        qualityLabel = selectedQuality.split(' ')[0];
      }
      // For video-only, it's just the quality label
      
      selectedFormatObj = sortedFormats.find(f => f.qualityLabel === qualityLabel);
    }

    if (!selectedFormatObj) {
      alert('Selected quality not found');
      return;
    }

    onDownload({
      format: selectedFormat,
      quality: selectedQuality,
      itag: selectedFormatObj.itag,
      combineStreams: selectedFormat === 'mp4' ? combineStreams : false,
      cookies: cookies || undefined,
    });
  };

  const formatDuration = (seconds: string) => {
    const num = parseInt(seconds);
    const hours = Math.floor(num / 3600);
    const minutes = Math.floor((num % 3600) / 60);
    const remainingSeconds = num % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: string) => {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M views`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K views`;
    }
    return `${num} views`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Video Info */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex-shrink-0">
          <Image
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            width={320}
            height={180}
            className="rounded-lg object-cover"
          />
        </div>
        
        <div className="flex-grow">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2">
            {videoInfo.title}
          </h2>
          
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <p className="font-medium">{videoInfo.author}</p>
            <p className="flex gap-4">
              <span>{formatViewCount(videoInfo.viewCount)}</span>
              <span>Duration: {formatDuration(videoInfo.duration)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Download Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Download Options</h3>
        
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Format
          </label>
          <select
            value={selectedFormat}
            onChange={(e) => {
              setSelectedFormat(e.target.value as 'mp3' | 'mp4' | 'video-only');
              setSelectedQuality(''); // Reset quality when format changes
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
              focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="mp4">MP4 (Video)</option>
            <option value="video-only">Video Only (No Audio)</option>
            <option value="mp3">MP3 (Audio Only)</option>
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
              focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            disabled={qualityOptions.length === 0}
          >
            <option value="">Select quality...</option>
            {qualityOptions.map((quality, index) => (
              <option key={index} value={quality}>
                {quality}
              </option>
            ))}
          </select>
        </div>

        {/* HD Mode Toggle for MP4 */}
        {selectedFormat === 'mp4' && (
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-200">HD Mode</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {combineStreams
                  ? 'Combine separate video and audio streams for higher quality (slower)'
                  : 'Use pre-combined streams for faster downloads (limited quality)'}
              </p>
            </div>
            <button
              onClick={() => {
                setCombineStreams(!combineStreams);
                setSelectedQuality(''); // Reset quality when mode changes
              }}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${combineStreams ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${combineStreams ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        )}

        {/* Available Formats Info */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {selectedFormat === 'mp4' && combineStreams && (
            <p className="text-blue-600 dark:text-blue-400">
              🔗 HD Mode will combine the best video and audio streams using FFmpeg
            </p>
          )}
          {selectedFormat === 'video-only' && (
            <p className="text-orange-600 dark:text-orange-400">
              🎥 Video-only downloads contain no audio
            </p>
          )}
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={downloading || !selectedQuality}
          className={`
            w-full py-3 px-4 rounded-md font-medium transition-colors
            ${downloading || !selectedQuality
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }
          `}
        >
          {downloading ? 'Downloading...' : `Download ${selectedFormat.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}
