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
{
  "appId": "1420058690",
  "country": "us",
  "totalFetched": 120,
  "needs_fixing": [
    { "id": "...", "rating": 1, "author": "...", "content": "..." }
  ],
  "working_well": [
    { "id": "...", "rating": 5, "author": "...", "content": "..." }
  ]
}

How classification works
- Rating <= 2 → needs_fixing
- Rating >= 4 → working_well
- Otherwise simple keyword checks; default 3-star goes to needs_fixing for actionability

Notes
- Apple’s RSS feed includes an app metadata entry as the first `feed.entry`; reviews begin at `entry[1]`.
- Pagination is followed via `feed.link` entries with `rel="next"`.
- The server uses stdio transport. Configure it with your MCP-compatible client to call the tool.
