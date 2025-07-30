export interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  viewCount: string;
  author: string;
  videoId: string;
  formats: VideoFormat[];
}

export interface VideoFormat {
  itag: number;
  quality: string;
  container: string;
  hasVideo: boolean;
  hasAudio: boolean;
  qualityLabel?: string | null;
  audioBitrate?: number | null;
  contentLength?: string | null;
}

export interface DownloadOptions {
  format: 'mp3' | 'mp4' | 'video-only';
  quality: string;
  itag?: number;
  combineStreams?: boolean;
  cookies?: string;
}

export interface DownloadProgress {
  downloaded: number;
  total: number;
  percent: number;
}
