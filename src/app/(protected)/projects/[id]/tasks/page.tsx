'use client';

import TasksView from '@/components/tasks/TasksView';

export default function ProjectTasksPage({ params }: { params: { id: string } }) {
    return <TasksView projectId={params.id} />;
}
