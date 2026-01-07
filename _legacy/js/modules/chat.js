

// ===== CHAT MODULE =====

class ChatModule {
    constructor() {
        this.conversations = [];
        this.activeConversation = null;
        this.currentUser = {
            id: 'user-1',
            name: 'Enrique',
            avatar: 'E',
            status: 'online'
        };
    }

    async render(container) {
        const chatHTML = `
            <div class="module-content" id="chat-module">
                <div class="chat-container">
                    <!-- Chat List -->
                    <div class="chat-list" id="chat-list">
                        <div style="padding: var(--space-lg); border-bottom: 1px solid var(--border-primary);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
                                <h3 style="font-weight: 700; color: var(--text-primary);">Mensajes</h3>
                                <button class="btn btn-ghost" onclick="chatModule.showNewChatModal()" style="padding: var(--space-sm);">
                                    <i data-lucide="edit" style="width: 18px; height: 18px;"></i>
                                </button>
                            </div>
                            
                            <div style="position: relative;">
                                <input type="text" class="form-input" placeholder="Buscar conversaciones..." 
                                       onkeyup="chatModule.searchConversations(this.value)"
                                       style="padding-left: 40px;">
                                <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; 
                                   transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-tertiary);"></i>
                            </div>
                        </div>
                        
                        <div class="space-y-2" style="padding: var(--space-md);" id="conversations-list">
                            ${this.renderConversationsList()}
                        </div>
                    </div>
                    
                    <!-- Chat Panel -->
                    <div class="chat-panel" id="chat-panel">
                        ${this.renderChatPanel()}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = chatHTML;
        window.chatModule = this;
    }

    renderConversationsList() {
        this.loadConversations();
        
        return this.conversations.map(conv => `
            <div class="chat-item ${conv.id === this.activeConversation?.id ? 'active' : ''}" 
                 onclick="chatModule.selectConversation('${conv.id}')">
                <div style="position: relative;">
                    <div class="user-avatar" style="width: 48px; height: 48px;">
                        ${conv.avatar}
                    </div>
                    <div style="position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; 
                               background: ${conv.status === 'online' ? 'var(--mep-success)' : 'var(--text-tertiary)'}; 
                               border: 3px solid var(--bg-surface); border-radius: var(--radius-full);"></div>
                </div>
                
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <h4 style="font-weight: 600; color: var(--text-primary); font-size: var(--font-size-base);">
                            ${conv.name}
                        </h4>
                        <span style="font-size: var(--font-size-xs); color: var(--text-tertiary);">
                            ${this.formatTime(conv.lastMessageTime)}
                        </span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <p style="font-size: var(--font-size-sm); color: var(--text-secondary); 
                                 white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
                            ${conv.typing ? '<em>Escribiendo...</em>' : conv.lastMessage}
                        </p>
                        ${conv.unread > 0 ? `
                            <span style="background: var(--mep-primary-500); color: white; 
                                        font-size: var(--font-size-xs); padding: 2px 6px; 
                                        border-radius: var(--radius-full); min-width: 20px; 
                                        text-align: center; font-weight: 700;">
                                ${conv.unread}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderChatPanel() {
        if (!this.activeConversation) {
            return this.renderEmptyState();
        }
        
        return `
            <!-- Chat Header -->
            <div class="chat-panel-header">
                <button class="btn btn-ghost" onclick="chatModule.closeChatPanel()" 
                        style="display: none; padding: var(--space-sm); margin-right: var(--space-md);"
                        id="chat-back-button">
                    <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
                </button>
                
                <div style="display: flex; align-items: center; gap: var(--space-md); flex: 1;">
                    <div style="position: relative;">
                        <div class="user-avatar" style="width: 40px; height: 40px;">
                            ${this.activeConversation.avatar}
                        </div>
                        <div style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; 
                                   background: ${this.activeConversation.status === 'online' ? 'var(--mep-success)' : 'var(--text-tertiary)'}; 
                                   border: 2px solid var(--bg-tertiary); border-radius: var(--radius-full);"></div>
                    </div>
                    
                    <div style="flex: 1;">
                        <h4 style="font-weight: 600; color: var(--text-primary);">
                            ${this.activeConversation.name}
                        </h4>
                        <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                            ${this.activeConversation.status === 'online' ? 'Activo ahora' : 
                              `Última vez ${this.formatTime(this.activeConversation.lastSeen)}`}
                        </p>
                    </div>
                </div>
                
                <div style="display: flex; gap: var(--space-sm);">
                    <button class="btn btn-ghost" onclick="chatModule.startVoiceCall()" style="padding: var(--space-sm);">
                        <i data-lucide="phone" style="width: 18px; height: 18px;"></i>
                    </button>
                    <button class="btn btn-ghost" onclick="chatModule.startVideoCall()" style="padding: var(--space-sm);">
                        <i data-lucide="video" style="width: 18px; height: 18px;"></i>
                    </button>
                    <button class="btn btn-ghost" onclick="chatModule.showChatInfo()" style="padding: var(--space-sm);">
                        <i data-lucide="info" style="width: 18px; height: 18px;"></i>
                    </button>
                </div>
            </div>
            
            <!-- Messages Area -->
            <div style="flex: 1; overflow-y: auto; padding: var(--space-xl);" id="messages-container">
                ${this.renderMessages()}
            </div>
            
            <!-- Typing Indicator -->
            <div id="typing-indicator" style="display: none; padding: 0 var(--space-xl) var(--space-md); 
                                             font-size: var(--font-size-sm); color: var(--text-secondary);">
                <i data-lucide="message-circle" style="width: 14px; height: 14px; 
                   display: inline-block; margin-right: var(--space-xs);"></i>
                ${this.activeConversation.name} está escribiendo...
            </div>
            
            <!-- Message Input -->
            <div style="padding: var(--space-lg); border-top: 1px solid var(--border-primary);">
                <form onsubmit="chatModule.sendMessage(event)" style="display: flex; gap: var(--space-md);">
                    <button type="button" class="btn btn-ghost" onclick="chatModule.attachFile()" 
                            style="padding: var(--space-sm);">
                        <i data-lucide="paperclip" style="width: 20px; height: 20px;"></i>
                    </button>
                    
                    <input type="text" class="form-input" id="message-input" 
                           placeholder="Escribe un mensaje..." 
                           style="flex: 1;" autocomplete="off">
                    
                    <button type="button" class="btn btn-ghost" onclick="chatModule.toggleEmoji()" 
                            style="padding: var(--space-sm);">
                        <i data-lucide="smile" style="width: 20px; height: 20px;"></i>
                    </button>
                    
                    <button type="submit" class="btn btn-primary">
                        <i data-lucide="send" style="width: 18px; height: 18px;"></i>
                        Enviar
                    </button>
                </form>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; 
                       justify-content: center; height: 100%; padding: var(--space-2xl);">
                <div style="width: 120px; height: 120px; background: var(--bg-tertiary); 
                           border-radius: var(--radius-full); display: flex; align-items: center; 
                           justify-content: center; margin-bottom: var(--space-xl);">
                    <i data-lucide="message-circle" style="width: 60px; height: 60px; color: var(--text-tertiary);"></i>
                </div>
                <h3 style="font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); 
                          margin-bottom: var(--space-sm);">
                    Selecciona una conversación
                </h3>
                <p style="color: var(--text-secondary); text-align: center; max-width: 400px;">
                    Elige una conversación de la lista para empezar a chatear o inicia una nueva conversación
                </p>
                <button class="btn btn-primary" onclick="chatModule.showNewChatModal()" 
                        style="margin-top: var(--space-xl);">
                    <i data-lucide="plus"></i>
                    Nueva Conversación
                </button>
            </div>
        `;
    }

    renderMessages() {
        const messages = this.activeConversation.messages || [];
        
        return messages.map((msg, index) => {
            const isMe = msg.sender === this.currentUser.id;
            const showAvatar = !isMe && (index === 0 || messages[index - 1].sender !== msg.sender);
            
            return `
                <div class="message ${isMe ? 'you' : 'other'}" style="display: flex; 
                            ${isMe ? 'justify-content: flex-end' : 'justify-content: flex-start'}; 
                            margin-bottom: var(--space-md);">
                    ${!isMe && showAvatar ? `
                        <div class="user-avatar" style="width: 32px; height: 32px; 
                                                        margin-right: var(--space-sm); flex-shrink: 0;">
                            ${this.activeConversation.avatar}
                        </div>
                    ` : !isMe ? '<div style="width: 32px; margin-right: var(--space-sm);"></div>' : ''}
                    
                    <div style="max-width: 70%;">
                        <div class="message-bubble" style="padding: var(--space-md); 
                                    background: ${isMe ? 'var(--bg-sidebar-active)' : 'var(--bg-tertiary)'}; 
                                    color: ${isMe ? 'white' : 'var(--text-primary)'}; 
                                    border-radius: var(--radius-lg); 
                                    ${isMe ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}">
                            ${msg.text}
                            
                            ${msg.attachments ? msg.attachments.map(att => `
                                <div style="margin-top: var(--space-sm); padding: var(--space-sm); 
                                           background: rgba(0,0,0,0.1); border-radius: var(--radius-md); 
                                           display: flex; align-items: center; gap: var(--space-sm);">
                                    <i data-lucide="${this.getFileIcon(att.type)}" 
                                       style="width: 16px; height: 16px;"></i>
                                    <span style="font-size: var(--font-size-sm);">${att.name}</span>
                                </div>
                            `).join('') : ''}
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: var(--space-sm); 
                                   margin-top: var(--space-xs); font-size: var(--font-size-xs); 
                                   color: var(--text-tertiary); ${isMe ? 'justify-content: flex-end;' : ''}">
                            <span>${this.formatTime(msg.timestamp)}</span>
                            ${isMe && msg.read ? '<i data-lucide="check-check" style="width: 14px; height: 14px;"></i>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Methods
    loadConversations() {
        // Mock conversations
        this.conversations = [
            {
                id: 'conv-1',
                name: 'Beatriz Tudela',
                avatar: 'BT',
                status: 'online',
                lastMessage: '¡Perfecto! Nos vemos en la reunión',
                lastMessageTime: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
                unread: 2,
                typing: false,
                messages: [
                    {
                        id: 'msg-1',
                        sender: 'user-2',
                        text: 'Hola Enrique, ¿has revisado el dashboard?',
                        timestamp: new Date(Date.now() - 1000 * 60 * 30),
                        read: true
                    },
                    {
                        id: 'msg-2',
                        sender: 'user-1',
                        text: 'Sí, acabo de verlos. Me parece excelente! Solo haría un pequeño ajuste en la paleta de colores.',
                        timestamp: new Date(Date.now() - 1000 * 60 * 25),
                        read: true
                    },
                    {
                        id: 'msg-3',
                        sender: 'user-2',
                        text: '¡Perfecto! Nos vemos en la reunión',
                        timestamp: new Date(Date.now() - 1000 * 60 * 5),
                        read: false
                    }
                ]
            },
            {
                id: 'conv-2',
                name: 'Francisco Gallego',
                avatar: 'FG',
                status: 'offline',
                lastSeen: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
                lastMessage: 'He optimizado las consultas SQL',
                lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
                unread: 0,
                typing: false,
                messages: []
            },
            {
                id: 'conv-3',
                name: 'Mari Carmen Lay',
                avatar: 'MC',
                status: 'online',
                lastMessage: 'Escribiendo...',
                lastMessageTime: new Date(),
                unread: 1,
                typing: true,
                messages: []
            },
            {
                id: 'conv-4',
                name: 'Equipo Desarrollo',
                avatar: 'ED',
                status: 'online',
                lastMessage: 'Edgar: El deploy está listo',
                lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
                unread: 0,
                typing: false,
                messages: []
            }
        ];
        
        // Set active conversation
        if (!this.activeConversation && this.conversations.length > 0) {
            this.activeConversation = this.conversations[0];
        }
    }

    selectConversation(conversationId) {
        this.activeConversation = this.conversations.find(c => c.id === conversationId);
        
        // Mark messages as read
        if (this.activeConversation) {
            this.activeConversation.unread = 0;
            this.activeConversation.messages.forEach(msg => msg.read = true);
        }
        
        // Refresh UI
        this.refreshChat();
        
        // Show chat panel on mobile
        if (window.innerWidth < 768) {
            MEP_Utils.$('#chat-list').style.display = 'none';
            MEP_Utils.$('#chat-back-button').style.display = 'block';
        }
        
        // Focus on input
        setTimeout(() => {
            MEP_Utils.$('#message-input')?.focus();
        }, 100);
    }

    closeChatPanel() {
        if (window.innerWidth < 768) {
            MEP_Utils.$('#chat-list').style.display = 'block';
            this.activeConversation = null;
            this.refreshChat();
        }
    }

    refreshChat() {
        const chatPanel = MEP_Utils.$('#chat-panel');
        const conversationsList = MEP_Utils.$('#conversations-list');
        
        if (chatPanel) {
            chatPanel.innerHTML = this.renderChatPanel();
        }
        
        if (conversationsList) {
            conversationsList.innerHTML = this.renderConversationsList();
        }
        
        window.app.initIcons();
        
        // Scroll to bottom of messages
        const messagesContainer = MEP_Utils.$('#messages-container');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    sendMessage(event) {
        event.preventDefault();
        
        const input = MEP_Utils.$('#message-input');
        const text = input.value.trim();
        
        if (!text || !this.activeConversation) return;
        
        // Add message
        const newMessage = {
            id: `msg-${Date.now()}`,
           sender: this.currentUser.id,
           text: text,
           timestamp: new Date(),
           read: false
       };
       
       this.activeConversation.messages.push(newMessage);
       this.activeConversation.lastMessage = text;
       this.activeConversation.lastMessageTime = new Date();
       
       // Clear input
       input.value = '';
       
       // Refresh messages
       const messagesContainer = MEP_Utils.$('#messages-container');
       if (messagesContainer) {
           messagesContainer.innerHTML = this.renderMessages();
           messagesContainer.scrollTop = messagesContainer.scrollHeight;
       }
       
       window.app.initIcons();
       
       // Simulate response
       this.simulateResponse();
   }

   simulateResponse() {
       // Show typing indicator
       const typingIndicator = MEP_Utils.$('#typing-indicator');
       if (typingIndicator) {
           typingIndicator.style.display = 'block';
       }
       
       // Simulate typing delay
       setTimeout(() => {
           if (typingIndicator) {
               typingIndicator.style.display = 'none';
           }
           
           // Add response
           const responses = [
               'Entendido, trabajaré en eso inmediatamente.',
               'Perfecto, gracias por la información.',
               '¡Excelente idea! Vamos a implementarlo.',
               'De acuerdo, lo revisaré y te confirmo.',
               '¡Genial! Me parece una buena propuesta.'
           ];
           
           const responseText = responses[Math.floor(Math.random() * responses.length)];
           
           const responseMessage = {
               id: `msg-${Date.now()}`,
               sender: 'user-2',
               text: responseText,
               timestamp: new Date(),
               read: false
           };
           
           this.activeConversation.messages.push(responseMessage);
           this.activeConversation.lastMessage = responseText;
           this.activeConversation.lastMessageTime = new Date();
           
           // Update conversation in list
           const conv = this.conversations.find(c => c.id === this.activeConversation.id);
           if (conv) {
               conv.lastMessage = responseText;
               conv.lastMessageTime = new Date();
           }
           
           // Refresh
           this.refreshChat();
           
           // Play notification sound
           this.playNotificationSound();
           
       }, 1000 + Math.random() * 2000); // 1-3 seconds delay
   }

   searchConversations(query) {
       // Filter conversations
       const filtered = this.conversations.filter(conv => 
           conv.name.toLowerCase().includes(query.toLowerCase()) ||
           conv.lastMessage.toLowerCase().includes(query.toLowerCase())
       );
       
       // Update list
       const conversationsList = MEP_Utils.$('#conversations-list');
       if (conversationsList) {
           if (filtered.length === 0) {
               conversationsList.innerHTML = `
                   <div style="text-align: center; padding: var(--space-2xl); color: var(--text-secondary);">
                       <i data-lucide="search" style="width: 48px; height: 48px; margin-bottom: var(--space-md);"></i>
                       <p>No se encontraron conversaciones</p>
                   </div>
               `;
           } else {
               const tempConversations = this.conversations;
               this.conversations = filtered;
               conversationsList.innerHTML = this.renderConversationsList();
               this.conversations = tempConversations;
           }
           window.app.initIcons();
       }
   }

   attachFile() {
       // Create file input
       const fileInput = document.createElement('input');
       fileInput.type = 'file';
       fileInput.multiple = true;
       fileInput.onchange = (e) => {
           const files = Array.from(e.target.files);
           console.log('Files selected:', files);
           
           // Handle file upload
           files.forEach(file => {
               showNotification('Archivo', `${file.name} adjuntado`, 'success');
           });
       };
       fileInput.click();
   }

   toggleEmoji() {
       console.log('Toggle emoji picker');
       // Implement emoji picker
   }

   startVoiceCall() {
       showNotification('Llamada', `Iniciando llamada de voz con ${this.activeConversation.name}`, 'info');
   }

   startVideoCall() {
       showNotification('Videollamada', `Iniciando videollamada con ${this.activeConversation.name}`, 'info');
   }

   showChatInfo() {
       console.log('Show chat info for:', this.activeConversation);
       // Implement chat info sidebar
   }

   showNewChatModal() {
       console.log('Show new chat modal');
       // Implement new chat modal
   }

   formatTime(timestamp) {
       if (!timestamp) return '';
       
       const now = new Date();
       const date = new Date(timestamp);
       const diff = now - date;
       
       // Less than 1 minute
       if (diff < 60000) {
           return 'ahora';
       }
       
       // Less than 1 hour
       if (diff < 3600000) {
           const minutes = Math.floor(diff / 60000);
           return `hace ${minutes}min`;
       }
       
       // Less than 24 hours
       if (diff < 86400000) {
           const hours = Math.floor(diff / 3600000);
           return `hace ${hours}h`;
       }
       
       // Less than 7 days
       if (diff < 604800000) {
           const days = Math.floor(diff / 86400000);
           return `hace ${days}d`;
       }
       
       // Default format
       return date.toLocaleDateString('es-ES', { 
           day: 'numeric', 
           month: 'short' 
       });
   }

   getFileIcon(fileType) {
       const icons = {
           'image': 'image',
           'video': 'video',
           'audio': 'music',
           'pdf': 'file-text',
           'doc': 'file-text',
           'xls': 'table',
           'zip': 'archive',
           'default': 'file'
       };
       
       return icons[fileType] || icons.default;
   }

   playNotificationSound() {
       // Create and play notification sound
       const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLLfzMGHWm98OOgUgwOVqzn1');
       audio.volume = 0.5;
       audio.play().catch(e => console.log('Could not play notification sound'));
   }

   async afterRender() {
       // Initialize chat functionality
       console.log('Chat module initialized');
       
       // Handle window resize
       window.addEventListener('resize', () => {
           if (window.innerWidth >= 768) {
               MEP_Utils.$('#chat-list').style.display = 'block';
               MEP_Utils.$('#chat-back-button').style.display = 'none';
           }
       });
       
       // Simulate incoming messages
       setInterval(() => {
           if (Math.random() < 0.1) { // 10% chance every interval
               this.simulateIncomingMessage();
           }
       }, 30000); // Check every 30 seconds
   }

   simulateIncomingMessage() {
       // Random conversation
       const otherConversations = this.conversations.filter(c => c.id !== this.activeConversation?.id);
       if (otherConversations.length === 0) return;
       
       const randomConv = otherConversations[Math.floor(Math.random() * otherConversations.length)];
       
       // Random message
       const messages = [
           '¿Tienes un momento para revisar esto?',
           'He terminado con la tarea asignada',
           '¿Podemos reunirnos mañana?',
           'Excelente trabajo en el proyecto',
           'Necesito tu aprobación para continuar'
       ];
       
       const messageText = messages[Math.floor(Math.random() * messages.length)];
       
       // Update conversation
       randomConv.lastMessage = messageText;
       randomConv.lastMessageTime = new Date();
       randomConv.unread = (randomConv.unread || 0) + 1;
       
       // Refresh list
       const conversationsList = MEP_Utils.$('#conversations-list');
       if (conversationsList) {
           conversationsList.innerHTML = this.renderConversationsList();
           window.app.initIcons();
       }
       
       // Show notification
       showNotification('Nuevo mensaje', `${randomConv.name}: ${messageText}`, 'info');
       this.playNotificationSound();
   }
}

// Export module
if (typeof module !== 'undefined' && module.exports) {
   module.exports = ChatModule;
}
            