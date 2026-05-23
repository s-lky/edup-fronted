import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import {
    FIELD_ERROR_MSG,
    validateRegisterForm,
    type RegisterField,
} from '../lib/authValidation';

// 复用错误提示组件
function FieldHint({ show }: { show: boolean }) {
    if (!show) return null;
    return <p className="mt-1 text-sm text-red-600">{FIELD_ERROR_MSG}</p>;
}

export default function RegisterPage() {
    // 复用错误提示组件
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        nickname: '',
    });
    // 记录字段校验失败项
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterField, boolean>>>({});
    // 标记输入框是否被操作，控制错误提示时机
    const [touched, setTouched] = useState<Partial<Record<RegisterField, boolean>>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    // 服务端注册错误文案
    const [error, setError] = useState('');

    // 标记字段已操作
    const markTouched = (field: RegisterField) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    // 实时同步表单数据，已操作字段边输入边校验
    const updateField = (field: RegisterField, value: string) => {
        const next = { ...formData, [field]: value };
        setFormData(next);
        if (Object.keys(touched).length > 0) {
            setFieldErrors(validateRegisterForm(next));
        }
    };

    // 输入框失焦触发完整表单校验
    const handleBlur = (field: RegisterField) => {
        markTouched(field);
        setFieldErrors(validateRegisterForm(formData));
    };

    // 注册提交核心逻辑
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // 全局校验所有字段
        const errors = validateRegisterForm(formData);
        setFieldErrors(errors);
        setTouched({
            username: true,
            nickname: true,
            email: true,
            password: true,
            confirmPassword: true,
        });

         // 校验失败直接拦截
        if (Object.keys(errors).length > 0) {
            return;
        }

        setLoading(true);

        try {
            // 调用注册接口
            const result = await authAPI.register({
                username: formData.username.trim(),
                password: formData.password,
                email: formData.email.trim(),
                nickname: formData.nickname.trim(),
            });

            // 注册成功存入全局登录态
            login(result.token, {
                id: result.userId,
                username: formData.username.trim(),
                nickname: formData.nickname.trim(),
                email: formData.email.trim(),
                role: 'learner',
                avatarUrl: result.avatarUrl,
            });

            navigate('/');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '注册失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    // 动态输入框样式
    const inputClass = (field: RegisterField) =>
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
                    <h1 className="text-2xl font-bold text-slate-900">创建账号</h1>
                    <p className="text-slate-500 mt-2">开始你的学习之旅</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => updateField('username', e.target.value)}
                                    onBlur={() => handleBlur('username')}
                                    className={inputClass('username')}
                                    placeholder="请输入用户名（3-50个字符）"
                                />
                            </div>
                            <FieldHint show={!!touched.username && !!fieldErrors.username} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">昵称</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={formData.nickname}
                                    onChange={(e) => updateField('nickname', e.target.value)}
                                    onBlur={() => handleBlur('nickname')}
                                    className={inputClass('nickname')}
                                    placeholder="请输入昵称"
                                />
                            </div>
                            <FieldHint show={!!touched.nickname && !!fieldErrors.nickname} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">邮箱</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    onBlur={() => handleBlur('email')}
                                    className={inputClass('email')}
                                    placeholder="请输入邮箱"
                                />
                            </div>
                            <FieldHint show={!!touched.email && !!fieldErrors.email} />
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
                                    placeholder="至少9位数字"
                                    inputMode="numeric"
                                    autoComplete="new-password"
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

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">确认密码</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                                    onBlur={() => handleBlur('confirmPassword')}
                                    className={`${inputClass('confirmPassword')} pr-12`}
                                    placeholder="请再次输入密码"
                                    inputMode="numeric"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <FieldHint show={!!touched.confirmPassword && !!fieldErrors.confirmPassword} />
                        </div>

                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                required
                            />
                            <span className="text-sm text-slate-600">
                                我已阅读并同意{' '}
                                <Link to="/terms" className="text-indigo-600 hover:text-indigo-700">
                                    用户协议
                                </Link>{' '}
                                和{' '}
                                <Link to="/privacy" className="text-indigo-600 hover:text-indigo-700">
                                    隐私政策
                                </Link>
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '注册中...' : '注册'}
                        </button>
                    </form>

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
