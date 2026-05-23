const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 至少 9 位纯数字（大于八位数字） */
const PASSWORD_DIGITS_RE = /^\d{9,}$/;

export type RegisterField = 'username' | 'nickname' | 'email' | 'password' | 'confirmPassword';
export type LoginField = 'username' | 'password';
// 单项字段校验函数
// 用户名校验
export function validateUsername(value: string): boolean {
    const v = value.trim();
    return v.length >= 3 && v.length <= 50 && /^[\w\u4e00-\u9fa5-]+$/.test(v);
}
// 昵称校验
export function validateNickname(value: string): boolean {
    const v = value.trim();
    return v.length >= 1 && v.length <= 50;
}

export function validateEmail(value: string): boolean {
    return EMAIL_RE.test(value.trim());
}

export function validatePassword(value: string): boolean {
    return PASSWORD_DIGITS_RE.test(value);
}

export function validateConfirmPassword(password: string, confirm: string): boolean {
    return confirm.length > 0 && password === confirm;
}

export function validateLoginUsername(value: string): boolean {
    return value.trim().length > 0;
}

export function validateLoginPassword(value: string): boolean {
    return value.length > 0;
}
// 注册表单校验
export function validateRegisterForm(data: {
    username: string;
    nickname: string;
    email: string;
    password: string;
    confirmPassword: string;
}): Partial<Record<RegisterField, boolean>> {
    const errors: Partial<Record<RegisterField, boolean>> = {};
    // 单项不合法则标记该字段报错
    if (!validateUsername(data.username)) errors.username = true;
    if (!validateNickname(data.nickname)) errors.nickname = true;
    if (!validateEmail(data.email)) errors.email = true;
    if (!validatePassword(data.password)) errors.password = true;
    if (!validateConfirmPassword(data.password, data.confirmPassword)) errors.confirmPassword = true;
    return errors;
}
// 登录表单检验-仅判断密码非空
export function validateLoginForm(data: { username: string; password: string }): Partial<Record<LoginField, boolean>> {
    const errors: Partial<Record<LoginField, boolean>> = {};
    if (!validateLoginUsername(data.username)) errors.username = true;
    if (!validateLoginPassword(data.password)) errors.password = true;
    return errors;
}

export type ForgotPasswordField = 'username' | 'email' | 'newPassword' | 'confirmPassword';
// 找回密码表单-校验账号、邮箱、新密码、两次密码一致
export function validateForgotPasswordForm(data: {
    username: string;
    email: string;
    newPassword: string;
    confirmPassword: string;
}): Partial<Record<ForgotPasswordField, boolean>> {
    const errors: Partial<Record<ForgotPasswordField, boolean>> = {};
    if (!validateLoginUsername(data.username)) errors.username = true;
    if (!validateEmail(data.email)) errors.email = true;
    if (!validatePassword(data.newPassword)) errors.newPassword = true;
    if (!validateConfirmPassword(data.newPassword, data.confirmPassword)) errors.confirmPassword = true;
    return errors;
}

export type ChangePasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';
// 修改密码表单-校验原密码非空、新密码规则、两次密码一致
export function validateChangePasswordForm(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}): Partial<Record<ChangePasswordField, boolean>> {
    const errors: Partial<Record<ChangePasswordField, boolean>> = {};
    if (!validateLoginPassword(data.currentPassword)) errors.currentPassword = true;
    if (!validatePassword(data.newPassword)) errors.newPassword = true;
    if (!validateConfirmPassword(data.newPassword, data.confirmPassword)) errors.confirmPassword = true;
    return errors;
}
// 通用错误提示
export const FIELD_ERROR_MSG = '需要更改';
