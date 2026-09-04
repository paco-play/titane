import { PlayerController } from '~/gameplay/PlayerController';

/**
 * Vite HMR: re-bind PlayerController without a full page reload.
 * `defineComponent` patches the interned type; the engine rebakes live data.
 */
export const wireGameplayHotReload = (): void => {
  if (!import.meta.hot) return;

  import.meta.hot.accept('../gameplay/PlayerController', () => {
    const { engine, notifyInspect } = useTitane();
    if (!engine.value) return;
    engine.value.reloadUserComponent(PlayerController);
    notifyInspect();
  });
};
