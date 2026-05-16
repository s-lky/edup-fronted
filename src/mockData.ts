import type { Course, User, Order } from './types';

export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'React 高级进阶指南',
    description: '从基础到源码，深度解析 React 生态。包含 Hooks 深度使用、性能优化、自定义渲染器等核心知识。',
    instructor: '张老师',
    price: 299,
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
    category: '前端开发',
    studentsCount: 1240,
    rating: 4.8,
    videos: [
      { id: 'v1', title: 'React 18 新特性概览', url: '#', duration: '12:00', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80' },
      { id: 'v2', title: '理解并发渲染 Concurrent Rendering', url: '#', duration: '25:00', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80' },
    ]
  },
  {
    id: 'c2',
    title: '人工智能入门：从数学到实践',
    description: '全面了解 AI 领域，涵盖机器学习、深度学习基础理论及行业应用案例。',
    instructor: 'AI 实验室',
    price: 499,
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    category: '人工智能',
    studentsCount: 850,
    rating: 4.9,
    videos: [
      { id: 'v3', title: '什么是神经网络？', url: '#', duration: '15:40', thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80' },
    ]
  },
  {
    id: 'c3',
    title: 'Web3 & 区块链底层技术',
    description: '深入探讨比特币、以太坊原理，学习智能合约开发与 DApp 项目实战。',
    instructor: '区块链专家',
    price: 399,
    thumbnail: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=80',
    category: '区块链',
    studentsCount: 560,
    rating: 4.7,
    videos: []
  }
];

export const MOCK_USER: User = {
  id: 'u1',
  name: '学霸小能手',
  role: 'learner',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  purchasedCourses: ['c1'],
  learningStats: {
    totalMinutes: 450,
    completedVideos: 12
  }
};

export const MOCK_ORDERS: Order[] = [
  { id: 'o1', courseId: 'c1', userId: 'u1', amount: 299, status: 'paid', createdAt: '2024-03-10' }
];

export const MOCK_RANKING = [
  { id: 'u1', name: '学霸小能手', score: 1250, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 'u2', name: '林间清泉', score: 1100, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
  { id: 'u3', name: '代码诗人', score: 950, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
  { id: 'u4', name: '全栈之光', score: 880, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb' },
];
