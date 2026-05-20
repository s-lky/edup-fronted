import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import {
    learningPathAPI,
    type LearningPathDetail,
    type PathAssessmentResult,
} from '../api';
import PathSubwayMap from '../components/PathSubwayMap';
import PathAssessmentModal from '../components/PathAssessmentModal';

export default function LearningPathDetailPage() {
    const { pathId } = useParams<{ pathId: string }>();
    const [detail, setDetail] = useState<LearningPathDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAssessment, setShowAssessment] = useState(false);
    const [aiResult, setAiResult] = useState<PathAssessmentResult | null>(null);

    const loadDetail = () => {
        if (!pathId) return;
        setLoading(true);
        learningPathAPI
            .getDetail(pathId)
            .then((data) => {
                setDetail(data);
                if (data.needsAssessment) {
                    setShowAssessment(true);
                }
            })
            .catch((e) => setError(e.message || '加载失败'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadDetail();
    }, [pathId]);

    const handleAssessmentComplete = (result: PathAssessmentResult) => {
        setAiResult(result);
        setShowAssessment(false);
        loadDetail();
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="space-y-4 text-center">
                <p className="text-red-500">{error || '路径不存在'}</p>
                <Link to="/learning-paths" className="text-indigo-600 hover:underline">
                    返回路径列表
                </Link>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Link
                to="/learning-paths"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600"
            >
                <ArrowLeft size={16} /> 返回路径列表
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold italic text-slate-900">{detail.title}</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500">{detail.description}</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowAssessment(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
                >
                    <Sparkles size={16} />
                    重新测评 / 定制路径
                </button>
            </div>

            {(aiResult || detail.assessmentSummary) && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-5"
                >
                    <div className="mb-2 flex items-center gap-2 text-indigo-700">
                        <Sparkles size={18} />
                        <span className="font-bold">AI 定制建议</span>
                    </div>
                    <p className="text-sm text-slate-700">
                        {aiResult?.summary ?? detail.assessmentSummary}
                    </p>
                    {aiResult?.aiRecommendation && (
                        <p className="mt-2 text-sm font-medium text-indigo-600">
                            {aiResult.aiRecommendation}
                        </p>
                    )}
                    {aiResult && aiResult.skippedStageOrders.length > 0 && (
                        <p className="mt-2 text-xs text-slate-500">
                            已跳过阶段：{aiResult.skippedStageOrders.join('、')}，从阶段
                            {aiResult.startStageOrder} 开始学习
                        </p>
                    )}
                </motion.div>
            )}

            <PathSubwayMap stages={detail.stages} overallProgress={detail.overallProgress} />

            <PathAssessmentModal
                pathId={detail.id}
                pathTitle={detail.title}
                open={showAssessment}
                onClose={() => setShowAssessment(false)}
                onComplete={handleAssessmentComplete}
            />
        </motion.div>
    );
}
