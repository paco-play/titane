# Getting started

Titane is a data-oriented ECS engine. The product is this loop:

> I write TypeScript → I attach a behavior to an entity → the editor exposes my fields → I press Play → it runs → I iterate.

This page is the five-minute path. The engine packages are not on npm yet, so the scaffold links them with `file:` from a Titane checkout.

## Create a project

From the Titane repository:

```bash
npm run create -- --name my-game --template nuxt --yes
cd my-game
npm run dev
```

Three questions if you omit the flags: **project name**, **template** (`nuxt` or `vanilla`), **install dependencies**.

| Template | What you get |
| --- | --- |
| `nuxt` | Game at `/`. Editor at `/titane` in dev. Production build strips the editor. |
| `vanilla` | Vite + TypeScript canvas. A cube moves. No embedded editor. |

`next` and `sveltekit` are not scaffolded. The engine itself has no UI framework dependency; those hosts can wait.

## What should happen

1. Open http://localhost:3000 — a green cube slides along X.
2. Open http://localhost:3000/titane — Hierarchy, Inspector, Play.
3. Select the cube, **Add Component**, or edit `speed` on `PlayerController`. Press Play.

## Project layout

```
my-game/
  titane.config.ts      plugins registered at boot
  scenes/main.titane    data only (no scripts)
  src/components/       your `defineComponent` files
  public/assets/        runtime files (textures, audio, glTF)
```

The Nuxt template also has `app/pages/index.vue` (the game) and inherits the editor layer in development.

## Production

`nuxt build` sets `NODE_ENV=production`. The generated `nuxt.config.ts` then **does not** `extends` `@titane/editor`. The bundle is core + renderer + scene + scripts.

## Next

- [ECS concepts](./ecs.md)
- [Writing a component](./writing-a-component.md)
- [API reference](./api.md)
