import {
  bakeNavGrid,
  clearNav,
  createNav,
  ensureNav,
  getComponent,
  Nav,
  pickNav,
  updateComponent,
  type NavData
} from '@titane/core';

/**
 * Authors the World nav grid: cell size, bake from walkable colliders, clear.
 */
export const useInspectorWorldNav = () => {
  const { engine, inspectTick, notifyInspect, markDirty, syncWorld } = useTitane();
  const { saveToStorage } = usePersistence();

  const authored = computed<boolean>(() => {
    void inspectTick.value;
    if (!engine.value) return false;
    return pickNav(engine.value.world) !== null;
  });

  const nav = computed<NavData>(() => {
    void inspectTick.value;
    if (!engine.value) return createNav();
    const entity = pickNav(engine.value.world);
    if (entity === null) return createNav();
    return getComponent(engine.value.world, entity, Nav) ?? createNav();
  });

  const persist = (): void => {
    syncWorld();
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const patch = (write: (data: NavData) => void): void => {
    if (!engine.value) return;
    const entity = ensureNav(engine.value.world);
    updateComponent(engine.value.world, entity, Nav, write);
    syncWorld();
    notifyInspect();
    markDirty();
  };

  const bake = (): void => {
    if (!engine.value) return;
    bakeNavGrid(engine.value.world);
    persist();
  };

  const clear = (): void => {
    if (!engine.value) return;
    clearNav(engine.value.world);
    persist();
  };

  return {
    nav,
    authored,
    bake,
    clear,
    setCellSize: (cellSize: number): void => { patch((data) => { data.cellSize = cellSize; }); },
    setAgentRadius: (agentRadius: number): void => { patch((data) => { data.agentRadius = agentRadius; }); },
    setAgentHeight: (agentHeight: number): void => { patch((data) => { data.agentHeight = agentHeight; }); }
  };
};
