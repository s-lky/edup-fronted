import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { adminAPI, courseAPI, type AdminCourseItem } from '../api';
import { cn } from '../lib/utils';

interface DeleteCourseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteCourseModal({ open, onClose, onSuccess }: DeleteCourseModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const publishedCourses = useMemo(
    () => courses.filter((course) => course.status === 'published'),
    [courses],
  );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError('');
    setSelectedIds(new Set());

    const loadCourses = async () => {
      try {
        const res = await adminAPI.listCourses(1, 100);
        if (!cancelled) setCourses(res.list ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '加载课程失败');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCourses();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const toggleCourse = (courseId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === publishedCourses.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(publishedCourses.map((course) => course.id)));
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `确定删除选中的 ${selectedIds.size} 门已发布课程吗？删除后学生端将无法访问，此操作不可恢复。`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError('');

    const ids = Array.from(selectedIds);
    const failed: string[] = [];

    for (const courseId of ids) {
      try {
        await courseAPI.delete(courseId);
      } catch {
        failed.push(courseId);
      }
    }

    setDeleting(false);

    if (failed.length > 0) {
      setError(`有 ${failed.length} 门课程删除失败，请重试`);
      setSelectedIds(new Set(failed));
      if (failed.length < ids.length) onSuccess();
      return;
    }

    onSuccess();
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-gray-100 p-6">
            <div>
              <div className="mb-2 flex items-center gap-2 text-red-600">
                <Trash2 size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">删除课程</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">选择要删除的已发布课程</h2>
              <p className="mt-1 text-sm text-gray-500">
                仅展示已上线课程，删除后将从学生端下架（软删除，数据保留在后台）
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="关闭"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : publishedCourses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-gray-400">
                暂无已发布的课程
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      publishedCourses.length > 0 && selectedIds.size === publishedCourses.length
                    }
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-bold text-gray-700">
                    全选（共 {publishedCourses.length} 门）
                  </span>
                </label>

                {publishedCourses.map((course) => {
                  const checked = selectedIds.has(course.id);
                  return (
                    <label
                      key={course.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 transition-colors',
                        checked
                          ? 'border-red-200 bg-red-50/50'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCourse(course.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-gray-900">{course.title}</p>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {course.category} · {course.studentsCount ?? 0} 名学员 · 营收 ¥
                          {Number(course.revenue ?? 0).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-600">
                        已上线
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-gray-100 p-6">
            <p className="text-sm text-gray-500">
              已选择 <span className="font-bold text-gray-900">{selectedIds.size}</span> 门课程
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={deleting}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || selectedIds.size === 0}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
