import { injectLiquidGlassFilter } from '~/utils/liquid-glass';

/**
 * Mounts the liquid-glass SVG filter once for the editor session.
 * Styles stay in CSS; this plugin only mutates the DOM.
 */
export default defineNuxtPlugin(() => {
  injectLiquidGlassFilter();
});
