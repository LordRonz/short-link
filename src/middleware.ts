import type { NextMiddleware, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getUrlBySlug } from '@/lib/notion';

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

const middleware: NextMiddleware = async (req: NextRequest) => {
  const path = req.nextUrl.pathname.split('/')[1];
  const baseUrl = req.nextUrl.clone();
  if (whitelist.includes(path) || process.env.CI) {
    return;
  }
  const url = await getUrlBySlug(path);

  /** Don't redirect if /:slug/detail */
  const isDetailPage = req.nextUrl.pathname.split('/')[2] === 'detail';
  if (isDetailPage) {
    return url?.link
      ? undefined
      : NextResponse.redirect(baseUrl.origin + '/new?slug=' + path);
  }

  if (url?.link) {
    if (isProd) {
      try {
        // using fetch because edge function won't allow patch request
        await fetch(req.nextUrl.origin + '/api/increment', {
          method: 'POST',
          body: JSON.stringify(url),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('/api/increment:', { error });
      }
    }

    return NextResponse.redirect(url.link + req.nextUrl.search);
  }

  return NextResponse.redirect(baseUrl.origin + '/new?slug=' + path);
};

export default middleware;
