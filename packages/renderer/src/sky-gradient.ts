import * as THREE from 'three';

const WIDTH = 512;
const HEIGHT = 256;

const zenith = new THREE.Color();
const horizon = new THREE.Color();
const ground = new THREE.Color();
const skyWhite = new THREE.Color('#f4f8ff');
const terrain = new THREE.Color('#2a3328');

/**
 * Equirectangular gradient: zenith → horizon → ground, tinted by `color`.
 * `null` in Node tests where `document` is missing.
 */
export const createSkyGradientTexture = (color: string): THREE.CanvasTexture | null => {
    if (typeof document === 'undefined') return null;

    zenith.set(color);
    horizon.copy(zenith).lerp(skyWhite, 0.55);
    ground.copy(zenith).lerp(terrain, 0.72);

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, `#${zenith.getHexString()}`);
    gradient.addColorStop(0.42, `#${horizon.getHexString()}`);
    gradient.addColorStop(0.55, `#${horizon.getHexString()}`);
    gradient.addColorStop(1, `#${ground.getHexString()}`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
};
