import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';
import { VideoInfo, VideoFormat } from '@/types/youtube';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    // Process formats
    const formats: VideoFormat[] = info.formats
      .filter(format => format.hasVideo || format.hasAudio)
      .map(format => ({
        itag: format.itag,
        quality: String(format.quality || 'unknown'),
        container: String(format.container || 'unknown'),
        hasVideo: format.hasVideo,
        hasAudio: format.hasAudio,
        qualityLabel: format.qualityLabel || null,
        audioBitrate: format.audioBitrate || null,
        contentLength: format.contentLength || null,
      }));

    const videoInfo: VideoInfo = {
      title: videoDetails.title,
      thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url || '',
      duration: videoDetails.lengthSeconds,
      viewCount: videoDetails.viewCount,
      author: videoDetails.author.name,
      videoId: videoDetails.videoId,
      formats,
    };

    return NextResponse.json(videoInfo);
  } catch (error) {
    console.error('Error fetching video info:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Video unavailable')) {
        return NextResponse.json(
          { error: 'Video is unavailable or private' },
          { status: 404 }
        );
      }
      if (error.message.includes('Age restricted')) {
        return NextResponse.json(
          { error: 'Age restricted video cannot be downloaded' },
          { status: 403 }
        );
      }
      if (error.message.includes('Private video')) {
        return NextResponse.json(
          { error: 'Private video cannot be accessed' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch video information' },
      { status: 500 }
    );
  }
}
