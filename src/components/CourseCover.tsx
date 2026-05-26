import { useState } from 'react';
import { COURSE_THUMB_FALLBACK, resolveCourseCoverUrl } from '../lib/courseCover';
import { cn } from '../lib/utils';

interface CourseCoverProps {
    courseId: string;
    thumbnail?: string | null;
    alt?: string;
    className?: string;
    imgClassName?: string;
    children?: React.ReactNode;
}

/** 统一 16:9 课程封面区域，避免图片比例不一撑高卡片 */
export default function CourseCover({
    courseId,
    thumbnail,
    alt = '',
    className,
    imgClassName,
    children,
}: CourseCoverProps) {
    const [src, setSrc] = useState(() => resolveCourseCoverUrl(courseId, thumbnail));

    return (
        <div
            className={cn(
                'relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-slate-100',
                className,
            )}
        >
            <img
                src={src}
                alt={alt}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className={cn(
                    'absolute inset-0 h-full w-full object-cover object-center',
                    imgClassName,
                )}
                onError={() => {
                    setSrc((prev) =>
                        prev === COURSE_THUMB_FALLBACK ? prev : COURSE_THUMB_FALLBACK,
                    );
                }}
            />
            {children}
        </div>
    );
}
