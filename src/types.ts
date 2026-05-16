export interface Course{
    id:string;
    title:string;
    description:string;
    instructor:string;
    price:number;
    thumbnail:string;
    category:string;
    studentsCount:number;
    rating:number;
    videos:Video[];
}

export interface Video{
    id:string;
    title:string;
    url:string;
    duration:string;
    thumbnail:string;
}

export interface Danmuku{
    id:string;
    text:string;
    videoTimeSec:number;
    color:string;
    userId:string;
    username:string;
    createdAt?: string;
}

export interface User{
    id:string;
    name:string;
    role:'learner'|'instructor'|'admin';
    avatar:string;
    purchasedCourses:string[];
    learningStats:{
        totalMinutes:number;
        completedVideos:number;
    };
}

export interface Order{
    id:string;
    courseId:string;
    userId:string;
    amount:number;
    status:'paid'|'pending';
    createdAt: string;
    courseTitle?: string;
}