import { MoreVertical, Sparkles, Send } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { cn } from '../lib/utils'
import { aiAPI } from '../api/index'

interface Message{
    id:string;
    role:'user'|'assistant';
    content:string;
}

interface AIChatResponse {
    reply: string;
    sessionId?: string;
    suggestions?: string[];
}

export default function AIAssistant({ 
    courseTitle, 
    context,
    courseId,
    videoId 
}: { 
    courseTitle: string; 
    context?: string;
    courseId?: string;
    videoId?: string;
}){
    const [messages, setMessages] = useState<Message[]>([
        { id:'1', role:'assistant', content:`你好！我是AI助教小希，很高兴为你服务。有什么学习问题都可以问我哦！` }
    ]);

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() =>{
        if(scrollRef.current){
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    },[messages, isLoading]);

    const handleSend = async () =>{
        if(!input.trim() || isLoading) return;

        const userText = input.trim();
        const userMessage: Message = { id: Date.now().toString(), role:'user', content: userText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try{
            const data: AIChatResponse = await aiAPI.chat({
                courseId,
                videoId,
                courseTitle,
                context,
                messages: [
                    ...messages
                        .filter(m => m.role === 'user' || m.role === 'assistant')
                        .map(m => ({
                            role: m.role as 'user' | 'assistant',
                            content: m.content
                        })),
                    { role: 'user', content: userText }
                ]
            });

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
            setIsLoading(false);
        }
    };

    return(
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
                        <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black",
                            m.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-indigo-600 text-white"
                        )}>
                            {m.role === 'assistant' ? 'AI' : 'JD'}
                        </div>
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

                {isLoading && (
                    <div className="flex gap-2 items-center text-indigo-400 p-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animate-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animate-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    </div>
                )}
            </div>

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