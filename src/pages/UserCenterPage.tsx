import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {User, Clock, BookOpen, Receipt, ChevronRight, Camera, RotateCcw, Sparkles, Trophy, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { useUserProfile } from '../context/UserProfileContext';
import { MOCK_USER } from '../mockData';
import { cn } from '../lib/utils';
import { orderAPI, progressAPI, uploadAPI } from '../api/index';
import { useAuth } from '../context/AuthContext';

const AVATAR_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const AVATAR_PRESETS = [
    { label: '活力', seed: 'Felix' },
    { label: '清新', seed: 'Aneka' },
    { label: '专注', seed: 'Lily' },
    { label: '极客', seed: 'Bob' },
    { label: '沉稳', seed: 'Caleb' },
    { label: '阳光', seed: 'Coco' },
] as const;

function dicebearUrl(seed: string) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

function formatStudyMinutes(total: number) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h <= 0) return `${m} 分钟`;
    if (m === 0) return `${h} 小时`;
    return `${h} 小时 ${m} 分钟`;
}

const roleLabel: Record<string, string> = {
    learner: '学员',
    instructor: '讲师',
    admin: '管理员',
};

interface PurchasedCourse {
    id: string;
    title: string;
    thumbnail: string;
    category: string;
    videoCount?: number;
    videos?: Array<{ id: string; title: string }>;
    purchasedAt?: string;
}

interface OrderItem {
    id: string;
    courseId: string;
    courseTitle?: string;
    amount: number;
    status: 'paid' | 'pending';
    createdAt: string;
}

export default function UserCenterPage() {
const { user } = useAuth();
const { profile, setProfile, resetProfile, loading: profileLoading } = useUserProfile();
const isLearner = !user || user.role === 'learner';
const [draftName, setDraftName] = useState(profile.displayName);
const [draftAvatarUrl, setDraftAvatarUrl] = useState(profile.avatarUrl);
const [savedHint, setSavedHint] = useState(false);
const [avatarSavedHint, setAvatarSavedHint] = useState(false);
const [avatarError, setAvatarError] = useState('');
const [savingAvatar, setSavingAvatar] = useState(false);
const [uploadingAvatar, setUploadingAvatar] = useState(false);
const avatarInputRef = useRef<HTMLInputElement>(null);
const [purchasedCourses, setPurchasedCourses] = useState<PurchasedCourse[]>([]);
const [myOrders, setMyOrders] = useState<OrderItem[]>([]);
const [learningStats, setLearningStats] = useState({
    totalMinutes: MOCK_USER.learningStats.totalMinutes,
    completedVideos: MOCK_USER.learningStats.completedVideos
});
const [loading, setLoading] = useState(true);

useEffect(() => {
    setDraftName(profile.displayName);
}, [profile.displayName]);

useEffect(() => {
    setDraftAvatarUrl(profile.avatarUrl);
}, [profile.avatarUrl]);

useEffect(() => {
    const fetchData = async () => {
        const tasks: Promise<unknown>[] = [
            orderAPI.getPurchasedCourses(),
            orderAPI.getList({ page: 1, pageSize: 10 }),
        ];
        if (isLearner) {
            tasks.push(progressAPI.getStats());
        }

        const results = await Promise.allSettled(tasks);

        const purchasedResult = results[0];
        if (purchasedResult.status === 'fulfilled') {
            setPurchasedCourses(purchasedResult.value as PurchasedCourse[]);
        } else {
            console.error('已购课程加载失败:', purchasedResult.reason);
        }

        const ordersResult = results[1];
        if (ordersResult.status === 'fulfilled') {
            const orders = ordersResult.value as { items?: OrderItem[] };
            setMyOrders(orders?.items ?? []);
        } else {
            console.error('订单加载失败:', ordersResult.reason);
        }

        if (isLearner && results[2]) {
            const statsResult = results[2];
            if (statsResult.status === 'fulfilled') {
                const stats = statsResult.value as {
                    totalMinutes?: number;
                    completedVideos?: number;
                };
                setLearningStats({
                    totalMinutes: stats.totalMinutes ?? 0,
                    completedVideos: stats.completedVideos ?? 0,
                });
            } else {
                console.error('学习统计加载失败:', statsResult.reason);
            }
        }

        setLoading(false);
    };

    fetchData();
}, [isLearner]);

const handleSaveProfile = async () => {
    const ok = await setProfile({ displayName: draftName });
    if (ok) {
        setSavedHint(true);
        window.setTimeout(() => setSavedHint(false), 2000);
    }
};

const pickAvatar = (seed: string) => {
    setAvatarError('');
    setDraftAvatarUrl(dicebearUrl(seed));
};

const hasAvatarChanges = draftAvatarUrl.trim() !== profile.avatarUrl.trim();

const handleSaveAvatar = async () => {
    if (!hasAvatarChanges) return;
    setAvatarError('');
    setSavingAvatar(true);
    const ok = await setProfile({ avatarUrl: draftAvatarUrl });
    setSavingAvatar(false);
    if (ok) {
        setAvatarSavedHint(true);
        window.setTimeout(() => setAvatarSavedHint(false), 2000);
    } else {
        setAvatarError('头像保存失败，请稍后重试');
    }
};

const handleAvatarFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAvatarError('');

    if (!file.type.startsWith('image/')) {
        setAvatarError('请选择 JPG、PNG、GIF 或 WebP 格式的图片');
        return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
        setAvatarError('头像图片不能超过 2MB');
        return;
    }

    setUploadingAvatar(true);
    try {
        const { url } = await uploadAPI.uploadAvatar(file);
        setDraftAvatarUrl(url);
        const ok = await setProfile({ avatarUrl: url });
        if (ok) {
            setAvatarSavedHint(true);
            window.setTimeout(() => setAvatarSavedHint(false), 2000);
        } else {
            setAvatarError('头像已上传但保存失败，请点击「保存头像」重试');
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '头像上传失败';
        setAvatarError(message);
    } finally {
        setUploadingAvatar(false);
    }
};

if (loading || profileLoading) {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );
}

return (
    <div className="mx-auto max-w-7xl space-y-10 pb-16 text-base">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                <User size={16} />
                个人中心
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 italic">
                你好，{profile.displayName}
            </h1>
                <p className="mt-2 text-base text-slate-500">
                    {isLearner
                        ? '管理头像与昵称，查看已购课程与学习数据。'
                        : '管理头像与昵称，查看账号与订单信息。'}
                </p>
            </div>
        <div className="flex flex-wrap gap-3">
            <Link
                to="/rankings"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-600"
            >
                <Trophy size={16} />
                成长路径
            </Link>
            <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-indigo-700"
            >
                <BookOpen size={16} />
                继续学习
            </Link>
        </div>
    </div>

    <div className="grid gap-10 lg:grid-cols-2 lg:items-stretch">
    {/* 左侧：资料设置（占满左栏） */}
    <div className="flex min-h-0 flex-col gap-6">
    <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-polish flex flex-1 flex-col overflow-hidden"
    >
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-white px-8 py-5">
            <h2 className="text-lg font-bold text-slate-800">资料设置</h2>
            <p className="mt-0.5 text-sm text-slate-500">修改头像、昵称</p>
        </div>
        <div className="flex flex-1 flex-col space-y-8 p-8">
            <input
                ref={avatarInputRef}
                type="file"
                accept={AVATAR_ACCEPT}
                className="hidden"
                onChange={handleAvatarFileChange}
            />
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                <div className="flex shrink-0 flex-col items-center gap-4 lg:items-start">
                <div className="relative">
                    <img
                    src={draftAvatarUrl}
                    alt=""
                    className="h-32 w-32 rounded-2xl border-4 border-white object-cover shadow-lg ring-2 ring-indigo-100 lg:h-36 lg:w-36"
                    />
                    <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    title="上传头像"
                    className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md transition-colors hover:bg-indigo-700 disabled:opacity-60"
                    >
                    <Camera size={18} />
                    </button>
                </div>
                <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 lg:text-left">
                    选择预设或上传图片，确认后保存
                </p>
                <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
                    >
                    <Upload size={16} />
                    {uploadingAvatar ? '上传中…' : '上传头像'}
                    </button>
                    <button
                    type="button"
                    onClick={handleSaveAvatar}
                    disabled={!hasAvatarChanges || savingAvatar || uploadingAvatar}
                    className="button-polish px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                    {savingAvatar ? '保存中…' : '保存头像'}
                    </button>
                </div>
                {avatarSavedHint && (
                    <span className="text-sm font-semibold text-emerald-600">头像已保存</span>
                )}
                {avatarError && (
                    <span className="max-w-[14rem] text-center text-sm text-red-600 lg:text-left">{avatarError}</span>
                )}
            </div>
            <div className="min-w-0 flex-1 space-y-5">
                <div>
                    <label
                    htmlFor="nickname"
                    className="text-xs font-black uppercase tracking-widest text-slate-400"
                    >
                    昵称
                    </label>
                    <input
                    id="nickname"
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    maxLength={24}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-800 outline-none transition-shadow focus:ring-2 focus:ring-indigo-500"
                    placeholder="输入昵称"
                    />
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="button-polish px-6 py-2.5 text-sm"
                    >
                    保存昵称
                    </button>
                    <button
                    type="button"
                    onClick={() => {
                        resetProfile();
                        setDraftName(MOCK_USER.name);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                    >
                    <RotateCcw size={16} />
                    恢复默认
                    </button>
                        {savedHint && (
                        <span className="flex items-center text-sm font-semibold text-emerald-600">
                            已保存
                        </span>
                        )}
                </div>
            </div>
        </div>

        <div className="mt-auto">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
            头像预设
            </p>
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                {AVATAR_PRESETS.map((p) => (
                    <button
                        key={p.seed}
                        type="button"
                        onClick={() => pickAvatar(p.seed)}
                        className={cn(
                            'group flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all',
                            draftAvatarUrl === dicebearUrl(p.seed)
                            ? 'border-indigo-600 bg-indigo-50/50'
                            : 'border-transparent bg-slate-50 hover:border-indigo-200',
                        )}
                        >
                    <img
                        src={dicebearUrl(p.seed)}
                        alt=""
                        className="h-14 w-14 rounded-lg object-cover sm:h-16 sm:w-16"
                    />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600">
                        {p.label}
                    </span>
                    </button>
                ))}
                </div>
            </div>
        </div>
    </motion.section>

    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-600">
        <span className="font-bold text-slate-700">账号角色：</span>
        {roleLabel[user?.role ?? 'learner']} · ID {user?.id ?? '—'}
    </div>
    </div>

    {/* 右侧：已购课程、订单记录、学习统计 */}
    <div className="min-w-0 space-y-10">
    <section className="space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold italic text-slate-800">我的已购课程</h2>
            <span className="text-sm font-semibold text-slate-400">
                共 {purchasedCourses.length} 门
            </span>
        </div>
        {purchasedCourses.length === 0 ? (
        <div className="card-polish p-12 text-center text-base text-slate-500">
            暂无已购课程，去学习中心逛逛吧。
            <Link
               to="/"
               className="mt-3 inline-flex items-center gap-1 font-bold text-indigo-600 hover:underline"
            >
            前往选课 <ChevronRight size={16} />
            </Link>
        </div>
        ) : (
        <div className="space-y-4">
            {purchasedCourses.map((course) => {
                const first = course.videos?.[0];
                if (!first) {
                    return (
                    <div
                        key={course.id}
                        className="card-polish flex cursor-not-allowed items-center gap-5 p-5 opacity-75"
                        title="课时即将上线"
                    >
                        <img
                        src={course.thumbnail}
                        alt=""
                        className="h-20 w-28 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-slate-800">{course.title}</p>
                        <p className="text-sm text-indigo-600">{course.category}</p>
                        <p className="mt-1 text-sm text-amber-600">课时筹备中，暂不可播放</p>
                        </div>
                        <ChevronRight size={20} className="shrink-0 text-slate-200" />
                    </div>
                    );
                }
            return (
                <Link
                    key={course.id}
                    to={`/play/${course.id}/${first.id}`}
                    className="card-polish group flex items-center gap-5 p-5 transition-shadow hover:shadow-md"
                >
                <img
                    src={course.thumbnail}
                    alt=""
                    className="h-20 w-28 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-slate-800 group-hover:text-indigo-600">
                        {course.title}
                    </p>
                    <p className="text-sm text-indigo-600">{course.category}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                        {course.videoCount || course.videos?.length || 0} 个课时
                    </p>
                </div>
                <ChevronRight
                    size={20}
                    className="shrink-0 text-slate-300 group-hover:text-indigo-500"
                />
                </Link>
            );
            })}
        </div>
        )}
    </section>

    {/* 订单 */}
    <section className="space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold italic text-slate-800">订单记录</h2>
            <Receipt size={20} className="text-slate-300" />
        </div>
        <div className="card-polish divide-y divide-slate-100 overflow-hidden">
            {myOrders.length === 0 ? (
                <div className="p-10 text-center text-base text-slate-500">暂无订单</div>
            ) : (
            myOrders.map((order) => {
            return (
                <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6"
                    >
                    <div>
                        <p className="text-base font-bold text-slate-800">
                        {order.courseTitle ?? order.courseId}
                        </p>
                        <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()} ·{' '}
                        <span
                            className={
                            order.status === 'paid'
                                ? 'text-emerald-600'
                                : 'text-amber-600'
                            }
                        >
                            {order.status === 'paid' ? '已支付' : '待支付'}
                        </span>
                        </p>
                    </div>
                    <p className="text-base font-black text-indigo-600">¥{order.amount}</p>
                </div>
                );
            })
        )}
        </div>
    </section>

    {isLearner && (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-5 sm:grid-cols-2"
    >
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-polish p-7"
        >
        <div className="flex items-start justify-between gap-4">
            <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                我的学习时长
            </p>
            <p className="mt-3 text-4xl font-black tracking-tight text-indigo-600">
                {formatStudyMinutes(learningStats.totalMinutes)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
                累计有效观看时长
            </p>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600">
                <Clock size={26} />
            </div>
        </div>
        </motion.div>
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-polish p-7"
        >
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    已完成课时
                </p>
                <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">
                    {learningStats.completedVideos}
                    <span className="ml-1 text-lg font-bold text-slate-400">节</span>
                </p>
                <p className="mt-2 text-sm text-slate-500">
                    与排行榜积分联动
                </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 text-amber-600">
                <Sparkles size={26} />
            </div>
        </div>
        </motion.div>
    </motion.div>
    )}
    </div>
    </div>
    </div>
);
}
