import {
  addComponent,
  getComponent,
  hasComponent,
  Input,
  listOrphans,
  Name,
  removeComponent,
  removeOrphan,
  updateComponent,
  type AnyComponentType,
  type AnyFieldDef,
  type Entity,
  type OrphanRecord,
} from '@titane/core';
import { useTitane } from '../useTitane';
import { fieldLabel } from '~/utils/field-label';
import type { EntityOption } from '~/types/inspector';

/** One schema-driven component currently attached to the selection. */
export interface InspectedUserComponent {
  readonly type: AnyComponentType;
  readonly label: string;
  readonly data: Record<string, unknown>;
  readonly fields: readonly { readonly key: string; readonly field: AnyFieldDef }[];
}

/**
 * Reads and writes user (schema-driven) components on the selected entity.
 */
export const useInspectorUser = () => {
  const {
    engine,
    selectedEntityId,
    inspectTick,
    notifyInspect,
    markDirty,
    entities,
  } = useTitane();
  const { saveToStorage } = usePersistence();

  const selected = (): { world: NonNullable<typeof engine.value>['world']; entity: Entity } | null => {
    if (selectedEntityId.value === null || !engine.value) return null;
    return { world: engine.value.world, entity: selectedEntityId.value };
  };

  const persist = (): void => {
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const attached = computed<InspectedUserComponent[]>(() => {
    void inspectTick.value;
    const host = selected();
    if (!host || !engine.value) return [];

    const sections: InspectedUserComponent[] = [];
    for (const type of engine.value.getUserComponents()) {
      if (!type.schema || !hasComponent(host.world, host.entity, type)) continue;
      const data = getComponent(host.world, host.entity, type);
      if (data === undefined) continue;
      sections.push({
        type,
        label: fieldLabel(type.id),
        data: data as Record<string, unknown>,
        fields: Object.entries(type.schema).map(([key, field]) => ({ key, field })),
      });
    }
    return sections;
  });

  const orphans = computed<OrphanRecord[]>(() => {
    void inspectTick.value;
    const host = selected();
    if (!host) return [];
    return listOrphans(host.world, host.entity);
  });

  const availableTypes = computed<AnyComponentType[]>(() => {
    void inspectTick.value;
    const host = selected();
    if (!host || !engine.value) return [];
    return engine.value.getUserComponents().filter(
      (type) => type.schema !== undefined && !hasComponent(host.world, host.entity, type)
    );
  });

  const entityOptions = computed<EntityOption[]>(() => {
    void inspectTick.value;
    void entities.value;
    if (!engine.value) return [];
    const world = engine.value.world;
    const options: EntityOption[] = [];
    for (const entityId of entities.value) {
      if (hasComponent(world, entityId, Input)) continue;
      options.push({
        id: entityId,
        label: getComponent(world, entityId, Name)?.value || `Entity #${entityId}`,
      });
    }
    return options;
  });

  const addUserComponent = (type: AnyComponentType): void => {
    const host = selected();
    if (!host) return;
    addComponent(host.world, host.entity, type, type.create());
    persist();
  };

  const dropUserComponent = (type: AnyComponentType): void => {
    const host = selected();
    if (!host) return;
    removeComponent(host.world, host.entity, type);
    persist();
  };

  const setField = (type: AnyComponentType, key: string, value: unknown): void => {
    const host = selected();
    if (!host) return;
    updateComponent(host.world, host.entity, type, (data) => {
      (data as Record<string, unknown>)[key] = value;
    });
    notifyInspect();
    markDirty();
  };

  const dropOrphan = (componentId: string): void => {
    const host = selected();
    if (!host) return;
    removeOrphan(host.world, host.entity, componentId);
    persist();
  };

  return {
    attached,
    orphans,
    availableTypes,
    entityOptions,
    addUserComponent,
    dropUserComponent,
    setField,
    dropOrphan,
  };
};
