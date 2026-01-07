'use client';

import { useState, useEffect } from 'react';
import Timer from './Timer';
import { saveTimerEntry } from './actions';

interface Project {
    id: string;
    code: string;
    name: string;
}

export default function TimerWrapper() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Cargar proyectos del lado del cliente
        fetch('/api/projects')
            .then(res => res.json())
            .then(data => {
                setProjects(data.filter((p: any) => p.isActive));
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading projects:', err);
                setLoading(false);
            });
    }, []);

    const handleSave = async (hours: number, projectId: string, notes?: string) => {
        await saveTimerEntry({ hours, projectId, notes });
    };

    if (loading) {
        return (
            <div className="flex items-center space-x-2 text-neutral-400">
                <div className="w-4 h-4 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return <Timer projects={projects} onSave={handleSave} />;
}
