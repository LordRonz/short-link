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

const middleware: NextMiddleware = async (
  req: NextRequest,
  event: NextFetchEvent
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
  const cachedUrlStep2 = cachedUrl ?? (await kv.get(path));
  const url = cachedUrlStep2 ?? (await getUrlBySlug(path));

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
          await incrementLinkCount(url);
          if (!cachedUrlStep2) {
            await kv.set(path, url, { ex: 60 * 60 * 24 });
          }
        })()
      );
    }

    if (!cachedRawUrl) {
      slugMap.set(path, JSON.stringify(url));
    }

    return NextResponse.redirect(url.link + req.nextUrl.search);
  }

  return NextResponse.redirect(baseUrl.origin + '/new?slug=' + path);
};

export default middleware;
