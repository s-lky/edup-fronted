/** 图片全部失败时的占位 SVG */
export const COURSE_THUMB_FALLBACK =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect fill='%23e2e8f0' width='800' height='450'/%3E%3Ctext x='400' y='230' text-anchor='middle' fill='%2394a3b8' font-size='22' font-family='system-ui,sans-serif'%3E%E8%AF%BE%E7%A8%8B%E5%B0%81%E9%9D%A2%3C/text%3E%3C/svg%3E";

/** 固定 16:9 封面尺寸，与卡片 aspect 一致 */
export const COURSE_COVER_WIDTH = 800;
export const COURSE_COVER_HEIGHT = 450;

/**
 * 课程封面地址。Unsplash 在部分网络环境下会 403/超时，导致顶部封面空白；
 * 对 Unsplash 或空地址改用 picsum 按课程 ID 生成稳定 16:9 图。
 */
export function resolveCourseCoverUrl(courseId: string, thumbnail?: string | null): string {
    const url = thumbnail?.trim();
    if (url && !url.includes('images.unsplash.com')) {
        return url;
    }
    return `https://picsum.photos/seed/${encodeURIComponent(courseId)}/${COURSE_COVER_WIDTH}/${COURSE_COVER_HEIGHT}`;
}
