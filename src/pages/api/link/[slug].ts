import { NextApiRequest, NextApiResponse } from 'next';

import { getUrlBySlug } from '@/lib/notion';

const UrlBySlugHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ message: 'Missing slug' });
    }

    const url = await getUrlBySlug(slug as string);

    if (!url?.pageId) {
      return res.status(404).json({ message: 'Not found' });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pageId: _, ...sanitizedUrl } = url;

    res.status(200).json(sanitizedUrl);
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};

export default UrlBySlugHandler;
