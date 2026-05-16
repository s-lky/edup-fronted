import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Play, Info, Maximize, Clock, User } from 'lucide-react';
import DanmakuOverlay from '../components/Danmaku';
import { MOCK_COURSES } from '../mockData';
import { cn } from '../lib/utils';
import AIAssistant from '../components/AIAssistant';
import { danmakuAPI } from '../api/index';

export default function PlayerPage() {
  const { courseId, videoId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'chapters' | 'info'>('chapters');
  const [danmakuInput, setDanmakuInput] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  const course = MOCK_COURSES.find(c => c.id === courseId);
  const video = course?.videos.find(v => v.id === videoId);

  if (!course || !video) {
    return (
      <div className="flex items-center justify-center h-[60vh] flex-col gap-4 text-slate-500 italic">
        <Play size={48} className="text-slate-300" />
        <p>课程或视频未找到</p>
        <button onClick={() => navigate('/')} className="text-indigo-600 font-bold uppercase tracking-widest text-xs">返回主控台</button>
      </div>
    );
  }

  const handleSendDanmaku = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!danmakuInput.trim() || !videoId) return;
    
    try {
      await danmakuAPI.send(videoId, {
        text: danmakuInput,
        color: '#ffffff',
        videoTimeSec: 120
      });
      setDanmakuInput('');
    } catch (error) {
      console.error('发送弹幕失败:', error);
      alert('发送失败，请重试');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 overflow-hidden">
      {/* Main Content Area: Video & Course Details */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin">
        {/* Video Player Viewport */}
        <div className="relative bg-black rounded-2xl aspect-video overflow-hidden shadow-2xl group border-4 border-slate-800 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-indigo-900 flex items-center justify-center">
            <img src={video.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Thumbnail" />
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md mb-4 ring-1 ring-white/20">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
              </div>
              <p className="text-slate-300 text-xs font-bold tracking-widest uppercase italic">{course.title} - 正在播放</p>
            </div>
          </div>

          {/* Danmaku Overlay Layer */}
          <DanmakuOverlay messages={[]} />

          {/* Player Controls */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/80 to-transparent flex items-center px-6 gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors">
              <Play size={18} fill="white" className="text-white" />
            </div>
            <div className="flex-1 h-1 bg-slate-600 rounded-full overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-indigo-500"></div>
            </div>
            <span className="text-[10px] text-white font-mono uppercase tracking-tighter">12:45 / {video.duration}</span>
            <div className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-white border border-white/20 font-bold uppercase">1.25x</div>
            <Maximize size={16} className="text-white cursor-pointer" />
          </div>
        </div>

        {/* Interaction & Details */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 italic tracking-tight">{video.title}</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded border border-indigo-100">难度: 中级</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <User size={12} /> {course.studentsCount} 人已加入学习
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="button-polish">分享笔记</button>
              <button 
                onClick={() => setIsLiked(!isLiked)}
                className={cn(
                  "p-2.5 rounded-xl border transition-all",
                  isLiked ? "bg-red-50 text-red-500 border-red-100" : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 shadow-sm"
                )}
              >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              </button>
            </div>
          </div>

          <div className="card-polish p-2 flex items-center gap-2 bg-slate-50">
            <input 
              type="text" 
              placeholder="发个弹幕和大家互动吧..."
              value={danmakuInput}
              onChange={(e) => setDanmakuInput(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
            <button 
              onClick={handleSendDanmaku}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors"
            >
              发送
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
                <div className="flex gap-8 border-b border-slate-100 h-10 items-center">
                  {['chapters', 'info'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={cn(
                        "h-10 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 mt-0.5",
                        activeTab === tab ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {tab === 'chapters' ? '课程章节' : '详情介绍'}
                    </button>
                  ))}
                </div>
                  
                <div className="pt-2">
                  {activeTab === 'chapters' ? (
                    <div className="space-y-2">
                      {course.videos.map((v, i) => (
                        <button
                          key={v.id}
                          onClick={() => navigate(`/play/${course.id}/${v.id}`)}
                          className={cn(
                            "w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left group",
                            v.id === videoId 
                              ? "bg-indigo-50 border-indigo-100" 
                              : "bg-white border-slate-100 hover:border-slate-200 shadow-sm"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <span className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black",
                              v.id === videoId ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                            )}>{String(i + 1).padStart(2, '0')}</span>
                            <div>
                              <h4 className={cn("font-bold text-sm italic", v.id === videoId ? "text-indigo-900" : "text-slate-700")}>{v.title}</h4>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-1 uppercase tracking-widest"><Clock size={10} /> {v.duration}</p>
                            </div>
                          </div>
                          {v.id === videoId && (
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] bg-white px-2 py-0.5 rounded shadow-sm border border-indigo-50">Active</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed italic">
                      <div className="p-5 bg-slate-100/50 rounded-2xl border border-slate-100 mb-6 flex items-start gap-4">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm text-indigo-600"><Info size={20} /></div>
                        <p className="text-xs text-slate-700">这门课程详细拆解神经网络的核心运行机制。我们将从简单的感知机模型出发，重点讲解损失函数与优化算法的数学原理。</p>
                      </div>
                      <p className="text-sm">{course.description}</p>
                    </div>
                  )}
                </div>
            </div>

            <div className="md:col-span-1 space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">实时学习榜</h3>
                <div className="card-polish p-4 space-y-3">
                  {[
                    { rank: 1, name: '林*华', pts: 245, color: 'bg-amber-100 text-amber-700' },
                    { rank: 2, name: '张*远', pts: 198, color: 'bg-slate-100 text-slate-700' },
                    { rank: 3, name: '陈*美', pts: 182, color: 'bg-orange-50 text-orange-700' },
                  ].map(u => (
                    <div key={u.rank} className="flex items-center gap-3">
                      <div className={cn("w-6 h-6 rounded flex items-center justify-center text-[10px] font-black", u.color)}>{u.rank}</div>
                      <span className="text-xs font-bold text-slate-700">{u.name}</span>
                      <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase">{u.pts} pts</span>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar: AI Assistant */}
      <aside className="w-full lg:w-80 h-full flex flex-col shrink-0 border-l border-slate-200 bg-white">
        <AIAssistant 
          courseTitle={course.title} 
          context={`正在观看：${video.title}`}
          courseId={courseId}
          videoId={videoId}
        />
      </aside>
    </div>
  );
}
