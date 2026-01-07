import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando seed de la base de datos...\n')

    // Limpiar datos existentes (opcional - comentar si no quieres borrar)
    console.log('🗑️  Limpiando datos anteriores...')
    await prisma.timeEntry.deleteMany()
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.client.deleteMany()
    await prisma.user.deleteMany()
    console.log('✅ Datos anteriores eliminados\n')

    const passwordHash = await bcrypt.hash('admin123', 10)

    // ============================================
    // USUARIOS
    // ============================================
    console.log('👥 Creando usuarios...')

    const admin = await prisma.user.create({
        data: {
            email: 'admin@mep-projects.com',
            name: 'Enrique',
            passwordHash,
            role: 'ADMIN',
            department: 'ADMINISTRATION',
            isActive: true,
            dailyWorkHours: 8,
        },
    })

    const workers = await Promise.all([
        prisma.user.create({
            data: {
                email: 'carlos.martinez@mep-projects.com',
                name: 'Carlos Martínez',
                passwordHash,
                role: 'WORKER',
                department: 'ENGINEERING',
                isActive: true,
                dailyWorkHours: 8,
            },
        }),
        prisma.user.create({
            data: {
                email: 'ana.lopez@mep-projects.com',
                name: 'Ana López',
                passwordHash,
                role: 'WORKER',
                department: 'ARCHITECTURE',
                isActive: true,
                dailyWorkHours: 8,
            },
        }),
        prisma.user.create({
            data: {
                email: 'miguel.sanchez@mep-projects.com',
                name: 'Miguel Sánchez',
                passwordHash,
                role: 'WORKER',
                department: 'ENGINEERING',
                isActive: true,
                dailyWorkHours: 8,
            },
        }),
        prisma.user.create({
            data: {
                email: 'laura.fernandez@mep-projects.com',
                name: 'Laura Fernández',
                passwordHash,
                role: 'WORKER',
                department: 'ADMINISTRATION',
                isActive: true,
                dailyWorkHours: 8,
            },
        }),
        prisma.user.create({
            data: {
                email: 'david.rodriguez@mep-projects.com',
                name: 'David Rodríguez',
                passwordHash,
                role: 'WORKER',
                department: 'ENGINEERING',
                isActive: true,
                dailyWorkHours: 8,
            },
        }),
    ])

    console.log(`✅ ${workers.length + 1} usuarios creados\n`)

    // ============================================
    // CLIENTES
    // ============================================
    console.log('🏢 Creando clientes...')

    const clients = await Promise.all([
        prisma.client.create({
            data: {
                name: 'Constructora Mediterránea S.L.',
                email: 'contacto@constructoramediterranea.com',
                phone: '+34 912 345 678',
                address: 'Calle Mayor 123, Madrid',
                isActive: true,
            },
        }),
        prisma.client.create({
            data: {
                name: 'Inmobiliaria Costa del Sol',
                email: 'info@inmobiliariacostadelsol.com',
                phone: '+34 952 111 222',
                address: 'Avenida del Mar 45, Málaga',
                isActive: true,
            },
        }),
        prisma.client.create({
            data: {
                name: 'Ayuntamiento de Valencia',
                email: 'obras@valencia.es',
                phone: '+34 963 333 444',
                address: 'Plaza del Ayuntamiento 1, Valencia',
                isActive: true,
            },
        }),
        prisma.client.create({
            data: {
                name: 'Grupo Hotelero Ibérico',
                email: 'proyectos@grupohoteleroiberico.com',
                phone: '+34 915 555 666',
                isActive: true,
            },
        }),
        prisma.client.create({
            data: {
                name: 'Desarrollos Urbanos BCN',
                email: 'contacto@desarrollosbcn.com',
                phone: '+34 933 777 888',
                address: 'Paseo de Gracia 88, Barcelona',
                isActive: true,
            },
        }),
    ])

    console.log(`✅ ${clients.length} clientes creados\n`)

    // ============================================
    // PROYECTOS
    // ============================================
    console.log('📁 Creando proyectos...')

    const projects = await Promise.all([
        prisma.project.create({
            data: {
                code: 'P-26-001',
                name: 'Rehabilitación Edificio Histórico Centro',
                year: 2026,
                department: 'ARCHITECTURE',
                clientId: clients[0].id,
                isActive: true,
            },
        }),
        prisma.project.create({
            data: {
                code: 'P-26-002',
                name: 'Diseño MEP Complejo Residencial',
                year: 2026,
                department: 'ENGINEERING',
                clientId: clients[1].id,
                isActive: true,
            },
        }),
        prisma.project.create({
            data: {
                code: 'P-26-003',
                name: 'Remodelación Plaza Mayor Valencia',
                year: 2026,
                department: 'ARCHITECTURE',
                clientId: clients[2].id,
                isActive: true,
            },
        }),
        prisma.project.create({
            data: {
                code: 'P-25-088',
                name: 'Hotel 5 Estrellas Costa del Sol',
                year: 2025,
                department: 'ENGINEERING',
                clientId: clients[3].id,
                isActive: true,
            },
        }),
        prisma.project.create({
            data: {
                code: 'P-25-089',
                name: 'Oficinas Corporativas Barcelona',
                year: 2025,
                department: 'ARCHITECTURE',
                clientId: clients[4].id,
                isActive: true,
            },
        }),
        prisma.project.create({
            data: {
                code: 'P-26-004',
                name: 'Mantenimiento Industrial Planta Norte',
                year: 2026,
                department: 'ENGINEERING',
                clientId: clients[0].id,
                isActive: true,
            },
        }),
    ])

    console.log(`✅ ${projects.length} proyectos creados\n`)

    // ============================================
    // TAREAS
    // ============================================
    console.log('✅ Creando tareas...')

    const allUsers = [admin, ...workers]
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const tasks = await Promise.all([
        // Tareas urgentes
        prisma.task.create({
            data: {
                title: 'Revisión urgente de planos estructurales',
                description: 'Revisar y aprobar planos estructurales antes de la reunión con el cliente',
                priority: 'URGENT',
                status: 'IN_PROGRESS',
                type: 'REVIEW',
                dueDate: tomorrow,
                assignedToId: workers[0].id,
                createdById: admin.id,
                projectId: projects[0].id,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Corregir cálculos de climatización',
                description: 'Error detectado en cálculos de carga térmica del edificio B',
                priority: 'URGENT',
                status: 'PENDING',
                type: 'PROJECT',
                dueDate: today,
                assignedToId: workers[2].id,
                createdById: admin.id,
                projectId: projects[1].id,
            },
        }),

        // Tareas de alta prioridad
        prisma.task.create({
            data: {
                title: 'Preparar presentación para cliente',
                description: 'Crear presentación con renders y planimetría del proyecto',
                priority: 'HIGH',
                status: 'IN_PROGRESS',
                type: 'MEETING',
                dueDate: nextWeek,
                assignedToId: workers[1].id,
                createdById: admin.id,
                projectId: projects[2].id,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Actualizar documentación técnica',
                description: 'Incorporar últimas modificaciones en la memoria técnica',
                priority: 'HIGH',
                status: 'PENDING',
                type: 'PROJECT',
                dueDate: nextWeek,
                assignedToId: workers[0].id,
                createdById: admin.id,
                projectId: projects[3].id,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Coordinar con instaladores eléctricos',
                description: 'Reunión de coordinación para resolver interferencias',
                priority: 'HIGH',
                status: 'PENDING',
                type: 'MEETING',
                dueDate: nextWeek,
                assignedToId: workers[4].id,
                createdById: admin.id,
                projectId: projects[1].id,
            },
        }),

        // Tareas de prioridad media
        prisma.task.create({
            data: {
                title: 'Modelado BIM de instalaciones',
                description: 'Completar modelo BIM de fontanería y saneamiento',
                priority: 'MEDIUM',
                status: 'IN_PROGRESS',
                type: 'PROJECT',
                dueDate: nextWeek,
                assignedToId: workers[2].id,
                createdById: admin.id,
                projectId: projects[4].id,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Revisión de presupuesto',
                description: 'Validar partidas del presupuesto con proveedores',
                priority: 'MEDIUM',
                status: 'PENDING',
                type: 'GENERAL',
                dueDate: nextWeek,
                assignedToId: workers[3].id,
                createdById: admin.id,
                projectId: projects[0].id,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Inspección de obra',
                description: 'Visita a obra para verificar avance de trabajos',
                priority: 'MEDIUM',
                status: 'PENDING',
                type: 'REVIEW',
                dueDate: nextWeek,
                assignedToId: workers[0].id,
                createdById: admin.id,
                projectId: projects[5].id,
            },
        }),

        // Tareas completadas
        prisma.task.create({
            data: {
                title: 'Entrega de planos de arquitectura',
                description: 'Planos de distribución y alzados entregados al cliente',
                priority: 'HIGH',
                status: 'COMPLETED',
                type: 'PROJECT',
                dueDate: lastWeek,
                completedAt: lastWeek,
                assignedToId: workers[1].id,
                createdById: admin.id,
                projectId: projects[2].id,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Cálculo de estructura metálica',
                description: 'Dimensionamiento de perfiles y uniones',
                priority: 'MEDIUM',
                status: 'COMPLETED',
                type: 'PROJECT',
                dueDate: lastWeek,
                completedAt: lastWeek,
                assignedToId: workers[0].id,
                createdById: admin.id,
                projectId: projects[3].id,
            },
        }),

        // Tareas de baja prioridad
        prisma.task.create({
            data: {
                title: 'Actualizar biblioteca de bloques CAD',
                description: 'Añadir nuevos bloques de mobiliario y equipamiento',
                priority: 'LOW',
                status: 'PENDING',
                type: 'MAINTENANCE',
                assignedToId: workers[1].id,
                createdById: admin.id,
            },
        }),
        prisma.task.create({
            data: {
                title: 'Organizar archivo de proyectos',
                description: 'Reorganizar estructura de carpetas en servidor',
                priority: 'LOW',
                status: 'PENDING',
                type: 'MAINTENANCE',
                assignedToId: workers[3].id,
                createdById: admin.id,
            },
        }),
    ])

    console.log(`✅ ${tasks.length} tareas creadas\n`)

    // ============================================
    // COMENTARIOS EN TAREAS
    // ============================================
    console.log('💬 Creando comentarios en tareas...')

    const comments = await Promise.all([
        prisma.taskComment.create({
            data: {
                content: 'He revisado los planos y encontré algunas inconsistencias en las cotas.',
                taskId: tasks[0].id,
                userId: workers[1].id,
            },
        }),
        prisma.taskComment.create({
            data: {
                content: 'Perfecto, voy a corregirlo ahora mismo.',
                taskId: tasks[0].id,
                userId: workers[0].id,
            },
        }),
        prisma.taskComment.create({
            data: {
                content: 'Los cálculos están listos. Adjunto el archivo Excel con los resultados.',
                taskId: tasks[1].id,
                userId: workers[2].id,
            },
        }),
        prisma.taskComment.create({
            data: {
                content: 'La presentación está al 80%. Necesito los renders finales.',
                taskId: tasks[2].id,
                userId: workers[1].id,
            },
        }),
        prisma.taskComment.create({
            data: {
                content: 'Coordinado con el instalador. Reunión programada para el jueves.',
                taskId: tasks[4].id,
                userId: workers[4].id,
            },
        }),
    ])

    console.log(`✅ ${comments.length} comentarios creados\n`)

    // ============================================
    // NOTIFICACIONES
    // ============================================
    console.log('🔔 Creando notificaciones...')

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const notifications = await Promise.all([
        prisma.notification.create({
            data: {
                userId: workers[0].id,
                type: 'TASK_ASSIGNED',
                title: 'Nueva tarea asignada',
                message: 'Te han asignado la tarea: Revisión urgente de planos estructurales',
                isRead: false,
            },
        }),
        prisma.notification.create({
            data: {
                userId: workers[0].id,
                type: 'TASK_COMMENT',
                title: 'Nuevo comentario en tarea',
                message: 'Ana López comentó en: Revisión urgente de planos estructurales',
                isRead: false,
            },
        }),
        prisma.notification.create({
            data: {
                userId: workers[2].id,
                type: 'TASK_DUE_SOON',
                title: 'Tarea próxima a vencer',
                message: 'La tarea "Corregir cálculos de climatización" vence hoy',
                isRead: false,
            },
        }),
        prisma.notification.create({
            data: {
                userId: admin.id,
                type: 'TASK_COMPLETED',
                title: 'Tarea completada',
                message: 'Ana López completó: Entrega de planos de arquitectura',
                isRead: true,
            },
        }),
        prisma.notification.create({
            data: {
                userId: workers[1].id,
                type: 'TASK_ASSIGNED',
                title: 'Nueva tarea asignada',
                message: 'Te han asignado la tarea: Preparar presentación para cliente',
                isRead: true,
            },
        }),
    ])

    console.log(`✅ ${notifications.length} notificaciones creadas\n`)

    // ============================================
    // REGISTROS DE HORAS
    // ============================================
    console.log('⏱️  Creando registros de horas...')

    const timeEntries = []

    // Generar registros de horas para los últimos 30 días
    for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        // Solo días laborables (lunes a viernes)
        if (date.getDay() !== 0 && date.getDay() !== 6) {
            // Cada trabajador registra horas en diferentes proyectos
            for (const worker of workers) {
                // 2-3 entradas por día
                const entriesPerDay = Math.floor(Math.random() * 2) + 2

                for (let j = 0; j < entriesPerDay; j++) {
                    const project = projects[Math.floor(Math.random() * projects.length)]
                    const hours = Math.floor(Math.random() * 4) + 2 // 2-6 horas

                    const notes = [
                        `Trabajo en ${project.name}`,
                        'Reunión de coordinación',
                        'Desarrollo de planos',
                        'Revisión de documentación',
                        'Cálculos estructurales',
                        'Modelado BIM',
                        'Visita a obra',
                        'Coordinación con cliente',
                    ]

                    timeEntries.push(
                        prisma.timeEntry.create({
                            data: {
                                userId: worker.id,
                                projectId: project.id,
                                date: date,
                                hours: hours,
                                notes: notes[Math.floor(Math.random() * notes.length)],
                            },
                        })
                    )
                }
            }
        }
    }

    await Promise.all(timeEntries)
    console.log(`✅ ${timeEntries.length} registros de horas creados\n`)

    // ============================================
    // CARPETAS
    // ============================================
    console.log('📁 Creando carpetas...')

    const folders = await Promise.all([
        prisma.folder.create({
            data: {
                name: 'Planos',
                description: 'Planos técnicos y arquitectónicos',
                createdById: admin.id,
            },
        }),
        prisma.folder.create({
            data: {
                name: 'Cálculos',
                description: 'Memorias de cálculo y hojas de cálculo',
                createdById: admin.id,
            },
        }),
        prisma.folder.create({
            data: {
                name: 'Informes',
                description: 'Informes técnicos y reportes',
                createdById: admin.id,
            },
        }),
        prisma.folder.create({
            data: {
                name: 'Documentación Técnica',
                description: 'Documentación técnica del proyecto',
                projectId: projects[0].id,
                createdById: workers[0].id,
            },
        }),
        prisma.folder.create({
            data: {
                name: 'Presentaciones',
                description: 'Presentaciones para clientes',
                projectId: projects[1].id,
                createdById: workers[1].id,
            },
        }),
    ])

    console.log(`✅ ${folders.length} carpetas creadas\n`)

    // ============================================
    // DOCUMENTOS
    // ============================================
    console.log('📄 Creando documentos...')

    const documents = await Promise.all([
        prisma.document.create({
            data: {
                name: 'Planos Estructurales - Edificio Centro',
                description: 'Planos estructurales completos del proyecto de rehabilitación',
                fileName: 'planos-estructurales-centro.pdf',
                fileSize: 2457600,
                fileType: 'application/pdf',
                filePath: '/uploads/planos-estructurales-centro.pdf',
                projectId: projects[0].id,
                folderId: folders[0].id,
                uploadedById: workers[0].id,
                version: 2,
            },
        }),
        prisma.document.create({
            data: {
                name: 'Memoria de Cálculo - Climatización',
                description: 'Cálculos detallados del sistema de climatización',
                fileName: 'memoria-calculo-climatizacion.pdf',
                fileSize: 1843200,
                fileType: 'application/pdf',
                filePath: '/uploads/memoria-calculo-climatizacion.pdf',
                projectId: projects[1].id,
                folderId: folders[1].id,
                uploadedById: workers[2].id,
                version: 1,
            },
        }),
        prisma.document.create({
            data: {
                name: 'Informe de Inspección - Plaza Mayor',
                description: 'Informe técnico de inspección del estado actual',
                fileName: 'informe-inspeccion-plaza.pdf',
                fileSize: 3145728,
                fileType: 'application/pdf',
                filePath: '/uploads/informe-inspeccion-plaza.pdf',
                projectId: projects[2].id,
                folderId: folders[2].id,
                uploadedById: workers[1].id,
                version: 1,
            },
        }),
        prisma.document.create({
            data: {
                name: 'Presupuesto Detallado - Hotel',
                description: 'Desglose completo de costos del proyecto hotelero',
                fileName: 'presupuesto-hotel.xlsx',
                fileSize: 524288,
                fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                filePath: '/uploads/presupuesto-hotel.xlsx',
                projectId: projects[3].id,
                folderId: folders[1].id,
                uploadedById: workers[3].id,
                version: 3,
            },
        }),
        prisma.document.create({
            data: {
                name: 'Mediciones - Oficinas Barcelona',
                description: 'Mediciones detalladas de instalaciones MEP',
                fileName: 'mediciones-oficinas-bcn.xlsx',
                fileSize: 409600,
                fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                filePath: '/uploads/mediciones-oficinas-bcn.xlsx',
                projectId: projects[4].id,
                uploadedById: workers[2].id,
                version: 1,
            },
        }),
        prisma.document.create({
            data: {
                name: 'Especificaciones Técnicas - Planta Industrial',
                description: 'Especificaciones técnicas de equipos y materiales',
                fileName: 'especificaciones-planta.docx',
                fileSize: 307200,
                fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                filePath: '/uploads/especificaciones-planta.docx',
                projectId: projects[5].id,
                folderId: folders[2].id,
                uploadedById: workers[4].id,
                version: 1,
            },
        }),
        prisma.document.create({
            data: {
                name: 'Plano de Instalaciones Eléctricas',
                description: 'Plano CAD de instalaciones eléctricas',
                fileName: 'instalaciones-electricas.dwg',
                fileSize: 1048576,
                fileType: 'application/acad',
                filePath: '/uploads/instalaciones-electricas.dwg',
                projectId: projects[0].id,
                folderId: folders[0].id,
                uploadedById: workers[0].id,
                version: 1,
            },
        }),
        prisma.document.create({
            data: {
                name: 'Foto de Obra - Estado Actual',
                description: 'Fotografía del estado actual de la obra',
                fileName: 'foto-obra-actual.jpg',
                fileSize: 2097152,
                fileType: 'image/jpeg',
                filePath: '/uploads/foto-obra-actual.jpg',
                projectId: projects[2].id,
                uploadedById: workers[1].id,
                version: 1,
            },
        }),
        prisma.document.create({
            data: {
                name: 'Render 3D - Fachada Principal',
                description: 'Renderizado 3D de la fachada principal',
                fileName: 'render-fachada.png',
                fileSize: 3145728,
                fileType: 'image/png',
                filePath: '/uploads/render-fachada.png',
                projectId: projects[0].id,
                folderId: folders[4].id,
                uploadedById: workers[1].id,
                version: 1,
            },
        }),
        prisma.document.create({
            data: {
                name: 'Manual de Procedimientos MEP',
                description: 'Manual interno de procedimientos de ingeniería MEP',
                fileName: 'manual-procedimientos.pdf',
                fileSize: 4194304,
                fileType: 'application/pdf',
                filePath: '/uploads/manual-procedimientos.pdf',
                uploadedById: admin.id,
                version: 1,
            },
        }),
    ])

    console.log(`✅ ${documents.length} documentos creados\n`)

    // ============================================
    // VERSIONES DE DOCUMENTOS
    // ============================================
    console.log('🔄 Creando versiones de documentos...')

    const versions = await Promise.all([
        prisma.documentVersion.create({
            data: {
                documentId: documents[0].id,
                version: 1,
                fileName: 'planos-estructurales-centro-v1.pdf',
                filePath: '/uploads/versions/planos-estructurales-centro-v1.pdf',
                fileSize: 2300000,
                uploadedById: workers[0].id,
                changes: 'Versión inicial de los planos estructurales',
            },
        }),
        prisma.documentVersion.create({
            data: {
                documentId: documents[3].id,
                version: 1,
                fileName: 'presupuesto-hotel-v1.xlsx',
                filePath: '/uploads/versions/presupuesto-hotel-v1.xlsx',
                fileSize: 480000,
                uploadedById: workers[3].id,
                changes: 'Versión inicial del presupuesto',
            },
        }),
        prisma.documentVersion.create({
            data: {
                documentId: documents[3].id,
                version: 2,
                fileName: 'presupuesto-hotel-v2.xlsx',
                filePath: '/uploads/versions/presupuesto-hotel-v2.xlsx',
                fileSize: 500000,
                uploadedById: workers[3].id,
                changes: 'Actualización de precios de materiales',
            },
        }),
    ])

    console.log(`✅ ${versions.length} versiones de documentos creadas\n`)

    // ============================================
    // COMPARTICIONES DE DOCUMENTOS
    // ============================================
    console.log('🔗 Creando comparticiones de documentos...')

    const shares = await Promise.all([
        prisma.documentShare.create({
            data: {
                documentId: documents[0].id,
                sharedWithId: workers[1].id,
                accessLevel: 'VIEW',
            },
        }),
        prisma.documentShare.create({
            data: {
                documentId: documents[0].id,
                sharedWithId: workers[2].id,
                accessLevel: 'DOWNLOAD',
            },
        }),
        prisma.documentShare.create({
            data: {
                documentId: documents[3].id,
                sharedWithId: admin.id,
                accessLevel: 'EDIT',
            },
        }),
        prisma.documentShare.create({
            data: {
                documentId: documents[2].id,
                sharedWithEmail: clients[2].email,
                accessLevel: 'VIEW',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        }),
    ])

    console.log(`✅ ${shares.length} comparticiones creadas\n`)

    // ============================================
    // RESUMEN
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 Base de datos inicializada correctamente')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('📊 RESUMEN:')
    console.log(`   👥 Usuarios: ${allUsers.length}`)
    console.log(`   🏢 Clientes: ${clients.length}`)
    console.log(`   📁 Proyectos: ${projects.length}`)
    console.log(`   ✅ Tareas: ${tasks.length}`)
    console.log(`   💬 Comentarios: ${comments.length}`)
    console.log(`   🔔 Notificaciones: ${notifications.length}`)
    console.log(`   ⏱️  Registros de horas: ${timeEntries.length}`)
    console.log(`   📂 Carpetas: ${folders.length}`)
    console.log(`   📄 Documentos: ${documents.length}`)
    console.log(`   🔄 Versiones: ${versions.length}`)
    console.log(`   🔗 Comparticiones: ${shares.length}\n`)

    console.log('🔐 CREDENCIALES DE ACCESO:\n')
    console.log('   ADMIN:')
    console.log('   📧 Email: admin@mep-projects.com')
    console.log('   🔑 Password: admin123\n')

    console.log('   TRABAJADORES (todos con password: admin123):')
    console.log('   📧 carlos.martinez@mep-projects.com')
    console.log('   📧 ana.lopez@mep-projects.com')
    console.log('   📧 miguel.sanchez@mep-projects.com')
    console.log('   📧 laura.fernandez@mep-projects.com')
    console.log('   📧 david.rodriguez@mep-projects.com\n')

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✨ ¡Listo para empezar!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Error:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
