import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {User, Clock, BookOpen, Receipt, ChevronRight, Camera, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { useUserProfile } from '../context/UserProfileContext';
import { MOCK_USER } from '../mockData';
import { cn } from '../lib/utils';
import { orderAPI, progressAPI } from '../api/index';

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
const { profile, setProfile, resetProfile, loading: profileLoading } = useUserProfile();
const [draftName, setDraftName] = useState(profile.displayName);
const [savedHint, setSavedHint] = useState(false);
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
    const fetchData = async () => {
        try {
            const [purchased, orders, stats] = await Promise.all([
                orderAPI.getPurchasedCourses(),
                orderAPI.getList({ page: 1, pageSize: 10 }),
                progressAPI.getStats()
            ]);
            
            setPurchasedCourses(purchased || []);
            setMyOrders((orders as any)?.items || []);
            if (stats) {
                setLearningStats({
                    totalMinutes: (stats as any).totalMinutes || 0,
                    completedVideos: (stats as any).completedVideos || 0
                });
            }
        } catch (error) {
            console.error('获取数据失败:', error);
        } finally {
            setLoading(false);
        }
    };
    
    fetchData();
}, []);

const handleSaveProfile = () => {
    setProfile({ displayName: draftName });
    setSavedHint(true);
    window.setTimeout(() => setSavedHint(false), 2000);
};

const pickAvatar = (seed: string) => {
    setProfile({ avatarUrl: dicebearUrl(seed) });
};

if (loading || profileLoading) {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );
}

return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                <User size={14} />
                个人中心
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 italic">
                你好，{profile.displayName}
            </h1>
                <p className="mt-1 text-sm text-slate-500">
                    管理头像与昵称，查看已购课程与学习数据。
                </p>
            </div>
        <div className="flex flex-wrap gap-2">
            <Link
                to="/rankings"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-600"
            >
                <Trophy size={14} />
                成长路径
            </Link>
            <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors hover:bg-indigo-700"
            >
                <BookOpen size={14} />
                继续学习
            </Link>
        </div>
    </div>

    {/* 资料：头像 + 昵称 */}
    <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-polish overflow-hidden"
    >
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-white px-6 py-4">
            <h2 className="text-sm font-bold text-slate-800">资料设置</h2>
            <p className="text-xs text-slate-500">修改头像、昵称</p>
        </div>
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex flex-col items-center gap-3 sm:items-start">
                <div className="relative">
                    <img
                    src={profile.avatarUrl}
                    alt=""
                    className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg ring-2 ring-indigo-100"
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md">
                    <Camera size={14} />
                    </span>
                </div>
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:text-left">
                    点击预设更换头像
                </p>
            </div>
            <div className="min-w-0 flex-1 space-y-4">
                <div>
                    <label
                    htmlFor="nickname"
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                    昵称
                    </label>
                    <input
                    id="nickname"
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    maxLength={24}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-shadow focus:ring-2 focus:ring-indigo-500"
                    placeholder="输入昵称"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="button-polish px-5 py-2 text-xs"
                    >
                    保存昵称
                    </button>
                    <button
                    type="button"
                    onClick={() => {
                        resetProfile();
                        setDraftName(MOCK_USER.name);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
                    >
                    <RotateCcw size={14} />
                    恢复默认
                    </button>
                        {savedHint && (
                        <span className="flex items-center text-xs font-semibold text-emerald-600">
                            已保存
                        </span>
                        )}
                </div>
            </div>
        </div>

        <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            头像预设
            </p>
                <div className="flex flex-wrap gap-3">
                {AVATAR_PRESETS.map((p) => (
                    <button
                        key={p.seed}
                        type="button"
                        onClick={() => pickAvatar(p.seed)}
                        className={cn(
                            'group flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all',
                            profile.avatarUrl === dicebearUrl(p.seed)
                            ? 'border-indigo-600 bg-indigo-50/50'
                            : 'border-transparent bg-slate-50 hover:border-indigo-200',
                        )}
                        >
                    <img
                        src={dicebearUrl(p.seed)}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover"
                    />
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600">
                        {p.label}
                    </span>
                    </button>
                ))}
                </div>
            </div>
        </div>
    </motion.section>

    {/* 学习时长 + 角色 */}
    <div className="grid gap-4 sm:grid-cols-2">
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-polish p-6"
        >
        <div className="flex items-start justify-between gap-4">
            <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                我的学习时长
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight text-indigo-600">
                {formatStudyMinutes(learningStats.totalMinutes)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
                累计有效观看时长
            </p>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                <Clock size={22} />
            </div>
        </div>
        </motion.div>
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-polish p-6"
        >
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    已完成课时
                </p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                    {learningStats.completedVideos}
                    <span className="ml-1 text-base font-bold text-slate-400">节</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    与排行榜积分联动
                </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                <Sparkles size={22} />
            </div>
        </div>
        </motion.div>
    </div>

    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-600">
        <span className="font-bold text-slate-700">账号角色：</span>
        {roleLabel[MOCK_USER.role]} · ID {MOCK_USER.id}
    </div>

    {/* 已购课程 */}
    <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-lg font-bold italic text-slate-800">我的已购课程</h2>
            <span className="text-xs font-semibold text-slate-400">
                共 {purchasedCourses.length} 门
            </span>
        </div>
        {purchasedCourses.length === 0 ? (
        <div className="card-polish p-10 text-center text-sm text-slate-500">
            暂无已购课程，去学习中心逛逛吧。
            <Link
               to="/"
               className="mt-3 inline-flex items-center gap-1 font-bold text-indigo-600 hover:underline"
            >
            前往选课 <ChevronRight size={14} />
            </Link>
        </div>
        ) : (
        <div className="space-y-3">
            {purchasedCourses.map((course) => {
                const first = course.videos?.[0];
                if (!first) {
                    return (
                    <div
                        key={course.id}
                        className="card-polish flex cursor-not-allowed items-center gap-4 p-4 opacity-75"
                        title="课时即将上线"
                    >
                        <img
                        src={course.thumbnail}
                        alt=""
                        className="h-16 w-24 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800">{course.title}</p>
                        <p className="text-xs text-indigo-600">{course.category}</p>
                        <p className="mt-1 text-xs text-amber-600">课时筹备中，暂不可播放</p>
                        </div>
                        <ChevronRight size={18} className="shrink-0 text-slate-200" />
                    </div>
                    );
                }
            return (
                <Link
                    key={course.id}
                    to={`/play/${course.id}/${first.id}`}
                    className="card-polish group flex items-center gap-4 p-4 transition-shadow hover:shadow-md"
                >
                <img
                    src={course.thumbnail}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 group-hover:text-indigo-600">
                        {course.title}
                    </p>
                    <p className="text-xs text-indigo-600">{course.category}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {course.videoCount || course.videos?.length || 0} 个课时
                    </p>
                </div>
                <ChevronRight
                    size={18}
                    className="shrink-0 text-slate-300 group-hover:text-indigo-500"
                />
                </Link>
            );
            })}
        </div>
        )}
    </section>

    {/* 订单 */}
    <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-lg font-bold italic text-slate-800">订单记录</h2>
            <Receipt size={18} className="text-slate-300" />
        </div>
        <div className="card-polish divide-y divide-slate-100 overflow-hidden">
            {myOrders.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">暂无订单</div>
            ) : (
            myOrders.map((order) => {
            return (
                <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"
                    >
                    <div>
                        <p className="text-sm font-bold text-slate-800">
                        {order.courseTitle ?? order.courseId}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                    <p className="text-sm font-black text-indigo-600">¥{order.amount}</p>
                </div>
                );
            })
        )}
        </div>
    </section>
    </div>
);
}