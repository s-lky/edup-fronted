import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import Hls from 'hls.js';
import { Loader2, Gauge } from 'lucide-react';
import { videoAPI, progressAPI, type VideoPlayInfo } from '../api/index';

export interface VideoPlayerHandle {
  getCurrentTime: () => number;
  getVideoElement: () => HTMLVideoElement | null;
}

interface VideoPlayerProps {
  videoId: string;
  poster?: string;
  className?: string;
  onTimeUpdate?: (time: number) => void;
  onPreviewEnded?: () => void;
  onLoadError?: () => void;
  onLoaded?: () => void;
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];
const PROGRESS_SAVE_INTERVAL_MS = 8000;

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer(
  { videoId, poster, className, onTimeUpdate, onPreviewEnded, onLoadError, onLoaded },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playInfoRef = useRef<VideoPlayInfo | null>(null);
  const resumeAppliedRef = useRef(false);
  const lastSavedAtRef = useRef(0);
  const watchedSecondsRef = useRef(0);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onPreviewEndedRef = useRef(onPreviewEnded);
  const onLoadErrorRef = useRef(onLoadError);
  const onLoadedRef = useRef(onLoaded);

  const [playInfo, setPlayInfo] = useState<VideoPlayInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showRateMenu, setShowRateMenu] = useState(false);

  onTimeUpdateRef.current = onTimeUpdate;
  onPreviewEndedRef.current = onPreviewEnded;
  onLoadErrorRef.current = onLoadError;
  onLoadedRef.current = onLoaded;

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    getVideoElement: () => videoRef.current,
  }));

  const buildProgressPayload = useCallback(() => {
    const el = videoRef.current;
    const info = playInfoRef.current;
    if (!el || !info || !localStorage.getItem('accessToken')) return null;

    const duration = Math.floor(el.duration || info.durationSeconds || 0);
    if (duration <= 0) return null;

    let current = Math.floor(el.currentTime);
    if (!info.purchased) {
      current = Math.min(current, info.previewLimitSeconds);
    }

    const watchedSeconds = Math.max(watchedSecondsRef.current, current);
    const completed = info.purchased
      ? current >= Math.max(duration - 5, duration * 0.95)
      : false;

    return {
      watchedSeconds,
      lastPositionSec: current,
      duration,
      completed,
    };
  }, []);

  const saveProgress = useCallback(
    async (keepalive = false) => {
      const payload = buildProgressPayload();
      if (!payload) return;

      watchedSecondsRef.current = Math.max(watchedSecondsRef.current, payload.watchedSeconds);

      try {
        if (keepalive) {
          progressAPI.updateProgressKeepalive(videoId, payload);
        } else {
          await progressAPI.updateProgress(videoId, payload);
        }
        lastSavedAtRef.current = Date.now();
      } catch (err) {
        console.error('保存播放进度失败:', err);
      }
    },
    [videoId, buildProgressPayload],
  );

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const attachSource = useCallback(
    (info: VideoPlayInfo) => {
      const el = videoRef.current;
      if (!el) return;

      destroyHls();
      resumeAppliedRef.current = false;

      if (info.format === 'hls') {
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true });
          hlsRef.current = hls;
          hls.loadSource(info.playUrl);
          hls.attachMedia(el);
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) onLoadErrorRef.current?.();
          });
        } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
          el.src = info.playUrl;
        } else {
          onLoadErrorRef.current?.();
        }
        return;
      }

      el.src = info.playUrl;
    },
    [destroyHls],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    resumeAppliedRef.current = false;
    watchedSecondsRef.current = 0;

    const load = async () => {
      try {
        const info = await videoAPI.getPlayInfo(videoId);
        if (cancelled) return;
        playInfoRef.current = info;
        watchedSecondsRef.current = info.lastPositionSec || 0;
        setPlayInfo(info);
        attachSource(info);
      } catch (err) {
        console.error('加载点播信息失败:', err);
        if (!cancelled) onLoadErrorRef.current?.();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      destroyHls();
    };
  }, [videoId, attachSource, destroyHls]);

  useEffect(() => {
    const flushProgress = () => {
      void saveProgress(true);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushProgress();
    };

    window.addEventListener('pagehide', flushProgress);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pagehide', flushProgress);
      document.removeEventListener('visibilitychange', handleVisibility);
      flushProgress();
      destroyHls();
    };
  }, [saveProgress, destroyHls]);

  const applyResume = () => {
    const el = videoRef.current;
    const info = playInfoRef.current;
    if (!el || !info || resumeAppliedRef.current) return;

    resumeAppliedRef.current = true;
    const duration = el.duration || info.durationSeconds || 0;
    let resumeAt = info.lastPositionSec;
    if (!info.purchased && resumeAt >= info.previewLimitSeconds) {
      resumeAt = Math.max(0, info.previewLimitSeconds - 5);
    }
    if (resumeAt > 3 && (!duration || resumeAt < duration - 10)) {
      el.currentTime = resumeAt;
      watchedSecondsRef.current = Math.max(watchedSecondsRef.current, resumeAt);
    }
  };

  const handleLoadedMetadata = () => {
    applyResume();
  };

  const handleCanPlay = () => {
    applyResume();
    onLoadedRef.current?.();
  };

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    const info = playInfoRef.current;
    if (!el || !info) return;

    const time = el.currentTime;
    onTimeUpdateRef.current?.(time);
    watchedSecondsRef.current = Math.max(watchedSecondsRef.current, Math.floor(time));

    if (!info.purchased && time >= info.previewLimitSeconds) {
      el.pause();
      el.currentTime = info.previewLimitSeconds;
      onPreviewEndedRef.current?.();
      return;
    }

    if (Date.now() - lastSavedAtRef.current >= PROGRESS_SAVE_INTERVAL_MS) {
      void saveProgress(false);
    }
  };

  const handlePause = () => {
    void saveProgress(false);
  };

  const handleRateChange = (rate: number) => {
    const el = videoRef.current;
    if (el) el.playbackRate = rate;
    setPlaybackRate(rate);
    setShowRateMenu(false);
  };

  return (
    <div className={`relative h-full w-full ${className ?? ''}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
        poster={poster || playInfo?.thumbnail}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onPause={handlePause}
        onError={() => onLoadErrorRef.current?.()}
      >
        您的浏览器不支持 HTML5 视频
      </video>

      {!loading && playInfo && (
        <div className="absolute bottom-14 right-3 z-20">
          <button
            type="button"
            onClick={() => setShowRateMenu((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-black/55 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/70"
            aria-label="播放倍速"
          >
            <Gauge size={14} />
            {playbackRate}x
          </button>
          {showRateMenu && (
            <div className="absolute bottom-full right-0 mb-1 overflow-hidden rounded-lg border border-white/10 bg-black/85 py-1 shadow-lg backdrop-blur-sm">
              {PLAYBACK_RATES.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleRateChange(rate)}
                  className={`block w-full px-4 py-1.5 text-left text-xs font-medium ${
                    playbackRate === rate ? 'bg-indigo-600 text-white' : 'text-white hover:bg-white/10'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && playInfo && playInfo.lastPositionSec > 3 && !playInfo.completed && (
        <div className="pointer-events-none absolute left-3 bottom-14 z-10 rounded-lg bg-black/55 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
          将从 {formatTime(playInfo.lastPositionSec)} 续播
        </div>
      )}
    </div>
  );
});

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default VideoPlayer;
