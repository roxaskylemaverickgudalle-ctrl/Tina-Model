# Tina Build Coach

The Tina frontend lives in
[`tina-ui-ux-reference/tina-ui-ux-reference`](./tina-ui-ux-reference/tina-ui-ux-reference/).
That source folder contains the active dashboard, project pages, and Vite app.

## Run locally

```powershell
Set-Location .\tina-ui-ux-reference\tina-ui-ux-reference
npm install
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`.
Apply [`supabase/schema.sql`](./supabase/schema.sql) to the Supabase project
before creating a project in the UI.

The Tina panel runs the local model from `tina-onnx-model`. The Vite dev server
serves that model at `/tina-onnx-model`; production hosting must expose the
same model directory at that URL. Model weights are not bundled into the
frontend build.
