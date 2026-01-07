# Colors - Sistema de Colores MEP

## 📋 Índice
- [Introducción](#introducción)
- [Colores Base](#colores-base)
- [Colores Semánticos](#colores-semánticos)
- [Uso](#uso)
- [Extensión](#extensión)

## 🎨 Introducción

El sistema de colores MEP está diseñado con una arquitectura de dos capas: **colores base** (palette primitiva) y **colores semánticos** (tokens contextuales). Esta separación permite flexibilidad, consistencia y fácil mantenimiento del tema visual.

### Principios
- **Separación**: Colores base vs. semánticos
- **Consistencia**: Mismos colores en toda la aplicación
- **Accesibilidad**: Contraste adecuado en todas las combinaciones
- **Escalabilidad**: Fácil agregar nuevos colores y contextos

---

## 🎨 Colores Base

### Paleta Olive (Color Principal)

#### Verde Oliva
```javascript
olive: {
  50: '#f8f9f4',   // Muy claro - backgrounds sutiles
  100: '#f0f2e6',  // Claro - hover states suaves  
  200: '#dde1c7',  // Claro medio - borders suaves
  300: '#c4cba0',  // Medio claro - texto secundario en fondos oscuros
  400: '#a3ad71',  // Medio - elementos decorativos
  500: '#7c8f3b',  // Base/Principal - CTAs, links, brand
  600: '#6b7d32',  // Medio oscuro - hover en elementos principales
  700: '#596a2a',  // Oscuro - texto en fondos claros, bordes
  800: '#4a5724',  // Muy oscuro - texto de alto contraste
  900: '#3d4a1e'   // Ultra oscuro - headers, texto principal
}
```

**Uso típico del color olive:**
- `olive.500`: Color principal del brand, CTAs, links
- `olive.700-900`: Texto sobre fondos claros
- `olive.50-200`: Fondos suaves, hover states

### Paleta Neutral (Escala de Grises)

#### Grises
```javascript
neutral: {
  50: '#ffffff',   // Blanco puro - fondos principales
  100: '#f9fafb',  // Casi blanco - fondos de sección
  200: '#f3f4f6',  // Gris muy claro - borders suaves, separadores
  300: '#e5e7eb',  // Gris claro - borders, dividers
  400: '#9ca3af',  // Gris medio claro - placeholder text
  500: '#6b7280',  // Gris medio - texto secundario
  600: '#4b5563',  // Gris medio oscuro - texto regular
  700: '#374151',  // Gris oscuro - texto importante
  800: '#1f2937',  // Muy oscuro - headers
  900: '#111827'   // Negro casi puro - texto principal
}
```

**Uso típico del color neutral:**
- `neutral.50-100`: Fondos principales de la aplicación
- `neutral.500-600`: Texto secundario, subtítulos
- `neutral.700-900`: Texto principal, headers

### Paleta de Estados (Feedback)

#### Success (Verde)
```javascript
success: {
  50: '#f0f9f0',
  500: '#10b981',
  700: '#047857'
}
```

#### Warning (Amarillo/Naranja)
```javascript
warning: {
  50: '#fefce8',
  500: '#f59e0b',
  700: '#d97706'
}
```

#### Error (Rojo)
```javascript
error: {
  50: '#fef2f2',
  500: '#ef4444',
  700: '#dc2626'
}
```

#### Info (Azul)
```javascript
info: {
  50: '#eff6ff',
  500: '#3b82f6',
  700: '#1d4ed8'
}
```

---

## 🏷️ Colores Semánticos

Los colores semánticos mapean los colores base a contextos específicos de uso, proporcionando una API consistente para los componentes.

### Content (Contenido)

#### Texto
```javascript
content: {
  text: colors.neutral[900],           // Texto principal
  textSecondary: colors.neutral[500],  // Texto secundario
  textTertiary: colors.neutral[400],   // Texto terciario/placeholder
  onPrimary: colors.neutral[50],       // Texto sobre color principal
  onSecondary: colors.neutral[700],    // Texto sobre color secundario
}
```

### Surface (Superficies)

#### Fondos
```javascript
surface: {
  background: colors.neutral[50],      // Fondo principal de la app
  backgroundSecondary: colors.neutral[100], // Fondo de secciones
  card: colors.neutral[50],            // Fondo de cards
  overlay: 'rgba(0, 0, 0, 0.5)',     // Overlays/modales
  primary: colors.olive[500],          // Superficie principal (botones)
  secondary: colors.neutral[200],      // Superficie secundaria
}
```

### Border (Bordes)

#### Líneas y Separadores
```javascript
border: {
  primary: colors.neutral[300],        // Bordes principales
  secondary: colors.neutral[200],      // Bordes secundarios
  focus: colors.olive[500],           // Bordes de focus
  disabled: colors.neutral[300],       // Bordes deshabilitados
}
```

### Accent (Acentos)

#### Colores de Marca
```javascript
accent: {
  primary: colors.olive[500],          // Color principal del brand
  primaryHover: colors.olive[600],     // Hover del color principal
  secondary: colors.neutral[600],      // Color secundario
  secondaryHover: colors.neutral[700], // Hover del color secundario
}
```

### States (Estados)

#### Feedback Visual
```javascript
states: {
  success: colors.success[500],        // Éxito
  successBg: colors.success[50],       // Fondo de éxito
  warning: colors.warning[500],        // Advertencia
  warningBg: colors.warning[50],       // Fondo de advertencia
  error: colors.error[500],            // Error
  errorBg: colors.error[50],          // Fondo de error
  info: colors.info[500],             // Información
  infoBg: colors.info[50],            // Fondo de información
}
```

---

## 💻 Uso

### Hook useSemanticTokens (Recomendado)

#### Importación
```jsx
import { useSemanticTokens } from '../design-system/foundations/theme-hooks.js';
```

#### Uso en Componentes
```jsx
const MiComponente = () => {
  const colors = useSemanticTokens();
  
  const styles = {
    container: {
      backgroundColor: colors.surface.background,
      color: colors.content.text,
      border: `1px solid ${colors.border.primary}`
    },
    title: {
      color: colors.content.text,
      borderBottom: `2px solid ${colors.accent.primary}`
    },
    secondaryText: {
      color: colors.content.textSecondary
    }
  };
  
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Título</h2>
      <p style={styles.secondaryText}>Texto secundario</p>
    </div>
  );
};
```

### Import Directo

#### Para Valores Estáticos
```jsx
import { colors, semanticColors } from '../design-system/foundations/';

const styles = {
  // Usando colores base (menos recomendado)
  background: colors.olive[50],
  
  // Usando colores semánticos (recomendado)
  color: semanticColors.content.text,
  borderColor: semanticColors.border.primary
};
```

### Estados de Componentes

#### Botón con Estados
```jsx
const Button = ({ variant, disabled, ...props }) => {
  const colors = useSemanticTokens();
  
  const getButtonColors = () => {
    if (disabled) {
      return {
        background: colors.surface.secondary,
        color: colors.content.textTertiary,
        border: colors.border.disabled
      };
    }
    
    switch (variant) {
      case 'primary':
        return {
          background: colors.accent.primary,
          color: colors.content.onPrimary,
          border: colors.accent.primary
        };
      case 'secondary':
        return {
          background: colors.surface.secondary,
          color: colors.content.text,
          border: colors.border.primary
        };
      default:
        return getButtonColors('primary');
    }
  };
  
  const buttonColors = getButtonColors();
  
  return (
    <button
      style={{
        backgroundColor: buttonColors.background,
        color: buttonColors.color,
        border: `1px solid ${buttonColors.border}`,
        padding: '12px 24px',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease'
      }}
      {...props}
    />
  );
};
```

### Cards y Superficies

#### Card con Semantic Colors
```jsx
const Card = ({ children, hover = false }) => {
  const colors = useSemanticTokens();
  
  const cardStyles = {
    backgroundColor: colors.surface.card,
    border: `1px solid ${colors.border.secondary}`,
    borderRadius: '8px',
    padding: '24px',
    boxShadow: hover 
      ? '0 4px 12px rgba(0, 0, 0, 0.1)' 
      : '0 2px 4px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease'
  };
  
  return (
    <div style={cardStyles}>
      {children}
    </div>
  );
};
```

---

## 🎯 Contextos de Uso

### Páginas y Layouts

#### Estructura Base
```jsx
const PageLayout = ({ children }) => {
  const colors = useSemanticTokens();
  
  return (
    <div style={{
      backgroundColor: colors.surface.background,
      color: colors.content.text,
      minHeight: '100vh'
    }}>
      <header style={{
        backgroundColor: colors.surface.card,
        borderBottom: `1px solid ${colors.border.primary}`,
        padding: '16px 24px'
      }}>
        {/* Header content */}
      </header>
      
      <main style={{ padding: '24px' }}>
        {children}
      </main>
    </div>
  );
};
```

### Formularios

#### Input con Estados
```jsx
const Input = ({ error, focused, disabled, ...props }) => {
  const colors = useSemanticTokens();
  
  const getBorderColor = () => {
    if (error) return colors.states.error;
    if (focused) return colors.border.focus;
    if (disabled) return colors.border.disabled;
    return colors.border.primary;
  };
  
  return (
    <input
      style={{
        border: `1px solid ${getBorderColor()}`,
        backgroundColor: disabled 
          ? colors.surface.backgroundSecondary 
          : colors.surface.background,
        color: disabled 
          ? colors.content.textTertiary 
          : colors.content.text,
        padding: '12px 16px',
        borderRadius: '4px',
        fontSize: '16px',
        outline: 'none',
        transition: 'border-color 0.2s ease'
      }}
      disabled={disabled}
      {...props}
    />
  );
};
```

### Feedback y Estados

#### Alert Component
```jsx
const Alert = ({ type = 'info', children }) => {
  const colors = useSemanticTokens();
  
  const getAlertColors = () => {
    switch (type) {
      case 'success':
        return {
          background: colors.states.successBg,
          color: colors.states.success,
          border: colors.states.success
        };
      case 'warning':
        return {
          background: colors.states.warningBg,
          color: colors.states.warning,
          border: colors.states.warning
        };
      case 'error':
        return {
          background: colors.states.errorBg,
          color: colors.states.error,
          border: colors.states.error
        };
      default:
        return {
          background: colors.states.infoBg,
          color: colors.states.info,
          border: colors.states.info
        };
    }
  };
  
  const alertColors = getAlertColors();
  
  return (
    <div
      style={{
        backgroundColor: alertColors.background,
        color: alertColors.color,
        border: `1px solid ${alertColors.border}`,
        borderRadius: '4px',
        padding: '16px',
        marginBottom: '16px'
      }}
    >
      {children}
    </div>
  );
};
```

---

## 🔧 Extensión

### Agregar Nuevos Colores Base

#### 1. Definir en colors.js
```javascript
export const colors = {
  // ... colores existentes
  
  // Nueva paleta
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87'
  }
};
```

#### 2. Mapear en semantic-colors.js
```javascript
export const semanticColors = {
  // ... tokens existentes
  
  // Nuevos contextos
  brand: {
    tertiary: colors.purple[500],
    tertiaryHover: colors.purple[600],
  },
  
  content: {
    // ... existentes
    accent: colors.purple[600], // Nuevo token
  }
};
```

### Crear Nuevos Contextos Semánticos

#### Tema Oscuro (Ejemplo)
```javascript
export const darkSemanticColors = {
  content: {
    text: colors.neutral[50],
    textSecondary: colors.neutral[300],
    textTertiary: colors.neutral[400],
    onPrimary: colors.neutral[900],
    onSecondary: colors.neutral[50],
  },
  
  surface: {
    background: colors.neutral[900],
    backgroundSecondary: colors.neutral[800],
    card: colors.neutral[800],
    overlay: 'rgba(255, 255, 255, 0.1)',
    primary: colors.olive[500],
    secondary: colors.neutral[700],
  },
  
  // ... resto de tokens adaptados
};
```

### Componente con Múltiples Temas

#### Theme Provider
```jsx
const ThemeContext = createContext();

const ThemeProvider = ({ children, theme = 'light' }) => {
  const colors = theme === 'dark' ? darkSemanticColors : semanticColors;
  
  return (
    <ThemeContext.Provider value={{ colors, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => useContext(ThemeContext);
```

---

## 📚 Mejores Prácticas

### ✅ Recomendado

```jsx
// Usar semantic tokens
const colors = useSemanticTokens();
style={{ color: colors.content.text }}

// Contextos claros
backgroundColor: colors.surface.card
borderColor: colors.border.primary

// Estados consistentes
color: disabled ? colors.content.textTertiary : colors.content.text
```

### ❌ Evitar

```jsx
// Hardcodear colores
style={{ color: '#333333' }}

// Usar colores base directamente en componentes
backgroundColor: colors.neutral[100] // Usar semanticColors en su lugar

// Magic numbers en rgba
boxShadow: '0 2px 4px rgba(123, 134, 145, 0.1)' // Usar semantic tokens
```

### Nomenclatura Consistente

#### Nuevos Tokens
```javascript
// ✅ Correcto - Descriptivo y claro
content: {
  textOnDark: colors.neutral[50],
  textMuted: colors.neutral[400],
  linkHover: colors.olive[600]
}

// ❌ Incorrecto - Ambiguo
content: {
  lightText: colors.neutral[50],
  grayText: colors.neutral[400],
  greenHover: colors.olive[600]
}
```

---

**Archivo**: `src/design-system/foundations/colors/README.md`  
**Mantenido por**: Equipo MEP  
**Última actualización**: Octubre 2025