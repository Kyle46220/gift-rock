# gift rock

A minimal 3D rock editor and shareable viewer. On phones the rock stays in the upper pane while the controls scroll below it. In landscape the panes sit side by side.

## Run

Use Node 22+ and the pnpm version in package.json.

```sh
pnpm install
pnpm dev
pnpm build
pnpm start
```

## Vercel

Import `Kyle46220/gift-rock`, select the Next.js framework, and deploy the main branch. No secrets or environment variables are needed for the existing storage arrangement.

## Storage and existing links

The interface runs on Vercel using standard Next.js. `/api/[...path]` forwards only rock and image operations to the existing public Rock Post service at `https://little-rock-post.kyle394956.chatgpt.site`. That service retains its D1 database and R2 uploads. Keep it deployed: it is the storage backend for this app. Existing rock IDs remain valid, and new links use the current site's origin. Browser cookies and credentials are never forwarded.

This is a frontend hosting migration, not a transfer of the database or image bucket to Vercel. If moving storage later, replace the server-side adapter and migrate the saved records/images before retiring the original service.

Images are resized in the browser and uploaded as JPEG. Shared rocks are immutable snapshots. Anyone with a link can view the corresponding rock and image.

## Controls

Drag to orbit; pinch or scroll to zoom. Arrow keys rotate, +/- zoom. Push and Pull brush the surface. The shape, colour, stone finish, sculpting, and image wrap are saved together.
