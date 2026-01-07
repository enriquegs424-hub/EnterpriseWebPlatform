

// ===== SETTINGS MODULE =====

class SettingsModule {
    constructor() {
        this.settings = {
            general: {},
            notifications: {},
            security: {},
            integrations: {}
        };
    }

    async render(container) {
        const settingsHTML = `
            <div class="module-content" id="settings-module">
                <div class="space-y-6">
                    <!-- Header -->
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 style="font-size: var(--font-size-3xl); font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-xs);">
                                Configuración
                            </h2>
                            <p style="color: var(--text-secondary); font-size: var(--font-size-lg); font-weight: 500;">
                                Personaliza tu experiencia en MEP-Projects
                            </p>
                        </div>
                        <div style="display: flex; gap: var(--space-md);">
                            <button class="btn btn-secondary" onclick="settingsModule.exportSettings()">
                                <i data-lucide="download"></i>
                                Exportar
                            </button>
                            <button class="btn btn-primary" onclick="settingsModule.saveSettings()">
                                <i data-lucide="save"></i>
                                Guardar Cambios
                            </button>
                        </div>
                    </div>

                    <!-- Settings Sections -->
                    <div class="grid" style="grid-template-columns: 250px 1fr; gap: var(--space-2xl);">
                        <!-- Settings Navigation -->
                        <div class="card" style="padding: var(--space-lg); height: fit-content;">
                            <nav class="space-y-2">
                                ${this.renderSettingsNav()}
                            </nav>
                        </div>

                        <!-- Settings Content -->
                        <div class="card" id="settings-content">
                            ${this.renderGeneralSettings()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = settingsHTML;
        window.settingsModule = this;
        
        // Load saved settings
        this.loadSettings();
    }

    renderSettingsNav() {
        const sections = [
            { id: 'general', icon: 'settings', label: 'General' },
            { id: 'notifications', icon: 'bell', label: 'Notificaciones' },
            { id: 'security', icon: 'shield', label: 'Seguridad' },
            { id: 'integrations', icon: 'plug', label: 'Integraciones' },
            { id: 'appearance', icon: 'palette', label: 'Apariencia' },
            { id: 'data', icon: 'database', label: 'Datos' }
        ];

        return sections.map(section => `
            <button class="setting-nav-item ${section.id === 'general' ? 'active' : ''}" 
                    onclick="settingsModule.switchSection('${section.id}')"
                    style="width: 100%; display: flex; align-items: center; gap: var(--space-md); 
                           padding: var(--space-md); border-radius: var(--radius-lg); 
                           border: none; background: transparent; color: var(--text-primary); 
                           cursor: pointer; transition: all var(--transition-fast); text-align: left;">
                <i data-lucide="${section.icon}" style="width: 20px; height: 20px;"></i>
                <span style="font-weight: 500;">${section.label}</span>
            </button>
        `).join('');
    }

    renderGeneralSettings() {
        return `
            <div class="settings-section" id="general-settings">
                <h3 style="font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-xl);">
                    Configuración General
                </h3>
                
                <div class="space-y-6">
                    <!-- Language -->
                    <div class="setting-item">
                        <div style="flex: 1;">
                            <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                                Idioma
                            </h4>
                            <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                                Selecciona el idioma de la interfaz
                            </p>
                        </div>
                        <select class="form-select" style="width: 200px;" onchange="settingsModule.updateSetting('language', this.value)">
                            <option value="es" selected>Español</option>
                            <option value="en">English</option>
                            <option value="pt">Português</option>
                        </select>
                    </div>

                    <!-- Timezone -->
                    <div class="setting-item">
                        <div style="flex: 1;">
                            <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                                Zona Horaria
                            </h4>
                            <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                                Configura tu zona horaria local
                            </p>
                        </div>
                        <select class="form-select" style="width: 200px;" onchange="settingsModule.updateSetting('timezone', this.value)">
                            <option value="Europe/Madrid" selected>Madrid (GMT+1)</option>
                            <option value="Europe/London">Londres (GMT)</option>
                            <option value="America/New_York">Nueva York (GMT-5)</option>
                        </select>
                    </div>

                    <!-- Date Format -->
                    <div class="setting-item">
                        <div style="flex: 1;">
                            <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                                Formato de Fecha
                            </h4>
                            <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                                Elige cómo mostrar las fechas
                            </p>
                        </div>
                        <select class="form-select" style="width: 200px;" onchange="settingsModule.updateSetting('dateFormat', this.value)">
                            <option value="DD/MM/YYYY" selected>DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                    </div>

                    <!-- Auto-save -->
                    <div class="setting-item">
                        <div style="flex: 1;">
                            <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                                Guardado Automático
                            </h4>
                            <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                                Guarda automáticamente los cambios mientras trabajas
                            </p>
                        </div>
                        <div class="setting-toggle active" onclick="settingsModule.toggleSetting('autoSave')">
                            <div class="setting-toggle-button"></div>
                        </div>
                    </div>

                    <!-- Keyboard Shortcuts -->
                    <div class="setting-item">
                        <div style="flex: 1;">
                            <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                                Atajos de Teclado
                            </h4>
                            <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                                Habilita los atajos de teclado para acciones rápidas
                            </p>
                        </div>
                        <div class="setting-toggle active" onclick="settingsModule.toggleSetting('shortcuts')">
                            <div class="setting-toggle-button"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderNotificationSettings() {
        return `
            <div class="settings-section" id="notification-settings">
                <h3 style="font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-xl);">
                    Configuración de Notificaciones
                </h3>
                
                <div class="space-y-6">
                    <!-- Email Notifications -->
                    <div class="setting-item">
                        <div style="flex: 1;">
                           <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                               Notificaciones por Email
                           </h4>
                           <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                               Recibe actualizaciones importantes en tu correo
                           </p>
                       </div>
                       <div class="setting-toggle active" onclick="settingsModule.toggleSetting('emailNotifications')">
                           <div class="setting-toggle-button"></div>
                       </div>
                   </div>

                   <!-- Desktop Notifications -->
                   <div class="setting-item">
                       <div style="flex: 1;">
                           <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                               Notificaciones de Escritorio
                           </h4>
                           <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                               Muestra notificaciones en tu escritorio
                           </p>
                       </div>
                       <div class="setting-toggle active" onclick="settingsModule.toggleSetting('desktopNotifications')">
                           <div class="setting-toggle-button"></div>
                       </div>
                   </div>

                   <!-- Sound Notifications -->
                   <div class="setting-item">
                       <div style="flex: 1;">
                           <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                               Sonidos
                           </h4>
                           <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                               Reproduce sonidos para nuevas notificaciones
                           </p>
                       </div>
                       <div class="setting-toggle active" onclick="settingsModule.toggleSetting('soundNotifications')">
                           <div class="setting-toggle-button"></div>
                       </div>
                   </div>

                   <!-- Notification Types -->
                   <div style="margin-top: var(--space-2xl);">
                       <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-lg);">
                           Tipos de Notificación
                       </h4>
                       <div class="space-y-4">
                           ${this.renderNotificationTypes()}
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   renderNotificationTypes() {
       const types = [
           { id: 'projects', label: 'Actualizaciones de Proyectos', enabled: true },
           { id: 'tasks', label: 'Asignación de Tareas', enabled: true },
           { id: 'messages', label: 'Nuevos Mensajes', enabled: true },
           { id: 'mentions', label: 'Menciones', enabled: true },
           { id: 'deadlines', label: 'Recordatorios de Fechas Límite', enabled: true },
           { id: 'system', label: 'Actualizaciones del Sistema', enabled: false }
       ];

       return types.map(type => `
           <div style="display: flex; align-items: center; gap: var(--space-md);">
               <input type="checkbox" ${type.enabled ? 'checked' : ''} 
                      onchange="settingsModule.updateNotificationType('${type.id}', this.checked)"
                      style="width: 18px; height: 18px; cursor: pointer;">
               <label style="font-size: var(--font-size-sm); color: var(--text-primary); cursor: pointer;">
                   ${type.label}
               </label>
           </div>
       `).join('');
   }

   renderSecuritySettings() {
       return `
           <div class="settings-section" id="security-settings">
               <h3 style="font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-xl);">
                   Seguridad y Privacidad
               </h3>
               
               <div class="space-y-6">
                   <!-- Two-Factor Authentication -->
                   <div class="setting-item">
                       <div style="flex: 1;">
                           <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                               Autenticación de Dos Factores
                           </h4>
                           <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                               Añade una capa extra de seguridad a tu cuenta
                           </p>
                       </div>
                       <button class="btn btn-primary" onclick="settingsModule.setup2FA()">
                           Configurar
                       </button>
                   </div>

                   <!-- Session Timeout -->
                   <div class="setting-item">
                       <div style="flex: 1;">
                           <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                               Tiempo de Sesión
                           </h4>
                           <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                               Cierra sesión automáticamente después de inactividad
                           </p>
                       </div>
                       <select class="form-select" style="width: 200px;" onchange="settingsModule.updateSetting('sessionTimeout', this.value)">
                           <option value="30">30 minutos</option>
                           <option value="60" selected>1 hora</option>
                           <option value="120">2 horas</option>
                           <option value="0">Nunca</option>
                       </select>
                   </div>

                   <!-- Password Change -->
                   <div class="setting-item">
                       <div style="flex: 1;">
                           <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                               Contraseña
                           </h4>
                           <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                               Última actualización hace 45 días
                           </p>
                       </div>
                       <button class="btn btn-secondary" onclick="settingsModule.changePassword()">
                           Cambiar Contraseña
                       </button>
                   </div>

                   <!-- Active Sessions -->
                   <div style="margin-top: var(--space-2xl);">
                       <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-lg);">
                           Sesiones Activas
                       </h4>
                       <div class="space-y-4">
                           ${this.renderActiveSessions()}
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   renderActiveSessions() {
       const sessions = [
           { device: 'Chrome - Windows', location: 'Madrid, España', current: true },
           { device: 'Safari - iPhone', location: 'Barcelona, España', current: false }
       ];

       return sessions.map(session => `
           <div style="display: flex; justify-content: space-between; align-items: center; 
                      padding: var(--space-md); background: var(--bg-tertiary); 
                      border-radius: var(--radius-lg);">
               <div>
                   <div style="font-weight: 600; color: var(--text-primary);">
                       ${session.device} ${session.current ? '(Sesión actual)' : ''}
                   </div>
                   <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                       ${session.location}
                   </div>
               </div>
               ${!session.current ? `
                   <button class="btn btn-ghost" onclick="settingsModule.revokeSession('${session.device}')">
                       Cerrar Sesión
                   </button>
               ` : ''}
           </div>
       `).join('');
   }

   renderIntegrationSettings() {
       return `
           <div class="settings-section" id="integration-settings">
               <h3 style="font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-xl);">
                   Integraciones
               </h3>
               
               <div class="space-y-6">
                   ${this.renderIntegrations()}
               </div>
           </div>
       `;
   }

   renderIntegrations() {
       const integrations = [
           { id: 'google', name: 'Google Workspace', icon: 'chrome', connected: true },
           { id: 'slack', name: 'Slack', icon: 'message-square', connected: false },
           { id: 'github', name: 'GitHub', icon: 'github', connected: true },
           { id: 'jira', name: 'Jira', icon: 'trello', connected: false }
       ];

       return integrations.map(integration => `
           <div class="setting-item">
               <div style="display: flex; align-items: center; gap: var(--space-md); flex: 1;">
                   <div style="width: 48px; height: 48px; background: var(--bg-tertiary); 
                              border-radius: var(--radius-lg); display: flex; align-items: center; 
                              justify-content: center;">
                       <i data-lucide="${integration.icon}" style="width: 24px; height: 24px; 
                          color: ${integration.connected ? 'var(--mep-success)' : 'var(--text-tertiary)'};"></i>
                   </div>
                   <div>
                       <h4 style="font-weight: 600; color: var(--text-primary);">
                           ${integration.name}
                       </h4>
                       <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                           ${integration.connected ? 'Conectado' : 'No conectado'}
                       </p>
                   </div>
               </div>
               <button class="btn ${integration.connected ? 'btn-secondary' : 'btn-primary'}" 
                       onclick="settingsModule.toggleIntegration('${integration.id}')">
                   ${integration.connected ? 'Desconectar' : 'Conectar'}
               </button>
           </div>
       `).join('');
   }

   renderAppearanceSettings() {
       return `
           <div class="settings-section" id="appearance-settings">
               <h3 style="font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-xl);">
                   Apariencia
               </h3>
               
               <div class="space-y-6">
                   <!-- Theme -->
                   <div class="setting-item">
                       <div style="flex: 1;">
                           <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                               Tema
                           </h4>
                           <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                               Elige entre tema claro u oscuro
                           </p>
                       </div>
                       <select class="form-select" style="width: 200px;" onchange="settingsModule.updateTheme(this.value)">
                           <option value="light" selected>Claro</option>
                           <option value="dark">Oscuro</option>
                           <option value="auto">Automático</option>
                       </select>
                   </div>

                   <!-- Color Accent -->
                   <div class="setting-item">
                       <div style="flex: 1;">
                           <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                               Color de Acento
                           </h4>
                           <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                               Personaliza el color principal de la interfaz
                           </p>
                       </div>
                       <div style="display: flex; gap: var(--space-sm);">
                           ${this.renderColorOptions()}
                       </div>
                   </div>

                   <!-- Font Size -->
                   <div class="setting-item">
                       <div style="flex: 1;">
                           <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                               Tamaño de Fuente
                           </h4>
                           <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                               Ajusta el tamaño del texto
                           </p>
                       </div>
                       <select class="form-select" style="width: 200px;" onchange="settingsModule.updateFontSize(this.value)">
                           <option value="small">Pequeño</option>
                           <option value="medium" selected>Medio</option>
                           <option value="large">Grande</option>
                       </select>
                   </div>

                   <!-- Animations -->
                   <div class="setting-item">
                       <div style="flex: 1;">
                           <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                               Animaciones
                           </h4>
                           <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                               Habilita las animaciones y transiciones
                           </p>
                       </div>
                       <div class="setting-toggle active" onclick="settingsModule.toggleSetting('animations')">
                           <div class="setting-toggle-button"></div>
                       </div>
                   </div>
               </div>
           </div>
       `;
   }

   renderColorOptions() {
       const colors = [
           { name: 'green', color: '#10B981' },
           { name: 'blue', color: '#3B82F6' },
           { name: 'purple', color: '#8B5CF6' },
           { name: 'orange', color: '#F59E0B' },
           { name: 'pink', color: '#EC4899' }
       ];

       return colors.map(color => `
           <button onclick="settingsModule.updateAccentColor('${color.name}')"
                   style="width: 32px; height: 32px; background: ${color.color}; 
                          border: 2px solid ${color.name === 'green' ? 'var(--text-primary)' : 'transparent'}; 
                          border-radius: var(--radius-full); cursor: pointer; 
                          transition: all var(--transition-fast);">
           </button>
       `).join('');
   }

   renderDataSettings() {
       return `
           <div class="settings-section" id="data-settings">
               <h3 style="font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-xl);">
                   Datos y Privacidad
               </h3>
               
               <div class="space-y-6">
                   <!-- Export Data -->
                   <div class="setting-item">
                       <div style="flex: 1;">
                           <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                               Exportar Datos
                           </h4>
                           <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                               Descarga una copia de todos tus datos
                           </p>
                       </div>
                       <button class="btn btn-secondary" onclick="settingsModule.exportAllData()">
                           Exportar
                       </button>
                   </div>

                   <!-- Clear Cache -->
                   <div class="setting-item">
                       <div style="flex: 1;">
                           <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-xs);">
                               Limpiar Caché
                           </h4>
                           <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                               Elimina los datos temporales almacenados
                           </p>
                       </div>
                       <button class="btn btn-secondary" onclick="settingsModule.clearCache()">
                           Limpiar
                       </button>
                   </div>

                   <!-- Delete Account -->
                   <div class="setting-item" style="border: 2px solid var(--mep-error); border-radius: var(--radius-lg); 
                                                   padding: var(--space-lg); background: rgba(239, 68, 68, 0.05);">
                       <div style="flex: 1;">
                           <h4 style="font-weight: 600; color: var(--mep-error); margin-bottom: var(--space-xs);">
                               Eliminar Cuenta
                           </h4>
                           <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                               Esta acción es permanente y no se puede deshacer
                           </p>
                       </div>
                       <button class="btn btn-ghost" style="color: var(--mep-error);" 
                               onclick="settingsModule.deleteAccount()">
                           Eliminar
                       </button>
                   </div>
               </div>
           </div>
       `;
   }

   // Methods
   loadSettings() {
       // Load saved settings from localStorage
       const savedSettings = MEP_Utils.storage.get('user-settings') || {};
       this.settings = { ...this.settings, ...savedSettings };
       
       console.log('Loaded settings:', this.settings);
   }

   saveSettings() {
       // Save settings to localStorage
       MEP_Utils.storage.set('user-settings', this.settings);
       showNotification('Configuración', 'Los cambios se han guardado correctamente', 'success');
   }

   switchSection(sectionId) {
       // Update navigation
       MEP_Utils.$$('.setting-nav-item').forEach(item => {
           item.classList.toggle('active', item.textContent.toLowerCase().includes(sectionId));
       });

       // Update content
       const contentEl = MEP_Utils.$('#settings-content');
       if (contentEl) {
           switch(sectionId) {
               case 'general':
                   contentEl.innerHTML = this.renderGeneralSettings();
                   break;
               case 'notifications':
                   contentEl.innerHTML = this.renderNotificationSettings();
                   break;
               case 'security':
                   contentEl.innerHTML = this.renderSecuritySettings();
                   break;
               case 'integrations':
                   contentEl.innerHTML = this.renderIntegrationSettings();
                   break;
               case 'appearance':
                   contentEl.innerHTML = this.renderAppearanceSettings();
                   break;
               case 'data':
                   contentEl.innerHTML = this.renderDataSettings();
                   break;
           }
           window.app.initIcons();
       }
   }

   updateSetting(key, value) {
       this.settings.general[key] = value;
       console.log(`Updated ${key} to ${value}`);
   }

   toggleSetting(key) {
       const toggle = event.target.closest('.setting-toggle');
       const isActive = toggle.classList.contains('active');
       
       toggle.classList.toggle('active', !isActive);
       this.settings.general[key] = !isActive;
       
       console.log(`Toggled ${key} to ${!isActive}`);
   }

   updateNotificationType(type, enabled) {
       this.settings.notifications[type] = enabled;
       console.log(`Notification type ${type} set to ${enabled}`);
   }

   updateTheme(theme) {
       if (theme === 'auto') {
           // Detect system preference
           const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
           theme = prefersDark ? 'dark' : 'light';
       }
       
       window.app.setTheme(theme);
       this.settings.appearance = { ...this.settings.appearance, theme };
   }

   updateAccentColor(color) {
       console.log(`Updating accent color to ${color}`);
       // Update CSS variables for accent color
       document.documentElement.style.setProperty('--mep-primary-500', color);
       this.settings.appearance = { ...this.settings.appearance, accentColor: color };
   }

   updateFontSize(size) {
       console.log(`Updating font size to ${size}`);
       // Update root font size
       const sizes = {
           small: '14px',
           medium: '16px',
           large: '18px'
       };
       document.documentElement.style.fontSize = sizes[size];
       this.settings.appearance = { ...this.settings.appearance, fontSize: size };
   }

   exportSettings() {
       const data = JSON.stringify(this.settings, null, 2);
       const blob = new Blob([data], { type: 'application/json' });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = 'mep-settings.json';
       a.click();
       
       showNotification('Exportación', 'Configuración exportada correctamente', 'success');
   }

   // Security methods
   setup2FA() {
       console.log('Setting up 2FA...');
       showNotification('2FA', 'Configurando autenticación de dos factores...', 'info');
   }

   changePassword() {
       console.log('Changing password...');
       showNotification('Contraseña', 'Abriendo formulario de cambio de contraseña...', 'info');
   }

   revokeSession(device) {
       console.log('Revoking session for:', device);
       showNotification('Sesión', `Sesión cerrada en ${device}`, 'success');
   }

   // Integration methods
   toggleIntegration(integrationId) {
       console.log('Toggling integration:', integrationId);
       showNotification('Integración', `Procesando integración con ${integrationId}...`, 'info');
   }

   // Data methods
   exportAllData() {
       console.log('Exporting all user data...');
       showNotification('Exportación', 'Preparando archivo de exportación...', 'info');
   }

   clearCache() {
       if (confirm('¿Estás seguro de que deseas limpiar el caché?')) {
           MEP_Utils.storage.clear();
           showNotification('Caché', 'Caché limpiado correctamente', 'success');
           setTimeout(() => location.reload(), 1000);
       }
   }

   deleteAccount() {
       if (confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
           console.log('Deleting account...');
           showNotification('Cuenta', 'Procesando eliminación de cuenta...', 'warning');
       }
   }

   async afterRender() {
       // Post-render initialization
       console.log('Settings module initialized');
   }
}

// Export module
if (typeof module !== 'undefined' && module.exports) {
   module.exports = SettingsModule;
}