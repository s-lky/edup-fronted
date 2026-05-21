import { useEffect, useState } from 'react';
import { X, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { userAPI } from '../api';
import { cn } from '../lib/utils';
import {
    FIELD_ERROR_MSG,
    validateChangePasswordForm,
    type ChangePasswordField,
} from '../lib/authValidation';

function FieldHint({ show }: { show: boolean }) {
    if (!show) return null;
    return <p className="mt-1 text-sm text-red-600">{FIELD_ERROR_MSG}</p>;
}

interface ChangePasswordModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const emptyForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
};

export default function ChangePasswordModal({ open, onClose, onSuccess }: ChangePasswordModalProps) {
    const [form, setForm] = useState(emptyForm);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<ChangePasswordField, boolean>>>({});
    const [touched, setTouched] = useState<Partial<Record<ChangePasswordField, boolean>>>({});
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setForm(emptyForm);
        setFieldErrors({});
        setTouched({});
        setError('');
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
    }, [open]);

    const updateField = (field: ChangePasswordField, value: string) => {
        const next = { ...form, [field]: value };
        setForm(next);
        if (Object.keys(touched).length > 0) {
            setFieldErrors(validateChangePasswordForm(next));
        }
    };

    const handleBlur = (field: ChangePasswordField) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        setFieldErrors(validateChangePasswordForm(form));
    };

    const inputClass = (field: ChangePasswordField) =>
        cn(
            'w-full rounded-xl border bg-white py-3 pl-11 pr-12 text-sm outline-none transition-shadow focus:ring-2 focus:ring-indigo-500',
            touched[field] && fieldErrors[field]
                ? 'border-red-400 focus:ring-red-200'
                : 'border-slate-200',
        );

    const handleSubmit = async () => {
        setError('');
        const errors = validateChangePasswordForm(form);
        setFieldErrors(errors);
        setTouched({
            currentPassword: true,
            newPassword: true,
            confirmPassword: true,
        });
        if (Object.keys(errors).length > 0) {
            return;
        }

        setSaving(true);
        try {
            await userAPI.changePassword({
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            onSuccess?.();
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '密码修改失败';
            if (message.includes('当前密码')) {
                setFieldErrors({ currentPassword: true });
                setTouched((prev) => ({ ...prev, currentPassword: true }));
            }
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
                onClick={() => !saving && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-indigo-600">
                                <Lock size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest">账号安全</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">修改密码</h2>
                            <p className="mt-1 text-sm text-slate-500">新密码须为至少 9 位数字</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">当前密码</label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={form.currentPassword}
                                    onChange={(e) => updateField('currentPassword', e.target.value)}
                                    onBlur={() => handleBlur('currentPassword')}
                                    className={inputClass('currentPassword')}
                                    placeholder="请输入当前密码"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <FieldHint show={!!touched.currentPassword && !!fieldErrors.currentPassword} />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">新密码</label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={form.newPassword}
                                    onChange={(e) => updateField('newPassword', e.target.value)}
                                    onBlur={() => handleBlur('newPassword')}
                                    className={inputClass('newPassword')}
                                    placeholder="至少9位数字"
                                    inputMode="numeric"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <FieldHint show={!!touched.newPassword && !!fieldErrors.newPassword} />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-bold text-slate-700">确认新密码</label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={form.confirmPassword}
                                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                                    onBlur={() => handleBlur('confirmPassword')}
                                    className={inputClass('confirmPassword')}
                                    placeholder="请再次输入新密码"
                                    inputMode="numeric"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <FieldHint show={!!touched.confirmPassword && !!fieldErrors.confirmPassword} />
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            取消
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '确认修改'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
