import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag,
    Play,
    Loader2,
    SearchX,
    Plus,
    CheckCircle2,
    Clock,
    Star,
    Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { courseAPI, orderAPI } from '../api';
import CreateCourseModal from '../components/CreateCourseModal';
import CourseCover from '../components/CourseCover';
import { COURSE_CATEGORIES, type Course } from '../components/CourseListSection';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const PREVIEW_LABEL = '试看 5 分钟';

const SHOP_CATEGORIES = COURSE_CATEGORIES.filter((c) => c !== '全部');

async function fetchCoursesPage(page: number, pageSize: number, category?: string) {
    const params: { page: number; pageSize: number; category?: string } = { page, pageSize };
    if (category) params.category = category;
    return courseAPI.getList(params);
}

/** 拉取某一分类下全部已发布课程（分页合并） */
async function fetchByCategory(category: string): Promise<Course[]> {
    const pageSize = 50;
    const first = await fetchCoursesPage(1, pageSize, category);
    const all = [...(first.list || [])];
    const totalPages = Math.ceil((first.total || 0) / pageSize);
    for (let page = 2; page <= totalPages; page++) {
        const res = await fetchCoursesPage(page, pageSize, category);
        all.push(...(res.list || []));
    }
    return all;
}

/** 「全部」：合并各分类课程；单分类：只拉该分类 */
async function fetchAllPublishedCourses(category?: string): Promise<Course[]> {
    if (category) {
        return fetchByCategory(category);
    }
    const batches = await Promise.all(SHOP_CATEGORIES.map((cat) => fetchByCategory(cat)));
    const merged = new Map<string, Course>();
    for (const list of batches) {
        for (const course of list) {
            merged.set(course.id, course);
        }
    }
    return Array.from(merged.values());
}

export default function PurchasableCoursesPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const canManageCourses = user?.role === 'admin' || user?.role === 'instructor';

    const [courses, setCourses] = useState<Course[]>([]);
    const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('全部');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        const category = selectedCategory !== '全部' ? selectedCategory : undefined;
        try {
            const allCourses = await fetchAllPublishedCourses(category);
            setCourses(allCourses);
        } catch (err) {
            console.error(err);
            setError('加载可购课程失败，请稍后重试');
            setCourses([]);
        }

        try {
            const purchased = await orderAPI.getPurchasedCourses();
            setPurchasedIds(new Set(purchased.map((c) => c.id)));
        } catch (err) {
            console.error('已购课程标记加载失败:', err);
            setPurchasedIds(new Set());
        } finally {
            setLoading(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const openPreview = async (course: Course) => {
        try {
            const detail = await courseAPI.getDetail(course.id);
            const firstVideo = detail.videos?.[0];
            if (!firstVideo) {
                alert('该课程暂无视频');
                return;
            }
            navigate(`/play/${course.id}/${firstVideo.id}`);
        } catch {
            alert('无法打开试看，请重试');
        }
    };

    const openFullPlay = async (course: Course) => {
        try {
            const detail = await courseAPI.getDetail(course.id);
            const firstVideo = detail.videos?.[0];
            if (!firstVideo) {
                alert('该课程暂无视频');
                return;
            }
            navigate(`/play/${course.id}/${firstVideo.id}`);
        } catch {
            alert('无法打开课程，请重试');
        }
    };

    const goCheckout = (courseId: string) => {
        navigate(`/shop/checkout/${courseId}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="-mx-4 -mt-4 w-[calc(100%+2rem)] space-y-8 text-base md:-mx-6 md:-mt-6 md:w-[calc(100%+3rem)]"
        >
            <section className="relative w-full overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 px-6 py-12 text-white md:px-10 md:py-16 lg:px-14 lg:py-20">
                <div className="relative z-10 mx-auto max-w-[1600px]">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
                        <ShoppingBag size={16} />
                        可购课程
                    </div>
                    <h1 className="text-3xl font-bold italic leading-tight md:text-5xl lg:text-6xl">
                        选购课程，解锁完整学习
                    </h1>
                    <p className="mt-4 max-w-3xl text-base leading-relaxed text-indigo-100 md:text-lg">
                        未购买课程支持 {PREVIEW_LABEL}；购买后可在个人中心的「我的已购课程」与「订单记录」中查看。
                    </p>
                    {!loading && courses.length > 0 && (
                        <p className="mt-6 text-sm font-semibold text-indigo-200">
                            共 {courses.length} 门可购课程
                        </p>
                    )}
                </div>
                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" />
            </section>

            <div className="mx-auto w-full max-w-[1600px] space-y-8 px-4 md:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div className="flex flex-wrap gap-3">
                        {COURSE_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                                    selectedCategory === cat
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    {canManageCourses && (
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
                        >
                            <Plus size={18} />
                            发布新课程
                        </button>
                    )}
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
                        <p className="mt-4 text-slate-500">正在加载课程...</p>
                    </div>
                )}

                {error && !loading && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                        <p className="font-medium text-red-600">{error}</p>
                        <button
                            type="button"
                            onClick={loadData}
                            className="mt-3 text-sm font-semibold text-indigo-600"
                        >
                            重新加载
                        </button>
                    </div>
                )}

                {!loading && !error && courses.length === 0 && (
                    <div className="rounded-xl bg-slate-50 p-16 text-center">
                        <SearchX className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                        <p className="text-lg font-medium text-slate-600">暂无可购课程</p>
                        <p className="mt-2 text-sm text-slate-400">
                            {canManageCourses
                                ? '点击「发布新课程」添加演示课程，或执行数据库脚本 shop-demo-courses.sql'
                                : '请联系管理员上架课程'}
                        </p>
                    </div>
                )}

                {!loading && courses.length > 0 && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {courses.map((course, index) => {
                            const purchased = purchasedIds.has(course.id);

                            return (
                                <motion.article
                                    key={course.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                                    className="card-polish flex flex-col overflow-hidden"
                                >
                                    <CourseCover courseId={course.id} thumbnail={course.thumbnail} alt={course.title}>
                                        <span className="absolute left-3 top-3 z-10 rounded bg-white/95 px-2 py-0.5 text-xs font-bold text-indigo-600">
                                            {course.category}
                                        </span>
                                        {purchased && (
                                            <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white">
                                                <CheckCircle2 size={12} />
                                                已购买
                                            </span>
                                        )}
                                    </CourseCover>

                                    <div className="flex flex-col p-5">
                                        <h2 className="line-clamp-2 text-lg font-bold italic text-slate-800">
                                            {course.title}
                                        </h2>
                                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                                            {course.description}
                                        </p>
                                        <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Users size={14} />
                                                {course.studentsCount || 0}
                                            </span>
                                            <span className="flex items-center gap-1 text-amber-500">
                                                <Star size={14} fill="currentColor" />
                                                {course.rating || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {course.videoCount || 0} 课时
                                            </span>
                                        </div>
                                        <div className="mt-4 border-t border-slate-100 pt-4">
                                            <span className="text-2xl font-black text-indigo-600">
                                                ¥{course.price || 0}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            {!purchased && (
                                                <button
                                                    type="button"
                                                    onClick={() => openPreview(course)}
                                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
                                                >
                                                    <Play size={16} />
                                                    {PREVIEW_LABEL}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    purchased
                                                        ? openFullPlay(course)
                                                        : goCheckout(course.id)
                                                }
                                                className={cn(
                                                    'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white',
                                                    purchased
                                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                                        : 'bg-indigo-600 hover:bg-indigo-700',
                                                )}
                                            >
                                                {purchased ? (
                                                    <>
                                                        <Play size={16} />
                                                        开始学习
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShoppingBag size={16} />
                                                        立即购买
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </div>
                )}
            </div>

            {canManageCourses && (
                <CreateCourseModal
                    open={createModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    onSuccess={() => {
                        setCreateModalOpen(false);
                        loadData();
                    }}
                />
            )}
        </motion.div>
    );
}
