'use client';

import EventsView from '@/components/calendar/EventsView';

export default function ProjectEventsPage({ params }: { params: { id: string } }) {
    return <EventsView projectId={params.id} />;
}
