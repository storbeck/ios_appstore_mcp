import { fetch } from 'undici';

export type Review = {
  id: string;
  author: string;
  rating: number; // 1-5
  title?: string;
  content: string;
  updated?: string;
  version?: string;
  voteSum?: number;
  voteCount?: number;
  link?: string;
};

export type ReviewsResult = {
  appId: string;
  country: string;
  totalFetched: number;
  needs_fixing: Review[];
  working_well: Review[];
};

type FeedEntry = any;

function classifyReview(review: Review): 'needs_fixing' | 'working_well' {
  // Basic heuristic: <=2 stars => needs fixing, >=4 => working well.
  if (review.rating <= 2) return 'needs_fixing';
  if (review.rating >= 4) return 'working_well';

  // Lightweight keyword checks to catch misrated or ambiguous 3-star cases.
  const text = `${review.title ?? ''} ${review.content}`.toLowerCase();
  const neg = /(bug|crash|crashes|freez|lag|slow|doesn't work|doesnt work|not working|broken|issue|problem|fix|error|glitch|annoy|refund|ads are (too|way) many|paywall|subscription)/i;
  const pos = /(great|awesome|love|fantastic|excellent|works well|reliable|stable|fast|useful|intuitive|perfect)/i;
  if (neg.test(text)) return 'needs_fixing';
  if (pos.test(text)) return 'working_well';

  // Default: treat 3-star as needs fixing to be conservative/actionable
  return 'needs_fixing';
}

function parseEntry(entry: FeedEntry): Review | null {
  try {
    // The first entry is the app metadata, skip if it lacks im:rating
    const ratingStr = entry?.["im:rating"]?.label ?? entry?.rating?.label;
    if (!ratingStr) return null;
    const id = entry?.id?.label ?? entry?.id ?? `${entry?.updated?.label ?? ''}:${entry?.title?.label ?? ''}`;
    const author = entry?.author?.name?.label ?? 'Unknown';
    const title = entry?.title?.label;
    const content = entry?.content?.label ?? entry?.summary?.label ?? '';
    const updated = entry?.updated?.label;
    const version = entry?.["im:version"]?.label;
    const voteSum = entry?.["im:voteSum"]?.label ? Number(entry?.["im:voteSum"]?.label) : undefined;
    const voteCount = entry?.["im:voteCount"]?.label ? Number(entry?.["im:voteCount"]?.label) : undefined;
    const link = Array.isArray(entry?.link)
      ? entry.link.find((l: any) => l?.rel === 'alternate')?.href
      : entry?.link?.href;

    const base: Review = {
      id: String(id),
      author: String(author),
      rating: Number(ratingStr),
      content,
    };
    return {
      ...base,
      ...(title ? { title } : {}),
      ...(updated ? { updated } : {}),
      ...(version ? { version } : {}),
      ...(voteSum !== undefined ? { voteSum } : {}),
      ...(voteCount !== undefined ? { voteCount } : {}),
      ...(link ? { link } : {}),
    };
  } catch {
    return null;
  }
}

function getNextLink(feed: any): string | undefined {
  const links = feed?.link;
  if (!links) return undefined;
  if (Array.isArray(links)) {
    const next = links.find((l: any) => l?.rel === 'next');
    return next?.href;
  }
  if (links?.rel === 'next') return links?.href;
  return undefined;
}

export async function fetchAllReviews(params: {
  appId: string;
  country?: string; // e.g., 'us'
  sortBy?: 'mostrecent' | 'mosthelpful';
  maxPages?: number; // safety cap
}): Promise<Review[]> {
  const { appId, country = 'us', sortBy = 'mostrecent', maxPages = 10 } = params;
  const baseUrl = `https://itunes.apple.com/${country}/rss/customerreviews/id=${encodeURIComponent(appId)}/sortby=${sortBy}/json`;

  const reviews: Review[] = [];
  let url: string | undefined = baseUrl;
  let pages = 0;

  while (url && pages < maxPages) {
    const res = await fetch(url, { headers: { 'User-Agent': 'mcp-review-fetcher/1.0' } });
    if (!res.ok) break;
    const data: any = await res.json();
    const entries: FeedEntry[] = data?.feed?.entry ?? [];

    // Skip app metadata entry at index 0
    for (const entry of entries.slice(1)) {
      const review = parseEntry(entry);
      if (review) reviews.push(review);
    }

    url = getNextLink(data?.feed);
    pages += 1;
  }

  return reviews;
}

export async function summarizeReviews(params: {
  appId: string;
  country?: string;
  sortBy?: 'mostrecent' | 'mosthelpful';
  maxPages?: number;
}): Promise<ReviewsResult> {
  const { appId, country = 'us', sortBy, maxPages } = params;
  const req: { appId: string; country?: string; sortBy?: 'mostrecent' | 'mosthelpful'; maxPages?: number } = { appId, country };
  if (sortBy !== undefined) req.sortBy = sortBy;
  if (maxPages !== undefined) req.maxPages = maxPages;
  const all = await fetchAllReviews(req);
  const needs_fixing: Review[] = [];
  const working_well: Review[] = [];

  for (const r of all) {
    const bucket = classifyReview(r);
    if (bucket === 'needs_fixing') needs_fixing.push(r);
    else working_well.push(r);
  }

  return {
    appId,
    country,
    totalFetched: all.length,
    needs_fixing,
    working_well,
  };
}
