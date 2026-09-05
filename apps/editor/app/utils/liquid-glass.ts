/** DOM id of the hidden SVG that hosts the refraction filter. */
export const LIQUID_GLASS_SVG_ID = 'liquid-glass-svg';

/** Filter id referenced by `.glass-panel` in `main.css`. */
export const LIQUID_GLASS_FILTER_ID = 'liquid-glass-refraction';

/** How the chrome should composite the backdrop. */
export type GlassFilterMode = 'svg' | 'blur';

/**
 * Detects whether `backdrop-filter: url(#filter)` is usable.
 * Safari (and some Firefox builds) support `blur()` only.
 */
export const detectGlassFilterSupport = (): GlassFilterMode => {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return 'blur';

  const svgBackdrop = `url(#${LIQUID_GLASS_FILTER_ID})`;
  const supported =
    CSS.supports('backdrop-filter', svgBackdrop)
    || CSS.supports('-webkit-backdrop-filter', svgBackdrop);

  return supported ? 'svg' : 'blur';
};

/**
 * Injects a static SVG displacement filter once. The filter is never
 * animated — updating it per frame would be far too expensive.
 */
export const injectLiquidGlassFilter = (): void => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(LIQUID_GLASS_SVG_ID)) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('id', LIQUID_GLASS_SVG_ID);
  svg.setAttribute('class', 'liquid-glass-svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');

  svg.innerHTML = `
    <defs>
      <filter id="${LIQUID_GLASS_FILTER_ID}" x="-12%" y="-12%" width="124%" height="124%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="2" seed="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  `;

  document.body.prepend(svg);
  document.documentElement.dataset.glassFilter = detectGlassFilterSupport();
};
