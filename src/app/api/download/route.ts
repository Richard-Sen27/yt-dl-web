import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs'; // Ensure Node.js runtime in Next.js

export async function POST(request: NextRequest) {
  try {
    const { videoId, format, itag, combineStreams, cookies } = await request.json();

    if (!videoId || !format) {
      return NextResponse.json({ error: 'Video ID and format are required' }, { status: 400 });
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    if (!ytdl.validateURL(url)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    // Prepare ytdl options with cookies if provided
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    const ytdlOptions: any = {};
    if (cookies) {
      ytdlOptions.requestOptions = {
        headers: {
          'Cookie': cookies
        }
      };
    }

    const info = await ytdl.getInfo(url, ytdlOptions);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');

    /** ===================== MP4 Download ===================== **/
    if (format === 'mp4') {
      let selectedFormat;

      if (itag) {
        selectedFormat = info.formats.find(f => f.itag === itag);
      } else {
        if (combineStreams) {
          // For HD mode, prioritize video-only formats for better quality
          selectedFormat = info.formats
            .filter(f => f.hasVideo && !f.hasAudio) // Prefer video-only
            .sort((a, b) => parseInt(b.qualityLabel || '0') - parseInt(a.qualityLabel || '0'))[0];
          
          // If no video-only format found, use best video format
          if (!selectedFormat) {
            selectedFormat = info.formats
              .filter(f => f.hasVideo)
              .sort((a, b) => parseInt(b.qualityLabel || '0') - parseInt(a.qualityLabel || '0'))[0];
          }
        } else {
          // Best video+audio for fast mode
          selectedFormat = info.formats
            .filter(f => f.hasVideo && f.hasAudio)
            .sort((a, b) => parseInt(b.qualityLabel || '0') - parseInt(a.qualityLabel || '0'))[0];
        }
      }

      if (!selectedFormat) {
        return NextResponse.json({ error: 'No suitable video format found' }, { status: 404 });
      }

      // Force combining when combineStreams is true (HD mode)
      const needsCombining = combineStreams;

      /** ====== Case 1: Combine separate audio + video ====== **/
      if (needsCombining) {
        // Pick best audio-only format for combining
        let audioFormat = info.formats
          .filter(f => f.hasAudio && !f.hasVideo)
          .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];

        // If no audio-only format found, use any audio format
        if (!audioFormat) {
          audioFormat = info.formats
            .filter(f => f.hasAudio)
            .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
        }

        if (!audioFormat) {
          return NextResponse.json({ error: 'No suitable audio format found' }, { status: 404 });
        }

        // Temp file paths
        const tmpVideoPath = path.join(os.tmpdir(), `${videoId}-video.webm`);
        const tmpAudioPath = path.join(os.tmpdir(), `${videoId}-audio.webm`);

        // Download video-only
        await new Promise<void>((resolve, reject) => {
            const vs = ytdl(url, { format: selectedFormat, ...ytdlOptions }).pipe(fs.createWriteStream(tmpVideoPath));
            vs.on('finish', () => resolve());
            vs.on('error', (err) => reject(err));
        });

        // Download audio-only
        await new Promise<void>((resolve, reject) => {
            const as = ytdl(url, { format: audioFormat, ...ytdlOptions }).pipe(fs.createWriteStream(tmpAudioPath));
            as.on('finish', () => resolve());
            as.on('error', (err) => reject(err));
        });

        // Merge using ffmpeg into a temp file
        const tmpOutputPath = path.join(os.tmpdir(), `${videoId}-merged.mp4`);

        await new Promise<void>((resolve, reject) => {
        ffmpeg()
            .input(tmpVideoPath)
            .input(tmpAudioPath)
            .videoCodec('copy')
            .audioCodec('copy')
            .format('mp4')
            .save(tmpOutputPath)
            .on('end', () => resolve())
            .on('error', err => {
            console.error('FFmpeg merge error:', err);
            reject(err);
            });
        });

        // Read merged file into buffer
        const buffer = await fs.promises.readFile(tmpOutputPath);

        // Cleanup temp files
        fs.unlink(tmpVideoPath, () => {});
        fs.unlink(tmpAudioPath, () => {});
        fs.unlink(tmpOutputPath, () => {});

        // Send response
        return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="${videoTitle}_HD.mp4"`,
            'Content-Length': buffer.length.toString(),
        }
        });
      }

      /** ====== Case 2: Single stream (already has audio) ====== **/
      const videoStream = ytdl(url, { format: selectedFormat, ...ytdlOptions });
      const headers = new Headers({
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${videoTitle}.mp4"`,
      });

      const readableStream = new ReadableStream({
        start(controller) {
          videoStream.on('data', chunk => controller.enqueue(chunk));
          videoStream.on('end', () => controller.close());
          videoStream.on('error', err => controller.error(err));
        }
      });

      return new NextResponse(readableStream, { headers });
    }

    /** ===================== MP3 Download ===================== **/
    else if (format === 'mp3') {
      let audioFormat;
      if (itag) {
        audioFormat = info.formats.find(f => f.itag === itag);
      } else {
        // First try audio-only formats
        audioFormat = info.formats
          .filter(f => f.hasAudio && !f.hasVideo)
          .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
        
        // If no audio-only format, use any format with audio
        if (!audioFormat) {
          audioFormat = info.formats
            .filter(f => f.hasAudio)
            .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
        }
      }

      if (!audioFormat) {
        return NextResponse.json({ error: 'No suitable audio format found' }, { status: 404 });
      }

      const audioStream = ytdl(url, { format: audioFormat, ...ytdlOptions });
      const headers = new Headers({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${videoTitle}.mp3"`,
      });

      const readableStream = new ReadableStream({
        start(controller) {
          audioStream.on('data', chunk => controller.enqueue(chunk));
          audioStream.on('end', () => controller.close());
          audioStream.on('error', err => controller.error(err));
        }
      });

      return new NextResponse(readableStream, { headers });
    }

    /** ===================== Video-Only Download ===================== **/
    else if (format === 'video-only') {
      let videoFormat;
      if (itag) {
        videoFormat = info.formats.find(f => f.itag === itag);
      } else {
        // Find best video-only format
        videoFormat = info.formats
          .filter(f => f.hasVideo && !f.hasAudio)
          .sort((a, b) => {
            const aHeight = parseInt(a.qualityLabel?.replace('p', '') || '0');
            const bHeight = parseInt(b.qualityLabel?.replace('p', '') || '0');
            return bHeight - aHeight;
          })[0];
      }

      if (!videoFormat) {
        // Fallback to any video format
        videoFormat = info.formats
          .filter(f => f.hasVideo)
          .sort((a, b) => {
            const aHeight = parseInt(a.qualityLabel?.replace('p', '') || '0');
            const bHeight = parseInt(b.qualityLabel?.replace('p', '') || '0');
            return bHeight - aHeight;
          })[0];
      }

      if (!videoFormat) {
        return NextResponse.json({ error: 'No suitable video format found' }, { status: 404 });
      }

      const videoStream = ytdl(url, { format: videoFormat, ...ytdlOptions });
      const headers = new Headers({
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${videoTitle}_video_only.mp4"`,
      });

      const readableStream = new ReadableStream({
        start(controller) {
          videoStream.on('data', chunk => controller.enqueue(chunk));
          videoStream.on('end', () => controller.close());
          videoStream.on('error', err => controller.error(err));
        }
      });

      return new NextResponse(readableStream, { headers });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}