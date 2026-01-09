# 🎨 Design System - MEP Projects

Comprehensive design tokens and component guidelines for consistent UI/UX.

---

## 🎨 Color Palette

### Primary Colors
```css
/* Olive (Primary Brand Color) */
--olive-50: #f7f8f5;
--olive-100: #e8ebe2;
--olive-200: #d1d7c5;
--olive-300: #b0ba9f;
--olive-400: #8b9775;
--olive-600: #5a6444; /* Primary */
--olive-700: #474f36;
--olive-800: #353b28;
--olive-900: #1c1f15;
```

### Semantic Colors
```css
/* Success */
--success-50: #f0fdf4;
--success-600: #16a34a;

/* Error */
--error-50: #fef2f2;
--error-600: #dc2626;

/* Warning */
--warning-50: #fff7ed;
--warning-600: #ea580c;

/* Info */
--info-50: #eff6ff;
--info-600: #2563eb;
```

### Neutral Scale
```css
--neutral-50: #fafafa;
--neutral-100: #f5f5f5;
--neutral-200: #e5e5e5;
--neutral-600: #525252;
--neutral-900: #171717;
```

---

## 📏 Spacing Scale

Using Tailwind's 4px scale:
- `1` = 4px
- `2` = 8px
- `3` = 12px
- `4` = 16px
- `6` = 24px
- `8` = 32px
- `12` = 48px

---

## 🔤 Typography

### Font Family
```css
--font-sans: Inter, system-ui, sans-serif;
--font-mono: 'Courier New', monospace;
```

### Font Sizes
- **xs**: 12px (0.75rem)
- **sm**: 14px (0.875rem)
- **base**: 16px (1rem)
- **lg**: 18px (1.125rem)
- **xl**: 20px (1.25rem)
- **2xl**: 24px (1.5rem)
- **3xl**: 30px (1.875rem)

### Font Weights
- **medium**: 500
- **bold**: 700
- **black**: 900

---

## 🎭 Component Patterns

### Buttons

#### Primary Button
```tsx
<button className="px-6 py-3 bg-olive-600 hover:bg-olive-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl">
  Primary Action
</button>
```

#### Secondary Button
```tsx
<button className="px-6 py-3 bg-white hover:bg-neutral-50 text-neutral-900 font-bold rounded-xl border-2 border-neutral-200 transition-all">
  Secondary Action
</button>
```

#### Danger Button
```tsx
<button className="px-6 py-3 bg-error-600 hover:bg-error-700 text-white font-bold rounded-xl transition-all">
  Delete
</button>
```

### Cards
```tsx
<div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow">
  {/* Card content */}
</div>
```

### Inputs
```tsx
<input 
  type="text"
  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-olive-600 focus:outline-none transition-colors"
  placeholder="Enter text..."
/>
```

### Badges
```tsx
import Badge from '@/components/ui/Badge';

// Success badge
<Badge variant="success">Completado</Badge>

// Warning badge
<Badge variant="warning">Pendiente</Badge>

// With pulse animation
<Badge variant="error" pulse>3</Badge>
```

---

## 🎬 Animations

### Duration
- **Fast**: 0.15s (modals, tooltips)
- **Normal**: 0.2s (hovers, simple transitions)
- **Slow**: 0.3s (page transitions)

### Easing
- **easeOut**: Default for entrances
- **easeIn**: For exits
- **spring**: For interactive elements

### Examples
```tsx
// Framer Motion modal
<motion.div
  initial={{ opacity: 0, scale: 0.98, y: -10 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.98, y: -10 }}
  transition={{ duration: 0.15, ease: "easeOut" }}
>
  {/* Modal content */}
</motion.div>
```

---

## 📐 Layout Grid

### Container Widths
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Grid Columns
```tsx
// 3 columns on desktop, 1 on mobile
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

---

## ♿ Accessibility Guidelines

### Focus Indicators
All interactive elements must have visible focus:
```css
.focusable:focus {
  outline: 2px solid var(--olive-600);
  outline-offset: 2px;
}
```

### ARIA Labels
```tsx
// Buttons with icons
<button aria-label="Close modal">
  <X size={20} />
</button>

// Form inputs
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

### Color Contrast
- **Normal text**: Minimum 4.5:1
- **Large text**: Minimum 3:1
- Test with WebAIM Contrast Checker

---

## 📱 Responsive Breakpoints

```css
/* Mobile first */
sm: 640px  /* Small devices */
md: 768px  /* Tablets */
lg: 1024px /* Laptops */
xl: 1280px /* Desktops */
```

### Usage
```tsx
<div className="p-4 md:p-6 lg:p-8">
  {/* Responsive padding */}
</div>
```

---

## 🎯 Usage Examples

### Loading States
```tsx
import { DocumentGridSkeleton } from '@/components/ui/Skeleton';

{loading ? (
  <DocumentGridSkeleton count={6} />
) : (
  <DocumentGrid documents={documents} />
)}
```

### Empty States
```tsx
import EmptyState from '@/components/ui/EmptyState';
import { Upload } from 'lucide-react';

<EmptyState
  icon={Upload}
  title="No hay documentos"
  description="Sube tu primer documento para comenzar."
  action={{
    label: "Subir Documento",
    onClick: () => setShowUploadModal(true)
  }}
/>
```

### Toast Notifications
```tsx
import { useToast } from '@/components/ui/Toast';

const toast = useToast();

// Success
toast.success('Documento guardado', 'El archivo se ha subido correctamente');

// Error
toast.error('Error', 'No se pudo guardar el documento');
```

---

## 🔧 Development Tools

### VS Code Extensions
- Tailwind CSS IntelliSense
- ESLint
- Prettier

### Browser Extensions
- React DevTools
- axe DevTools (Accessibility)

---

**Last Updated:** January 8, 2026  
**Maintained by:** Development Team
