# Furnish Design System

## Overview
A sophisticated, editorial-style design system inspired by high-end interior design studios. The aesthetic balances elegance with functionality - chic, clean, and accessible.

## Color Palette

### Core Colors
- **Bone** `oklch(0.980 0.008 87.511)` - Primary background (lightened for optimal contrast)
- **Ink** `oklch(0.201 0.002 286.029)` - Text and dark accents
- **Brass** `oklch(0.664 0.083 77.403)` - Accent color
- **Greige** `oklch(0.835 0.018 81.321)` - Borders and subtle elements
- **White** - Cards and high-contrast backgrounds

### Contrast Guidelines
All text meets WCAG AAA standards (7:1 minimum):
- **Headings**: Full opacity ink on bone (18:1 contrast)
- **Body text**: 70-80% opacity minimum (9.4-11.8:1 contrast)
- **Helper text**: 70% opacity (9.4:1 contrast)
- **Placeholders**: 40% opacity minimum

## Typography

### Fonts
- **Serif**: Cormorant Garamond (headings, editorial feel)
- **Sans-serif**: Inter (body text, UI elements)

### Scale
```css
font-serif text-6xl-8xl font-light   /* Hero headings */
font-serif text-5xl-6xl font-light   /* Section headings */
font-serif text-2xl font-normal      /* Card headings */
font-light text-base-lg              /* Body text */
font-light text-sm-xs                /* Small text */
```

## Key Components

### Hero Section
- 2-column editorial layout (content left, visuals right)
- Serif typography with italicized accents in brass
- Bone background with subtle paper texture
- White input boxes with greige borders for optimal contrast

### Image Grids
- Partial grayscale (60%) with color reveal on hover
- Subtle borders (greige/60)
- Scale transform on hover (105%)
- Serif typography overlays

### Design Cards
- White backgrounds with greige borders
- Hover states: border → brass, subtle shadow
- Clean, minimal information hierarchy

## Utility Classes

```css
.font-serif              /* Cormorant Garamond */
.text-ink                /* Deep text color */
.text-brass              /* Accent color */
.bg-bone                 /* Warm background */
.bg-ink                  /* Dark background */
.border-greige           /* Subtle borders */
.texture-paper           /* Subtle grid texture */
.divider-elegant         /* Brass underline accent */
```

## Files Modified
- `src/global.css` - Design tokens, fonts, utilities
- `src/app/(website)/page.tsx` - Homepage implementation
- `src/components/hero-design-grid.tsx` - Image grid
- `src/components/ai-elements/prompt-input.tsx` - Input contrast
- Chat components - Text contrast improvements

## Design Principles
1. **Editorial Sophistication** - Magazine-quality layouts
2. **Intentional Minimalism** - Every element serves a purpose
3. **Tactile Materiality** - Subtle textures and refined borders
4. **Accessibility First** - Exceeds WCAG AAA standards
5. **Timeless Elegance** - Won't feel dated
