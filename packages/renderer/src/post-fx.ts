import * as THREE from 'three';
import type { World } from '@titane/core';
import {
    createPostFx,
    getComponent,
    pickPostFx,
    PostFx,
    postFxIsIdentity,
    type PostFxData
} from '@titane/core';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { applyPostFxGrade, POST_FX_GRADE_SHADER } from './post-fx-grade';

/**
 * World post filters: bloom + color grade + vignette.
 * Identity data falls through to a raw `renderer.render`.
 */
export class PostFxComposer {
    private composer: EffectComposer | null = null;
    private renderPass: RenderPass | null = null;
    private bloomPass: UnrealBloomPass | null = null;
    private gradePass: ShaderPass | null = null;
    private bloomOn = false;

    constructor(
        private readonly renderer: THREE.WebGLRenderer,
        private readonly scene: THREE.Scene
    ) {}

    /**
     * Presents the frame with authored filters, or a direct render.
     */
    public render(world: World, camera: THREE.Camera): void {
        const data = this.read(world);
        if (postFxIsIdentity(data)) {
            this.renderer.render(this.scene, camera);
            return;
        }

        this.ensure(camera, data.bloom > 0);
        if (!this.composer || !this.renderPass || !this.gradePass) {
            this.renderer.render(this.scene, camera);
            return;
        }

        this.renderPass.camera = camera;
        applyPostFxGrade({
            exposure: this.gradePass.uniforms.exposure,
            contrast: this.gradePass.uniforms.contrast,
            saturation: this.gradePass.uniforms.saturation,
            tint: this.gradePass.uniforms.tint,
            vignette: this.gradePass.uniforms.vignette
        }, data);
        if (this.bloomPass) {
            this.bloomPass.strength = data.bloom;
            this.bloomPass.radius = 0.4;
            this.bloomPass.threshold = 0.7;
        }
        this.composer.render();
    }

    public setSize(width: number, height: number): void {
        this.composer?.setSize(width, height);
        this.bloomPass?.resolution.set(width, height);
    }

    public dispose(): void {
        this.composer?.dispose();
        this.composer = null;
        this.renderPass = null;
        this.bloomPass = null;
        this.gradePass = null;
    }

    private read(world: World): PostFxData {
        const entity = pickPostFx(world);
        if (entity === null) return createPostFx();
        return getComponent(world, entity, PostFx) ?? createPostFx();
    }

    private ensure(camera: THREE.Camera, bloom: boolean): void {
        if (this.composer && this.bloomOn === bloom) return;
        this.composer?.dispose();

        const composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, camera);
        const gradePass = new ShaderPass(POST_FX_GRADE_SHADER);
        composer.addPass(renderPass);

        let bloomPass: UnrealBloomPass | null = null;
        if (bloom) {
            const size = this.renderer.getSize(new THREE.Vector2());
            bloomPass = new UnrealBloomPass(size, 0.5, 0.4, 0.7);
            composer.addPass(bloomPass);
        }

        composer.addPass(gradePass);
        composer.addPass(new OutputPass());
        composer.setPixelRatio(this.renderer.getPixelRatio());

        this.composer = composer;
        this.renderPass = renderPass;
        this.bloomPass = bloomPass;
        this.gradePass = gradePass;
        this.bloomOn = bloom;
    }
}
