# Titane Drop demo

A small Nuxt 4 game that boots `@titane/core` + `@titane/renderer` with **no editor chrome**.

Stay on the slab. WASD / arrows to move, Space to jump. Walk off and you fall; Restart restores the snapshot.

The demo loads [`public/drop.titane`](public/drop.titane) on boot (`engine.loadWorld`). If that file is missing, it seeds the same scene in code. Author the scene in the editor (Rigid Body + Player controlled), export a `.titane`, and replace `public/drop.titane` to play it.

Regenerate the committed scene after changing spawn data:

```bash
npm run build
npx tsx packages/core/scripts/write-drop-scene.ts
```

```bash
npm run build
npm run demo:dev
```

Opens on [http://localhost:3001](http://localhost:3001). Keep `npm run core:dev` / `npm run renderer:dev` running if you are iterating on the engine.
