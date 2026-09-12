import {
  clearPostFx,
  createPostFx,
  ensurePostFx,
  getComponent,
  pickPostFx,
  PostFx,
  updateComponent,
  type PostFxData
} from '@titane/core';

/**
 * Authors scene-wide bloom / color grade from the World inspector.
 */
export const useInspectorWorldPostFx = () => {
  const { engine, inspectTick, notifyInspect, markDirty, syncWorld } = useTitane();
  const { saveToStorage } = usePersistence();

  const authored = computed<boolean>(() => {
    void inspectTick.value;
    if (!engine.value) return false;
    return pickPostFx(engine.value.world) !== null;
  });

  const postFx = computed<PostFxData>(() => {
    void inspectTick.value;
    if (!engine.value) return createPostFx();
    const entity = pickPostFx(engine.value.world);
    if (entity === null) return createPostFx();
    return getComponent(engine.value.world, entity, PostFx) ?? createPostFx();
  });

  const patch = (write: (data: PostFxData) => void): void => {
    if (!engine.value) return;
    const entity = ensurePostFx(engine.value.world);
    updateComponent(engine.value.world, entity, PostFx, write);
    syncWorld();
    notifyInspect();
    markDirty();
  };

  const resetPostFx = (): void => {
    if (!engine.value) return;
    clearPostFx(engine.value.world);
    syncWorld();
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  return {
    postFx,
    authored,
    setBloom: (bloom: number): void => { patch((data) => { data.bloom = bloom; }); },
    setExposure: (exposure: number): void => { patch((data) => { data.exposure = exposure; }); },
    setContrast: (contrast: number): void => { patch((data) => { data.contrast = contrast; }); },
    setSaturation: (saturation: number): void => { patch((data) => { data.saturation = saturation; }); },
    setTint: (tint: string): void => { patch((data) => { data.tint = tint; }); },
    setVignette: (vignette: number): void => { patch((data) => { data.vignette = vignette; }); },
    resetPostFx
  };
};
