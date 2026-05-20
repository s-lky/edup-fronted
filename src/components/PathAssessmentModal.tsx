import { useEffect, useState } from 'react';
import { X, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { learningPathAPI, type PathAssessmentQuestion, type PathAssessmentResult } from '../api';
import { cn } from '../lib/utils';

interface PathAssessmentModalProps {
    pathId: string;
    pathTitle: string;
    open: boolean;
    onClose: () => void;
    onComplete: (result: PathAssessmentResult) => void;
}

export default function PathAssessmentModal({
    pathId,
    pathTitle,
    open,
    onClose,
    onComplete,
}: PathAssessmentModalProps) {
    const [questions, setQuestions] = useState<PathAssessmentQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setStep(0);
        setAnswers({});
        setError('');
        setLoading(true);
        learningPathAPI
            .getAssessment(pathId)
            .then(setQuestions)
            .catch((e) => setError(e.message || '加载测评失败'))
            .finally(() => setLoading(false));
    }, [open, pathId]);

    const current = questions[step];
    const isLast = step >= questions.length - 1;

    const handleSubmit = async () => {
        if (questions.some((q) => answers[q.id] === undefined)) {
            setError('请完成全部题目');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const result = await learningPathAPI.submitAssessment(pathId, answers);
            onComplete(result);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : '提交失败');
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-indigo-600">
                                <Sparkles size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest">
                                    AI 入学测评
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{pathTitle}</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                完成 {questions.length} 道题，AI 将为你定制专属学习路径
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {loading && (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
                    )}

                    {!loading && current && (
                        <>
                            <div className="mb-4 flex gap-1">
                                {questions.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'h-1 flex-1 rounded-full',
                                            i <= step ? 'bg-indigo-600' : 'bg-slate-200',
                                        )}
                                    />
                                ))}
                            </div>
                            <p className="mb-1 text-xs font-bold text-indigo-600">
                                第 {step + 1} / {questions.length} 题 · 阶段{current.stageOrder}
                            </p>
                            <h3 className="mb-4 text-lg font-bold text-slate-800">{current.question}</h3>
                            <div className="space-y-3">
                                {current.options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() =>
                                            setAnswers((prev) => ({ ...prev, [current.id]: idx }))
                                        }
                                        className={cn(
                                            'w-full rounded-xl border-2 p-4 text-left text-sm font-medium transition-all',
                                            answers[current.id] === idx
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                : 'border-slate-200 hover:border-indigo-300',
                                        )}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-6 flex gap-3">
                                {step > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setStep((s) => s - 1)}
                                        className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600"
                                    >
                                        上一题
                                    </button>
                                )}
                                {!isLast ? (
                                    <button
                                        type="button"
                                        disabled={answers[current.id] === undefined}
                                        onClick={() => setStep((s) => s + 1)}
                                        className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                                    >
                                        下一题 <ChevronRight size={16} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={handleSubmit}
                                        className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                生成专属路径 <Sparkles size={16} />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
