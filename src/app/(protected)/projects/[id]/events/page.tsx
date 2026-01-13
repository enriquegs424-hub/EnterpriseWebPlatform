import EventsView from '@/components/calendar/EventsView';
import { use } from 'react';

export default function ProjectEventsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <EventsView projectId={id} />;
}
