import { NextApiRequest, NextApiResponse } from 'next';

import type { Url } from '@/lib/notion';
import { incrementLinkCount } from '@/lib/notion';

export const runtime = 'edge';

const increment = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const url = req.body as Url;

    if (!url.pageId) {
      throw Error('pageId not sent through body');
    }

    await incrementLinkCount(url);

    res.status(200).send('OK');
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};

export default increment;
