import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import CourseListSection from '../components/CourseListSection';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="space-y-12">
            <section className="relative overflow-hidden rounded-2xl bg-indigo-600 p-8 text-white md:p-12">
                <div className="relative z-10 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-sm"
                    >
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        AI协同学习社区
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 text-4xl font-bold italic leading-tight md:text-5xl"
                    >
                        神经网络与深度学习：
                        <br />
                        <span className="text-indigo-200">从零构建智能未来</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 max-w-xl text-base leading-relaxed text-indigo-100 md:text-lg"
                    >
                        探索前沿技术，与AI助教一同成长
                    </motion.p>
                    <div className="flex flex-wrap gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/courses')}
                            className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-600 shadow-xl shadow-indigo-900/20 transition-transform hover:scale-105"
                        >
                            立即开始学习
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/learning-paths')}
                            className="rounded-xl border border-white/20 bg-indigo-500/30 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/10"
                        >
                            查看学习路径
                        </button>
                    </div>
                </div>

                <div className="absolute top-0 right-0 hidden h-full w-1/2 lg:block">
                    <div className="absolute inset-0 z-10 bg-gradient-to-l from-indigo-600 to-transparent" />
                    <div className="flex h-full items-center justify-center bg-indigo-900 opacity-50">
                        <motion.div className="h-64 w-64 animate-ping rounded-full border-4 border-indigo-400/20" />
                        <div className="absolute h-48 w-48 rounded-full border-2 border-white/10" />
                    </div>
                </div>
            </section>

            <CourseListSection variant="preview" pageSize={6} />
        </div>
    );
}
