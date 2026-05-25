# BookSaver Agent — Documentation

Project documentation for the BookSaver Agent local-first Python daemon. All artifacts use Markdown (`.md`).

See the [project README](../README.md) for an overview of the application.

## Workflow

1. Create a plan in [`plans/`](plans/) before starting work.
2. Wait for plan approval before implementing changes.
3. Store requirements, stories, and design artifacts in the folders below as the project evolves.

## Folders

| Folder | Purpose |
|--------|---------|
| [`plans/`](plans/) | Implementation plans; work begins only after approval |
| [`requirements/`](requirements/) | Requirements and feature-change documents |
| [`story-artifacts/`](story-artifacts/) | User stories |
| [`design-artifacts/`](design-artifacts/) | Architecture and design documents |

## Project shape

BookSaver Agent is a single-repository, local-first Python daemon — not a frontend/backend web app. Runtime code and internal modules live in this repo; distributed services and separate front-end/back-end project folders are out of scope unless explicitly added later.
