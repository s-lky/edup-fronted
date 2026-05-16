import { useEffect, useRef, useState } from "react";
import type { Danmuku as DanmakuType } from "../types";

interface DanmakuItem extends DanmakuType{
    top:number;
    startTime:number;
}

export default function DanmakuOverlay({ messages }:{ messages:DanmakuType[] }){
    const [activeDanmakus, setActiveDanmakus] = useState<DanmakuItem[]>([]);
    const lastProcessedTime = useRef<number>(-1);

    useEffect(() =>{
        const interval = setInterval(() =>{
            if(Math.random() > 0.8){
                const newItem: DanmakuItem = {
                    id: Math.random().toString(),
                    text:["弹幕1", "弹幕2", "弹幕3", "弹幕4", "弹幕5"][Math.floor(Math.random() * 6)],
                    time:0,
                    color:['#FFFFFF','#FFD700','#00FF00','00FFFF','#FF69B4'][Math.floor(Math.random() * 5)],
                    userId:'user',
                    username:'Guset',
                    top:10 + Math.random() * 80,
                    startTime:Date.now()
                };
                setActiveDanmakus(prev => [...prev, newItem]);
            }

            const now = Date.now();
            setActiveDanmakus(prev => prev.filter(d => now - d.startTime < 8000));
        }, 1000);

        return ()=>clearInterval(interval);
    },[]);

    return(
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