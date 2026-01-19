import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed data script that adds example data using EXISTING users
 * Run AFTER seed-users.ts: npx tsx prisma/seed-data.ts
 */

async function main() {
    console.log('🌱 Adding example data to MEP Projects...\n');

    // Get company
    const company = await prisma.company.findFirst({ where: { slug: 'mep-projects' } });
    if (!company) throw new Error('Company not found. Run seed-users.ts first.');

    // Get existing users
    const users = await prisma.user.findMany({ where: { companyId: company.id } });
    if (users.length === 0) throw new Error('No users found. Run seed-users.ts first.');

    console.log(`Found ${users.length} users`);

    const getSuperAdmin = () => users.find(u => u.role === 'SUPERADMIN')!;
    const getByDept = (dept: string) => users.filter(u => u.department === dept);

    const civilUsers = getByDept('CIVIL_DESIGN');
    const electricalUsers = getByDept('ELECTRICAL');
    const instrumentUsers = getByDept('INSTRUMENTATION');
    const adminUsers = getByDept('ADMINISTRATION');
    const superAdmin = getSuperAdmin();

    // Clean old data
    console.log('🗑️ Cleaning old data...');
    await prisma.notification.deleteMany();
    await prisma.eventAttendee.deleteMany();
    await prisma.event.deleteMany();
    await prisma.timeEntry.deleteMany();
    await prisma.taskComment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.project.deleteMany();
    await prisma.clientContact.deleteMany();
    await prisma.client.deleteMany();
    await prisma.holiday.deleteMany();
    console.log('✅ Old data cleaned\n');

    // ============================================
    // CLIENTS
    // ============================================
    console.log('🏢 Creating clients...');

    const clients = await Promise.all([
        prisma.client.create({ data: { name: 'Repsol S.A.', email: 'contacto@repsol.com', phone: '+34 917 538 100', address: 'Méndez Álvaro 44, Madrid', website: 'www.repsol.com', companyId: company.id } }),
        prisma.client.create({ data: { name: 'CEPSA', email: 'info@cepsa.com', phone: '+34 913 376 000', address: 'Castellana 259A, Madrid', website: 'www.cepsa.com', companyId: company.id } }),
        prisma.client.create({ data: { name: 'Naturgy', email: 'contacto@naturgy.com', phone: '+34 912 100 100', address: 'San Luis 77, Madrid', website: 'www.naturgy.com', companyId: company.id } }),
        prisma.client.create({ data: { name: 'Ferrovial', email: 'industrial@ferrovial.com', phone: '+34 915 866 000', address: 'Príncipe de Vergara 135, Madrid', website: 'www.ferrovial.com', companyId: company.id } }),
        prisma.client.create({ data: { name: 'Técnicas Reunidas', email: 'proyectos@tecnicas.es', phone: '+34 917 222 920', address: 'Arapiles 14, Madrid', website: 'www.tecnicasreunidas.es', companyId: company.id } }),
    ]);
    console.log(`✅ ${clients.length} clients created`);

    // ============================================
    // PROJECTS
    // ============================================
    console.log('\n📁 Creating projects...');

    const projects = await Promise.all([
        prisma.project.create({ data: { code: 'REP-2026-001', name: 'Refinería Cartagena - Modernización FCC', year: 2026, department: 'CIVIL_DESIGN', clientId: clients[0].id, companyId: company.id } }),
        prisma.project.create({ data: { code: 'CEP-2026-002', name: 'Planta Químicos Palos - Ampliación', year: 2026, department: 'ELECTRICAL', clientId: clients[1].id, companyId: company.id } }),
        prisma.project.create({ data: { code: 'NAT-2026-003', name: 'Terminal GNL Barcelona - Control', year: 2026, department: 'INSTRUMENTATION', clientId: clients[2].id, companyId: company.id } }),
        prisma.project.create({ data: { code: 'FER-2025-012', name: 'Hospital La Paz - Instalaciones', year: 2025, department: 'ELECTRICAL', clientId: clients[3].id, companyId: company.id } }),
        prisma.project.create({ data: { code: 'TEC-2026-004', name: 'Refinería Bilbao - P&ID', year: 2026, department: 'CIVIL_DESIGN', clientId: clients[4].id, companyId: company.id } }),
    ]);
    console.log(`✅ ${projects.length} projects created`);

    // ============================================
    // TASKS
    // ============================================
    console.log('\n✅ Creating tasks...');

    const taskData = [
        { projectIdx: 0, title: 'Revisión documentación existente FCC', status: 'COMPLETED', priority: 'HIGH', user: civilUsers[0] },
        { projectIdx: 0, title: 'P&ID Unidad de Destilación', status: 'IN_PROGRESS', priority: 'URGENT', user: civilUsers[1] },
        { projectIdx: 0, title: 'Isométricos de tuberías zona A', status: 'IN_PROGRESS', priority: 'HIGH', user: civilUsers[2] },
        { projectIdx: 0, title: 'Cálculo de soportes de tuberías', status: 'PENDING', priority: 'MEDIUM', user: civilUsers[3] },
        { projectIdx: 0, title: 'Diseño sistema eléctrico MT', status: 'IN_PROGRESS', priority: 'HIGH', user: electricalUsers[0] },
        { projectIdx: 0, title: 'Unifilares subestación 66kV', status: 'PENDING', priority: 'HIGH', user: electricalUsers[1] },
        { projectIdx: 0, title: 'Lógica de control DCS', status: 'PENDING', priority: 'MEDIUM', user: instrumentUsers[0] },
        { projectIdx: 1, title: 'Estudio de implantación', status: 'COMPLETED', priority: 'HIGH', user: civilUsers[4] },
        { projectIdx: 1, title: 'Plot plan nuevas unidades', status: 'IN_PROGRESS', priority: 'HIGH', user: civilUsers[5] },
        { projectIdx: 1, title: 'Diseño sistema alumbrado', status: 'PENDING', priority: 'MEDIUM', user: electricalUsers[2] },
        { projectIdx: 1, title: 'Cuadro de cables área 100', status: 'PENDING', priority: 'LOW', user: electricalUsers[3] },
    ];

    const tasks = [];
    for (const t of taskData) {
        if (!t.user) continue;
        tasks.push(await prisma.task.create({
            data: {
                title: t.title,
                description: `Tarea del proyecto ${projects[t.projectIdx].code}`,
                status: t.status as any,
                priority: t.priority as any,
                dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
                projectId: projects[t.projectIdx].id,
                createdById: superAdmin.id,
                assignedToId: t.user.id,
            },
        }));
    }
    console.log(`✅ ${tasks.length} tasks created`);

    // ============================================
    // TIME ENTRIES (last 30 days)
    // ============================================
    console.log('\n🕐 Creating time entries...');

    let timeEntryCount = 0;
    const today = new Date();
    const allWorkers = [...civilUsers, ...electricalUsers, ...instrumentUsers];

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() - dayOffset);
        date.setHours(0, 0, 0, 0);

        if (date.getDay() === 0 || date.getDay() === 6) continue;

        const usersToLog = allWorkers.filter(() => Math.random() > 0.3);
        for (const user of usersToLog) {
            const project = projects[Math.floor(Math.random() * projects.length)];
            await prisma.timeEntry.create({
                data: {
                    date: date,
                    hours: Math.round((6 + Math.random() * 3) * 10) / 10,
                    notes: `Trabajo en ${project.code}`,
                    status: dayOffset > 7 ? 'APPROVED' : (dayOffset > 3 ? 'SUBMITTED' : 'DRAFT'),
                    userId: user.id,
                    projectId: project.id,
                },
            });
            timeEntryCount++;
        }
    }
    console.log(`✅ ${timeEntryCount} time entries created`);

    // ============================================
    // LEADS (CRM)
    // ============================================
    console.log('\n🎯 Creating leads...');

    const leads = await Promise.all([
        prisma.lead.create({ data: { title: 'Parque Eólico Offshore - Iberdrola', description: 'Interesados en diseño offshore', value: 350000, probability: 60, stage: 'QUALIFIED', assignedToId: adminUsers[0]?.id || superAdmin.id, companyId: company.id } }),
        prisma.lead.create({ data: { title: 'Planta Solar - Acciona', description: 'Presupuesto para planta solar 50MW', value: 280000, probability: 30, stage: 'NEW', assignedToId: superAdmin.id, companyId: company.id } }),
        prisma.lead.create({ data: { title: 'Retrofit Ciclo Combinado - Endesa', description: 'Modernización central', value: 520000, probability: 75, stage: 'PROPOSAL', assignedToId: adminUsers[0]?.id || superAdmin.id, companyId: company.id } }),
        prisma.lead.create({ data: { title: 'Proyecto Oriente Medio - Sacyr', description: 'Colaboración internacional', value: 180000, probability: 40, stage: 'NEGOTIATION', assignedToId: superAdmin.id, companyId: company.id } }),
    ]);
    console.log(`✅ ${leads.length} leads created`);

    // ============================================
    // EVENTS (Calendar)
    // ============================================
    console.log('\n📅 Creating events...');

    const events = await Promise.all([
        prisma.event.create({ data: { title: 'Reunión Kickoff Repsol FCC', description: 'Inicio proyecto con cliente', startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), location: 'Campus Repsol', type: 'MEETING', userId: superAdmin.id, projectId: projects[0].id } }),
        prisma.event.create({ data: { title: 'Revisión semanal Civil', description: 'Avance departamento civil', startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), location: 'Sala MEP', type: 'MEETING', userId: superAdmin.id } }),
        prisma.event.create({ data: { title: 'Entrega P&IDs Fase 1', description: 'Fecha límite entrega', startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), allDay: true, type: 'DEADLINE', userId: superAdmin.id, projectId: projects[0].id } }),
    ]);
    console.log(`✅ ${events.length} events created`);

    // ============================================
    // HOLIDAYS (2026)
    // ============================================
    console.log('\n🎄 Creating holidays...');

    const holidayData = [
        { name: 'Año Nuevo', date: '2026-01-01' },
        { name: 'Reyes Magos', date: '2026-01-06' },
        { name: 'Jueves Santo', date: '2026-04-02' },
        { name: 'Viernes Santo', date: '2026-04-03' },
        { name: 'Día del Trabajo', date: '2026-05-01' },
        { name: 'Asunción', date: '2026-08-15' },
        { name: 'Fiesta Nacional', date: '2026-10-12' },
        { name: 'Todos los Santos', date: '2026-11-01' },
        { name: 'Constitución', date: '2026-12-06' },
        { name: 'Inmaculada', date: '2026-12-08' },
        { name: 'Navidad', date: '2026-12-25' },
    ];

    const holidays = [];
    for (const h of holidayData) {
        holidays.push(await prisma.holiday.create({ data: { name: h.name, date: new Date(h.date), type: 'NATIONAL', year: 2026, companyId: company.id } }));
    }
    console.log(`✅ ${holidays.length} holidays created`);

    // ============================================
    // NOTIFICATIONS
    // ============================================
    console.log('\n🔔 Creating notifications...');

    const notifications = [];
    for (const user of users.slice(0, 10)) {
        notifications.push(await prisma.notification.create({ data: { userId: user.id, type: 'SYSTEM', title: '¡Bienvenido a MEP Projects!', message: 'Tu cuenta está lista. Explora el sistema.', link: '/dashboard' } }));
    }
    console.log(`✅ ${notifications.length} notifications created`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEED DATA COMPLETED!');
    console.log('='.repeat(50));
    console.log(`
📊 Summary:
   • ${clients.length} Clients
   • ${projects.length} Projects  
   • ${tasks.length} Tasks
   • ${timeEntryCount} Time Entries
   • ${leads.length} Leads
   • ${events.length} Events
   • ${holidays.length} Holidays
   • ${notifications.length} Notifications
   
🔐 Login: Mep2026!
   • SuperAdmin: enrique.gallego@mep-projects.com
   • Admin: carmen.lay@mep-projects.com
   • Worker: alfonso.mateos@mep-projects.com
`);
}

main()
    .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
