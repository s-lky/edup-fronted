import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Users, ChevronRight, Loader2, SearchX } from 'lucide-react';
import { motion } from 'motion/react';
import { courseAPI } from '../api';
import { cn } from '../lib/utils';

// 图片失效时显示
export const COURSE_THUMB_FALLBACK =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect fill='%23e2e8f0' width='800' height='450'/%3E%3Ctext x='400' y='230' text-anchor='middle' fill='%2394a3b8' font-size='22' font-family='system-ui,sans-serif'%3E%E8%AF%BE%E7%A8%8B%E5%B0%81%E9%9D%A2%3C/text%3E%3C/svg%3E";
// 分类枚举
export const COURSE_CATEGORIES = [
    '全部',
    '前端开发',
    '人工智能',
    '区块链',
    '后端开发',
    '移动开发',
] as const;
// 图片错误处理工具函数
function handleCourseThumbError(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.dataset.fallbackApplied === '1') return;
    img.dataset.fallbackApplied = '1';
    img.src = COURSE_THUMB_FALLBACK;
}

// 课程实体类型,和后端V0完全对齐
export interface Course {
    id: string;
    title: string;
    description: string;
    instructor: string;
    price: number;
    thumbnail: string;
    category: string;
    studentsCount: number;
    rating: number;
    videoCount: number;
    videos?: Array<{
        id: string;
        title: string;
        url: string;
        duration: string;
        thumbnail: string;
        order: number;
    }>;
}
// 组件对外传入参数
interface CourseListSectionProps {
    /** 首页预览：少量课程 + 查看全部；课程专区：完整列表 */
    variant?: 'preview' | 'full';
    keyword?: string;
    pageSize?: number;
}

// 组件入口与基础变量
export default function CourseListSection({
    variant = 'full',
    keyword = '',
    pageSize,
}: CourseListSectionProps) {
    const navigate = useNavigate();
    const isPreview = variant === 'preview';
    // 预览默认6条，完整版默认20条
    const limit = pageSize ?? (isPreview ? 6 : 20);

    // 组件状态管理
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('全部');

    const activeKeyword = keyword.trim();

    // 数据请求核心useEffect
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            setError('');

            try {
                // 组装请求参数
                const params: {
                    page: number;
                    pageSize: number;
                    keyword?: string;
                    category?: string;
                } = {
                    page: 1,
                    pageSize: limit,
                };

                if (activeKeyword) {
                    params.keyword = activeKeyword;
                }

                if (selectedCategory !== '全部') {
                    params.category = selectedCategory;
                }
                // 调用接口获取课程列表
                const response = await courseAPI.getList(params);
                setCourses(response.list || []);
            } catch (err: unknown) {
                console.error('获取课程列表失败:', err);
                setError('加载课程失败，请检查网络连接');
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
        // 依赖变化自动重新请求:关键词、分类、条数
    }, [activeKeyword, selectedCategory, limit]);

    const openCourse = async (course: Course) => {
        try {
            // 先获取课程详情
            const detail = await courseAPI.getDetail(course.id);
            // 取第一个视频
            const firstVideo = detail.videos?.[0];
            if (firstVideo) {
                // 跳转到播放页 /play/课程ID/视频ID
                navigate(`/play/${course.id}/${firstVideo.id}`);
            } else {
                setError('该课程暂无视频');
            }
        } catch (err) {
            console.error('获取课程详情失败:', err);
            setError('无法打开课程，请重试');
        }
    };

    return (
        <div className="space-y-6 text-base">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h2 className="flex items-center gap-2 text-2xl font-bold italic text-slate-800">
                    精选课程专区
                    <span className="rounded bg-slate-100 px-2.5 py-0.5 text-sm font-normal not-italic text-slate-500">
                        最新更新
                    </span>
                </h2>
                <motion.div className="flex flex-wrap items-center justify-end gap-3 md:gap-4">
                    {COURSE_CATEGORIES.map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setSelectedCategory(t)}
                            className={cn(
                                'text-base font-medium uppercase tracking-wider transition-colors',
                                selectedCategory === t
                                    ? 'font-bold text-indigo-600'
                                    : 'text-slate-500 hover:text-indigo-600',
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </motion.div>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        <p className="text-base text-slate-500">正在加载课程...</p>
                    </div>
                </div>
            )}

            {error && !loading && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                    <p className="font-medium text-red-600">{error}</p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-3 text-base font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                        重新加载
                    </button>
                </div>
            )}

            {!loading && !error && courses.length === 0 && (
                <div className="rounded-xl bg-slate-50 p-10 text-center">
                    <SearchX className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                    <p className="mb-2 font-medium text-slate-600">
                        {activeKeyword ? '没有找到对应课程' : '暂无课程数据'}
                    </p>
                    <p className="text-sm text-slate-400">
                        {activeKeyword
                            ? '请尝试其他关键词，或前往课程专区浏览全部'
                            : '请稍后再来，或联系管理员添加课程'}
                    </p>
                </div>
            )}

            {!loading && courses.length > 0 && (
                <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course, index) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="card-polish group flex cursor-pointer flex-col transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5"
                            onClick={() => openCourse(course)}
                        >
                            <div className="relative aspect-video overflow-hidden bg-slate-100">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    onError={handleCourseThumbError}
                                />
                                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-slate-900/60 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                                    <span className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                                        开始学习 <ChevronRight size={16} />
                                    </span>
                                </div>
                                <div className="absolute left-3 top-3 rounded bg-white/90 px-2.5 py-0.5 text-xs font-black uppercase tracking-tighter text-indigo-600 shadow-sm">
                                    {course.category}
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col p-5">
                                <h3 className="mb-2 line-clamp-1 text-xl font-bold italic leading-tight text-slate-800 transition-colors group-hover:text-indigo-600">
                                    {course.title}
                                </h3>
                                <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-slate-500">
                                    {course.description}
                                </p>
                                <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4">
                                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Users size={14} />
                                            {course.studentsCount || 0}
                                        </span>
                                        <span className="flex items-center gap-1 text-amber-500">
                                            <Star size={14} fill="currentColor" />
                                            {course.rating || 0}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black text-indigo-600">
                                        ￥{course.price || 0}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </section>
            )}

            {isPreview && !loading && courses.length > 0 && (
                <div className="flex justify-center pt-2">
                    <Link
                        to="/courses"
                        className="inline-flex items-center gap-1 text-base font-bold text-indigo-600 hover:underline underline-offset-4"
                    >
                        查看全部课程 <ChevronRight size={16} />
                    </Link>
                </div>
            )}
        </div>
    );
}
