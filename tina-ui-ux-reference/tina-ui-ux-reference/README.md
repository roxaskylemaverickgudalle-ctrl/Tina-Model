# Tina Build Coach

This is the Tina frontend application. It uses the dashboard layout and
components in this source folder and connects authenticated users to the
Supabase project workspace.

## Run locally

From this directory:

```powershell
npm install
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` before
signing in. Apply `../../supabase/schema.sql` to the connected Supabase project
to create the project, requirements, milestone, and message tables with
owner-only row-level security.

## Tina model

The Tina panel uses the local Qwen ONNX model in `../../tina-onnx-model`.
Vite serves this directory at `/tina-onnx-model` during local development.
Production hosting must serve the same model directory at that URL; the model
weights are intentionally not copied into the frontend build. Keep the model's
configuration, tokenizer files, and `onnx/model_quantized.onnx` together.

## Features

- Supabase email sign-up/sign-in and private, multi-project workspaces.
- Persistent project briefs, technology stacks, requirements, evidence,
  milestone dates/status/progress, and Tina conversations.
- Dashboard overview, editable project timeline, requirements tracking,
  searchable project data, activity notifications, settings, and JSON export.
- Tina's project-aware defense coaching generated locally by the ONNX model.
- Responsive sidebar, mobile navigation, and light/dark/system themes.

Errors from Supabase and the local model are shown in the interface. The
frontend does not substitute sample records or scripted chat replies when a
service is unavailable.
