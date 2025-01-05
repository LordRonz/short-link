import httpStatus from 'http-status';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { addLink, checkSlugIsTaken } from '@/lib/notion';
import { sessionOptions } from '@/lib/session';
import type { IronSessionData } from '@/types/iron-session';

const linkRegex =
  /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;

const slugRegex = /^\S{1,30}$/;

export async function POST(req: Request) {
  const session = await getIronSession<IronSessionData>(
    await cookies(),
    sessionOptions,
  );

  const { user } = session;

  if (!user || user?.admin !== true) {
    return Response.json(
      { message: 'Unauthorized' },
      {
        status: httpStatus.UNAUTHORIZED,
      },
    );
  }

  const url = (await req.json()) as { link: string; slug: string };
  if (!url.link || !url.slug) {
    return Response.json(
      { message: 'Link and slug are required' },
      {
        status: httpStatus.BAD_REQUEST,
      },
    );
  }

  if (!slugRegex.test(url.slug)) {
    return Response.json(
      { message: 'Please input a valid slug' },
      {
        status: httpStatus.BAD_REQUEST,
      },
    );
  }

  if (!linkRegex.test(url.link)) {
    return Response.json(
      { message: 'Please input a valid link' },
      {
        status: httpStatus.BAD_REQUEST,
      },
    );
  }

  const taken = await checkSlugIsTaken(url.slug);
  if (taken) {
    return Response.json(
      { message: 'Slug is already taken' },
      {
        status: httpStatus.BAD_REQUEST,
      },
    );
  }

  await addLink(url.slug, url.link);

  await session.save();

  return Response.json({ ok: true });
}
