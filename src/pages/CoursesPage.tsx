import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import CourseListSection from '../components/CourseListSection';
import { useSearch } from '../context/SearchContext';

export default function CoursesPage() {
    const [searchParams] = useSearchParams();
    const keyword = searchParams.get('q')?.trim() ?? '';
    const { draft } = useSearch();
    const activeKeyword = keyword || draft.trim();

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div>
                <h1 className="text-2xl font-bold italic text-slate-900">课程专区</h1>
                <p className="mt-1 text-sm text-slate-500">
                    {activeKeyword
                        ? `搜索「${activeKeyword}」的结果`
                        : '浏览全部精选课程，开启你的学习之旅'}
                </p>
            </div>

            <CourseListSection variant="full" keyword={keyword} pageSize={20} />
        </motion.div>
    );
}
