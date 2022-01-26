import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';

import { addLink, checkSlugIsTaken } from '@/lib/notion';

const NewLinkHandler = withIronSessionApiRoute(
  async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
      const user = req.session.user;

      if (!user || user?.admin !== true) {
        return res.status(401).send({ message: 'Unauthorized' });
      }

      const url = req.body as { link: string; slug: string };
      if (!url.link || !url.slug) {
        return res.status(400).json({
          message: 'Link and slug are required',
        });
      }

      const taken = await checkSlugIsTaken(url.slug);
      if (taken) {
        return res.status(409).json({
          message: 'Slug is already taken',
        });
      }

      await addLink(url.slug, url.link);

      res.status(201).send('OK');
    } else {
      res.status(405).json({ message: 'Method Not Allowed' });
    }
  },
  {
    cookieName: 'anjay_kue',
    password: process.env.COOKIE_PASS as string,
    // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
    },
  }
);

export default NewLinkHandler;
