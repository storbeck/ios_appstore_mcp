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

Codex config.toml
```
[mcp_servers.appstore_reviews]
command = "node"
args = ["/home/$USER/repos/ios_appstore_mcp/dist/server.js"]

[projects."/home/$USER/projects/ios_appstore_mcp"]
trust_level = "trusted"
```

Example Output 
<img width="1563" height="811" alt="image" src="https://github.com/user-attachments/assets/ef73b8bb-c116-4125-a5c9-23a1b80eff72" />

