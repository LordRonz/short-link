import { incrementLinkCount, type Url } from '@/lib/notion';

export async function POST(req: Request) {
  const url: Url = await req.json();
  if (!url.pageId) {
    throw Error('pageId not sent through body');
  }
  await incrementLinkCount(url);
  
  return new Response('Incremented link count');
}
