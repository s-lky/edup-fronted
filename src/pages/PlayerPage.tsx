// 视频播放页
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Play, Maximize, Clock, Loader2, Star, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import AIAssistant from '../components/AIAssistant';
import { danmakuAPI, courseAPI } from '../api/index';

interface Course {
  // 课程基础字段+内嵌视频数组结构
  id: string;
  title: string;
  description: string;
  instructor: string;
  price: number;
  thumbnail: string;
  category: string;
  studentsCount: number;
  rating: number;
  videoCount: number;
  videos: Array<{
    id: string;
    title: string;
    url: string;
    duration: string;
    thumbnail: string;
    order: number;
  }>;
}

export default function PlayerPage() {
  const { courseId, videoId } = useParams();
  const navigate = useNavigate();
  // 防止重复路由跳转的标记引用
  const redirectOnceRef = useRef(false);
  // 标签页切换状态（章节 / 详情）
  const [activeTab, setActiveTab] = useState<'chapters' | 'info'>('chapters');
  // 弹幕输入框内容
  const [danmakuInput, setDanmakuInput] = useState('');
  // 课程点赞状态
  const [isLiked, setIsLiked] = useState(false);
  // 课程完整状态
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoLoadError, setVideoLoadError] = useState(false);

  // 路由切换重置状态
  useEffect(() => {
    redirectOnceRef.current = false;
    setVideoLoadError(false);
  }, [courseId, videoId]);

  // 请求课程详情数据
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setError('课程 ID 不存在');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await courseAPI.getDetail(courseId);
        setCourse(data as Course);
      } catch (err: unknown) {
        console.error('获取课程详情失败:', err);
        setError('加载课程失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // 路由合法性自动校正
  useEffect(() => {
    if (!course || !courseId || loading || redirectOnceRef.current) return;
    const videos = course.videos ?? [];
    if (videos.length === 0) return;

    const matched = videoId && videos.some((v) => v.id === videoId);
    if (!matched) {
      redirectOnceRef.current = true;
      navigate(`/play/${courseId}/${videos[0].id}`, { replace: true });
    }
  }, [course, courseId, videoId, loading, navigate]);

  // 获取当前播放视频对象
  const video = course?.videos.find((v) => v.id === videoId);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
        <p className="text-base text-slate-500">正在加载课程...</p>
      </div>
    );
  }

  if (error || !course || !video) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 italic text-slate-500">
        <Play size={48} className="text-slate-300" />
        <p className="text-base">{error || '课程或视频未找到'}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm font-semibold text-indigo-600"
        >
          返回主控台
        </button>
      </div>
    );
  }

  // 弹幕提交逻辑
  const handleSendDanmaku = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!danmakuInput.trim() || !videoId) return;

    try {
      await danmakuAPI.send(videoId, {
        text: danmakuInput,
        color: '#ffffff',
        videoTimeSec: 120,
      });
      setDanmakuInput('');
    } catch (err) {
      console.error('发送弹幕失败:', err);
      alert('发送失败，请重试');
    }
  };

  return (
    <div className="mx-auto grid h-full min-h-0 w-full max-w-[1760px] grid-cols-1 grid-rows-[minmax(0,1fr)] gap-4 min-[960px]:grid-cols-[minmax(0,1fr)_340px] min-[960px]:grid-rows-1 min-[960px]:gap-6">
      {/* 左侧：固定占满可用高度，内部滚动，不会被右侧聊天撑开 */}
      <section className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto pr-0.5 scrollbar-thin">
        <div className="group relative aspect-video w-full max-h-[min(52vh,640px)] shrink-0 overflow-hidden rounded-2xl bg-black shadow-2xl shadow-indigo-500/10 min-[960px]:max-h-[min(56vh,680px)]">
          <video
            key={video.id}
            src={video.url}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-contain"
            poster={video.thumbnail || course.thumbnail}
            onLoadedData={() => setVideoLoadError(false)}
            onError={() => setVideoLoadError(true)}
          >
            您的浏览器不支持 HTML5 视频
          </video>

          {videoLoadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/95 px-4 text-center text-white">
              <AlertCircle className="h-8 w-8 text-amber-400" />
              <p className="text-sm font-semibold">视频加载失败，请检查网络或更换视频地址</p>
            </div>
          )}

          {!videoLoadError && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <span className="rounded-lg bg-black/40 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                沉浸式学习模式
              </span>
            </div>
          )}

          <button
            type="button"
            className="absolute bottom-3 right-3 z-10 rounded-lg bg-black/50 p-2 text-white hover:bg-black/70"
            aria-label="全屏"
            onClick={() => document.querySelector('video')?.requestFullscreen?.()}
          >
            <Maximize size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSendDanmaku}
          className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
        >
          <input
            type="text"
            value={danmakuInput}
            onChange={(e) => setDanmakuInput(e.target.value)}
            placeholder="发送弹幕..."
            className="flex-1 bg-transparent text-sm text-slate-700 outline-none"
          />
          <button
            type="submit"
            disabled={!danmakuInput.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            发送
          </button>
        </form>

        <div className="flex shrink-0 items-start justify-between border-b border-slate-200 pb-4">
          <div className="min-w-0 flex-1 pr-4">
            <h1 className="text-2xl font-black text-slate-800 min-[960px]:text-3xl">{course.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              讲师：{course.instructor} · {course.category}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{video.title}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              'shrink-0 rounded-xl border p-2.5',
              isLiked ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-100 text-slate-400',
            )}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="space-y-4 pb-2">
          <div className="flex gap-6 border-b border-slate-200">
            {(['chapters', 'info'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'border-b-2 pb-2 text-sm font-bold',
                  activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400',
                )}
              >
                {tab === 'chapters' ? '课程章节' : '课程详情'}
              </button>
            ))}
          </div>

          {activeTab === 'chapters' ? (
            <div className="space-y-2">
              {course.videos.map((v, i) => (
                <div
                  key={v.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/play/${courseId}/${v.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/play/${courseId}/${v.id}`)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-3',
                    v.id === videoId ? 'border-indigo-200 bg-indigo-50' : 'border-slate-100 bg-white',
                  )}
                >
                  <span className="w-6 text-xs font-bold text-slate-400">{String(i + 1).padStart(2, '0')}</span>
                  <Play size={14} className={v.id === videoId ? 'text-indigo-600' : 'text-slate-400'} />
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm font-bold', v.id === videoId && 'text-indigo-600')}>
                      {v.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} /> {v.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 bg-white p-5 text-sm leading-relaxed text-slate-600">
              {course.description}
            </div>
          )}
        </div>
      </section>

      {/* 右侧 AI：固定宽度 + 高度上限，聊天再多也在内部滚动 */}
      <aside className="flex h-[min(42vh,420px)] min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm min-[960px]:h-full min-[960px]:max-h-full">
        <AIAssistant
          courseId={courseId}
          videoId={videoId}
          courseTitle={course.title}
          context={course.description}
        />
      </aside>
    </div>
  );
}
