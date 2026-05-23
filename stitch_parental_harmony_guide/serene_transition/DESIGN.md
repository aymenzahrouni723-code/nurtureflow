---
name: Serene Transition
colors:
  surface: '#fff8f2'
  surface-dim: '#e2d9cb'
  surface-bright: '#fff8f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf2e4'
  surface-container: '#f7ecde'
  surface-container-high: '#f1e7d9'
  surface-container-highest: '#ebe1d3'
  on-surface: '#1f1b13'
  on-surface-variant: '#424842'
  inverse-surface: '#353026'
  inverse-on-surface: '#faefe1'
  outline: '#737972'
  outline-variant: '#c2c8c0'
  surface-tint: '#4a654e'
  primary: '#4a654e'
  on-primary: '#ffffff'
  primary-container: '#8ba88e'
  on-primary-container: '#233d29'
  inverse-primary: '#b0ceb2'
  secondary: '#655974'
  on-secondary: '#ffffff'
  secondary-container: '#ecdcfd'
  on-secondary-container: '#6b5f7b'
  tertiary: '#43617f'
  on-tertiary: '#ffffff'
  tertiary-container: '#86a4c5'
  on-tertiary-container: '#1a3a56'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cceace'
  primary-fixed-dim: '#b0ceb2'
  on-primary-fixed: '#07200f'
  on-primary-fixed-variant: '#334d38'
  secondary-fixed: '#ecdcfd'
  secondary-fixed-dim: '#d0c1e0'
  on-secondary-fixed: '#21172e'
  on-secondary-fixed-variant: '#4d425c'
  tertiary-fixed: '#cfe5ff'
  tertiary-fixed-dim: '#abc9ec'
  on-tertiary-fixed: '#001d33'
  on-tertiary-fixed-variant: '#2b4966'
  background: '#fff8f2'
  on-background: '#1f1b13'
  surface-variant: '#ebe1d3'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 20px
  gutter: 16px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
  section-gap: 40px
---

## Brand & Style
The design system is centered on the profound life transition from partnership to parenthood. The brand personality is **empathetic, nurturing, and expert**, serving as a digital companion for parents-to-be and new parents. 

The aesthetic style is **Modern Softness**, blending minimalist layouts with organic, tactile elements to reduce cognitive load and evoke a sense of calm. The interface prioritizes generous whitespace and a "human" touch to counteract the stress of early parenting. It avoids sharp edges and aggressive transitions, opting instead for a fluid, supportive user experience that feels safe and professional.

## Colors
The palette is inspired by nature and tranquility, utilizing desaturated tones to maintain professionalism while remaining approachable.

- **Primary (Sage Green):** Used for main actions, growth-related progress, and primary navigation. It signifies health and stability.
- **Secondary (Muted Lavender):** Reserved for emotional support features, reflection areas, and partnership-focused content.
- **Tertiary (Sky Blue):** Applied to informational tips, medical guidance, and scheduled reminders.
- **Neutral (Warm Beige):** Serves as the surface color for cards and containers, providing a softer alternative to pure white or harsh grey.
- **Functional Colors:** Text is kept in a deep charcoal green-grey (`#3A3D3A`) to maintain high legibility without the starkness of pure black.

## Typography
This design system uses **Plus Jakarta Sans** for its friendly, open counters and modern geometric build which remains highly legible in both French and Arabic scripts.

- **Nurturing Headers:** Headlines use a semi-bold weight to establish hierarchy without feeling overbearing.
- **Reading Comfort:** Body text is set with generous line heights to accommodate tired eyes and the specific flourishes of Arabic typography.
- **Bi-directional Support:** For the Arabic locale, font weights are preserved, but line-height is increased by 15% to ensure diacritics do not clash with the lines above or below. Text alignment must flip globally (RTL) while maintaining the visual weight established in the LTR layout.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for Android viewports. A 4-column grid is used for mobile devices, expanding to 8 columns for tablets.

- **Safe Zones:** A 20px outer margin ensures content never feels cramped or risks being cut off by screen curves or gestures.
- **Rhythm:** An 8px base unit drives all spacing. For bi-directional support, all horizontal padding and margins must be defined using logical properties (e.g., `padding-inline-start` instead of `padding-left`) to ensure automatic mirroring when switching between French and Arabic.
- **Touch Targets:** Minimum touch targets are 48x48px, with 12px of internal padding for input fields to ensure ease of use for busy parents.

## Elevation & Depth
To maintain a "soft" feel, this design system avoids heavy shadows. Depth is communicated through **Tonal Layers** and **Ambient Diffusion**.

- **Surfaces:** The base background is the most recessed. Content sits on "elevated" cards using the Neutral Warm Beige or pure White.
- **Shadows:** Where necessary for buttons or active cards, use extremely soft, tinted shadows (`Primary Color` at 8% opacity) with a large blur radius (16px+) and no offset. This creates a "levitating" rather than "projecting" effect.
- **Interactivity:** On press, elements should slightly scale down (0.98x) and deepen in color rather than casting a larger shadow, emphasizing a tactile, physical response.

## Shapes
The shape language is **Organic and Friendly**. Sharp corners are strictly avoided to reinforce the theme of safety and gentleness.

- **Standard Containers:** Cards and input fields use a 0.5rem (8px) radius.
- **High-Emphasis Elements:** Primary buttons and featured image containers use a 1.5rem (24px) or fully rounded (pill) radius to draw the eye and feel "huggable."
- **Icons:** Use rounded icon sets (e.g., Material Symbols Rounded) with a consistent 2px stroke weight to match the typography's softness.

## Components
Consistent component behavior is vital for a professional, calming experience.

- **Buttons:** Primary buttons are pill-shaped with a solid Sage Green fill and white text. Secondary buttons use a Sage Green outline (1.5px) with a transparent background.
- **Cards:** Cards should have a subtle 1px border in a slightly darker shade of the background color to define boundaries without using shadows.
- **Input Fields:** Use "floating labels" that work elegantly in both LTR and RTL. Ensure error states use a muted terracotta instead of a harsh bright red to maintain the calming aesthetic.
- **Progress Indicators:** Use soft, thick lines for progress bars (8px height) with rounded end-caps.
- **Contextual Chips:** Small, rounded labels used for categorizing content (e.g., "Newborn," "Self-Care," "Communication"). Use the Tertiary Blue and Secondary Lavender for background tints.
- **Empty States:** Use soft, hand-drawn style illustrations with a limited color palette from the primary/secondary sets to provide an empathetic feeling when no data is present.