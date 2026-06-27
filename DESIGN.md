# Design Context - سياق (Siyaq) | Luxury AI Content Generation Platform

## Brand Overview
**سياق (Siyaq)** - A premium, bilingual (Arabic/English) platform for intelligent content generation with sophisticated, minimalist luxury aesthetic. Targets affluent, globally-conscious audiences seeking premium creative tools.

## Color Palette
- **Primary Background**: Cream #f7f4e6 (premium, warm, elegant)
- **Secondary**: Warm Tan #d8c4a1 (accents, dividers, soft backgrounds)
- **Accent - Primary**: Forest Green #1f3a34 (CTAs, highlights, premium feel)
- **Accent - Secondary**: Gold/Tan #a5955e (refined highlights, borders, subtle accents)
- **Charcoal**: #2a2a2a (primary text, headings)
- **Light Beige**: #e6e0d0 (hover states, subtle backgrounds)
- **Text Colors**:
  - Primary: Charcoal #2a2a2a (on cream backgrounds)
  - Secondary (70% opacity): rgba(42, 42, 42, 0.7) (subtitles, supporting text)
  - Muted (50% opacity): rgba(42, 42, 42, 0.5) (metadata, labels)
  - Luxury Shadow: rgba(31, 58, 52, 0.1) (subtle shadows)

## Typography
- **Arabic Headings**: IBM Plex Sans Arabic, weights 600-700, size 2.5rem-4rem
- **English Headings**: Geist, weight 600-700, size 2.5rem-4rem
- **Arabic Body**: IBM Plex Sans Arabic, weight 400-500, size 1rem-1.125rem
- **English Body**: Geist, weight 400-500, size 1rem-1.125rem
- **Labels/Metadata**: Geist, weight 500, size 0.875rem, letter-spacing 0.05em
- **Bilateral Support**: Seamless RTL/LTR handling for Arabic and English content

## Spacing & Layout
- **Container**: max-width 1400px, subtle rounded corners (1.5rem), padding 2rem-4rem per section
- **Gap Spacing**: 1.5rem-2rem between grid items, 4rem-6rem between major sections
- **Section Padding**: Hero 3rem-4rem top/bottom, Features 4rem top/bottom, Methodology 3rem top/bottom, Footer 4rem top/2rem bottom
- **Border Radius**: 1.5rem on main containers, 1rem on cards, 0.75rem on buttons

## Visual Effects & Refinement
```css
.luxury-shadow {
  box-shadow: 0 10px 30px -10px rgba(31, 58, 52, 0.1);
}

.border-luxury {
  border: 1px solid rgba(165, 149, 94, 0.2);
}

.btn-luxury-hover {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-luxury-hover:hover {
  background-color: #1f3a34;
  color: #f7f4e6;
  transform: translateY(-2px);
}
```

## Animation & Motion
- **Subtle Transitions**: 0.3-0.4s cubic-bezier(0.4, 0, 0.2, 1) for all interactions
- **Hover Effects**: Light transform translateY(-2px), soft shadow increases
- **Focus States**: Gold accent (#a5955e) on interactive elements
- **No Aggressive Animations**: Emphasizes refinement over motion
- **Decorative Patterns**: Subtle 80x80px grid at 15% opacity, minimal noise overlay (2% opacity)

## Photography & Visual Style
- **Aesthetic**: Natural materials, warm earth tones, minimalist compositions
- **Color Harmony**: Beiges, taupes, warm grays complementing cream backgrounds
- **Lighting**: Soft, directional natural light suggesting luxury and craftsmanship
- **Composition**: Architectural, geometric, with emphasis on form and space
- **Texture**: Fine details, tactile qualities in photography

## Design Philosophy
- **Luxury First**: Premium positioning through refined minimalism, not maximalism
- **Bilingual Excellence**: Seamless Arabic/English integration respecting both languages equally
- **Subtle Sophistication**: Understated elegance through careful typography, spacing, and color harmony
- **Cultural Awareness**: Respects Arabic design traditions (calligraphy, geometric patterns) while embracing global aesthetics
- **High-Contrast Readability**: Dark text on light backgrounds for premium, clean appearance
- **Restrained Interactions**: Smooth transitions and subtle feedback avoiding aggressive design patterns
- **Natural Materials Influence**: Earth tones, warm textures suggesting craftsmanship and quality

## Reusable Components

### Navigation Header (Siyaq)
```html
<header class="sticky top-0 z-40 px-8 py-6 flex items-center justify-between bg-[#f7f4e6] border-b border-[#a5955e]/20">
  <div class="flex items-center gap-3">
    <div class="font-arabic text-3xl font-bold text-[#1f3a34]">سياق</div>
    <span class="font-english text-sm text-[#2a2a2a]/70 hidden sm:block">Siyaq</span>
  </div>

  <nav class="hidden md:flex items-center gap-8">
    <a href="#" class="font-english text-sm text-[#2a2a2a]/70 hover:text-[#1f3a34] transition-colors">Generate</a>
    <a href="#" class="font-english text-sm text-[#2a2a2a]/70 hover:text-[#1f3a34] transition-colors">Features</a>
    <a href="#" class="font-english text-sm text-[#2a2a2a]/70 hover:text-[#1f3a34] transition-colors">Pricing</a>
    <a href="#" class="font-english text-sm text-[#2a2a2a]/70 hover:text-[#1f3a34] transition-colors">Docs</a>
  </nav>

  <a href="#" class="bg-[#1f3a34] text-[#f7f4e6] px-6 py-2.5 rounded-lg font-english font-medium text-sm hover:bg-[#2a4a42] transition-colors">Get Started</a>
</header>
```

### Neon Pulse Button
```html
<button class="bg-[#ccff00] text-black font-bold px-8 py-4 rounded-full neon-glow hover:scale-105 transition-all duration-300 flex items-center gap-3">
  <span>START GENERATING</span>
  <iconify-icon icon="lucide:arrow-right"></iconify-icon>
</button>
```

CSS for glow effect:
```css
.neon-glow {
  box-shadow: 0 0 30px rgba(204, 255, 0, 0.3);
}

@keyframes pulse-lime {
  0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(204, 255, 0, 0.4); }
  50% { transform: scale(1.2); opacity: 0.8; box-shadow: 0 0 0 6px rgba(204, 255, 0, 0); }
}

.pulse-dot {
  animation: pulse-lime 2s infinite;
}
```

### Premium Dashboard (Siyaq Style)
```html
<div class="w-full aspect-[4/3] bg-[#080808] rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
  <!-- Dashboard Header with Search -->
  <div class="h-12 border-b border-white/10 glass flex items-center justify-between px-4 shrink-0">
    <div class="flex items-center gap-3 flex-1">
      <iconify-icon icon="lucide:search" class="text-white/40 text-sm"></iconify-icon>
      <input type="text" placeholder="Search images..." class="bg-transparent text-[11px] text-white/60 focus:outline-none w-full font-sans">
    </div>
    <div class="flex items-center gap-3">
      <div class="w-6 h-6 rounded-full bg-[#ccff00]/20 border border-[#ccff00]/30 flex items-center justify-center text-[9px] font-bold text-[#ccff00]">JD</div>
    </div>
  </div>

  <div class="flex flex-1 overflow-hidden">
    <!-- Sidebar -->
    <div class="w-44 border-r border-white/10 flex flex-col p-4 shrink-0 bg-[#0c0c0c]">
      <div class="font-mono text-[9px] tracking-[0.2em] text-white/30 uppercase mb-4">Projects</div>
      <div class="space-y-1.5">
        <!-- Project Items with counter badges -->
        <div class="flex items-center justify-between group cursor-pointer py-1.5 px-2 rounded-md hover:bg-white/5 transition-colors">
          <div class="flex items-center gap-2">
            <iconify-icon icon="lucide:layout" class="text-white/40 group-hover:text-[#ccff00] text-sm"></iconify-icon>
            <span class="text-[11px] text-white/70">Social Posts</span>
          </div>
          <span class="text-[9px] bg-[#ccff00]/10 text-[#ccff00] px-1.5 rounded-full font-mono">12</span>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="flex-1 p-4 overflow-y-auto grid grid-cols-2 gap-2">
      <!-- Image Cards with Status -->
      <div class="bg-white/5 border border-white/10 rounded-lg p-2 hover:border-[#ccff00]/30 transition-colors group">
        <div class="w-full aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-md mb-2 overflow-hidden flex items-center justify-center">
          <iconify-icon icon="lucide:image" class="text-white/20 text-xl"></iconify-icon>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-[9px] text-white/50 truncate">Instagram Post</span>
          <span class="text-[8px] bg-[#ccff00]/20 text-[#ccff00] px-1 rounded-full font-mono">✓</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Bento Grid Cards
```html
<!-- Large 2x2 Card with Data Visualization -->
<div class="md:col-span-2 md:row-span-2 glass rounded-[2.5rem] p-8 group hover:border-[#ccff00]/40 transition-colors">
  <h3 class="text-2xl font-bold mb-4">Brand Visualization</h3>
  <p class="text-white/60 mb-8">Real-time performance metrics and brand consistency tracking.</p>
  <div class="mt-auto flex items-end gap-3 h-32">
    <div class="flex-1 bg-white/5 rounded-t-xl group-hover:bg-[#ccff00]/20 transition-all" style="height: 40%;"></div>
    <div class="flex-1 bg-white/5 rounded-t-xl group-hover:bg-[#ccff00]/40 transition-all" style="height: 70%;"></div>
    <div class="flex-1 bg-[#ccff00] rounded-t-xl" style="height: 90%;"></div>
  </div>
</div>

<!-- Tall 1x2 Token Engine Card -->
<div class="md:col-span-1 md:row-span-2 glass rounded-[2.5rem] p-8">
  <h3 class="text-xl font-bold mb-6">Token Engine</h3>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl bg-[#ccff00]"></div>
      <div>
        <div class="text-[10px] font-mono text-white/40">PRIMARY</div>
        <div class="font-mono text-xs">#CCFF00</div>
      </div>
    </div>
  </div>
</div>
```

### Footer CTA Button with Slide-Up Effect
```html
<button class="relative h-20 w-80 bg-[#ccff00] text-black font-bold text-xl rounded-full overflow-hidden neon-glow btn-slide-up">
  <span class="relative z-10">Start Creating Now</span>
</button>
```

CSS for slide-up effect:
```css
.btn-slide-up::after {
  content: '';
  position: absolute;
  top: 100%; left: 0; width: 100%; height: 100%;
  background: white;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}
.btn-slide-up:hover::after {
  transform: translateY(-100%);
}
.btn-slide-up:hover {
  color: black;
}
```

## Design Philosophy
- **Dark Mode First**: Optimized for low-light viewing with high contrast
- **Glassmorphism Focus**: All overlay elements use glass effect for visual consistency
- **Premium Tech Aesthetic**: Space Grotesk + JetBrains Mono create industrial, modern feel
- **Accessibility**: High contrast ratios, 16px+ blur on glass for readability
- **Interactive Feedback**: Every hover state provides visual confirmation with scaling and color changes
- **Hardware-Like Feel**: Minimum 2rem border radius on all containers for modern, rounded aesthetic