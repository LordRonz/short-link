import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getUrlBySlug } from '@/lib/notion';

const middleware = async (req: NextRequest) => {
  const path = req.nextUrl.pathname.split('/')[1];
  const whitelist = ['favicons', 'fonts', 'images', 'svg', '', 'login', 'new'];
  if (whitelist.includes(path)) {
    return;
  }

  const url = await getUrlBySlug(path);

  /** Don't redirect if /:slug/detail */
  const isDetailPage = req.nextUrl.pathname.split('/')[2] === 'detail';
  if (isDetailPage) {
    return url.link ? NextResponse.redirect('/new?slug=' + path) : undefined;
  }

  if (url.link) {
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

    return NextResponse.redirect(url.link);
  }
};

export default middleware;