import type { AssetAccept } from '@titane/core';

/**
 * One file under `public/assets`, listed by the Inspector asset picker.
 */
export interface ProjectAsset {
  readonly url: string;
  readonly name: string;
  readonly kind: AssetAccept;
}
