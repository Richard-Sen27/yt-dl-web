import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export async function POST(request: NextRequest) {
  try {
    const { videoId, format, itag } = await request.json();

    if (!videoId || !format) {
      return NextResponse.json(
        { error: 'Video ID and format are required' },
        { status: 400 }
      );
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;

    // Validate URL
    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: 'Invalid video ID' },
        { status: 400 }
      );
    }

    // Get video info for filename
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
    
    if (format === 'mp4') {
      // For MP4, find the best format with both video and audio
      let selectedFormat;
      if (itag) {
        selectedFormat = info.formats.find(f => f.itag === itag);
      } else {
        // Fallback to highest quality with video and audio
        selectedFormat = info.formats
          .filter(f => f.hasVideo && f.hasAudio)
          .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
      }

      if (!selectedFormat) {
        return NextResponse.json(
          { error: 'No suitable video format found' },
          { status: 404 }
        );
      }

      // Stream the video
      const videoStream = ytdl(url, { format: selectedFormat });
      
      const headers = new Headers({
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${videoTitle}.mp4"`,
      });

      // Convert Node.js stream to web stream
      const readableStream = new ReadableStream({
        start(controller) {
          videoStream.on('data', (chunk) => {
            controller.enqueue(chunk);
          });
          
          videoStream.on('end', () => {
            controller.close();
          });
          
          videoStream.on('error', (err) => {
            controller.error(err);
          });
        }
      });

      return new NextResponse(readableStream, { headers });

    } else if (format === 'mp3') {
      // For MP3, find best audio format and stream directly
      // Note: For production, you might want to use FFmpeg for conversion
      let audioFormat;
      if (itag) {
        audioFormat = info.formats.find(f => f.itag === itag);
      } else {
        // Find best audio-only format
        audioFormat = info.formats
          .filter(f => f.hasAudio && !f.hasVideo)
          .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
      }

      if (!audioFormat) {
        // Fallback to any format with audio
        audioFormat = info.formats
          .filter(f => f.hasAudio)
          .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
      }

      if (!audioFormat) {
        return NextResponse.json(
          { error: 'No suitable audio format found' },
          { status: 404 }
        );
      }

      // Stream the audio (note: this will be in the original format, not MP3)
      // For true MP3 conversion, you'd need FFmpeg processing
      const audioStream = ytdl(url, { format: audioFormat });
      
      const headers = new Headers({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${videoTitle}.mp3"`,
      });

      // Convert Node.js stream to web stream
      const readableStream = new ReadableStream({
        start(controller) {
          audioStream.on('data', (chunk) => {
            controller.enqueue(chunk);
          });
          
          audioStream.on('end', () => {
            controller.close();
          });
          
          audioStream.on('error', (err) => {
            controller.error(err);
          });
        }
      });

      return new NextResponse(readableStream, { headers });
    }

    return NextResponse.json(
      { error: 'Unsupported format' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Download error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Video unavailable')) {
        return NextResponse.json(
          { error: 'Video is unavailable or private' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}
