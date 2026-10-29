import { kv } from '@vercel/kv';
import type { NextFetchEvent, NextMiddleware, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getUrlBySlug, incrementLinkCount, type Url } from '@/lib/notion';

const whitelist = [
  'favicons',
  'fonts',
  'images',
  'svg',
  '',
  'login',
  'new',
  'favicon',
  '_next',
  'favicon.ico',
  'api',
];

const isProd = process.env.NODE_ENV === 'production';

const slugMap = new Map<string, string>();
const pendingUrls = new Map<string, Promise<Url | undefined>>();

const resolveUrl = async (path: string, event: NextFetchEvent) => {
  const cachedUrl = await kv.get<Url>(path);
  const url = cachedUrl ?? (await getUrlBySlug(path));

  if (url?.link) {
    slugMap.set(path, JSON.stringify(url));
    if (isProd && !cachedUrl) {
      event.waitUntil(
        (async () => {
          await kv.set(path, url, { ex: 60 * 60 * 24 });
        })().catch(() => {
          console.error('Redirect cache write failed');
        }),
      );
    }
  }

  return url;
};

const proxy: NextMiddleware = async (
  req: NextRequest,
  event: NextFetchEvent,
) => {
  const path = req.nextUrl.pathname.split('/')[1];
  const baseUrl = req.nextUrl.clone();
  if (whitelist.includes(path) || process.env.CI || path.length > 128) {
    return;
  }
  const cachedRawUrl = slugMap.get(path);
  const cachedUrl = cachedRawUrl
    ? (JSON.parse(cachedRawUrl) as Url)
    : undefined;
  let url = cachedUrl;
  if (!url) {
    let pending = pendingUrls.get(path);
    if (!pending) {
      pending = resolveUrl(path, event).finally(() => pendingUrls.delete(path));
      pendingUrls.set(path, pending);
    }
    url = await pending;
  }

  /** Don't redirect if /:slug/detail */
  const isDetailPage = req.nextUrl.pathname.split('/')[2] === 'detail';
  if (isDetailPage) {
    return url?.link
      ? undefined
      : NextResponse.redirect(baseUrl.origin + '/new?slug=' + path);
  }

  if (url?.link) {
    if (isProd) {
      event.waitUntil(
        (async () => {
          await incrementLinkCount(url, url.slug);
        })().catch(() => {
          console.error('Redirect click count failed');
        }),
      );
    }

    return NextResponse.redirect(url.link + req.nextUrl.search);
  }

  return NextResponse.redirect(baseUrl.origin + '/new?slug=' + path);
};

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export default proxy;
