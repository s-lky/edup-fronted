import { useEffect, useRef, useState } from "react";
import type { Danmuku as DanmakuType } from "../types";

// 在原有弹幕类型基础上，新增位置、开播时间字段
interface DanmakuItem extends DanmakuType{
    top:number;  //弹幕垂直百分比位置
    startTime:number; //弹幕创建时间戳
}

export default function DanmakuOverlay({ messages }:{ messages:DanmakuType[] }){
    // 屏幕上正在滚动的弹幕列表
    const [activeDanmakus, setActiveDanmakus] = useState<DanmakuItem[]>([]);
    // 记录上一次处理时间
    const lastProcessedTime = useRef<number>(-1);

    useEffect(() =>{
        // 1秒执行一次轮询
        const interval = setInterval(() =>{
             // 20%概率随机生成一条测试弹幕
            if(Math.random() > 0.8){
                const newItem: DanmakuItem = {
                    id: Math.random().toString(),
                    text:["弹幕1", "弹幕2", "弹幕3", "弹幕4", "弹幕5"][Math.floor(Math.random() * 6)],
                    time:0,
                    color:['#FFFFFF','#FFD700','#00FF00','00FFFF','#FF69B4'][Math.floor(Math.random() * 5)],
                    userId:'user',
                    username:'Guset',
                    top:10 + Math.random() * 80,  // 纵向10%~90%随机位置
                    startTime:Date.now()  //记录生成时间
                };
                // 追加到活跃弹幕列表
                setActiveDanmakus(prev => [...prev, newItem]);
            }
            // 过滤移除超过8秒的弹幕，自动销毁
            const now = Date.now();
            setActiveDanmakus(prev => prev.filter(d => now - d.startTime < 8000));
        }, 1000);
        //清除定时器
        return ()=>clearInterval(interval);
    },[]);

    return(
        // 全屏绝对定位弹幕容器
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            {activeDanmakus.map((d) =>(
                <div
                    key={d.id}
                    className="absolute whitespace-nowrap font-medium text-lg drop-shadow-md animate-danmaku"
                    style={{
                        top: `${d.top}%`,
                        color: d.color,
                        textShadow: '0 0 4px rgba(0,0,0,0.8)',
                        transform:'translateX(100vw)'
                    }}
                >
                    {d.text}
                </div>
            ))}
        </div>
    );
}