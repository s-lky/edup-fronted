import { useCallback, useEffect, useState } from 'react';
import { X, Plus, Trash2, Upload, Loader2, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { courseAPI, uploadAPI, type CreateCoursePayload } from '../api';
import { COURSE_CATEGORIES } from './CourseListSection';
import { cn } from '../lib/utils';

// 单条视频草稿数据结构
export interface VideoDraft {
    id: string;
    title: string;
    file: File | null;
    url: string;  //后端返回线上视频地址
    duration: string; //格式化时长01:20
    uploading: boolean;
}
// 组件对外传参
interface CreateCourseModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    /** 编辑已有草稿时传入课程 ID */
    editingCourseId?: string | null;
}
// 过滤掉“全部”，只保留实际可选择分类
const CATEGORY_OPTIONS = COURSE_CATEGORIES.filter((c) => c !== '全部');
// 生成一条空的视频草稿项
function newVideoDraft(): VideoDraft {
    return {
        id: crypto.randomUUID(),  //浏览器原生生成唯一ID
        title: '',
        file: null,
        url: '',
        duration: '',
        uploading: false,
    };
}
// 秒数 转为 分:秒 格式
function formatDuration(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}
// 读取本地视频文件时长（核心工具）
function readVideoDuration(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        const objectUrl = URL.createObjectURL(file);
        // 读取元数据成功获取时长
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(objectUrl);  //释放内存00
            resolve(formatDuration(video.duration));
        };
        video.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('无法读取视频时长'));
        };
        video.src = objectUrl;
    });
}

export default function CreateCourseModal({
    open,
    onClose,
    onSuccess,
    editingCourseId = null,
}: CreateCourseModalProps) {
    // 课程基础表单
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[0]);
    const [price, setPrice] = useState('0');
    const [thumbnail, setThumbnail] = useState('');
    // 视频列表数组
    const [videos, setVideos] = useState<VideoDraft[]>([newVideoDraft()]);
    // 各类加载状态
    const [submitting, setSubmitting] = useState(false); //发布提交中
    const [savingDraft, setSavingDraft] = useState(false); //保存草稿中
    const [loadingDraft, setLoadingDraft] = useState(false); //编辑回显加载中
    const [error, setError] = useState(''); //全局错误提示
    const [draftConfirmOpen, setDraftConfirmOpen] = useState(false); //关闭确认弹窗

    const isEditing = Boolean(editingCourseId); //判断是否为编辑模式

    // 表单重置函数-只创建一次，弹窗新建模式打开直接清空所有表单
    const resetForm = useCallback(() => {
        setTitle('');
        setDescription('');
        setCategory(CATEGORY_OPTIONS[0]);
        setPrice('0');
        setThumbnail('');
        setVideos([newVideoDraft()]);
        setError('');
    }, []);

    // 弹窗打开监听+编辑草稿数据回显
    useEffect(() => {
        if (!open) {
            setDraftConfirmOpen(false);
            return;
        }
        // 新建模式：直接清空表单
        if (!editingCourseId) {
            resetForm();
            return;
        }
        // 编辑模式：拉取已有课程草稿数据回填
        let cancelled = false;
        setLoadingDraft(true);
        setError('');

        courseAPI
            .getForManage(editingCourseId)
            .then((detail) => {
                if (cancelled) return;
                // 回填基础信息
                setTitle(detail.title === '未命名草稿' ? '' : detail.title);
                setDescription(detail.description ?? '');
                setCategory(
                    detail.category && detail.category !== '未分类'
                        ? detail.category
                        : CATEGORY_OPTIONS[0],
                );
                setPrice(String(detail.price ?? 0));
                setThumbnail(detail.thumbnail ?? '');
                // 回填已有视频
                const loadedVideos =
                    detail.videos && detail.videos.length > 0
                        ? detail.videos.map((v) => ({
                              id: v.id,
                              title: v.title,
                              file: null,
                              url: v.url,
                              duration: v.duration,
                              uploading: false,
                          }))
                        : [newVideoDraft()];
                setVideos(loadedVideos);
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : '加载草稿失败');
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingDraft(false);
            });
        // 组件销毁、依赖变更取消请求
        return () => {
            cancelled = true;
        };
    }, [open, editingCourseId, resetForm]);
    // 视频数据局部更新
    const updateVideo = (id: string, patch: Partial<VideoDraft>) => {
        setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
    };
    // 本地视频上传逻辑
    const handleVideoFile = async (id: string, file: File | null) => {
        // 清空文件
        if (!file) {
            updateVideo(id, { file: null, url: '', duration: '' });
            return;
        }
        // 校验视频类型
        if (!file.type.startsWith('video/')) {
            setError('请选择视频文件（mp4、webm 等）');
            return;
        }
        // 标记开始上传
        updateVideo(id, { file, uploading: true });
        setError('');
        try {
            // 前端读取视频时长
            const duration = await readVideoDuration(file);
            // 调用上传接口
            const { url } = await uploadAPI.uploadVideo(file);
            // 回填线上地址+时长，结束上传
            updateVideo(id, { file, url, duration, uploading: false });
        } catch (e) {
            // 上传失败重置状态
            updateVideo(id, { file: null, url: '', duration: '', uploading: false });
            setError(e instanceof Error ? e.message : '视频上传失败');
        }
    };
    // 组装请求体函数
    const buildPayload = (publish: boolean): CreateCoursePayload => {
        const priceNum = Number(price);
        // 过滤有效已上传视频
        const validVideos = videos
            .filter((v) => v.url)
            .map((v) => ({
                title: v.title.trim() || '未命名视频',
                url: v.url,
                duration: v.duration || '0:00',
            }));

        return {
            title: title.trim(),
            description: description.trim() || undefined,
            category: category || CATEGORY_OPTIONS[0],
            price: Number.isNaN(priceNum) || priceNum < 0 ? 0 : priceNum,
            thumbnail: thumbnail.trim() || undefined,
            publish,// 核心字段：是否正式发布
            videos: validVideos.length > 0 ? validVideos : undefined,
        };
    };
    // 判断表单是否填写了内容（用来关闭弹窗判断是否存草稿）
    const hasFormContent = () => {
        if (title.trim() || description.trim() || thumbnail.trim()) return true;
        if (price !== '' && price !== '0') return true;
        return videos.some(
            (v) => v.title.trim() || v.url || v.file || v.uploading,
        );
    };
    // 发布课程严格校验
    const validateBeforePublish = () => {
        if (!title.trim()) {
            setError('请填写课程标题');
            return false;
        }
        if (!category) {
            setError('请选择课程分类');
            return false;
        }
        const priceNum = Number(price);
        if (Number.isNaN(priceNum) || priceNum < 0) {
            setError('请填写有效的课程价格');
            return false;
        }
        const validVideos = videos.filter((v) => v.title.trim() && v.url);
        if (validVideos.length === 0) {
            setError('请至少添加一个已上传的视频并填写名称');
            return false;
        }
        if (videos.some((v) => v.uploading)) {
            setError('请等待视频上传完成');
            return false;
        }
        if (videos.some((v) => (v.title.trim() || v.file) && !v.url)) {
            setError('存在未上传完成的视频，请上传或删除');
            return false;
        }
        return true;
    };
    // 保存草稿逻辑
    const handleSaveDraft = async () => {
        if (!hasFormContent()) {
            setError('请至少填写一项课程信息后再保存草稿');
            return;
        }
        if (videos.some((v) => v.uploading)) {
            setError('请等待视频上传完成');
            return;
        }

        setSavingDraft(true);
        setError('');
        try {
            const payload = buildPayload(false); //publish=flase存草稿
            // 编辑走更新接口，新建走创建接口
            if (isEditing && editingCourseId) {
                await courseAPI.update(editingCourseId, payload);
            } else {
                await courseAPI.create(payload);
            }
            onSuccess();
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : '保存草稿失败');
        } finally {
            setSavingDraft(false);
            setDraftConfirmOpen(false);
        }
    };
    // 正式发表课程逻辑
    const handleSubmit = async () => {
        if (!validateBeforePublish()) return;

        setSubmitting(true);
        setError('');
        try {
            const payload = buildPayload(true); //publish=true正式上线
            if (isEditing && editingCourseId) {
                await courseAPI.publish(editingCourseId, payload);
            } else {
                await courseAPI.create(payload);
            }
            onSuccess();
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : isEditing ? '发布失败' : '创建失败');
        } finally {
            setSubmitting(false);
        }
    };
    // 弹窗关闭拦截逻辑
    const requestClose = () => {
        // 正在请求中
        if (submitting || savingDraft || loadingDraft) return;
        // 无内容直接关
        if (!hasFormContent()) {
            onClose();
            return;
        }
        // 有内容二次确认
        setDraftConfirmOpen(true);
    };

    const busy = submitting || savingDraft || loadingDraft;

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
                onClick={requestClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-indigo-600">
                                <Video size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest">
                                    {isEditing ? '编辑草稿' : '新建课程'}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {isEditing ? '完善并发布课程' : '发布新课程'}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                可先保存草稿，稍后在草稿页继续编辑并发布
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={requestClose}
                            disabled={busy}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {loadingDraft ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-bold text-slate-700">
                                        课程标题 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="例如：React 高级进阶指南"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-bold text-slate-700">
                                            分类 <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                                        >
                                            {CATEGORY_OPTIONS.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-bold text-slate-700">
                                            价格（元）
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-bold text-slate-700">
                                        课程简介
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={2}
                                        placeholder="简要介绍课程内容…"
                                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-bold text-slate-700">
                                        封面图 URL（可选）
                                    </label>
                                    <input
                                        type="url"
                                        value={thumbnail}
                                        onChange={(e) => setThumbnail(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-700">
                                            课程视频 <span className="text-red-500">*</span>
                                            <span className="ml-1 text-xs font-normal text-slate-400">
                                                （发布时必填）
                                            </span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setVideos((prev) => [...prev, newVideoDraft()])
                                            }
                                            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                        >
                                            <Plus size={14} /> 添加视频
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {videos.map((v, index) => (
                                            <div
                                                key={v.id}
                                                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
                                            >
                                                <div className="mb-3 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-400">
                                                        视频 {index + 1}
                                                    </span>
                                                    {videos.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setVideos((prev) =>
                                                                    prev.filter(
                                                                        (item) => item.id !== v.id,
                                                                    ),
                                                                )
                                                            }
                                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={v.title}
                                                    onChange={(e) =>
                                                        updateVideo(v.id, {
                                                            title: e.target.value,
                                                        })
                                                    }
                                                    placeholder="视频名称，如：01 入门介绍"
                                                    className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                                                />
                                                <label
                                                    className={cn(
                                                        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition-colors',
                                                        v.url
                                                            ? 'border-green-200 bg-green-50/50'
                                                            : 'border-slate-200 bg-white hover:border-indigo-300',
                                                    )}
                                                >
                                                    <input
                                                        type="file"
                                                        accept="video/*"
                                                        className="hidden"
                                                        disabled={v.uploading}
                                                        onChange={(e) => {
                                                            const file =
                                                                e.target.files?.[0] ?? null;
                                                            void handleVideoFile(v.id, file);
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                    {v.uploading ? (
                                                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                                    ) : (
                                                        <Upload
                                                            className={cn(
                                                                'h-6 w-6',
                                                                v.url
                                                                    ? 'text-green-600'
                                                                    : 'text-slate-400',
                                                            )}
                                                        />
                                                    )}
                                                    <span className="mt-2 text-center text-xs font-medium text-slate-600">
                                                        {v.uploading
                                                            ? '上传中…'
                                                            : v.url
                                                              ? `已上传 · ${v.duration || '—'}`
                                                              : '点击选择视频文件'}
                                                    </span>
                                                    {v.file && !v.uploading && (
                                                        <span className="mt-1 max-w-full truncate text-[10px] text-slate-400">
                                                            {v.file.name}
                                                        </span>
                                                    )}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={requestClose}
                                    disabled={busy}
                                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 disabled:opacity-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleSaveDraft()}
                                    className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 py-3 text-sm font-bold text-indigo-700 disabled:opacity-50"
                                >
                                    {savingDraft ? (
                                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                                    ) : (
                                        '仅保存草稿'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleSubmit()}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : isEditing ? (
                                        '发布课程'
                                    ) : (
                                        '创建并发布'
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {draftConfirmOpen && (
                        <div
                            className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-black/40 p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                                <h3 className="text-lg font-bold text-slate-900">保存草稿？</h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    是否将当前填写的内容保存到草稿页？选择「不保存」将直接关闭且不会保留本次修改。
                                </p>
                                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDraftConfirmOpen(false);
                                            onClose();
                                        }}
                                        className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600"
                                    >
                                        不保存
                                    </button>
                                    <button
                                        type="button"
                                        disabled={savingDraft}
                                        onClick={() => void handleSaveDraft()}
                                        className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                                    >
                                        {savingDraft ? '保存中…' : '保存到草稿'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
