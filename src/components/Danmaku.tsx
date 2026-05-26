import { useEffect, useRef, useState } from 'react';
import type { DanmakuItem } from '../api/index';

interface ActiveDanmaku {
  id: string;
  text: string;
  color: string;
  top: number;
  createdAt: number;
}

interface DanmakuOverlayProps {
  currentTime: number;
  danmakuList: DanmakuItem[];
}

export default function DanmakuOverlay({ currentTime, danmakuList }: DanmakuOverlayProps) {
  const [activeDanmakus, setActiveDanmakus] = useState<ActiveDanmaku[]>([]);
  const triggeredRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (currentTime < lastTimeRef.current - 1) {
      triggeredRef.current.clear();
      setActiveDanmakus([]);
    }
    lastTimeRef.current = currentTime;

    danmakuList.forEach((item) => {
      if (triggeredRef.current.has(item.id)) return;
      const delta = currentTime - item.videoTimeSec;
      if (delta >= 0 && delta < 1) {
        triggeredRef.current.add(item.id);
        setActiveDanmakus((prev) => [
          ...prev,
          {
            id: item.id,
            text: item.text,
            color: item.color || '#ffffff',
            top: 8 + Math.random() * 72,
            createdAt: Date.now(),
          },
        ]);
      }
    });
  }, [currentTime, danmakuList]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setActiveDanmakus((prev) => prev.filter((d) => now - d.createdAt < 8000));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {activeDanmakus.map((d) => (
        <div
          key={d.id}
          className="absolute animate-danmaku whitespace-nowrap text-lg font-medium drop-shadow-md"
          style={{
            top: `${d.top}%`,
            color: d.color,
            textShadow: '0 0 4px rgba(0,0,0,0.8)',
          }}
        >
          {d.text}
        </div>
      ))}
    </div>
  );
}
