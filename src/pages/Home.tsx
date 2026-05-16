import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Users, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { MOCK_COURSES } from '../mockData';
import { cn } from '../lib/utils';


export default function Home(){
    //状态：存储搜索框输入的内容
    const[searchQuery,setSearchQuery] = useState('');

    //路由跳转方法
    const navigate = useNavigate();

    //课程筛选：根据搜索关键词寻找课程
    const filteredCourses = MOCK_COURSES.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return(
        <div className="space-y-12">
            <section className="relative overflow-hidden rounded-2xl bg-indigo-600 p-8 md:p-12 text-white">
                <div className="relative z-10 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-bold tracking-widest uppercase mb-6"
                    >
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        AI协同学习社区
                    </motion.div>
                    <motion.h1
                        initial={{ opacity:0,y:20 }}
                        animate={{ opacity:1,y:0 }}
                        className="text-4xl md:text-5xl font-bold leading-tight mb-4 italic"
                    >
                        神经网络与深度学习：<br/><span className="text-indigo-200">从零构建智能未来</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity:0,y:20 }}
                        animate={{ opacity:1,y:0 }}
                        className="text-indigo-100 text-base md:text-lg mb-8 leading-relaxed max-w-xl"
                    >
                        xxxx
                    </motion.p>
                    <div className="flex flex-wrap gap-4">
                        <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm shadow-xl shadow-indigo-900/20 hover:scale-105 transition-transform">
                            立即开始学习
                        </button>
                        <button className="px-6 py-3 bg-indigo-500/30 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold text-sm hover:bg-white/10 transition-all">
                            查看学习路径
                        </button>
                    </div>
                </div>

                <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
                    <div className="absolute inset-0 bg-gradient-to-l from-indigo-600 to-transparent z-10" />
                        <div className="w-full h-full bg-indigo-900 opacity-50 flex items-center justify-center" >
                            <div className="w-64 h-64 border-4 border-indigo-400/20 rounded-full animate-ping" />
                            <div className="absolute w-48 h-48 border-2 border-white/10 rounded-full"/>
                        </div>
                    </div>
            </section>

            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 italic">
                        精选课程专区
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded italic font-normal not-italic">最新更新</span>
                    </h2>
                    <div className="flex gap-4">
                        {['全部','人工智能','前端'].map(t => (
                            <button key={t} className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"></button>
                        ))}
                    </div>
                </div>

                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course, index) =>(
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="card-polish group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col"
                            onClick={() => navigate(`/play/${course.id}/${course.videos[0]?.id || 'none'}`)}
                        >
                            <div className="relative aspect-video overflow-hidden bg-slate-100">
                                <img
                                    src={course.thumbnail} 
                                    alt={course.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
                                        开始学习 <ChevronRight size={14} />
                                    </span>
                                </div>
                                <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-white/90 text-[10px] font-black text-indigo-600 uppercase tracking-tighter shadow-sm">
                                    {course.category}
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors italic leading-tight mb-2 line-clamp-1">{course.title}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-6">{course.description}</p>

                                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                        <span className="flex items-center gap-1"><Users size={12} /> {course.studentsCount}</span>
                                        <span className="flex items-center gap-1 text-amber-500"><Star size={12} fill="currentColor" /> {course.rating}</span>
                                    </div>
                                    <div className="text-lg font-black text-indigo-600">
                                        ￥{course.price}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </section>
            </div>
        </div>
    );
}