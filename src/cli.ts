import { summarizeReviews } from './appleReviews.js';

async function run() {
  const args = new Map<string, string>();
  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.split('=');
    if (k && v) args.set(k.replace(/^--/, ''), v);
  }

  const appId = args.get('appId') || args.get('appid');
  if (!appId) {
    console.error('Usage: tsx src/cli.ts --appId=1420058690 [--country=us] [--sortBy=mostrecent] [--maxPages=5]');
    process.exit(1);
  }
  const country = args.get('country');
  const sortBy = args.get('sortBy') as 'mostrecent' | 'mosthelpful' | undefined;
  const maxPages = args.get('maxPages') ? Number(args.get('maxPages')) : undefined;

  const req: { appId: string; country?: string; sortBy?: 'mostrecent' | 'mosthelpful'; maxPages?: number } = { appId };
  if (country !== undefined) req.country = country;
  if (sortBy !== undefined) req.sortBy = sortBy;
  if (maxPages !== undefined) req.maxPages = maxPages;

  const summary = await summarizeReviews(req);
  console.log(JSON.stringify(summary, null, 2));
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

