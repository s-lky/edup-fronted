import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// 业务图标、加载、播放、设置等图标
import { Users, Video, DollarSign, TrendingUp, Plus, MoreVertical, Eye, Settings, ShieldCheck, ChevronRight, Loader2, Play, FileText, } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
// 登录全局上下文
import { useAuth } from '../context/AuthContext';
// 管理员、学员全套接口 + TS类型
import { adminAPI, dashboardAPI, type AdminCourseItem, type AdminStats, type LearnerCourseItem, type LearnerDashboardStats, type LearnerLearningTrend, type LearningTrend, } from '../api/index';
// 新建课程弹窗组件
import CreateCourseModal from '../components/CreateCourseModal';
// 默认课程封面兜底图
const PLACEHOLDER_THUMB =
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80';
// 状态文字映射
const COURSE_STATUS_LABEL: Record<string, string> = {
    published: '已上线',
    draft: '草稿',
    offline: '已下线',
    learning: '学习中',
    completed: '已完成',
    not_started: '未开始',
};
// 状态对应标签样式
const COURSE_STATUS_STYLE: Record<string, string> = {
    published: 'bg-green-50 text-green-600',
    draft: 'bg-gray-50 text-gray-500',
    offline: 'bg-red-50 text-red-600',
    learning: 'bg-blue-50 text-blue-600',
    completed: 'bg-green-50 text-green-600',
    not_started: 'bg-gray-50 text-gray-500',
};
//通用格式化函数
//数字千分位格式化
function formatNumber(n: number) {
    return n.toLocaleString('zh-CN');
}
// 增长率带正负号
function formatGrowth(rate: number) {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate}%`;
}

// 主组件 & 角色判定
export default function AdminPage() {
    const { user } = useAuth();
    // 讲师/管理员 = 管理视图
    const isManagementView = user?.role === 'admin' || user?.role === 'instructor';
    // 纯管理员标识
    const isAdmin = user?.role === 'admin';

    // 页面状态定义
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // 管理员
    const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
    const [adminCourses, setAdminCourses] = useState<AdminCourseItem[]>([]);
    const [adminTrend, setAdminTrend] = useState<LearningTrend | null>(null);
    // 学员
    const [learnerStats, setLearnerStats] = useState<LearnerDashboardStats | null>(null);
    const [learnerCourses, setLearnerCourses] = useState<LearnerCourseItem[]>([]);
    const [learnerTrend, setLearnerTrend] = useState<LearnerLearningTrend | null>(null);
    // 新建课程弹窗、刷新标识
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // 数据请求核心副作用
    useEffect(() => {
        if (!user) return;

        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                // 管理端：讲师/管理员
                if (isManagementView) {
                    const coursesRes = await adminAPI.listCourses(1, 20);
                    if (cancelled) return;
                    setAdminCourses(coursesRes.list ?? []);
                    // 管理员拿完整统计+趋势
                    if (isAdmin) {
                        const [statsRes, trendRes] = await Promise.all([
                            adminAPI.getStats(),
                            adminAPI.getLearningTrend(30),
                        ]);
                        if (cancelled) return;
                        setAdminStats(statsRes);
                        setAdminTrend(trendRes);
                    } 
                    // 讲师：自行统计学员数、营收
                    else {
                        const totalStudents = coursesRes.list.reduce(
                            (sum, c) => sum + (c.studentsCount ?? 0),
                            0,
                        );
                        const totalRevenue = coursesRes.list.reduce(
                            (sum, c) => sum + Number(c.revenue ?? 0),
                            0,
                        );
                        if (cancelled) return;
                        setAdminStats({
                            totalUsers: totalStudents,
                            totalCourses: coursesRes.total,
                            monthlyRevenue: totalRevenue,
                            aiInteractionRate: 0,
                            userGrowth: 0,
                            revenueGrowth: 0,
                        });
                        setAdminTrend(null);
                    }
                }
                // 学员端：个人学习数据 
                else {
                    const [statsRes, coursesRes, trendRes] = await Promise.all([
                        dashboardAPI.getStats(),
                        dashboardAPI.listCourses(1, 20),
                        dashboardAPI.getLearningTrend(30),
                    ]);
                    if (cancelled) return;
                    setLearnerStats(statsRes);
                    setLearnerCourses(coursesRes.list ?? []);
                    setLearnerTrend(trendRes);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : '加载失败');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        // 组件卸载终止请求防止内存泄漏
        return () => {
            cancelled = true;
        };
    }, [user, isManagementView, isAdmin, refreshKey]);

    const reloadManagementData = () => setRefreshKey((k) => k + 1);

    // 组装统计卡片数据
    // 管理端卡片数组
    const managementStats = adminStats
            ? [
                {
                    label: '总学员数',
                    value: formatNumber(adminStats.totalUsers),
                    growth: adminStats.userGrowth,
                    icon: Users,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                },
                {
                    label: '已发布课程',
                    value: formatNumber(adminStats.totalCourses),
                    growth: 0,
                    icon: Video,
                    color: 'text-purple-600',
                    bg: 'bg-purple-50',
                },
                {
                    label: '本月营收',
                    value: `¥${formatNumber(Number(adminStats.monthlyRevenue))}`,
                    growth: adminStats.revenueGrowth,
                    icon: DollarSign,
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                },
                {
                    label: 'AI互动率',
                    value: `${adminStats.aiInteractionRate}%`,
                    growth: 0,
                    icon: TrendingUp,
                    color: 'text-indigo-600',
                    bg: 'bg-indigo-50',
                },
            ]
        : [];
    // 学员端卡片数组
    const learnerStatCards = learnerStats
            ? [
                {
                    label: '已学习课程',
                    value: formatNumber(learnerStats.learnedCoursesCount),
                    icon: Video,
                    color: 'text-purple-600',
                    bg: 'bg-purple-50',
                },
                {
                    label: 'AI互动率',
                    value: `${learnerStats.aiInteractionRate}%`,
                    icon: TrendingUp,
                    color: 'text-indigo-600',
                    bg: 'bg-indigo-50',
                },
            ]
        : [];
    // 根据角色切换卡片源
    const stats = isManagementView ? managementStats : learnerStatCards;
    const courseCount = isManagementView ? adminCourses.length : learnerCourses.length;
    const courseSectionTitle = isManagementView
        ? `已发布课程 (${courseCount})`
        : `已学习课程 (${courseCount})`;
    // 完成率/反馈率
    const completionRate = isManagementView ? 76 : (learnerTrend?.completionRate ?? 0);
    // AI提问、弹幕次数
    const trendAiCount = isManagementView
        ? (adminTrend?.aiQuestions ?? 0)
        : (learnerTrend?.aiQuestionCount ?? 0);
    const trendDanmakuCount = isManagementView
        ? (adminTrend?.regularDanmaku ?? 0)
        : (learnerTrend?.regularDanmaku ?? 0);
    // 环形进度偏移量，控制圆环填充比例
    const circleOffset = 502 - (502 * completionRate) / 100;
    // 旋转加载动画
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-[50vh] items-center justify-center"
            >
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </motion.div>
        );
    }
    // 错误提示+刷新重试按钮
    if (error) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
                <p className="text-red-500">{error}</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white"
                >
                    重试
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 text-base">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                        {isManagementView ? '管理看板' : '学习看板'}
                    </h1>
                    <p className="mt-2 text-base text-gray-500">
                        {isManagementView
                            ? '欢迎回来，讲师助手已为您同步最新数据'
                            : '欢迎回来，以下是你的学习概况'}
                    </p>
                </motion.div>
                {isManagementView && (
                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/admin/drafts"
                            className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white px-5 py-3 font-bold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50"
                        >
                            <FileText size={20} />
                            课程草稿
                        </Link>
                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-xl shadow-indigo-100 transition-colors hover:bg-indigo-700"
                        >
                            <Plus size={20} />
                            新建课程
                        </button>
                    </div>
                )}
            </motion.div>

            <div
                className={cn(
                    'grid grid-cols-1 gap-6',
                    isManagementView ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2',
                )}
            >
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.1 + 0.1 }}
                        >
                            <p className="mb-1 text-base font-medium text-gray-400">{stat.label}</p>
                            <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
                            {isManagementView && 'growth' in stat && isAdmin && (
                                <div className="mt-2 flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-green-600">
                                    <ShieldCheck size={12} />
                                    {formatGrowth((stat as { growth: number }).growth)}
                                </div>
                            )}
                        </motion.div>
                        <motion.div className={cn('rounded-2xl p-4', stat.bg, stat.color)}>
                            <stat.icon size={24} />
                        </motion.div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">{courseSectionTitle}</h2>
                        <button
                            type="button"
                            className="text-base font-bold text-indigo-600 underline-offset-4 hover:underline"
                        >
                            查看全部
                        </button>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                        <div
                            className={cn(
                                'grid border-b border-gray-100 bg-gray-50 p-4 text-xs font-black uppercase tracking-widest text-gray-400',
                                isManagementView ? 'grid-cols-6' : 'grid-cols-5',
                            )}
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={isManagementView ? 'col-span-3' : 'col-span-3'}
                            >
                                课程标题 / 类别
                            </motion.div>
                            <div className="text-center">状态</div>
                            {isManagementView && <div className="text-center">营收</div>}
                            {!isManagementView && <div className="text-center">进度</div>}
                            <div className="text-right">操作</div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {isManagementView
                                ? adminCourses.map((course) => (
                                      <div
                                          key={course.id}
                                          className="grid grid-cols-6 items-center p-4 transition-colors hover:bg-gray-50/50"
                                      >
                                          <div className="col-span-3 flex items-center gap-4">
                                              <img
                                                  src={PLACEHOLDER_THUMB}
                                                  className="h-12 w-12 rounded-xl object-cover"
                                                  alt=""
                                              />
                                              <div>
                                                  <h4 className="line-clamp-1 text-base font-bold text-gray-900">
                                                      {course.title}
                                                  </h4>
                                                  <p className="mt-0.5 text-sm font-medium text-indigo-600">
                                                      {course.category}
                                                  </p>
                                              </div>
                                          </div>
                                          <div className="text-center">
                                              <span
                                                  className={cn(
                                                      'rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider',
                                                      COURSE_STATUS_STYLE[course.status] ??
                                                          'bg-gray-50 text-gray-500',
                                                  )}
                                              >
                                                  {COURSE_STATUS_LABEL[course.status] ?? course.status}
                                              </span>
                                          </div>
                                          <div className="text-center text-base font-bold text-gray-900">
                                              ¥{formatNumber(Number(course.revenue ?? 0))}
                                          </div>
                                          <div className="flex items-center justify-end gap-2 text-right text-gray-400">
                                              <button
                                                  type="button"
                                                  className="rounded-lg p-2 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                                              >
                                                  <Eye size={18} />
                                              </button>
                                              <button
                                                  type="button"
                                                  className="rounded-lg p-2 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                                              >
                                                  <Settings size={18} />
                                              </button>
                                              <button
                                                  type="button"
                                                  className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                                              >
                                                  <MoreVertical size={18} />
                                              </button>
                                          </div>
                                      </div>
                                  ))
                                : learnerCourses.map((course) => (
                                      <div
                                          key={course.id}
                                          className="grid grid-cols-5 items-center p-4 transition-colors hover:bg-gray-50/50"
                                      >
                                          <div className="col-span-3 flex items-center gap-4">
                                              <img
                                                  src={course.thumbnail || PLACEHOLDER_THUMB}
                                                  className="h-12 w-12 rounded-xl object-cover"
                                                  alt=""
                                              />
                                              <div>
                                                  <h4 className="line-clamp-1 text-base font-bold text-gray-900">
                                                      {course.title}
                                                  </h4>
                                                  <p className="mt-0.5 text-sm font-medium text-indigo-600">
                                                      {course.category}
                                                  </p>
                                              </div>
                                          </div>
                                          <div className="text-center">
                                              <span
                                                  className={cn(
                                                      'rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider',
                                                      COURSE_STATUS_STYLE[course.status] ??
                                                          'bg-gray-50 text-gray-500',
                                                  )}
                                              >
                                                  {COURSE_STATUS_LABEL[course.status] ?? course.status}
                                              </span>
                                          </div>
                                          <div className="text-center text-base font-bold text-gray-900">
                                              {course.progressPercent}%
                                          </div>
                                          <div className="flex items-center justify-end gap-2 text-gray-400">
                                              <Link
                                                  to={`/play/${course.id}/start`}
                                                  className="rounded-lg p-2 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                                                  title="继续学习"
                                              >
                                                  <Play size={18} />
                                              </Link>
                                          </div>
                                      </div>
                                  ))}
                            {courseCount === 0 && (
                                <div className="p-8 text-center text-base text-gray-400">
                                    {isManagementView ? '暂无课程' : '暂无已学习课程，去学习中心选课吧'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">学习效率趋势</h2>
                    <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                        <div className="relative flex aspect-square items-center justify-center">
                            <svg className="h-48 w-48 -rotate-90">
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="80"
                                    className="fill-none stroke-gray-100"
                                    strokeWidth="12"
                                />
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="80"
                                    className="fill-none stroke-indigo-600"
                                    strokeWidth="12"
                                    strokeDasharray="502"
                                    strokeDashoffset={circleOffset}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-gray-900">
                                    {completionRate}%
                                </span>
                                <span className="mt-1 text-xs font-black uppercase tracking-widest text-gray-400">
                                    {isManagementView ? '周平均反馈率' : '课程完成率'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4 text-left">
                            <div className="flex items-center justify-between">
                                <motion.div className="flex items-center gap-2 text-base font-bold text-gray-700">
                                    <motion.div className="h-3 w-3 rounded-full bg-indigo-600" />
                                    AI 辅助提问
                                </motion.div>
                                <span className="font-mono text-base font-bold text-gray-900">
                                    {formatNumber(trendAiCount)} 次
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-base font-bold text-gray-700">
                                    <div className="h-3 w-3 rounded-full bg-gray-200" />
                                    常规弹幕
                                </div>
                                <span className="font-mono text-base font-bold text-gray-900">
                                    {formatNumber(trendDanmakuCount)} 次
                                </span>
                            </div>
                        </div>

                        {isManagementView && (
                            <button
                                type="button"
                                className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-50 py-4 text-base font-bold text-gray-600 transition-colors hover:bg-gray-100"
                            >
                                下载完整报表 <ChevronRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isManagementView && (
                <CreateCourseModal
                    open={createModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    onSuccess={reloadManagementData}
                />
            )}
        </div>
    );
}
