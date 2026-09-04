/**
 * Turns a schema key into an Inspector label (`jumpHeight` → `Jump Height`).
 */
export const fieldLabel = (key: string): string =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase());
