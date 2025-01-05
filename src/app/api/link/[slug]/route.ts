import httpStatus from 'http-status';

import { getUrlBySlug } from '@/lib/notion';

export const revalidate = 10;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const slug = (await params).slug; // 'a', 'b', or 'c'

  if (!slug) {
    return Response.json(
      { message: 'Missing slug' },
      {
        status: httpStatus.BAD_REQUEST,
      },
    );
  }

  const url = await getUrlBySlug(slug as string);

  if (!url?.pageId) {
    return Response.json(
      { message: 'Not found' },
      {
        status: httpStatus.NOT_FOUND,
      },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { pageId: _, ...sanitizedUrl } = url;

  return Response.json(sanitizedUrl);
}
