/**
 * Fixed simulation timestep, in seconds (60 Hz).
 * Physics and UPDATE run on this cadence while the engine is playing.
 */
export const FIXED_DT = 1 / 60;

/** Caps substeps per frame so a hitch cannot spiral. */
export const MAX_FIXED_STEPS = 8;

/**
 * Accumulates frame time and reports how many `FIXED_DT` steps to run.
 */
export class FixedStep {
    private accumulator = 0;

    /**
     * Adds a frame delta and returns the number of simulation steps due.
     * Leftover time stays in the accumulator. Hitting {@link MAX_FIXED_STEPS}
     * drops the remainder so a long hitch cannot cascade.
     * @param frameDt - Real frame time, in seconds.
     */
    public consume(frameDt: number): number {
        this.accumulator += Math.max(0, frameDt);

        let steps = 0;
        while (this.accumulator >= FIXED_DT && steps < MAX_FIXED_STEPS) {
            this.accumulator -= FIXED_DT;
            steps += 1;
        }

        if (steps === MAX_FIXED_STEPS) this.accumulator = 0;
        return steps;
    }

    /**
     * Clears leftover time. Call when leaving play mode so the next play
     * does not dump a backlog of steps.
     */
    public reset(): void {
        this.accumulator = 0;
    }
}
