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
// 组件初始化与状态定义
export default function LearningPathDetailPage() {
    // 路由动态参数，当前查看的学习路径唯一标识
    const { pathId } = useParams<{ pathId: string }>();
    // 路径完整详情数据
    const [detail, setDetail] = useState<LearningPathDetail | null>(null);
    // 接口加载状态
    const [loading, setLoading] = useState(true);
    // 异常请求文案
    const [error, setError] = useState('');
    // 控制AI测评弹窗显隐
    const [showAssessment, setShowAssessment] = useState(false);
    // 本次最新测评返回结果
    const [aiResult, setAiResult] = useState<PathAssessmentResult | null>(null);

    // 加载路径详情方法
    const loadDetail = () => {
        if (!pathId) return;
        setLoading(true);
        learningPathAPI
            .getDetail(pathId)
            .then((data) => {
                setDetail(data);
                // 后端标记需要测评，自动弹出弹窗
                if (data.needsAssessment) {
                    setShowAssessment(true);
                }
            })
            .catch((e) => setError(e.message || '加载失败'))
            .finally(() => setLoading(false));
    };
    // 路由监听触发刷新
    useEffect(() => {
        loadDetail();
    }, [pathId]);
    // 测评完成回调
    const handleAssessmentComplete = (result: PathAssessmentResult) => {
        setAiResult(result);
        setShowAssessment(false);
        loadDetail();
    };
    // 兜底页面渲染
    // 旋转加载图标
    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }
    // 请求失败、数据不存在
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
    // 页面主体渲染
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Link
                to="/learning-paths"
                className="inline-flex items-center gap-1 text-base font-medium text-slate-500 hover:text-indigo-600"
            >
                <ArrowLeft size={18} /> 返回路径列表
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold italic text-slate-900">{detail.title}</h1>
                    <p className="mt-2 max-w-2xl text-base text-slate-500">{detail.description}</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowAssessment(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-base font-bold text-indigo-700 hover:bg-indigo-100"
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
                        <span className="text-base font-bold">AI 定制建议</span>
                    </div>
                    <p className="text-base text-slate-700">
                        {aiResult?.summary ?? detail.assessmentSummary}
                    </p>
                    {aiResult?.aiRecommendation && (
                        <p className="mt-2 text-base font-medium text-indigo-600">
                            {aiResult.aiRecommendation}
                        </p>
                    )}
                    {aiResult && aiResult.skippedStageOrders.length > 0 && (
                        <p className="mt-2 text-sm text-slate-500">
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
