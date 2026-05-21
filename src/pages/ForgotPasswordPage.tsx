import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { authAPI } from '../api';
import {
    FIELD_ERROR_MSG,
    validateForgotPasswordForm,
    type ForgotPasswordField,
} from '../lib/authValidation';

function FieldHint({ show }: { show: boolean }) {
    if (!show) return null;
    return <p className="mt-1 text-sm text-red-600">{FIELD_ERROR_MSG}</p>;
}

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<ForgotPasswordField, boolean>>>({});
    const [touched, setTouched] = useState<Partial<Record<ForgotPasswordField, boolean>>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const updateField = (field: ForgotPasswordField, value: string) => {
        const next = { ...formData, [field]: value };
        setFormData(next);
        if (Object.keys(touched).length > 0) {
            setFieldErrors(validateForgotPasswordForm(next));
        }
    };

    const handleBlur = (field: ForgotPasswordField) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        setFieldErrors(validateForgotPasswordForm(formData));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const errors = validateForgotPasswordForm(formData);
        setFieldErrors(errors);
        setTouched({
            username: true,
            email: true,
            newPassword: true,
            confirmPassword: true,
        });

        if (Object.keys(errors).length > 0) {
            return;
        }

        setLoading(true);
        try {
            await authAPI.forgotPassword({
                username: formData.username.trim(),
                email: formData.email.trim(),
                newPassword: formData.newPassword,
            });
            setSuccess('密码已重置，即将跳转到登录页…');
            window.setTimeout(() => navigate('/login', { replace: true }), 2000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '密码重置失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (field: ForgotPasswordField) =>
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
                    <h1 className="text-2xl font-bold text-slate-900">找回密码</h1>
                    <p className="text-slate-500 mt-2">验证用户名与注册邮箱后设置新密码</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
                            {success}
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
                                    placeholder="请输入注册时的用户名"
                                />
                            </div>
                            <FieldHint show={!!touched.username && !!fieldErrors.username} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">注册邮箱</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    onBlur={() => handleBlur('email')}
                                    className={inputClass('email')}
                                    placeholder="请输入注册邮箱"
                                />
                            </div>
                            <FieldHint show={!!touched.email && !!fieldErrors.email} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">新密码</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.newPassword}
                                    onChange={(e) => updateField('newPassword', e.target.value)}
                                    onBlur={() => handleBlur('newPassword')}
                                    className={`${inputClass('newPassword')} pr-12`}
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
                            <FieldHint show={!!touched.newPassword && !!fieldErrors.newPassword} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">确认新密码</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                                    onBlur={() => handleBlur('confirmPassword')}
                                    className={`${inputClass('confirmPassword')} pr-12`}
                                    placeholder="请再次输入新密码"
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

                        <button
                            type="submit"
                            disabled={loading || !!success}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '提交中...' : '重置密码'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:text-indigo-700"
                        >
                            <ArrowLeft size={16} />
                            返回登录
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
