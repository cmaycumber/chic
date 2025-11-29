# Furnish Design Guidelines

## Quick Reference

### Design System
Furnish uses a sophisticated, editorial-style design inspired by high-end interior design studios. Think Architectural Digest meets modern web design - chic, clean, and accessible.

## Color Palette

### Core Brand Colors
```css
--color-bone: oklch(0.980 0.008 87.511)   /* Primary background (lightened) */
--color-ink: oklch(0.201 0.002 286.029)    /* Text and dark accents */
--color-brass: oklch(0.664 0.083 77.403)   /* Accent color */
--color-greige: oklch(0.835 0.018 81.321)  /* Borders, subtle elements */
```

### Usage Guidelines
- **Backgrounds**: Bone for main areas, White for cards/inputs
- **Text**: Ink at 100% for headings, 70-80% for body (WCAG AAA)
- **Accents**: Brass for emphasis, hover states, dividers
- **Borders**: Greige at 60-100% opacity for subtle definition

## Typography

### Fonts
```tsx
className="font-serif"  // Cormorant Garamond - headings, editorial
className="font-sans"   // Inter - body text, UI
```

### Type Scale
```tsx
// Hero Headings
className="font-serif text-6xl sm:text-7xl lg:text-8xl font-light text-ink"

// Section Headings
className="font-serif text-5xl sm:text-6xl font-light text-ink"

// Card Headings
className="font-serif text-2xl font-normal text-ink"

// Body Text (70% minimum for accessibility)
className="font-light text-base text-ink/70 leading-relaxed"

// Small Text
className="font-light text-sm text-ink/70"

// Labels
className="font-medium text-xs text-ink/70 uppercase tracking-wider"
```

## Component Patterns

### Hero Section
```tsx
<section className="texture-paper bg-bone px-4 pt-16 pb-24">
  <h1 className="font-serif text-6xl font-light text-ink">
    Design with <span className="font-normal text-brass italic">intention</span>
  </h1>
  <p className="font-light text-xl text-ink/80">
    Editorial-style description...
  </p>
</section>
```

### Input Fields
```tsx
<PromptInput>
  <PromptInputBody>
    <PromptInputTextarea
      className="bg-white text-ink placeholder:text-ink/40"
      placeholder="Describe your vision..."
    />
  </PromptInputBody>
  <PromptInputToolbar className="bg-white">
    <PromptInputSubmit className="bg-ink text-white hover:bg-ink/90">
      <ArrowUp className="size-4" />
    </PromptInputSubmit>
  </PromptInputToolbar>
</PromptInput>
```

### Feature Cards
```tsx
<div className="group space-y-6">
  <div className="flex size-14 items-center justify-center rounded-full border border-greige bg-white transition-colors group-hover:border-brass group-hover:bg-bone">
    <Icon className="size-6 text-ink group-hover:text-brass" />
  </div>
  <h3 className="font-serif text-2xl font-normal text-ink">
    Card Title
  </h3>
  <p className="font-light text-ink/70 leading-relaxed">
    Description text...
  </p>
</div>
```

### Image Grids
```tsx
<Link className="group relative overflow-hidden border border-greige/60 bg-white shadow-sm hover:border-brass hover:shadow-md">
  <Image
    className="object-cover transition-all duration-500 grayscale-[0.6] group-hover:scale-105 group-hover:grayscale-0"
    src={imageUrl}
    alt={title}
  />
</Link>
```

## Utility Classes

### Chic Design Utilities
```css
.font-serif          /* Cormorant Garamond */
.text-ink            /* Brand ink color */
.text-brass          /* Brand brass accent */
.text-greige         /* Brand greige */
.bg-bone             /* Brand bone background */
.bg-ink              /* Dark background */
.border-greige       /* Subtle borders */
.texture-paper       /* Subtle grid texture */
.divider-elegant     /* Brass underline after element */
```

## Accessibility Requirements

### Contrast Standards (WCAG AAA)
- ✅ Headings: text-ink on bone = 18:1
- ✅ Body text: text-ink/70 on bone = 9.4:1 minimum
- ✅ Inputs: text-ink on white = 18:1
- ✅ Helper text: text-ink/70 = 9.4:1 minimum
- ⚠️ **Never** go below 70% opacity for readable text
- ⚠️ **Never** go below 40% opacity for any text (placeholders only)

### Focus States
```tsx
// Always ensure visible focus rings
className="focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
```

## Design Principles

### 1. Editorial Sophistication
- Use serif typography for headings
- Create magazine-quality layouts with generous whitespace
- Apply subtle textures (paper texture)

### 2. Intentional Minimalism
- Every element serves a purpose
- Remove unnecessary decorations
- Let content breathe

### 3. Accessible Elegance
- Beautiful AND accessible (WCAG AAA)
- High contrast without being harsh
- Readable at all sizes

### 4. Refined Interactions
- Subtle hover states (scale, border color changes)
- Smooth transitions (300-500ms)
- Tactile, quality feel

## Common Mistakes to Avoid

1. ❌ Using text opacity below 70% for body text
2. ❌ Transparent backgrounds on input fields
3. ❌ Full grayscale on images (use 60% partial grayscale)
4. ❌ Hardcoding colors instead of using CSS variables
5. ❌ Mixing sans-serif for headings (use serif)
6. ❌ Over-engineering with complex effects
7. ❌ Ignoring the 8px spacing grid

## Quick Checklist

Before submitting code, verify:
- [ ] Text contrast meets WCAG AAA (7:1 minimum)
- [ ] Serif font used for headings
- [ ] Proper opacity (70%+ for text, 40%+ for placeholders)
- [ ] Solid backgrounds on interactive elements
- [ ] Hover states on all interactive elements
- [ ] Consistent spacing (8px grid)
- [ ] Tested on mobile

## References

- See `/DESIGN.md` for complete design system overview
- See `/src/global.css` for all design tokens
- See homepage `/src/app/(website)/page.tsx` for pattern examples
