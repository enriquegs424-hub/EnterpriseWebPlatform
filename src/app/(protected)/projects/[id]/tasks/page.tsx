import TasksView from '@/components/tasks/TasksView';
import { use } from 'react';

export default function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <TasksView projectId={id} />;
}
