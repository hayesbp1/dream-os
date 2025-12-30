
import { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday
} from 'date-fns';
import { CaretLeft, CaretRight, Plus } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { Project, Task } from '../../types';

interface TemporalViewProps {
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

export function TemporalView({ projects, setProjects }: TemporalViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskEnergy, setNewTaskEnergy] = useState<'high' | 'medium' | 'low'>('high');

    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Flatten all tasks for easy filtering
    const allTasks = projects.flatMap(p => p.tasks.map(t => ({ ...t, projectId: p.id })));

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setIsModalOpen(true);
    };

    const addTask = () => {
        if (!newTaskText.trim() || !selectedDate) return;

        // Add to the first project for now, or a "General" project if exists.
        // Ideally user selects project, but simple first.
        // Let's assume the first project is safe to add to, or specifically 'Dream OS Dev' or similar.
        // Or just the first one.
        const targetProjectId = projects[0]?.id;
        if (!targetProjectId) return;

        const newTask: Task = {
            id: crypto.randomUUID(),
            text: newTaskText,
            completed: false,
            scheduledDate: selectedDate.toISOString(),
            energy: newTaskEnergy,
        };

        setProjects(prev => prev.map(p => {
            if (p.id === targetProjectId) {
                return { ...p, tasks: [...p.tasks, newTask] };
            }
            return p;
        }));

        setNewTaskText('');
        setIsModalOpen(false);
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header */}
            <div className="glass-panel p-4 rounded-2xl flex items-center justify-between shrink-0">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                >
                    <CaretLeft weight="bold" className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-bold text-white drop-shadow-md">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>

                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                >
                    <CaretRight weight="bold" className="w-6 h-6" />
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-7 gap-4 h-full auto-rows-fr">
                    {/* Weekday Headers */}
                    {weekDays.map(day => (
                        <div key={day} className="text-center text-white/60 font-medium text-sm py-2">
                            {day}
                        </div>
                    ))}

                    {/* Days */}
                    {calendarDays.map((day: Date) => {
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isTodayDate = isToday(day);
                        const dayTasks = allTasks.filter(t => t.scheduledDate && isSameDay(new Date(t.scheduledDate), day));

                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                    "p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col gap-1 overflow-hidden group",
                                    isCurrentMonth ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20" : "bg-transparent border-transparent opacity-30",
                                    isTodayDate && "ring-2 ring-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)] bg-cyan-900/10"
                                )}
                            >
                                <span className={cn(
                                    "text-sm font-bold block mb-1",
                                    isTodayDate ? "text-cyan-300" : "text-white/70"
                                )}>
                                    {format(day, 'd')}
                                </span>

                                {/* Task Pills */}
                                <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
                                    {dayTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className={cn(
                                                "text-[10px] px-2 py-0.5 rounded-full truncate border border-white/10 text-white/90 shadow-sm",
                                                task.energy === 'high' ? "bg-green-500/30 hover:bg-green-500/40" :
                                                    task.energy === 'medium' ? "bg-yellow-500/30 hover:bg-yellow-500/40" :
                                                        "bg-blue-500/30 hover:bg-blue-500/40"
                                            )}
                                            title={task.text}
                                        >
                                            {task.text}
                                        </div>
                                    ))}
                                </div>

                                {/* Hover Add Icon */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-4 h-4 text-white/50" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick Schedule Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-panel w-full max-w-md p-6 rounded-2xl relative z-10 border border-white/20"
                        >
                            <h3 className="text-xl font-bold text-white mb-4">
                                Schedule for {selectedDate && format(selectedDate, 'MMM d, yyyy')}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-white/60 text-sm mb-1 block">Task</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newTaskText}
                                        onChange={e => setNewTaskText(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                                        placeholder="What needs to be done?"
                                        onKeyDown={e => e.key === 'Enter' && addTask()}
                                    />
                                </div>

                                <div>
                                    <label className="text-white/60 text-sm mb-1 block">Energy Level</label>
                                    <div className="flex gap-2">
                                        {(['high', 'medium', 'low'] as const).map(level => (
                                            <button
                                                key={level}
                                                onClick={() => setNewTaskEnergy(level)}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-sm font-medium border capitalize transition-all",
                                                    newTaskEnergy === level
                                                        ? "bg-white/20 border-white/40 text-white shadow-inner"
                                                        : "bg-transparent border-white/10 text-white/50 hover:bg-white/5"
                                                )}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={addTask}
                                        disabled={!newTaskText.trim()}
                                        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Add Task
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
