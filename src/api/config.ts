export const API_ORIGIN = 'http://localhost:8080';

/** /api/v1 版本接口（用户信息、进度、弹幕等） */
export const API_V1_BASE_URL = `${API_ORIGIN}/api/v1`;

/** 注册、登录（无 v1 前缀） */
export const API_AUTH_BASE_URL = `${API_ORIGIN}/api/auth`;

/** 课程、订单、学习统计等（无 v1 前缀） */
export const API_BASE_URL = `${API_ORIGIN}/api`;

// 兼容旧引用
export { API_V1_BASE_URL as API_V1_URL };
