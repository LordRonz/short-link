import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { sessionOptions } from '@/lib/session';
import type { IronSessionData } from '@/types/iron-session';

export async function DELETE() {
  const session = await getIronSession<IronSessionData>(
    await cookies(),
    sessionOptions,
  );

  session.destroy();
  return Response.json({ ok: true });
}
