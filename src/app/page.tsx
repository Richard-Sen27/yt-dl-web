'use client';

import YouTubeDownloader from '@/components/YouTubeDownloader';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            YouTube Downloader
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Download YouTube videos as MP3 or MP4 with quality selection
          </p>
        </header>
        
        <main className="max-w-4xl mx-auto">
          <YouTubeDownloader />
        </main>
        
        <footer className="text-center mt-12 text-gray-500 dark:text-gray-400">
          <p>Built with Next.js, TypeScript, and ytdl-core</p>
        </footer>
      </div>
    </div>
  );
}
