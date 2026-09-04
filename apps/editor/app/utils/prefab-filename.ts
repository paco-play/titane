/**
 * Turns an entity name into a downloadable prefab filename.
 */
export const prefabFileName = (name: string): string => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'prefab'}.titane`;
};
