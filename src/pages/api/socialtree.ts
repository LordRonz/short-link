import { NextApiRequest, NextApiResponse } from 'next';

import { getSocialTree } from '@/lib/notion';

export const runtime = 'edge';

const SocialTreeHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const tree = await getSocialTree();

    res.status(200).json({ tree });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};

export default SocialTreeHandler;
