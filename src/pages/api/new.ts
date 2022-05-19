import { withIronSessionApiRoute } from 'iron-session/next';
import type { NextApiRequest, NextApiResponse } from 'next';

import { addLink, checkSlugIsTaken } from '@/lib/notion';

const linkRegex =
  /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;

const slugRegex = /^\S{1,30}$/;

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

      if (!slugRegex.test(url.slug)) {
        return res.status(400).json({
          message: 'Please input a valid slug',
        });
      }

      if (!linkRegex.test(url.link)) {
        return res.status(400).json({
          message: 'Please input a valid link',
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
