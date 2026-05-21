import { useState, useEffect, React } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import {
    FIELD_ERROR_MSG,
    validateLoginForm,
    type LoginField,
} from '../lib/authValidation';

function FieldHint({ show }: { show: boolean }) {
    if (!show) return null;
    return <p className="mt-1 text-sm text-red-600">{FIELD_ERROR_MSG}</p>;
}

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated, isReady } = useAuth();

    useEffect(() => {
        if (isReady && isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isReady, isAuthenticated, navigate]);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<LoginField, boolean>>>({});
    const [touched, setTouched] = useState<Partial<Record<LoginField, boolean>>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const updateField = (field: LoginField, value: string) => {
        const next = { ...formData, [field]: value };
        setFormData(next);
        if (touched[field]) {
            setFieldErrors(validateLoginForm(next));
        }
    };

    const handleBlur = (field: LoginField) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        setFieldErrors(validateLoginForm(formData));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const errors = validateLoginForm(formData);
        setFieldErrors(errors);
        setTouched({ username: true, password: true });

        if (Object.keys(errors).length > 0) {
            return;
        }

        setLoading(true);

        try {
            const result = await authAPI.login(formData.username.trim(), formData.password);

            login(
                result.token,
                {
                    id: result.userId,
                    username: formData.username.trim(),
                    nickname: result.nickname,
                    email: result.email || '',
                    role: result.role as 'learner' | 'instructor' | 'admin',
                    avatarUrl: result.avatarUrl,
                },
                result.refreshToken,
            );

            navigate('/');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '登录失败，请检查用户名和密码');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (field: LoginField) =>
        `w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${
            touched[field] && fieldErrors[field]
                ? 'border-red-400 focus:ring-red-200'
                : 'border-slate-200'
        }`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                            Σ
                        </div>
                        <span className="font-bold text-2xl text-slate-900 italic">CoLearn AI</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">欢迎回来</h1>
                    <p className="text-slate-500 mt-2">登录以继续学习</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => updateField('username', e.target.value)}
                                    onBlur={() => handleBlur('username')}
                                    className={inputClass('username')}
                                    placeholder="请输入用户名"
                                />
                            </div>
                            <FieldHint show={!!touched.username && !!fieldErrors.username} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => updateField('password', e.target.value)}
                                    onBlur={() => handleBlur('password')}
                                    className={`${inputClass('password')} pr-12`}
                                    placeholder="请输入密码"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <FieldHint show={!!touched.password && !!fieldErrors.password} />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-600">记住我</span>
                            </label>
                            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700">
                                忘记密码？
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '登录中...' : '登录'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-600">
                            还没有账号？{' '}
                            <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">
                                立即注册
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-slate-500">
                                其他登录方式
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            <span className="text-sm font-medium text-slate-700">微信登录</span>
                        </button>
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            <span className="text-sm font-medium text-slate-700">GitHub登录</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
