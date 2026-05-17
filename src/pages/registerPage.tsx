import { useState, React } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
const navigate = useNavigate();
const { login } = useAuth();

const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    nickname: ''
});
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证密码
    if (formData.password !== formData.confirmPassword) {
    setError('两次输入的密码不一致');
    return;
    }

    if (formData.password.length < 6) {
    setError('密码长度至少为6位');
    return;
    }

    setLoading(true);

    try {
    const result = await authAPI.register({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        nickname: formData.nickname
    });
    
    // 注册成功，自动登录
    login(result.token, {
        id: result.userId,
        username: formData.username,
        nickname: formData.nickname,
        email: formData.email,
        role: 'learner',
        avatarUrl: result.avatarUrl
    });
    
    // 跳转到首页
    navigate('/');
    } catch (err: any) {
    setError(err.message || '注册失败，请稍后重试');
    } finally {
    setLoading(false);
    }
};

return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
    >
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
            Σ
            </div>
            <span className="font-bold text-2xl text-slate-900 italic">CoLearn AI</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">创建账号</h1>
        <p className="text-slate-500 mt-2">开始你的学习之旅</p>
        </div>

        {/* 注册表单 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
        {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
            {/* 用户名 */}
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                用户名
            </label>
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="请输入用户名"
                required
                />
            </div>
            </div>

            {/* 昵称 */}
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                昵称
            </label>
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="请输入昵称"
                required
                />
            </div>
            </div>

            {/* 邮箱 */}
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                邮箱
            </label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="请输入邮箱"
                required
                />
            </div>
            </div>

            {/* 密码 */}
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                密码
            </label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="请输入密码（至少6位）"
                required
                />
                <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            </div>

            {/* 确认密码 */}
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                确认密码
            </label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="请再次输入密码"
                required
                />
                <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            </div>

            {/* 用户协议 */}
            <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" required />
            <span className="text-sm text-slate-600">
                我已阅读并同意{' '}
                <Link to="/terms" className="text-indigo-600 hover:text-indigo-700">
                用户协议
                </Link>
                {' '}和{' '}
                <Link to="/privacy" className="text-indigo-600 hover:text-indigo-700">
                隐私政策
                </Link>
            </span>
            </div>

            {/* 注册按钮 */}
            <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {loading ? '注册中...' : '注册'}
            </button>
        </form>

        {/* 登录链接 */}
        <div className="mt-6 text-center">
            <p className="text-slate-600">
            已有账号？{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
                立即登录
            </Link>
            </p>
        </div>
        </div>
    </motion.div>
    </div>
);
}