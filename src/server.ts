import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { summarizeReviews } from './appleReviews.js';

const server = new McpServer(
  { name: 'appstore-reviews-mcp', version: '0.1.0' },
  {
    capabilities: {
      tools: { listChanged: true },
      logging: {},
    },
    instructions:
      'Use the tools to fetch App Store reviews and classify them into actionable buckets.',
  }
);

// Define tool input and output schemas
const inputSchema = {
  appId: z.string().min(1).describe('Apple App Store app ID, e.g. 1420058690'),
  country: z
    .string()
    .min(2)
    .max(2)
    .optional()
    .describe('Two-letter country code, default: us'),
  sortBy: z
    .enum(['mostrecent', 'mosthelpful'])
    .optional()
    .describe('Sort order, default: mostrecent'),
  maxPages: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe('Safety cap for pagination, default: 10'),
};

const reviewSchema = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.number(),
  title: z.string().optional(),
  content: z.string(),
  updated: z.string().optional(),
  version: z.string().optional(),
  voteSum: z.number().optional(),
  voteCount: z.number().optional(),
  link: z.string().optional(),
});

const outputSchema = {
  appId: z.string(),
  country: z.string(),
  totalFetched: z.number().int(),
  needs_fixing: z.array(reviewSchema),
  working_well: z.array(reviewSchema),
};

server.registerTool(
  'appstore_reviews_summary',
  {
    title: 'App Store Reviews Summary',
    description:
      'Fetch Apple App Store reviews for an app and categorize into needs_fixing vs working_well.',
    inputSchema,
    outputSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (args: z.infer<z.ZodObject<typeof inputSchema>>) => {
    const { appId, country, sortBy, maxPages } = args;
    const req: { appId: string; country?: string; sortBy?: 'mostrecent' | 'mosthelpful'; maxPages?: number } = { appId };
    if (country !== undefined) req.country = country;
    if (sortBy !== undefined) req.sortBy = sortBy;
    if (maxPages !== undefined) req.maxPages = maxPages;
    const summary = await summarizeReviews(req);

    const needs = summary.needs_fixing.length;
    const good = summary.working_well.length;
    const headline = `Fetched ${summary.totalFetched} reviews for ${summary.appId} (${summary.country}). Needs fixing: ${needs}, working well: ${good}.`;

    return {
      content: [
        {
          type: 'text',
          text: headline,
        },
      ],
      structuredContent: summary,
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
