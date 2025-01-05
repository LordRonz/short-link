import { getIronSession } from 'iron-session';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import Login from '@/components/pages/login';
import { generateSeoMetadata } from '@/lib/generate-seo-metadata';
import { sessionOptions } from '@/lib/session';
import { IronSessionData } from '@/types/iron-session';

export const generateMetadata = (): Metadata => {
  return {
    ...generateSeoMetadata({ templateTitle: 'Login' }),
  };
};

async function getSession() {
  const session = await getIronSession<IronSessionData>(
    await cookies(),
    sessionOptions,
  );

  return session;
}

const Page = async () => {
  const session = await getSession();

  if (session?.user) {
    redirect('/new');
  }

  return <Login />;
};

export default Page;
