// 课程订单结算 / 支付页面
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    Loader2,
    ShieldCheck,
    ShoppingBag,
} from 'lucide-react';
import { motion } from 'motion/react';
import { courseAPI, orderAPI, type CreateOrderResult } from '../api';
import { COURSE_THUMB_FALLBACK } from '../components/CourseListSection';
import { cn } from '../lib/utils';

export default function CheckoutPage() {
    // 读取路由参数 :courseId
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();

    // 页面整体加载（拉取课程+创建订单）
    const [loading, setLoading] = useState(true);
    // 支付按钮加载态
    const [paying, setPaying] = useState(false);
    // 全局错误文案
    const [error, setError] = useState('');
    // 订单信息（接口返回）
    const [order, setOrder] = useState<CreateOrderResult | null>(null);
    // 课程基础信息
    const [courseTitle, setCourseTitle] = useState('');
    const [courseThumb, setCourseThumb] = useState('');
    const [courseCategory, setCourseCategory] = useState('');

    useEffect(() => {
        // 路由无课程ID，直接报错
        if (!courseId) {
            setError('课程不存在');
            setLoading(false);
            return;
        }

        const init = async () => {
            setLoading(true);
            setError(''); // 清空历史错误
            try {
                // 并行发起两个请求：课程详情 + 预创建订单
                const [detail, checkout] = await Promise.all([
                    courseAPI.getDetail(courseId),
                    orderAPI.prepareCheckout(courseId),
                ]);
                // 回填课程信息，无封面则使用兜底图
                setCourseTitle(detail.title);
                setCourseThumb(detail.thumbnail || COURSE_THUMB_FALLBACK);
                setCourseCategory(detail.category);
                // 回填订单信息
                setOrder(checkout);
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : '加载订单失败';
                // 业务拦截：课程已购买，直接跳个人中心（替换当前路由，禁止回退到结算页）
                if (msg.includes('已购买')) {
                    navigate('/profile', { replace: true });
                    return;
                }
                // 其他错误展示文案
                setError(msg);
            } finally {
                 // 无论成功失败，结束页面加载状态
                setLoading(false);
            }
        };

        init();
    }, [courseId, navigate]);

    // 支付处理函数 handlePay
    const handlePay = async () => {
        // 无合法订单ID，直接拦截
        if (!order?.orderId) return;
        setPaying(true);
        setError('');
        try {
             // 调用支付接口
            await orderAPI.pay(order.orderId);
            // 支付成功：跳个人中心，路由传参标记购买成功 + 课程名称
            navigate('/profile', {
                replace: true,
                state: { purchaseSuccess: true, courseTitle },
            });
        } catch (err: unknown) {
            // 支付失败，展示错误
            setError(err instanceof Error ? err.message : '支付失败');
        } finally {
             // 结束支付加载态
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
                <p className="text-slate-500">正在准备订单...</p>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                <p className="font-medium text-red-600">{error}</p>
                <Link to="/shop" className="mt-4 inline-block text-sm font-bold text-indigo-600">
                    返回可购课程
                </Link>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6"
        >
            <button
                type="button"
                onClick={() => navigate('/shop')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
            >
                <ArrowLeft size={18} />
                返回可购课程
            </button>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-indigo-500/5">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-8 text-white md:px-10">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-indigo-100">
                        <ShoppingBag size={16} />
                        确认购买
                    </div>
                    <h1 className="mt-2 text-2xl font-bold italic md:text-3xl">订单结算</h1>
                    <p className="mt-2 text-sm text-indigo-100">
                        支付成功后，课程将出现在个人中心的「我的已购课程」与「订单记录」
                    </p>
                </div>

                <div className="grid gap-8 p-6 md:grid-cols-[1fr_280px] md:p-10">
                    <div className="flex gap-5">
                        <img
                            src={courseThumb}
                            alt=""
                            className="h-28 w-44 shrink-0 rounded-xl object-cover shadow-md"
                        />
                        <div className="min-w-0">
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600">
                                {courseCategory}
                            </span>
                            <h2 className="mt-2 text-xl font-bold text-slate-900">{courseTitle}</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                订单号：<span className="font-mono text-slate-700">{order?.orderId}</span>
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                创建时间：{order?.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-5">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">应付金额</p>
                        <p className="mt-2 text-4xl font-black text-indigo-600">¥{order?.amount ?? 0}</p>
                        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            演示环境：点击即完成支付
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 md:mx-10">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-6 sm:flex-row sm:justify-end md:px-10">
                    <button
                        type="button"
                        onClick={() => navigate('/shop')}
                        className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        disabled={paying || !order?.orderId}
                        onClick={handlePay}
                        className={cn(
                            'inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg',
                            paying ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700',
                        )}
                    >
                        {paying ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <CreditCard size={18} />
                        )}
                        {paying ? '支付中…' : '确认支付'}
                    </button>
                </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                <p>购买即表示同意平台课程服务条款。支付完成后可无限次观看该课程全部课时。</p>
            </div>
        </motion.div>
    );
}
