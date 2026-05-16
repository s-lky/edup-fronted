import { Trophy, ArrowUp, Flame, Star, Medal } from "lucide-react";
import { motion } from "motion/react";
import { MOCK_RANKING } from "../mockData";

export default function RankingPage(){
    return(
        <div className="max-w-4xl mx-auto space-y-12 py-8">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100">
                    <Trophy size={14} />
                        社区学习先锋榜
                </div>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-800 italic">与优秀的伙伴一起进化</h1>
                    <p className="text-slate-500 text-sm">根据学习时长、互动频率、AI 挑战积分综合评定</p>
            </div>

            <div className="flex items-end justify-center gap-4 md:gap-12 mt-24">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <img src={MOCK_RANKING[1].avatar} className="w-20 h-20 rounded-2xl border-4 border-slate-200" alt="Avatar" />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700 shadow-sm border border-white">2</div>
                    </div>
                    <div className="text-center bg-white p-6 rounded-t-3xl shadow-xl border border-slate-100 min-w-[140px] h-32 flex flex-col justify-end">
                        <p className="font-bold text-slate-800 mb-1 text-sm italic">{MOCK_RANKING[1].name}</p>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{MOCK_RANKING[1].score} PTS</p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="relative"
                    >
                        <Medal size={48} className="absolute -top-14 left-1/2 -track-x-1/2 text-amber-500 fill-amber-50 opacity-80" />
                        <img src={MOCK_RANKING[0].avatar} className="w-28 h-28 rounded-3xl border-4 border-amber-400 p-1 bg-amber-50" alt="Avatar" />
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center font-black text-white shadow-xl border-2 border-white">1</div>
                    </motion.div>
                    <div className="text-center bg-slate-900 p-8 rounded-t-[40px] shadow-2xl min-w-[200px] h-52 flex flex-col justify-end">
                        <p className="font-bold text-white mb-1 italic">{MOCK_RANKING[0].name}</p>
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">{MOCK_RANKING[0].score} PTS</p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <img src={MOCK_RANKING[2].avatar} className="w-20 h-20 rounded-2xl border-4 border-orange-200" alt="Avatar" />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-200 rounded-lg flex items-center justify-center font-bold text-orange-800 shadow-sm border border-white">3</div>
                    </div>
                    <div className="text-center bg-white p-6 rounded-t-3xl shadow-xl border border-slate-100 min-w-[140px] h-28 flex flex-col justify-end">
                        <p className="font-bold text-slate-800 mb-1 text-sm italic">{MOCK_RANKING[2].name}</p>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{MOCK_RANKING[2].score} PTS</p>
                    </div>
                </div>
            </div>

            <div className="card-polish divide-y divide-slate-50">
                {MOCK_RANKING.slice(3).map((user, i) =>(
                    <div
                        key={user.id}
                        className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-6">
                            <span className="w-6 text-center font-black text-slate-300 text-xs">{i + 4}</span>
                            <img src={user.avatar} className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200" alt="Avatar" />
                            <div>
                                <p className="font-bold text-slate-800 text-sm italic">{user.name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="flex items-center gap-1 text-[9px] font-black text-orange-500 uppercase tracking-widest"><Flame size={10} /> 12 天</span>
                                    <span className="flex items-center gap-1 text-[9px] font-black text-indigo-500 uppercase tracking-widest"><Star size={10} /> 核心贡献</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-8 text-right">
                            <div>
                                <p className="font-black text-indigo-600 text-sm">{user.score}</p>
                                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">LUMINA PTS</p>
                            </div>
                            <div className="text-emerald-500 flex flex-col items-center">
                                <ArrowUp size={14} />
                                <span className="text=[9px] font-black">+2</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}