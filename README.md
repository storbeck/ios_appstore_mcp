App Store Reviews MCP Server (TypeScript)

This is a minimal Model Context Protocol (MCP) server that fetches Apple App Store reviews for a given app ID and organizes them into two actionable buckets:
- needs_fixing — likely issues, complaints, or low ratings
- working_well — praise, high ratings, or positive feedback

Features
- Fetches reviews via Apple iTunes RSS customer reviews API, follows pagination via `rel=next` links (capped by `maxPages`).
- Lightweight classification using star rating and simple keyword heuristics.
- Exposes an MCP tool returning structured output suitable for agent workflows.
- Includes a small CLI for quick local use/testing.

Install
- Node 18+ recommended
- Install dependencies: `npm install`

Scripts
- `npm run start` — Run MCP server over stdio
- `npm run fetch -- --appId=1420058690 --country=us --sortBy=mostrecent --maxPages=5` — One-off CLI to print categorized reviews as JSON

MCP Tool
- Name: `appstore_reviews_summary`
- Input:
  - `appId` (string, required) — e.g., `1420058690`
  - `country` (string, optional, default `us`)
  - `sortBy` (enum: `mostrecent` | `mosthelpful`, optional)
  - `maxPages` (number, optional, safety cap, default `10`)
- Output (structuredContent):
  - `appId`, `country`, `totalFetched`
  - `needs_fixing`: Review[]
  - `working_well`: Review[]

Example Output (truncated)
<img width="1520" height="749" alt="image" src="https://github.com/user-attachments/assets/399736a5-3620-4e97-87b2-9e6b4d06f47b" />

