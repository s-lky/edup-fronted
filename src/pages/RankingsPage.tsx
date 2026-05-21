import { useEffect, useState } from 'react';
import { Trophy, Flame, Star, Medal, Loader2 } from 'lucide-react';
import { rankingAPI, type RankingItem, type MyRankInfo } from '../api';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

type RankType = 'weekly' | 'monthly' | 'all';

const RANK_TABS: { key: RankType; label: string }[] = [
    { key: 'weekly', label: '周榜' },
    { key: 'monthly', label: '月榜' },
    { key: 'all', label: '总榜' },
];

const AVATAR_FALLBACK = (seed: string) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

function avatarSrc(item: RankingItem) {
    return item.avatarUrl?.trim() || AVATAR_FALLBACK(item.nickname || item.userId);
}

export default function RankingPage() {
    const { isAuthenticated } = useAuth();
    const [type, setType] = useState<RankType>('weekly');
    const [list, setList] = useState<RankingItem[]>([]);
    const [myRank, setMyRank] = useState<MyRankInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError('');
            try {
                const [rankings, mine] = await Promise.all([
                    rankingAPI.getList({ type, limit: 50 }),
                    isAuthenticated ? rankingAPI.getMyRank(type) : Promise.resolve(null),
                ]);
                if (!cancelled) {
                    setList(rankings ?? []);
                    setMyRank(mine);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : '加载排行榜失败');
                    setList([]);
                    setMyRank(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [type, isAuthenticated]);

    const top3 = list.slice(0, 3);
    const rest = list.slice(3);
    const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as RankingItem[];

    return (
        <div className="mx-auto max-w-4xl space-y-12 py-8 text-base">
            <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                    <Trophy size={16} />
                    社区学习先锋榜
                </div>
                <h1 className="text-5xl font-bold tracking-tight text-slate-800 italic">
                    与优秀的伙伴一起进化
                </h1>
                <p className="text-base text-slate-500">
                    根据学习时长、完成课时与连续学习天数综合评定（观看课程自动累计积分）
                </p>
                <div className="flex justify-center gap-2 pt-2">
                    {RANK_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setType(tab.key)}
                            className={cn(
                                'rounded-full px-4 py-2 text-sm font-bold transition-colors',
                                type === tab.key
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-indigo-50',
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {isAuthenticated && myRank && !loading && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-6 py-4 text-center text-sm text-indigo-900">
                    我的排名：
                    <span className="mx-1 text-lg font-black">
                        {myRank.rank > 0 && list.length > 0 ? `第 ${myRank.rank} 名` : '暂未上榜'}
                    </span>
                    · 积分 <span className="font-black">{myRank.score}</span>
                    {myRank.percentile > 0 && (
                        <span className="text-indigo-600">
                            {' '}
                            · 超过 {myRank.percentile}% 的学员
                        </span>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                </div>
            ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
                    {error}
                </div>
            ) : list.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center">
                    <Trophy className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-4 font-medium text-slate-600">暂无排行数据</p>
                    <p className="mt-2 text-sm text-slate-400">
                        学员观看课程、完成课时后积分会自动累计并出现在榜单中
                    </p>
                </div>
            ) : (
                <>
                    {top3.length > 0 && (
                        <div className="mt-16 flex items-end justify-center gap-4 md:gap-12">
                            {podiumOrder.map((user) => {
                                const place = user.rank;
                                const isFirst = place === 1;
                                return (
                                    <div key={user.userId} className="flex flex-col items-center gap-4">
                                        <div className="relative">
                                            {isFirst && (
                                                <Medal
                                                    size={48}
                                                    className="absolute -top-14 left-1/2 -translate-x-1/2 text-amber-500 opacity-80"
                                                />
                                            )}
                                            <img
                                                src={avatarSrc(user)}
                                                alt=""
                                                className={cn(
                                                    'rounded-2xl border-4 object-cover',
                                                    isFirst
                                                        ? 'h-28 w-28 rounded-3xl border-amber-400 bg-amber-50 p-1'
                                                        : place === 2
                                                          ? 'h-20 w-20 border-slate-200'
                                                          : 'h-20 w-20 border-orange-200',
                                                )}
                                            />
                                            <div
                                                className={cn(
                                                    'absolute -bottom-2 -right-2 flex items-center justify-center rounded-lg font-bold shadow-sm border border-white',
                                                    isFirst
                                                        ? 'h-10 w-10 bg-amber-400 text-white'
                                                        : place === 2
                                                          ? 'h-8 w-8 bg-slate-200 text-slate-700'
                                                          : 'h-8 w-8 bg-orange-200 text-orange-800',
                                                )}
                                            >
                                                {place}
                                            </div>
                                        </div>
                                        <div
                                            className={cn(
                                                'flex min-w-[140px] flex-col justify-end rounded-t-3xl p-6 text-center shadow-xl',
                                                isFirst
                                                    ? 'h-52 min-w-[200px] rounded-t-[40px] bg-slate-900 shadow-2xl'
                                                    : 'h-32 border border-slate-100 bg-white',
                                            )}
                                        >
                                            <p
                                                className={cn(
                                                    'mb-1 font-bold italic',
                                                    isFirst ? 'text-lg text-white' : 'text-base text-slate-800',
                                                )}
                                            >
                                                {user.nickname}
                                            </p>
                                            <p
                                                className={cn(
                                                    'text-sm font-black uppercase tracking-widest',
                                                    isFirst ? 'text-indigo-400' : 'text-indigo-600',
                                                )}
                                            >
                                                {user.score} PTS
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {rest.length > 0 && (
                        <div className="card-polish divide-y divide-slate-50">
                            {rest.map((user) => (
                                <div
                                    key={user.userId}
                                    className="flex items-center justify-between p-6 transition-colors hover:bg-slate-50"
                                >
                                    <div className="flex items-center gap-6">
                                        <span className="w-8 text-center text-sm font-black text-slate-300">
                                            {user.rank}
                                        </span>
                                        <img
                                            src={avatarSrc(user)}
                                            alt=""
                                            className="h-12 w-12 rounded-xl border border-slate-200 bg-slate-100 object-cover"
                                        />
                                        <div>
                                            <p className="text-base font-bold italic text-slate-800">
                                                {user.nickname}
                                            </p>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-3">
                                                {user.streakDays > 0 && (
                                                    <span className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-orange-500">
                                                        <Flame size={12} /> 连续 {user.streakDays} 天
                                                    </span>
                                                )}
                                                {user.completedVideos > 0 && (
                                                    <span className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-indigo-500">
                                                        <Star size={12} /> {user.completedVideos} 课时
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base font-black text-indigo-600">{user.score}</p>
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                            LUMINA PTS
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
