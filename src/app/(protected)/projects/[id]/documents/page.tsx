import DocumentsView from '@/components/documents/DocumentsView';
import { use } from 'react';

export default function ProjectDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <DocumentsView projectId={id} />;
}
