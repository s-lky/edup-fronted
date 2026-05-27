// 弹幕渲染组件
import { useEffect, useRef, useState } from 'react';
import type { DanmakuItem } from '../api/index';

// 页面中正在展示的弹幕结构
interface ActiveDanmaku {
  id: string;
  text: string;
  color: string;
  top: number;
  createdAt: number;
}

// 组件入参
interface DanmakuOverlayProps {
  currentTime: number;  // 视频当前播放时间（秒）
  danmakuList: DanmakuItem[];  // 全量弹幕列表（后端/静态数据）
}

export default function DanmakuOverlay({ currentTime, danmakuList }: DanmakuOverlayProps) {
  // 页面上当前正在播放的弹幕数组
  const [activeDanmakus, setActiveDanmakus] = useState<ActiveDanmaku[]>([]);
  // 记录已经发射过的弹幕ID，防止重复弹出
  const triggeredRef = useRef<Set<string>>(new Set());
  // 记录上一帧视频事件，用于判断是否回退进度
  const lastTimeRef = useRef(0);

  useEffect(() => {
    // 场景：视频时间大幅回退（快退/拖拽进度条）
    if (currentTime < lastTimeRef.current - 1) {
      triggeredRef.current.clear(); //清空已发射标记
      setActiveDanmakus([]); //清空页面所有弹幕
    }
    // 更新上一帧时间
    lastTimeRef.current = currentTime;

    // 遍历所有弹幕，判断是否到播放时机
    danmakuList.forEach((item) => {
      // 以及发送过的弹幕直接跳过
      if (triggeredRef.current.has(item.id)) return;

      // 计算:当前时间-弹幕预设出现时间
      const delta = currentTime - item.videoTimeSec;
      // 时间差在[0,1秒)区间内,判定为到点,触发弹幕
      if (delta >= 0 && delta < 1) {
        triggeredRef.current.add(item.id); //标记为已发射
        // 追加一条新弹幕到列表
        setActiveDanmakus((prev) => [
          ...prev,
          {
            id: item.id,
            text: item.text,
            color: item.color || '#ffffff', //无颜色默认白色
            top: 8 + Math.random() * 72, //垂直位置：8%-80%随机，避免贴顶贴底
            createdAt: Date.now(), //记录创建时间戳
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
