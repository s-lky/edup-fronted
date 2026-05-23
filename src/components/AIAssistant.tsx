import { MoreVertical, Sparkles, Send } from "lucide-react";
import { useEffect, useState, useRef } from "react"; //状态、副作用、DON作用
import { cn } from '../lib/utils' //Tailwind CSS类名合并工具
import { aiAPI } from '../api/index'

interface Message{
    id:string;
    role:'user'|'assistant';
    content:string; //消息内容
}

interface AIChatResponse {
    reply: string;
    sessionId?: string; //会话ID
    suggestions?: string[]; //推荐问题
}

// 组件定义与props
export default function AIAssistant({ 
    courseTitle, //课程标题（AI上下文）
    context, //额外上下文
    courseId, //绑定到具体课程/视频
    videoId 
}: { 
    courseTitle: string; 
    context?: string;
    courseId?: string;
    videoId?: string;
}){
    // 消息列表：初始一条欢迎语
    const [messages, setMessages] = useState<Message[]>([
        { id:'1', role:'assistant', content:`你好！我是AI助教小希，很高兴为你服务。有什么学习问题都可以问我哦！` }
    ]);

    // 输入框内容
    const [input, setInput] = useState('');
    // 加载中状态（发送请求时禁用按钮）
    const [isLoading, setIsLoading] = useState(false);
    // 滚动容器引用（自动滚动到底部）
    const scrollRef = useRef<HTMLDivElement>(null);

    // 自动滚到到底部，监听消息变化、加载状态
    useEffect(() =>{
        if(scrollRef.current){
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    },[messages, isLoading]);

    // 发送消息给AI
    const handleSend = async () =>{
        // 空输入 or 加载中 -> 不执行
        if(!input.trim() || isLoading) return;

        const userText = input.trim();
        // 构建用户消息
        const userMessage: Message = { id: Date.now().toString(), role:'user', content: userText };
        // 更新消息列表
        setMessages(prev => [...prev, userMessage]);
        setInput(''); //清空输入框
        setIsLoading(true); //开启加载

        try{
            // 调用后端AI接口
            const data: AIChatResponse = await aiAPI.chat({
                courseId,
                videoId,
                courseTitle,
                context,
                messages: [
                    // 历史消息
                    ...messages
                        .filter(m => m.role === 'user' || m.role === 'assistant')
                        .map(m => ({
                            role: m.role as 'user' | 'assistant',
                            content: m.content
                        })),
                        // 最新用户消息
                    { role: 'user', content: userText }
                ]
            });
            // 把AI回复加入消息列表
            setMessages(prev => [...prev, { 
                id: (Date.now() + 1).toString(), 
                role:'assistant', 
                content: data.reply 
            }]);
        }catch(error){
            console.error('AI Error:', error);
            const errMsg = error instanceof Error ? error.message : '网络连接失败，请稍后重试';
            setMessages(prev => [...prev, { 
                id: (Date.now() + 1).toString(), 
                role:'assistant', 
                content: errMsg || '网络连接失败，请稍后重试'
            }]);
        }finally{
            // 关闭加载
            setIsLoading(false);
        }
    };
    // UI界面渲染
    return(
        // 顶部标题栏
        <div className="flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden bg-white">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h2 className="text-base font-bold text-slate-700">AI 助教小希 (在线)</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-400"/>
                    <MoreVertical size={16} className="text-slate-400 cursor-pointer" />
                </div>
            </div>
            {/* 消息列表区域 */}
            <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 scrollbar-thin"
            >
                {messages.map((m) =>(
                    <div
                        key={m.id}
                        className={cn(
                            "flex gap-2 items-start",
                            m.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        {/* 头像 */}
                        <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black",
                            m.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-indigo-600 text-white"
                        )}>
                            {m.role === 'assistant' ? 'AI' : 'JD'}
                        </div>
                        {/* 消息气泡 */}
                        <div
                            className={cn(
                                'max-w-[min(100%,280px)] break-words rounded-2xl p-3 text-sm leading-relaxed shadow-sm',
                                m.role === 'user'
                                    ? 'rounded-tr-none bg-indigo-600 text-white'
                                    : 'rounded-tl-none border-l-4 border-indigo-400 bg-slate-100 text-slate-700',
                            )}
                        >
                            {m.content}
                        </div>
                    </div>
                ))}

                {/* 加载动画：3个小圆点弹跳 */}
                {isLoading && (
                    <div className="flex gap-2 items-center text-indigo-400 p-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animate-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animate-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    </div>
                )}
            </div>
                {/* 底部输入框区域 */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                <div className="relative">
                    <textarea
                        rows={3}
                        placeholder="随时唤醒ai提问"
                        value={input}
                        onChange={(e)=>setInput(e.target.value)}
                        onKeyDown={(e)=>e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 pr-10 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500"
                    />

                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 bottom-2 bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-slate-900 disabled:opacity-30 transition-all shadow-md"
                    >
                        <Send size={14}/>
                    </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-[9px] text-slate-400 italic">基于 DeepSeek 深度语义解析</span>
                    <div className="flex gap-2">
                        <button className="text-[9px] font-black text-slate-500 hover:text-indigo-600 uppercase tracking-tighter">快捷提问</button>
                        <button className="text-[9px] font-black text-slate-500 hover:text-indigo-600 uppercase tracking-tighter">语言互动</button>
                    </div>
                </div>
            </div>
        </div>
    );
}