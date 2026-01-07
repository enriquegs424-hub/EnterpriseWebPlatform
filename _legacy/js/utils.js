// ===== MEP-PROJECTS UTILITIES =====

const MEP_Utils = {
    
    // ===== DOM UTILITIES =====
    
    /**
     * Selecciona elemento del DOM
     */
    $(selector, context = document) {
        return context.querySelector(selector);
    },
    
    /**
     * Selecciona múltiples elementos del DOM
     */
    $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    },
    
    /**
     * Crea elemento DOM con atributos
     */
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        
        return element;
    },
    
    /**
     * Añade/remueve clases CSS
     */
    toggleClass(element, className, force = null) {
        if (force !== null) {
            element.classList.toggle(className, force);
        } else {
            element.classList.toggle(className);
        }
    },
    
    /**
     * Obtiene datos del elemento
     */
    getData(element, key) {
        return element.dataset[key];
    },
    
    /**
     * Establece datos del elemento
     */
    setData(element, key, value) {
        element.dataset[key] = value;
    },
    
    // ===== EVENT UTILITIES =====
    
    /**
     * Añade event listener con debounce
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },
    
    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Event delegation
     */
    delegate(parent, selector, event, handler) {
        parent.addEventListener(event, (e) => {
            if (e.target.matches(selector)) {
                handler(e);
            }
        });
    },
    
    // ===== STORAGE UTILITIES =====
    
    /**
     * Local Storage wrapper
     */
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Error saving to localStorage:', e);
                return false;
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Error reading from localStorage:', e);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Error removing from localStorage:', e);
                return false;
            }
        },
        
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Error clearing localStorage:', e);
                return false;
            }
        }
    },
    
    // ===== STRING UTILITIES =====
    
    /**
     * Capitaliza primera letra
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    /**
     * Convierte a kebab-case
     */
    kebabCase(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    },
    
    /**
     * Convierte a camelCase
     */
    camelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    },
    
    /**
     * Trunca texto
     */
    truncate(str, length = 50, suffix = '...') {
        return str.length > length ? str.substring(0, length) + suffix : str;
    },
    
    /**
     * Slug from string
     */
    slugify(str) {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },
    
    // ===== NUMBER UTILITIES =====
    
    /**
     * Formatea números
     */
    formatNumber(num, locale = 'es-ES') {
        return new Intl.NumberFormat(locale).format(num);
    },
    
    /**
     * Formatea moneda
     */
    formatCurrency(amount, currency = 'EUR', locale = 'es-ES') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    /**
     * Formatea porcentaje
     */
    formatPercentage(value, decimals = 1) {
        return `${value.toFixed(decimals)}%`;
    },
    
    /**
     * Genera número aleatorio
     */
    randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // ===== DATE UTILITIES =====
    
    /**
     * Formatea fecha
     */
    formatDate(date, format = 'DD/MM/YYYY') {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return format
            .replace('DD', day)
            .replace('MM', month)
            .replace('YYYY', year)
            .replace('HH', hours)
            .replace('mm', minutes);
    },
    
    /**
     * Tiempo relativo
     */
    timeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
        
        const intervals = {
            año: 31536000,
            mes: 2592000,
            semana: 604800,
            día: 86400,
            hora: 3600,
            minuto: 60
        };
        
        for (const [unit, seconds] of Object.entries(intervals)) {
            const interval = Math.floor(diffInSeconds / seconds);
            if (interval >= 1) {
                return `hace ${interval} ${unit}${interval !== 1 ? 's' : ''}`;
            }
        }
        
        return 'hace un momento';
    },
    
    // ===== VALIDATION UTILITIES =====
    
    /**
     * Valida email
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    /**
     * Valida teléfono español
     */
    isValidPhone(phone) {
        const re = /^(\+34|0034|34)?[6789]\d{8}$/;
        return re.test(phone.replace(/\s/g, ''));
    },
    
    /**
     * Valida URL
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    
    // ===== ARRAY UTILITIES =====
    
    /**
     * Elimina duplicados
     */
    unique(array) {
        return [...new Set(array)];
    },
    
    /**
     * Agrupa array por clave
     */
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    },
    
    /**
     * Ordena array por clave
     */
    sortBy(array, key, ascending = true) {
        return array.sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if (aVal < bVal) return ascending ? -1 : 1;
            if (aVal > bVal) return ascending ? 1 : -1;
            return 0;
        });
    },
    
    /**
     * Mezcla array aleatoriamente
     */
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    // ===== OBJECT UTILITIES =====
    
    /**
     * Deep clone object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
    },
    
    /**
     * Merge objects
     */
    merge(target, ...sources) {
        return Object.assign({}, target, ...sources);
    },
    
    /**
     * Get nested property
     */
    get(obj, path, defaultValue = undefined) {
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result == null || typeof result !== 'object') {
                return defaultValue;
            }
            result = result[key];
        }
        
        return result !== undefined ? result : defaultValue;
    },
    
    // ===== ANIMATION UTILITIES =====
    
    /**
     * Animate element
     */
    animate(element, animation, duration = 250) {
        return new Promise((resolve) => {
            element.style.animationDuration = `${duration}ms`;
            element.classList.add(animation);
            
            const handleAnimationEnd = () => {
                element.classList.remove(animation);
                element.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            };
            
            element.addEventListener('animationend', handleAnimationEnd);
        });
    },
    
    /**
     * Fade in element
     */
    fadeIn(element, duration = 250) {
        element.style.opacity = '0';
        element.style.display = 'block';
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
        
        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    },
    
    /**
     * Fade out element
     */
    fadeOut(element, duration = 250) {
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        element.style.opacity = '0';
        
        return new Promise(resolve => {
            setTimeout(() => {
                element.style.display = 'none';
                resolve();
            }, duration);
        });
    },
    
    // ===== PERFORMANCE UTILITIES =====
    
    /**
     * Request animation frame wrapper
     */
    nextFrame(callback) {
        return requestAnimationFrame(callback);
    },
    
    /**
     * Lazy load images
     */
    lazyLoadImages() {
        const images = this.$$('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    },
    
    // ===== ERROR HANDLING =====
    
    /**
     * Safe function execution
     */
    safe(fn, fallback = null) {
        try {
            return fn();
        } catch (error) {
            console.error('Safe execution failed:', error);
            return fallback;
        }
    },
    
    /**
     * Retry function with exponential backoff
     */
    async retry(fn, maxAttempts = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) throw error;
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
            }
        }
    }
};

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MEP_Utils;
} else {
    window.MEP_Utils = MEP_Utils;
}