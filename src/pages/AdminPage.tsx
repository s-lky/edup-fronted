import { useState } from 'react';
import { Users, Video, DollarSign, TrendingUp, Plus, MoreVertical, Eye, Settings,ShieldCheck,ChevronRight} from 'lucide-react';
import { motion } from 'motion/react';
import { MOCK_COURSES } from '../mockData';
import { cn } from '../lib/utils';

export default function AdminPage() {
const stats = [
    { label: '总学员数', value: '4,520', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '已发布课程', value: '12', icon: Video, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '本月营收', value: '¥28,450', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'AI互动率', value: '82%', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

return (
    <div className="space-y-8 pb-20">
    {/* Header */}
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">管理看板</h1>
            <p className="text-gray-500 mt-1">欢迎回来，讲师助手已为您同步最新数据</p>
            </div>
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-100">
            <Plus size={20} />
            新建课程
            </button>
        </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
        <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-start justify-between"
        >
            <div>
            <p className="text-sm font-medium text-gray-400 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase mt-2 tracking-widest">
                <ShieldCheck size={12} /> 提升 12.5%
            </div>
            </div>
            <div className={cn("p-4 rounded-2xl", stat.bg, stat.color)}>
            <stat.icon size={24} />
            </div>
        </motion.div>
        ))}
    </div>

    {/* Course List Section */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">已发布课程 ({MOCK_COURSES.length})</h2>
            <button className="text-sm text-indigo-600 font-bold hover:underline underline-offset-4">查看全部</button>
        </div>
        
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-6 p-4 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
            <div className="col-span-3">课程标题 / 类别</div>
            <div className="text-center">状态</div>
            <div className="text-center">营收</div>
            <div className="text-right">操作</div>
                </div>
            <div className="divide-y divide-gray-50">
            {MOCK_COURSES.map((course) => (
                <div key={course.id} className="grid grid-cols-6 p-4 items-center hover:bg-gray-50/50 transition-colors">
                <div className="col-span-3 flex items-center gap-4">
                    <img src={course.thumbnail} className="w-12 h-12 rounded-xl object-cover" alt="Thumbnail" />
                        <div>
                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{course.title}</h4>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">{course.category}</p>
                        </div>
                    </div>
                <div className="text-center">
                    <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider">已上线</span>
                </div>
                <div className="text-center font-bold text-gray-900 text-sm">
                    ¥{course.price * 12}
                </div>
                <div className="text-right flex items-center justify-end gap-2 text-gray-400">
                    <button className="p-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"><Eye size={18} /></button>
                    <button className="p-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"><Settings size={18} /></button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><MoreVertical size={18} /></button>
                    </div>
                </div>
            ))}
            </div>
        </div>
    </div>

        {/* Recent Data Visualization Placeholder */}
    <div className="lg:col-span-1 space-y-6">
        <h2 className="text-xl font-bold text-gray-900">学习效率趋势</h2>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
                <div className="aspect-square flex items-center justify-center relative">
            {/* Circular Chart Simulation */}
                    <svg className="w-48 h-48 -rotate-90">
                    <circle cx="96" cy="96" r="80" className="stroke-gray-100 fill-none" strokeWidth="12" />
                    <circle cx="96" cy="96" r="80" className="stroke-indigo-600 fill-none" strokeWidth="12" strokeDasharray="502" strokeDashoffset="120" strokeLinecap="round" />
                    </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-gray-900">76%</span>
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">周平均反馈率</span>
                </div>
            </div>
            
            <div className="mt-8 space-y-4 text-left">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                    AI 辅助提问
                    </div>
                    <span className="text-sm font-bold text-gray-900 font-mono">1,240 次</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                    常规弹幕
                    </div>
                <span className="text-sm font-bold text-gray-900 font-mono">480 次</span>
                </div>
            </div>

            <button className="w-full mt-10 py-4 rounded-2xl bg-gray-50 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
            下载完整报表 <ChevronRight size={16} />
            </button>
        </div>
        </div>
    </div>
    </div>
);
}
