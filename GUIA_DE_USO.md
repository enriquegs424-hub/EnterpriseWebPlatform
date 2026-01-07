# 📖 GUÍA DE USO - MEP PROJECTS

**Versión**: 1.0  
**Fecha**: 7 de Enero de 2026  
**Para**: Todos los usuarios de MEP Projects

---

## 🚀 INICIO RÁPIDO

### **1. Acceder a la Aplicación**
```
URL: http://localhost:3000
```

### **2. Credenciales de Acceso**

**ADMINISTRADOR**:
```
📧 Email: admin@mep-projects.com
🔑 Password: admin123
```

**TRABAJADORES** (todos con password: admin123):
```
📧 carlos.martinez@mep-projects.com
📧 ana.lopez@mep-projects.com
📧 miguel.sanchez@mep-projects.com
📧 laura.fernandez@mep-projects.com
📧 david.rodriguez@mep-projects.com
```

---

## 📊 MÓDULOS DISPONIBLES

### **1. DASHBOARD** 📈
**Ruta**: `/dashboard`

**¿Qué puedes hacer?**
- Ver resumen de tus horas del mes
- Ver tus tareas pendientes (top 5)
- Acceder a acciones rápidas
- Ver gráficos de distribución de horas

**Acciones Rápidas**:
- Registrar Horas (Ctrl+H)
- Nueva Tarea (Ctrl+T)

---

### **2. TAREAS** ✅
**Ruta**: `/tasks`

**¿Qué puedes hacer?**
- Ver todas tus tareas
- Cambiar entre 3 vistas:
  - **Lista**: Tabla completa con filtros
  - **Kanban**: Arrastrar y soltar entre columnas
  - **Calendario**: Ver tareas por fecha
- Crear nuevas tareas
- Editar tareas existentes
- Agregar comentarios
- Marcar como completadas

**Atajos**:
- Ctrl+T: Nueva tarea
- Drag & drop en Kanban para cambiar estado

**Tipos de Tareas**:
- GENERAL: Tareas generales
- PROJECT: Relacionadas con proyecto
- MEETING: Reuniones
- REVIEW: Revisiones
- MAINTENANCE: Mantenimiento

**Prioridades**:
- URGENT: Rojo (vence hoy/mañana)
- HIGH: Naranja
- MEDIUM: Amarillo
- LOW: Verde

---

### **3. HORAS** ⏱️
**Ruta**: `/hours/daily`

**¿Qué puedes hacer?**
- Ver tus horas registradas
- Filtrar por fecha
- Ver resumen mensual
- Exportar reportes

**IMPORTANTE**: 
- Puedes tener **múltiples entradas por día**
- Cada entrada puede ser de un proyecto diferente
- Ejemplo:
  ```
  08:00-10:30 → P-26-001 (2.5h)
  10:30-11:00 → Sin proyecto (0.5h) - Reunión
  11:00-13:00 → P-26-002 (2h)
  Total día: 5h en 3 entradas
  ```

**Temporizador** (en el Header):
- Click en el icono del reloj
- Selecciona proyecto
- Click "Iniciar"
- Trabaja...
- Click "Guardar" cuando termines
- Puedes pausar y cambiar de proyecto

---

### **4. DOCUMENTOS** 📄
**Ruta**: `/documents`

**¿Qué puedes hacer?**
- Subir documentos (drag & drop)
- Organizar en carpetas
- Buscar documentos
- Ver documentos
- Descargar documentos
- Compartir documentos (próximamente)

**Tipos de Archivos Soportados**:
- PDFs
- Excel (.xlsx)
- Word (.docx)
- Imágenes (.jpg, .png)
- CAD (.dwg)

**Vistas**:
- Grid: Tarjetas visuales
- Lista: Tabla detallada

**Búsqueda**:
- Busca por nombre
- Busca por descripción
- Filtra por carpeta
- Filtra por proyecto

---

### **5. PROYECTOS** 📁
**Ruta**: `/projects`

**¿Qué puedes hacer?**
- Ver todos los proyectos
- Ver detalles del proyecto
- Ver tareas del proyecto
- Ver documentos del proyecto
- Ver horas del proyecto

**Información del Proyecto**:
- Código (ej: P-26-001)
- Nombre
- Cliente
- Departamento
- Estado (Activo/Inactivo)

---

### **6. CLIENTES** 🏢
**Ruta**: `/clients`

**¿Qué puedes hacer?**
- Ver todos los clientes
- Ver detalles del cliente
- Ver proyectos del cliente
- Información de contacto

---

### **7. BÚSQUEDA GLOBAL** 🔍
**Atajo**: `Ctrl+K` o `Cmd+K`

**¿Qué puedes buscar?**
- Tareas
- Proyectos
- Documentos
- Clientes
- Usuarios

**Cómo usar**:
1. Presiona Ctrl+K en cualquier página
2. Escribe lo que buscas
3. Usa ↑↓ para navegar
4. Presiona Enter para abrir
5. Presiona Esc para cerrar

---

## ⌨️ ATAJOS DE TECLADO

### **Globales**:
```
Ctrl+K → Búsqueda global
Esc → Cerrar modal
```

### **Planificados** (próximamente):
```
Ctrl+H → Nueva entrada de horas
Ctrl+T → Nueva tarea
Ctrl+D → Nuevo documento
Ctrl+P → Nuevo proyecto
Ctrl+/ → Ver todos los atajos
```

---

## 💡 CONSEJOS DE USO

### **Para Ingenieros**:
1. **Empieza el día** revisando tus tareas en el Dashboard
2. **Usa el temporizador** para registrar horas automáticamente
3. **Sube documentos** (planos, cálculos) al proyecto correspondiente
4. **Comenta en tareas** para comunicarte con el equipo
5. **Cambia el estado** de las tareas arrastrándolas en Kanban

### **Para Administración**:
1. **Revisa tareas administrativas** en la vista Lista
2. **Registra horas administrativas** (sin proyecto)
3. **Sube documentos** (facturas, contratos)
4. **Usa la búsqueda global** para encontrar información rápido

### **Para Dirección**:
1. **Revisa el Dashboard** para ver estado general
2. **Usa reportes** de horas por proyecto
3. **Revisa tareas** del equipo
4. **Accede a documentos** importantes rápidamente

---

## 🔄 FLUJOS DE TRABAJO COMUNES

### **Registrar Horas del Día**:
```
1. Click en temporizador (Header)
2. Selecciona proyecto
3. Click "Iniciar"
4. Trabaja en el proyecto
5. Cuando cambies de proyecto:
   - Click "Pausar"
   - Selecciona nuevo proyecto
   - Click "Iniciar"
6. Al final del día:
   - Click "Guardar"
   - Revisa tus horas en /hours/daily
```

### **Gestionar Tareas**:
```
1. Ve a /tasks
2. Selecciona vista preferida:
   - Lista: Para ver todas con filtros
   - Kanban: Para actualizar estados rápido
   - Calendario: Para planificar
3. Crea nueva tarea si necesitas
4. Arrastra tareas en Kanban para cambiar estado
5. Agrega comentarios para comunicarte
```

### **Subir Documentos**:
```
1. Ve a /documents
2. Click "Subir Archivo"
3. Arrastra archivos o selecciona
4. Espera a que suban
5. Organiza en carpetas si es necesario
6. Usa búsqueda para encontrarlos después
```

### **Buscar Información**:
```
1. Presiona Ctrl+K
2. Escribe lo que buscas
3. Navega con flechas
4. Presiona Enter para abrir
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### **No puedo iniciar sesión**:
- Verifica que estés usando el email correcto
- Verifica que la contraseña sea `admin123`
- Asegúrate de que el servidor esté corriendo

### **El temporizador no guarda**:
- Asegúrate de seleccionar un proyecto
- Verifica que tengas conexión
- Revisa que el tiempo sea mayor a 0

### **No encuentro un documento**:
- Usa la búsqueda (Ctrl+K)
- Verifica que esté en la carpeta correcta
- Verifica que tengas permisos

### **Las tareas no se actualizan**:
- Refresca la página (F5)
- Verifica tu conexión
- Cierra sesión y vuelve a entrar

---

## 📞 SOPORTE

### **Problemas Técnicos**:
- Revisa la consola del navegador (F12)
- Revisa los logs del servidor
- Contacta al administrador del sistema

### **Dudas de Uso**:
- Consulta esta guía
- Pregunta a tus compañeros
- Contacta al administrador

---

## 🔄 ACTUALIZACIONES

### **Próximas Funcionalidades**:
- ✅ Sistema de notificaciones
- ✅ Chat interno
- ✅ Calendario compartido
- ✅ Reportes en PDF
- ✅ Aplicación móvil (PWA)

### **Mejoras Planificadas**:
- Vista de horas mejorada (múltiples entradas)
- Visor de PDFs mejorado
- Compartir documentos
- CRM avanzado
- Gestión de gastos

---

## 🎯 MEJORES PRÁCTICAS

### **Horas**:
✅ Registra tus horas diariamente (no esperes al viernes)
✅ Usa el temporizador para precisión
✅ Agrega notas descriptivas
✅ Revisa totales semanales

### **Tareas**:
✅ Actualiza el estado regularmente
✅ Agrega comentarios útiles
✅ Usa prioridades correctamente
✅ Asigna fechas de vencimiento

### **Documentos**:
✅ Usa nombres descriptivos
✅ Organiza en carpetas
✅ Agrega descripciones
✅ Asocia a proyectos

### **General**:
✅ Usa atajos de teclado
✅ Usa la búsqueda global
✅ Mantén tus datos actualizados
✅ Comunica con el equipo

---

**¡Disfruta usando MEP Projects!** 🚀

**¿Preguntas?** Contacta al administrador del sistema.
