import {
  addComponent,
  createSound,
  getComponent,
  removeComponent,
  Sound,
  updateComponent,
  type SoundData,
} from '@titane/core';
import { useTitane } from '../useTitane';
import { usePersistence } from '../usePersistence';

/**
 * Reads and writes the selected entity's `Sound` component.
 */
export const useInspectorSound = () => {
  const { engine, selectedEntityId, inspectTick, notifyInspect, markDirty } = useTitane();
  const { saveToStorage } = usePersistence();

  const sound = computed<SoundData | undefined>(() => {
    void inspectTick.value;
    if (selectedEntityId.value === null || !engine.value) return undefined;
    return getComponent(engine.value.world, selectedEntityId.value, Sound);
  });

  const addSound = (): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    addComponent(engine.value.world, selectedEntityId.value, Sound, createSound());
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const removeSound = (): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    removeComponent(engine.value.world, selectedEntityId.value, Sound);
    notifyInspect();
    markDirty();
    saveToStorage();
  };

  const patchSound = (write: (data: SoundData) => void): void => {
    if (selectedEntityId.value === null || !engine.value) return;
    updateComponent(engine.value.world, selectedEntityId.value, Sound, write);
    notifyInspect();
    markDirty();
  };

  const setSoundUrl = (url: string): void => {
    patchSound(data => { data.url = url; });
  };

  const setSoundVolume = (volume: number): void => {
    patchSound(data => { data.volume = volume; });
  };

  const setSoundLoop = (loop: boolean): void => {
    patchSound(data => { data.loop = loop; });
    saveToStorage();
  };

  const setSoundPositional = (positional: boolean): void => {
    patchSound(data => { data.positional = positional; });
    saveToStorage();
  };

  const setSoundPlaying = (playing: boolean): void => {
    patchSound(data => { data.playing = playing; });
    saveToStorage();
  };

  return {
    sound,
    addSound,
    removeSound,
    setSoundUrl,
    setSoundVolume,
    setSoundLoop,
    setSoundPositional,
    setSoundPlaying
  };
};
