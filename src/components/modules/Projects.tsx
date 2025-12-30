import { useState, useEffect, useRef } from 'react';
import { FlowDispatcher, type EnergyState } from './FlowDispatcher';
import { Folder, CheckCircle, Circle, Plus, TerminalWindow, Trash, PencilSimple, WarningCircle } from '@phosphor-icons/react';
import { GlassCard } from '../ui/GlassCard';
import type { Project, Task, Priority } from '../../types';
import { cn } from '../../lib/utils';

interface ProjectsProps {
    energy: EnergyState;
    setEnergy: (energy: EnergyState) => void;
    projects: Project[];
    setProjects: (projects: Project[]) => void;
}

export function Projects({ energy, setEnergy, projects, setProjects }: ProjectsProps) {
    const [inputValue, setInputValue] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    // Project Creation State
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const newProjectInputRef = useRef<HTMLInputElement>(null);

    // Project Editing State
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editProjectName, setEditProjectName] = useState('');

    // Initialize selectedProjectId once projects are loaded
    useEffect(() => {
        if (projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId]);

    // Auto-focus new project input
    useEffect(() => {
        if (isCreatingProject && newProjectInputRef.current) {
            newProjectInputRef.current.focus();
        }
    }, [isCreatingProject]);

    const parseTaskInput = (input: string): { text: string; priority: Priority } => {
        let text = input;
        let priority: Priority = 'low'; // Default

        if (text.includes('!high')) {
            priority = 'high';
            text = text.replace('!high', '').trim();
        } else if (text.includes('!med') || text.includes('!medium')) {
            priority = 'medium';
            text = text.replace(/!med(ium)?/, '').trim();
        } else if (text.includes('!low')) {
            priority = 'low';
            text = text.replace('!low', '').trim();
        }

        return { text, priority };
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim() && selectedProjectId) {
            const { text, priority } = parseTaskInput(inputValue);

            const newTask: Task = {
                id: crypto.randomUUID(),
                text: text,
                completed: false,
                priority: priority,
                dueDate: new Date().toISOString()
            };

            const updatedProjects = projects.map((project) => {
                if (project.id === selectedProjectId) {
                    return {
                        ...project,
                        tasks: [newTask, ...project.tasks]
                    };
                }
                return project;
            });
            setProjects(updatedProjects);
            setInputValue('');
        }
    };

    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            const newProject: Project = {
                id: crypto.randomUUID(),
                name: newProjectName.trim(),
                tasks: []
            };
            setProjects([...projects, newProject]);
            setSelectedProjectId(newProject.id);
            setNewProjectName('');
            setIsCreatingProject(false);
        } else {
            setIsCreatingProject(false);
        }
    };

    const handleProjectInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleCreateProject();
        } else if (e.key === 'Escape') {
            setIsCreatingProject(false);
            setNewProjectName('');
        }
    };

    const toggleTask = (projectId: string, taskId: string) => {
        const updatedProjects = projects.map(project => {
            if (project.id === projectId) {
                return {
                    ...project,
                    tasks: project.tasks.map(t =>
                        t.id === taskId ? { ...t, completed: !t.completed } : t
                    )
                };
            }
            return project;
        });
        setProjects(updatedProjects);
    };

    const deleteTask = (projectId: string, taskId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent toggling
        const updatedProjects = projects.map(project => {
            if (project.id === projectId) {
                return {
                    ...project,
                    tasks: project.tasks.filter(t => t.id !== taskId)
                };
            }
            return project;
        });
        setProjects(updatedProjects);
    };

    const deleteProject = (projectId: string) => {
        const updatedProjects = projects.filter(p => p.id !== projectId);
        setProjects(updatedProjects);
        if (selectedProjectId === projectId) {
            setSelectedProjectId(updatedProjects.length > 0 ? updatedProjects[0].id : null);
        }
    };

    const startEditingProject = (project: Project) => {
        setEditingProjectId(project.id);
        setEditProjectName(project.name);
    };

    const saveProjectName = (projectId: string) => {
        if (editProjectName.trim()) {
            setProjects(projects.map(p => p.id === projectId ? { ...p, name: editProjectName.trim() } : p));
        }
        setEditingProjectId(null);
    };

    const getPriorityColor = (priority?: Priority) => {
        switch (priority) {
            case 'high': return 'text-red-400';
            case 'medium': return 'text-yellow-400';
            case 'low': return 'text-green-400';
            default: return 'text-white/40';
        }
    };



    return (
        <div className="h-full flex flex-col gap-6">
            {/* Input Console */}
            <div className="flex-shrink-0 flex flex-col gap-3 z-20">
                {/* Project Selector Pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
                    {projects.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedProjectId(p.id)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-mono transition-all border whitespace-nowrap",
                                selectedProjectId === p.id
                                    ? "bg-blue-500/30 text-white border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                    : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80"
                            )}
                        >
                            {p.name}
                        </button>
                    ))}

                    {/* New Project Button / Input */}
                    {isCreatingProject ? (
                        <div className="flex items-center bg-white/10 rounded-full border border-white/20 px-2 py-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
                            <input
                                ref={newProjectInputRef}
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                onKeyDown={handleProjectInputKeyDown}
                                onBlur={handleCreateProject}
                                placeholder="Project Name..."
                                className="bg-transparent border-none text-white text-xs font-mono focus:ring-0 focus:outline-none w-32 placeholder-white/30"
                            />
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreatingProject(true)}
                            className="p-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                            title="Create New Project"
                        >
                            <Plus weight="duotone" className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl opacity-30 group-hover:opacity-50 transition duration-500 blur-sm"></div>
                    <div className="relative glass-panel rounded-xl p-1 flex items-center">
                        <div className="pl-4 pr-3 text-white/50">
                            <TerminalWindow weight="duotone" className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={selectedProjectId ? `Add task to ${projects.find(p => p.id === selectedProjectId)?.name}... (Tip: !high, !med)` : "Select a project..."}
                            className="w-full bg-transparent border-none text-white placeholder-white/40 focus:ring-0 focus:outline-none py-3 font-mono text-sm tracking-wide"
                            autoFocus={!isCreatingProject}
                            disabled={!selectedProjectId}
                        />
                        <div className="pr-2">
                            <div className="h-6 w-6 rounded bg-white/10 flex items-center justify-center border border-white/20">
                                <Plus weight="duotone" className="w-4 h-4 text-white/60" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Grid */}
            <div className="flex-1 overflow-y-auto pr-2 pb-2 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {projects.map((project) => (
                    <GlassCard key={project.id} className="flex flex-col gap-4 group/card" hoverEffect>
                        {/* Project Header */}
                        <div className="flex items-center gap-3 border-b border-white/10 pb-3 relative">
                            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
                                <Folder weight="duotone" className="w-5 h-5" />
                            </div>

                            {editingProjectId === project.id ? (
                                <input
                                    type="text"
                                    value={editProjectName}
                                    onChange={(e) => setEditProjectName(e.target.value)}
                                    onBlur={() => saveProjectName(project.id)}
                                    onKeyDown={(e) => e.key === 'Enter' && saveProjectName(project.id)}
                                    className="bg-transparent border-b border-blue-400 text-white font-bold text-lg focus:outline-none w-full"
                                    autoFocus
                                />
                            ) : (
                                <h3 className="text-lg font-bold text-white tracking-wide">{project.name}</h3>
                            )}

                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded-md">
                                    {project.tasks.filter(t => !t.completed).length} OPEN
                                </span>

                                {/* Project Actions (Hover Only) */}
                                <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => startEditingProject(project)}
                                        className="p-1.5 hover:bg-white/10 rounded-md text-white/40 hover:text-white transition-colors"
                                    >
                                        <PencilSimple weight="duotone" className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => deleteProject(project.id)}
                                        className="p-1.5 hover:bg-red-500/20 rounded-md text-white/40 hover:text-red-400 transition-colors"
                                    >
                                        <Trash weight="duotone" className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Task List */}
                        <div className="flex flex-col gap-2">
                            {/* Active Tasks */}
                            {project.tasks.filter(t => !t.completed).map((task) => (
                                <div key={task.id} className="group flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer relative" onClick={() => toggleTask(project.id, task.id)}>
                                    <div className={cn("mt-0.5 transition-colors", getPriorityColor(task.priority))}>
                                        {task.priority === 'high' ? <WarningCircle weight="duotone" className="w-4 h-4" /> : <Circle weight="duotone" className="w-4 h-4" />}
                                    </div>
                                    <span className="text-white/80 text-sm leading-relaxed group-hover:text-white transition-colors flex-1">
                                        {task.text}
                                    </span>

                                    {/* Task Actions */}
                                    <button
                                        onClick={(e) => deleteTask(project.id, task.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-white/20 hover:text-red-400 transition-all absolute right-2 top-1.5"
                                    >
                                        <Trash weight="duotone" className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}

                            {/* Completed Tasks */}
                            {project.tasks.filter(t => t.completed).length > 0 && (
                                <div className="mt-2 pt-2 border-t border-white/5">
                                    <div className="text-xs text-white/30 font-semibold mb-2 uppercase tracking-wider">Completed</div>
                                    {project.tasks.filter(t => t.completed).map((task) => (
                                        <div key={task.id} className="group flex items-start gap-3 p-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer relative" onClick={() => toggleTask(project.id, task.id)}>
                                            <div className="mt-0.5 text-green-400">
                                                <CheckCircle weight="duotone" className="w-4 h-4" />
                                            </div>
                                            <span className="text-white/60 text-sm leading-relaxed line-through decoration-white/30 flex-1">
                                                {task.text}
                                            </span>
                                            <button
                                                onClick={(e) => deleteTask(project.id, task.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-white/20 hover:text-red-400 transition-all absolute right-2 top-1.5"
                                            >
                                                <Trash weight="duotone" className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {project.tasks.length === 0 && (
                                <div className="text-center py-4 text-white/30 text-sm italic">
                                    No active protocols.
                                </div>
                            )}
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* System Status / Flow Dispatcher */}
            <div className="flex-shrink-0">
                <FlowDispatcher energy={energy} setEnergy={setEnergy} />
            </div>
        </div>
    );
}
