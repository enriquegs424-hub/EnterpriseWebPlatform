import { lazy } from 'react';

// Lazy load heavy modals to improve initial bundle size
export const TaskDetailsModal = lazy(() => import('@/components/tasks/TaskDetailsModal'));
export const CreateEventModal = lazy(() => import('@/components/calendar/CreateEventModal'));
export const EventDetailsModal = lazy(() => import('@/components/calendar/EventDetailsModal'));
export const ImagePreviewModal = lazy(() => import('@/components/documents/ImagePreviewModal'));

// Usage example:
// import { Suspense } from 'react';
// import { TaskDetailsModal } from '@/components/lazy';
//
// <Suspense fallback={<Spinner size="lg" />}>
//   <TaskDetailsModal ... />
// </Suspense>
