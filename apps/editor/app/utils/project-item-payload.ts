import type { ProjectItem, ProjectKind } from '~/types/project';

/** HTML5 DnD MIME for a Project panel tile. */
export const PROJECT_ITEM_MIME = 'application/x-titane-project-item';

const PROJECT_KINDS: readonly ProjectKind[] = [
  'scene',
  'prefab',
  'model',
  'texture',
  'audio'
];

const isProjectKind = (value: unknown): value is ProjectKind =>
  typeof value === 'string' && (PROJECT_KINDS as readonly string[]).includes(value);

/**
 * Parses a Project tile payload from a drag event.
 * Invalid JSON or a missing kind/url is rejected.
 */
export const parseProjectItemPayload = (raw: string): ProjectItem | null => {
  if (raw === '') return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  if (!isProjectKind(record.kind)) return null;
  if (typeof record.url !== 'string' || record.url === '') return null;
  const name = typeof record.name === 'string' ? record.name : record.url;
  const label = typeof record.label === 'string' ? record.label : name;
  return { kind: record.kind, url: record.url, name, label };
};

/**
 * Writes a Project tile onto a drag `DataTransfer`.
 */
export const writeProjectItemPayload = (dataTransfer: DataTransfer, item: ProjectItem): void => {
  const json = JSON.stringify({
    kind: item.kind,
    url: item.url,
    name: item.name,
    label: item.label
  });
  dataTransfer.setData(PROJECT_ITEM_MIME, json);
  dataTransfer.setData('text/plain', json);
  dataTransfer.effectAllowed = 'copy';
};

/**
 * Reads a Project tile from a drop `DataTransfer`.
 */
export const readProjectItemPayload = (dataTransfer: DataTransfer): ProjectItem | null => {
  const typed = dataTransfer.getData(PROJECT_ITEM_MIME);
  if (typed !== '') return parseProjectItemPayload(typed);
  return parseProjectItemPayload(dataTransfer.getData('text/plain'));
};
