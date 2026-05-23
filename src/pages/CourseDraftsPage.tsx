import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, FileEdit, Loader2, Plus, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { courseAPI, type DraftCourseItem } from '../api';
import CreateCourseModal from '../components/CreateCourseModal';
import { cn } from '../lib/utils';

const PLACEHOLDER_THUMB =
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80';

    // 组件入口 & 权限判定
export default function CourseDraftsPage() {
    const { user } = useAuth();
    // 仅管理员、讲师拥有草稿管理权限
    const canManage = user?.role === 'admin' || user?.role === 'instructor';

    // 页面状态定义
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<DraftCourseItem[]>([]);
    // 创建 / 编辑弹窗开关
    const [modalOpen, setModalOpen] = useState(false);
    // 当前正在编辑的草稿 ID，为空代表新建
    const [editingId, setEditingId] = useState<string | null>(null);
    // 触发列表重新请求刷新
    const [refreshKey, setRefreshKey] = useState(0);

    // 数据请求副作用
    useEffect(() => {
        if (!canManage) return;

        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                // 一页最多拉取50条草稿
                const res = await courseAPI.listDrafts(1, 50);
                if (!cancelled) {
                    setDrafts(res.list ?? []);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : '加载草稿失败');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        // 组件卸载终止请求，防止内存泄漏
        load();
        return () => {
            cancelled = true;
        };
    }, [canManage, refreshKey]);

    // 无权限拦截重定向
    if (!canManage) {
        return <Navigate to="/admin" replace />;
    }
    // 新建课程草稿
    const openCreate = () => {
        setEditingId(null);
        setModalOpen(true);
    };
    // 编辑已有草稿
    const openEdit = (id: string) => {
        setEditingId(id);
        setModalOpen(true);
    };
    // 关闭弹窗、清空编辑标识
    const handleModalClose = () => {
        setModalOpen(false);
        setEditingId(null);
    };
    // 刷新列表数据
    const reload = () => setRefreshKey((k) => k + 1);

    return (
        <div className="space-y-8 pb-20">
            {/* 返回上级页面链接 */}
            <motion.div  
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <Link
                        to="/admin"
                        className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:underline"
                    >
                        <ArrowLeft size={16} />
                        返回管理看板
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">课程草稿</h1>
                    <p className="mt-1 text-gray-500">
                        保存的草稿仅自己可见，完善后可发布到学习中心
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700"
                >
                    <Plus size={20} />
                    新建课程
                </button>
            </motion.div>

            {loading ? (
                <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
                    {error}
                </div>
            ) : drafts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
                    <Video className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-gray-500">暂无草稿</p>
                    <p className="mt-1 text-sm text-gray-400">
                        新建课程时点击「仅保存草稿」，或关闭弹窗时选择保存到草稿
                    </p>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
                    >
                        去新建课程
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* 草稿卡片网格 */}
                    {drafts.map((draft, i) => (
                        <motion.div
                            key={draft.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
                        >
                            <img
                                src={draft.thumbnail || PLACEHOLDER_THUMB}
                                alt=""
                                className="h-36 w-full object-cover"
                            />
                            <div className="p-5">
                                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                     {/* 草稿标签、标题、分类、视频数量、更新时间 */}
                                    草稿
                                </span>
                                <h3 className="mt-2 line-clamp-2 font-bold text-gray-900">
                                    {draft.title}
                                </h3>
                                <p className="mt-1 text-xs font-medium text-indigo-600">
                                    {draft.category}
                                </p>
                                <p className="mt-2 text-xs text-gray-400">
                                    {draft.videoCount} 个视频 · 更新于{' '}
                                    {new Date(draft.updatedAt).toLocaleString('zh-CN')}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => openEdit(draft.id)}
                                    className={cn(
                                        'mt-4 flex w-full items-center justify-center gap-2 rounded-xl',
                                        'border border-indigo-200 bg-indigo-50 py-2.5 text-sm font-bold text-indigo-700',
                                        'transition-colors hover:bg-indigo-100',
                                    )}
                                >
                                    <FileEdit size={16} />
                                    继续编辑
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            {/* 课程编辑创建弹窗挂载 */}
            <CreateCourseModal
                open={modalOpen}
                onClose={handleModalClose}
                onSuccess={reload}
                editingCourseId={editingId}
            />
        </div>
    );
}
