import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearPersistenceDirty,
  isPersistenceDirty,
  markPersistenceDirty
} from '../app/utils/persistence-dirty';

describe('persistence dirty flag', () => {
  beforeEach(() => {
    clearPersistenceDirty();
  });

  it('starts clean so an idle timer does not serialize', () => {
    expect(isPersistenceDirty()).toBe(false);
  });

  it('stays dirty across repeated marks until a successful save clears it', () => {
    markPersistenceDirty();
    markPersistenceDirty();
    expect(isPersistenceDirty()).toBe(true);

    clearPersistenceDirty();
    expect(isPersistenceDirty()).toBe(false);
  });
});
