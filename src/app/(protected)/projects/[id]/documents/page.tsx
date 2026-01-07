'use client';

import DocumentsView from '@/components/documents/DocumentsView';

export default function ProjectDocumentsPage({ params }: { params: { id: string } }) {
    return <DocumentsView projectId={params.id} />;
}
