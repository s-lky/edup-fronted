import { useNavigate } from 'react-router-dom';
import { Check, Lock, Play, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { PathStage } from '../api';
import { cn } from '../lib/utils';

interface PathSubwayMapProps {
    stages: PathStage[];
    overallProgress: number;
}

const STATUS_LABEL: Record<string, string> = {
    not_started: '未开始',
    in_progress: '学习中',
    completed: '已完成',
    skipped: '已掌握',
};

export default function PathSubwayMap({ stages, overallProgress }: PathSubwayMapProps) {
    const navigate = useNavigate();

    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
        >
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">路径总完成度</span>
                    <span className="text-2xl font-black text-indigo-600">{overallProgress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    />
                </div>
            </div>

            <div className="overflow-x-auto pb-4">
                <div className="relative min-w-[720px] px-4">
                    <div className="absolute left-8 right-8 top-10 h-1 bg-slate-200" />
                    <div
                        className="absolute left-8 top-10 h-1 bg-indigo-500 transition-all duration-700"
                        style={{ width: `calc((100% - 4rem) * ${overallProgress / 100})` }}
                    />

                    <div className="relative flex justify-between gap-4">
                        {stages.map((stage, si) => (
                            <motion.div
                                key={stage.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: si * 0.08 }}
                                className="flex w-[22%] min-w-[160px] flex-col items-center"
                            >
                                <div
                                    className={cn(
                                        'relative z-10 flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 text-center shadow-sm',
                                        stage.skipped
                                            ? 'border-emerald-300 bg-emerald-50'
                                            : stage.stageProgressPercent >= 100
                                              ? 'border-indigo-500 bg-indigo-600 text-white'
                                              : stage.stageProgressPercent > 0
                                                ? 'border-indigo-400 bg-white'
                                                : 'border-slate-200 bg-slate-50',
                                    )}
                                >
                                    {stage.skipped ? (
                                        <Sparkles className="mb-0.5 h-5 w-5 text-emerald-600" />
                                    ) : stage.stageProgressPercent >= 100 ? (
                                        <Check className="h-7 w-7" />
                                    ) : (
                                        <span className="text-lg font-black text-indigo-600">
                                            {stage.stageOrder}
                                        </span>
                                    )}
                                    <span className="mt-0.5 text-[9px] font-bold uppercase text-slate-500">
                                        {stage.stageProgressPercent}%
                                    </span>
                                </div>

                                <h3 className="mt-3 line-clamp-2 text-center text-xs font-bold text-slate-800">
                                    {stage.title}
                                </h3>
                                {stage.skipped && (
                                    <span className="mt-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                        AI 已跳过
                                    </span>
                                )}

                                <div className="mt-4 w-full space-y-2">
                                    {stage.nodes.map((node) => (
                                        <button
                                            key={node.id}
                                            type="button"
                                            disabled={node.locked}
                                            onClick={() =>
                                                !node.locked &&
                                                navigate(`/play/${node.courseId}/${node.videoId}`)
                                            }
                                            className={cn(
                                                'w-full rounded-xl border p-3 text-left transition-all',
                                                node.status === 'completed' || node.status === 'skipped'
                                                    ? 'border-green-200 bg-green-50/80'
                                                    : node.status === 'in_progress'
                                                      ? 'border-indigo-200 bg-indigo-50/80 hover:shadow-md'
                                                      : node.locked
                                                        ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60'
                                                        : 'border-slate-200 bg-white hover:border-indigo-300',
                                            )}
                                        >
                                            <div className="flex items-start gap-2">
                                                <span
                                                    className={cn(
                                                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                                                        node.status === 'completed' || node.status === 'skipped'
                                                            ? 'bg-green-500 text-white'
                                                            : node.status === 'in_progress'
                                                              ? 'bg-indigo-500 text-white'
                                                              : 'bg-slate-200 text-slate-400',
                                                    )}
                                                >
                                                    {node.locked ? (
                                                        <Lock size={12} />
                                                    ) : node.status === 'completed' ||
                                                      node.status === 'skipped' ? (
                                                        <Check size={12} />
                                                    ) : (
                                                        <Play size={12} />
                                                    )}
                                                </span>
                                                <span className="min-w-0 flex-1 block">
                                                    <span className="line-clamp-2 block text-xs font-bold text-slate-800">
                                                        {node.title}
                                                    </span>
                                                    <span className="mt-0.5 block text-[10px] text-slate-500">
                                                        {node.courseTitle}
                                                    </span>
                                                    <span className="mt-1 block text-[10px] font-bold text-indigo-600">
                                                        {STATUS_LABEL[node.status]}
                                                        {node.status === 'in_progress' &&
                                                            ` ${node.progressPercent}%`}
                                                    </span>
                                                    {node.status === 'in_progress' && (
                                                        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-slate-200">
                                                            <span
                                                                className="block h-full rounded-full bg-indigo-500"
                                                                style={{
                                                                    width: `${node.progressPercent}%`,
                                                                }}
                                                            />
                                                        </span>
                                                    )}
                                                </span>
                                                {!node.locked && (
                                                    <ChevronRight size={12} className="text-slate-400" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
