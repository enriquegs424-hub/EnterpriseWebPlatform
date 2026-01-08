import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const generateAnalyticsReport = (
    kpis: any,
    projectMetrics: any,
    teamMetrics: any,
    financialMetrics: any,
    dateRangeLabel: string
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Reporte de Analytics - MEP Projects', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 14, 30);
    doc.text(`Período: ${dateRangeLabel}`, 14, 35);

    // KPIs Summary
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Resumen Ejecutivo', 14, 50);

    autoTable(doc, {
        startY: 55,
        head: [['Métrica', 'Valor', 'Detalle']],
        body: [
            ['Proyectos Activos', kpis?.activeProjects?.toString() || '0', 'En progreso'],
            ['Tareas Completadas', kpis?.completedTasks?.toString() || '0', `${kpis?.taskCompletionRate?.toFixed(1) || 0}% tasa de éxito`],
            ['Horas Totales', `${kpis?.totalHours?.toString() || '0'}h`, 'Registradas en el período'],
            ['Ingresos Estimados', `€${financialMetrics?.totalRevenue?.toLocaleString() || '0'}`, 'Basado en horas registradas']
        ],
        theme: 'grid',
        headStyles: { fillColor: [132, 132, 64] }, // Olive color
    });

    // Projects Section
    let finalY = (doc as any).lastAutoTable.finalY + 20;

    doc.text('Rendimiento de Proyectos', 14, finalY);

    const projectRows = projectMetrics?.projects?.map((p: any) => [
        p.name,
        p.code,
        p.taskCount,
        `${p.timeEntryCount}h`
    ]) || [];

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Proyecto', 'Código', 'Tareas', 'Horas']],
        body: projectRows,
        theme: 'striped'
    });

    // Team Section
    finalY = (doc as any).lastAutoTable.finalY + 20;

    // Check if new page needed
    if (finalY > 250) {
        doc.addPage();
        finalY = 20;
    }

    doc.text('Productividad del Equipo', 14, finalY);

    const teamRows = teamMetrics?.map((u: any) => [
        u.name,
        u.completedTasks,
        `${u.totalHours.toFixed(1)}h`,
        (u.totalHours > 0 ? (u.completedTasks / (u.totalHours / 8)).toFixed(2) : '0')
    ]) || [];

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Miembro', 'Tareas Comp.', 'Horas', 'Tareas/Día']],
        body: teamRows,
        theme: 'striped'
    });

    // Save
    doc.save(`reporte-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
