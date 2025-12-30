export type Priority = 'high' | 'medium' | 'low';

export interface Task {
    id: string;
    text: string;
    completed: boolean;
    priority?: Priority;
    scheduledDate?: string; // ISO string
    energy?: 'high' | 'medium' | 'low';
    dueDate?: string; // ISO string
}

export interface Project {
    id: string;
    name: string;
    tasks: Task[];
}

export interface Track {
    id: string;
    title: string;
    artist: string;
    url: string;
    duration?: number;
}

export interface SystemSettings {
    glassBlur: number; // px
    wallpaper: string; // url or gradient
    theme: 'day' | 'night';
}
