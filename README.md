# YouTube Downloader

A modern Next.js application for downloading YouTube videos as MP3 or MP4 files with quality selection options.

## Features

- 🎥 Download YouTube videos in MP4 format
- 🎵 Convert and download YouTube videos as MP3 audio files
- 📊 Quality selection for both video and audio formats
- 🖼️ Video information display with thumbnail, title, duration, and view count
- 🌙 Dark mode support
- 📱 Responsive design
- ⚡ Built with Next.js 15 and TypeScript

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **YouTube API**: ytdl-core
- **Audio Processing**: fluent-ffmpeg
- **Deployment**: Vercel-ready

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd yt-downloader
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Enter YouTube URL**: Paste any valid YouTube URL (youtube.com or youtu.be)
2. **Get Video Info**: Click "Get Info" to fetch video details and available formats
3. **Select Format**: Choose between MP4 (video) or MP3 (audio only)
4. **Choose Quality**: Select from available quality options
5. **Download**: Click the download button to start the download

## Supported URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

## Quality Options

### Video (MP4)
- Various resolutions: 144p, 240p, 360p, 480p, 720p, 1080p, 1440p, 2160p (4K)
- Depends on original video quality

### Audio (MP3)
- Multiple bitrates: 48kbps, 128kbps, 160kbps, etc.
- Converted to MP3 format using FFmpeg

## Development

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── video-info/     # API route for fetching video metadata
│   │   └── download/       # API route for handling downloads
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           # Main page component
├── components/
│   ├── YouTubeDownloader.tsx  # Main downloader component
│   ├── URLInput.tsx          # URL input form
│   ├── VideoInfoDisplay.tsx  # Video information display
│   └── LoadingSpinner.tsx    # Loading indicator
└── types/
    └── youtube.ts           # TypeScript type definitions
```

### API Routes

#### `/api/video-info`
- **Method**: POST
- **Body**: `{ url: string }`
- **Response**: Video metadata including title, thumbnail, duration, and available formats

#### `/api/download`
- **Method**: POST
- **Body**: `{ videoId: string, format: 'mp3' | 'mp4', quality: string, itag?: number }`
- **Response**: File stream for download

## Build for Production

```bash
npm run build
npm start
```

## Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

## Important Notes

- **FFmpeg Requirement**: For MP3 conversion, FFmpeg must be available on the server
- **Rate Limiting**: YouTube may rate limit requests; consider implementing caching
- **Legal Compliance**: Ensure you comply with YouTube's Terms of Service and copyright laws
- **Age Restrictions**: Age-restricted videos cannot be downloaded
- **Private Videos**: Private or unavailable videos will return appropriate error messages

## Limitations

- No support for live streams
- No support for age-restricted content
- Download speed depends on YouTube's servers and your internet connection
- Some videos may have limited format availability

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for educational purposes. Please respect YouTube's Terms of Service and copyright laws when using this application.
