import { compare } from 'bcrypt';
import httpStatus from 'http-status';
import { getIronSession } from 'iron-session';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { getUser } from '@/lib/fauna';
import { sessionOptions } from '@/lib/session';
import type { IronSessionData } from '@/types/iron-session';

export async function POST(req: Request) {
  const session = await getIronSession<IronSessionData>(
    await cookies(),
    sessionOptions,
  );

  const body = (await req.json()) as { name: string; password: string };

  const data = await getUser(body);

  if (!data || !(await compare(body.password, data.data.password))) {
    return Response.json(
      {
        status: httpStatus.BAD_REQUEST,
        message: 'Name or password are invalid, who tf are u',
      },
      {
        status: httpStatus.BAD_REQUEST,
      },
    );
  }

  session.user = {
    id: data.ts,
    name: data.data.name,
    admin: data.data.admin,
  };
  await session.save();
  revalidatePath('/login');
  return Response.json({ ok: true });
}
