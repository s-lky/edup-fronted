// 视频播放器组件
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import Hls from 'hls.js'; // HLS 流媒体解析库
import { Loader2, Gauge } from 'lucide-react';
import { videoAPI, progressAPI, type VideoPlayInfo } from '../api/index';

// 对外暴露实例类型（父组件可调用）
export interface VideoPlayerHandle {
  getCurrentTime: () => number; //获取当前播放时间
  getVideoElement: () => HTMLVideoElement | null; //获取video DOM
}

interface VideoPlayerProps {
  videoId: string; //视频唯一ID（核心，用于拉取信息、保存进度）
  poster?: string; //视频封面
  className?: string; //外层样式类
  onTimeUpdate?: (time: number) => void; //播放时间更新回调
  onPreviewEnded?: () => void; //试看时长用尽回调
  onLoadError?: () => void; //加载失败回调
  onLoaded?: () => void; //视频加载完成可播放回调
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];
const PROGRESS_SAVE_INTERVAL_MS = 8000; // 正常播放时，进度保存间隔：8秒

// 组件入口 & 转发 Ref，使用 forwardRef 转发 ref，让父组件可以拿到播放器实例：
const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer(
  { videoId, poster, className, onTimeUpdate, onPreviewEnded, onLoadError, onLoaded },
  ref,
) {
  // 各类 Ref（存实例 / 标记 / 缓存，不触发重渲染）
  const videoRef = useRef<HTMLVideoElement>(null); // video DOM 实例
  const hlsRef = useRef<Hls | null>(null); // hls 实例
  const playInfoRef = useRef<VideoPlayInfo | null>(null); // 视频播放信息（内存缓存）
  const resumeAppliedRef = useRef(false); // 是否已经执行过「断点续播」（防重复）
  const lastSavedAtRef = useRef(0); // 上一次保存进度的时间戳
  const watchedSecondsRef = useRef(0); // 已观看最大时长（用于进度上报）

  // 回调函数 Ref：保证内部取到最新回调，不依赖 useEffect 依赖项
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onPreviewEndedRef = useRef(onPreviewEnded);
  const onLoadErrorRef = useRef(onLoadError);
  const onLoadedRef = useRef(onLoaded);

  // 状态 State（驱动视图更新）
  const [playInfo, setPlayInfo] = useState<VideoPlayInfo | null>(null);// 视频播放信息（视图渲染用）
  const [loading, setLoading] = useState(true);// 加载中状态
  const [playbackRate, setPlaybackRate] = useState(1);// 当前倍速
  const [showRateMenu, setShowRateMenu] = useState(false);// 倍速下拉框显隐

  //  同步最新回调-每次渲染都把最新外部回调赋值给 Ref，内部事件里直接取 xxxRef.current
  onTimeUpdateRef.current = onTimeUpdate;
  onPreviewEndedRef.current = onPreviewEnded;
  onLoadErrorRef.current = onLoadError;
  onLoadedRef.current = onLoaded;

  // 向外暴露方法 useImperativeHandle-父组件通过 ref 即可调用这两个方法，获取播放时间或原生 video 元素
  useImperativeHandle(ref, () => ({
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    getVideoElement: () => videoRef.current,
  }));

  // 组装进度上报参数 buildProgressPayload
  const buildProgressPayload = useCallback(() => {
    const el = videoRef.current;
    const info = playInfoRef.current;
    // 无DOM/无播放信息/未登录，直接返回
    if (!el || !info || !localStorage.getItem('accessToken')) return null;

    // 视频总时长
    const duration = Math.floor(el.duration || info.durationSeconds || 0);
    if (duration <= 0) return null;

    let current = Math.floor(el.currentTime);
    // 未购买课程：进度不能超过试看上限
    if (!info.purchased) {
      current = Math.min(current, info.previewLimitSeconds);
    }

     // 记录历史最大观看时长（防止回退播放导致进度倒退）
    const watchedSeconds = Math.max(watchedSecondsRef.current, current);
     // 判断是否看完（已购买 + 播放到结尾95%/最后5秒内）
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

  // 保存播放进度 saveProgress
  const saveProgress = useCallback(
    async (keepalive = false) => {
      const payload = buildProgressPayload();
      if (!payload) return;

      watchedSecondsRef.current = Math.max(watchedSecondsRef.current, payload.watchedSeconds);

      try {
         // 区分普通上报 / 保活上报（页面切后台专用接口）
        if (keepalive) {
          progressAPI.updateProgressKeepalive(videoId, payload);
        } else {
          await progressAPI.updateProgress(videoId, payload);
        }
        lastSavedAtRef.current = Date.now();  // 更新最后保存时间
      } catch (err) {
        console.error('保存播放进度失败:', err);
      }
    },
    [videoId, buildProgressPayload],
  );

  // 销毁 HLS 实例 destroyHls
  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  // 绑定视频源 attachSource
  const attachSource = useCallback(
    (info: VideoPlayInfo) => {
      const el = videoRef.current;
      if (!el) return;

      destroyHls();
      resumeAppliedRef.current = false;  // 重置续播标记

       // 分支1：HLS 流媒体
      if (info.format === 'hls') {
        if (Hls.isSupported()) {
          // 浏览器不原生支持 HLS，使用 hls.js 解析
          const hls = new Hls({ enableWorker: true });
          hlsRef.current = hls;
          hls.loadSource(info.playUrl);
          hls.attachMedia(el);
          // HLS 致命错误，触发加载失败
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) onLoadErrorRef.current?.();
          });
        } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
          // 浏览器原生支持 HLS（如 Safari），直接赋值 src
          el.src = info.playUrl;
        } else {
          onLoadErrorRef.current?.(); // 完全不支持
        }
        return;
      }

      // 分支2：普通视频源
      el.src = info.playUrl;
    },
    [destroyHls],
  );

  // 加载视频基础信息（核心入口）-依赖 videoId，视频 ID 变化则重新加载
  useEffect(() => {
    let cancelled = false; // 竞态标记：组件卸载/切换视频时终止回调
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
        attachSource(info); // 绑定播放源
      } catch (err) {
        console.error('加载点播信息失败:', err);
        if (!cancelled) onLoadErrorRef.current?.();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    // 清理函数：组件卸载 / videoId 变化时触发
    return () => {
      cancelled = true;
      destroyHls();
    };
  }, [videoId, attachSource, destroyHls]);

  // 页面切后台 / 关闭 兜底保存进度-监听页面可见性、页面关闭事件，离开页面强制上报进度
  useEffect(() => {
    const flushProgress = () => {
      void saveProgress(true); // 保活接口上报
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushProgress();
    };

    // 页面隐藏 / 页面关闭
    window.addEventListener('pagehide', flushProgress);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pagehide', flushProgress);
      document.removeEventListener('visibilitychange', handleVisibility);
      flushProgress(); // 卸载前最后保存一次
      destroyHls();
    };
  }, [saveProgress, destroyHls]);
// 视频事件处理函数
// 断点续播核心 applyResume
  const applyResume = () => {
    const el = videoRef.current;
    const info = playInfoRef.current;
    if (!el || !info || resumeAppliedRef.current) return;

    resumeAppliedRef.current = true; // 标记已执行，只走一次
    const duration = el.duration || info.durationSeconds || 0;
    let resumeAt = info.lastPositionSec;
     // 未购买：续播位置不能超过试看上限，最多回退5秒
    if (!info.purchased && resumeAt >= info.previewLimitSeconds) {
      resumeAt = Math.max(0, info.previewLimitSeconds - 5);
    }
    // 合理位置才跳转（跳过开头3秒、不跳到结尾）
    if (resumeAt > 3 && (!duration || resumeAt < duration - 10)) {
      el.currentTime = resumeAt;
      watchedSecondsRef.current = Math.max(watchedSecondsRef.current, resumeAt);
    }
  };

  // 元数据加载完成
  const handleLoadedMetadata = () => {
    applyResume();
  };

  // 视频可播放
  const handleCanPlay = () => {
    applyResume();
    onLoadedRef.current?.();
  };

  // 播放时间更新（最核心事件）
  const handleTimeUpdate = () => {
    const el = videoRef.current;
    const info = playInfoRef.current;
    if (!el || !info) return;

    const time = el.currentTime;
    onTimeUpdateRef.current?.(time);
    watchedSecondsRef.current = Math.max(watchedSecondsRef.current, Math.floor(time));

     // 试看拦截：未购买 + 达到试看时长 → 暂停并触发回调
    if (!info.purchased && time >= info.previewLimitSeconds) {
      el.pause();
      el.currentTime = info.previewLimitSeconds;
      onPreviewEndedRef.current?.();
      return;
    }

    // 每间隔8秒自动保存一次进度
    if (Date.now() - lastSavedAtRef.current >= PROGRESS_SAVE_INTERVAL_MS) {
      void saveProgress(false);
    }
  };

  // 视频暂停
  const handlePause = () => {
    void saveProgress(false); // 暂停立即保存进度
  };

  // 倍速切换
  const handleRateChange = (rate: number) => {
    const el = videoRef.current;
    if (el) el.playbackRate = rate;
    setPlaybackRate(rate);
    setShowRateMenu(false);
  };

  return (
    <div className={`relative h-full w-full ${className ?? ''}`}>
        {/* 加载中遮罩 */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      <video
        ref={videoRef}
        controls // 显示原生控制栏
        playsInline // 移动端行内播放，不自动全屏
        preload="metadata" // 预加载元数据（时长、封面）
        className="h-full w-full object-contain"
        poster={poster || playInfo?.thumbnail} // 封面优先级：外部传入 > 接口返回
        onLoadedMetadata={handleLoadedMetadata} 
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onPause={handlePause}
        onError={() => onLoadErrorRef.current?.()}
      >
        您的浏览器不支持 HTML5 视频
      </video>

{/* 倍速按钮 + 下拉菜单 */}
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
          倍速按钮 + 下拉菜单
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

{/* 续播提示文案 */}
      {!loading && playInfo && playInfo.lastPositionSec > 3 && !playInfo.completed && (
        <div className="pointer-events-none absolute left-3 bottom-14 z-10 rounded-lg bg-black/55 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
          将从 {formatTime(playInfo.lastPositionSec)} 续播
        </div>
      )}
    </div>
  );
});

//  时间格式化工具函数
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default VideoPlayer;
