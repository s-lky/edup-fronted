import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, Clock, Layers, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { learningPathAPI, type LearningPathSummary } from '../api';

export default function LearningPathsPage() {
    const [paths, setPaths] = useState<LearningPathSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        learningPathAPI
            .list()
            .then(setPaths)
            .catch((e) => setError(e.message || '加载失败'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <motion.div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <header>
                <h1 className="text-2xl font-bold italic text-slate-900">学习路径</h1>
                <p className="mt-1 text-sm text-slate-500">
                    选择系统化成长路线，AI 测评后可生成专属定制路径
                </p>
            </header>

            {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">{error}</p>
            ) : null}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {paths.map((path, i) => (
                    <motion.article
                        key={path.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-200 hover:shadow-lg"
                    >
                        <Link to={`/learning-paths/${path.id}`} className="group flex">
                            <img
                                src={path.thumbnail}
                                alt=""
                                className="h-full w-36 shrink-0 object-cover md:w-44"
                            />
                            <div className="flex flex-1 flex-col p-5">
                                <p className="mb-2 flex items-center gap-2 text-xs font-bold text-indigo-600">
                                    <Map size={16} />
                                    {path.category}
                                </p>
                                <h2 className="mb-2 text-lg font-bold text-slate-900 group-hover:text-indigo-600">
                                    {path.title}
                                </h2>
                                <p className="mb-4 line-clamp-2 flex-1 text-xs text-slate-500">
                                    {path.description}
                                </p>
                                <p className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Layers size={12} />
                                        {path.stageCount} 阶段
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {path.estimatedHours}h
                                    </span>
                                </p>
                                {path.hasStarted ? (
                                    <motion.div className="mt-3">
                                        <p className="mb-1 flex justify-between text-xs">
                                            <span className="text-slate-500">学习进度</span>
                                            <span className="font-bold text-indigo-600">
                                                {path.overallProgress ?? 0}%
                                            </span>
                                        </p>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-indigo-500 transition-all"
                                                style={{ width: `${path.overallProgress ?? 0}%` }}
                                            />
                                        </div>
                                    </motion.div>
                                ) : null}
                                <p className="mt-4 flex items-center justify-between text-xs font-bold text-indigo-600">
                                    <span className="flex items-center gap-1">
                                        <Sparkles size={14} />
                                        {path.hasStarted ? '继续学习' : '开始测评'}
                                    </span>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500" />
                                </p>
                            </div>
                        </Link>
                    </motion.article>
                ))}
            </div>

            {!loading && paths.length === 0 && !error ? (
                <p className="py-12 text-center text-slate-500">暂无学习路径，请先执行数据库初始化脚本</p>
            ) : null}
        </motion.div>
    );
}
