import type { DropdownMenuItem } from '@nuxt/ui';
import type { HierarchyItem } from './useHierarchy';
import {
  HIERARCHY_COLORS,
  HIERARCHY_ICONS,
  hierarchyIconLabel
} from '~/utils/hierarchy-appearance';

type SwatchMenuItem = DropdownMenuItem & { hex?: string };

/**
 * Builds the per-row kebab menu: rename, icon picker, color swatches, reset.
 */
export const useHierarchyRowMenu = () => {
  const { patchName, nameOf } = useHierarchyName();
  const { beginRename } = useHierarchyRename();

  const itemsFor = (item: HierarchyItem): DropdownMenuItem[][] => {
    if (item.id === undefined) return [];

    const entityId = item.id;
    const current = nameOf(entityId);
    const groups: DropdownMenuItem[][] = [
      [
        {
          label: 'Rename',
          icon: 'i-lucide-pencil',
          onSelect: () => beginRename(entityId, item.label ?? '')
        }
      ],
      [
        {
          label: 'Icon',
          icon: 'i-lucide-shapes',
          filter: { placeholder: 'Search icons...' },
          children: HIERARCHY_ICONS.map(icon => ({
            label: hierarchyIconLabel(icon),
            icon,
            onSelect: () => patchName(entityId, { icon })
          }))
        },
        {
          label: 'Color',
          icon: 'i-lucide-palette',
          children: HIERARCHY_COLORS.map(swatch => ({
            label: swatch.label,
            slot: 'swatch',
            hex: swatch.hex,
            onSelect: () => patchName(entityId, { color: swatch.hex })
          } satisfies SwatchMenuItem))
        }
      ]
    ];

    if (current?.icon || current?.color) {
      groups.push([
        {
          label: 'Reset appearance',
          icon: 'i-lucide-rotate-ccw',
          onSelect: () => patchName(entityId, { icon: null, color: null })
        }
      ]);
    }

    return groups;
  };

  return { itemsFor };
};
