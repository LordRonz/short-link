// pages/api/login.ts

import { compare } from 'bcrypt';
import httpStatus from 'http-status';
import { withIronSessionApiRoute } from 'iron-session/next';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getUser } from '@/lib/fauna';

declare module 'iron-session' {
  interface IronSessionData {
    user?: {
      id: number;
      name: string;
      admin?: boolean;
    };
  }
}

export type UserSession = {
  id: number;
  name: string;
  admin?: boolean;
};

export type LoginResponse = {
  message?: string;
  status?: number;
  ok?: boolean;
};

export default withIronSessionApiRoute(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const { method } = req;

    switch (method) {
      case 'POST': {
        const data = await getUser(req.body);

        if (!data || !(await compare(req.body.password, data.data.password))) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: httpStatus.BAD_REQUEST,
            message: 'Name or password are invalid, who tf are u',
          });
        }

        req.session.user = {
          id: data.ts,
          name: data.data.name,
          admin: data.data.admin,
        };
        await req.session.save();
        res.send({ ok: true });
        break;
      }
      default:
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
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
