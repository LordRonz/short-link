import { getIronSession } from 'iron-session';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import NewLinkPage from '@/components/pages/new';
import { generateSeoMetadata } from '@/lib/generate-seo-metadata';
import { sessionOptions } from '@/lib/session';
import { IronSessionData } from '@/types/iron-session';

export const generateMetadata = (): Metadata => {
  return {
    ...generateSeoMetadata({ templateTitle: 'New Link' }),
  };
};

async function getSession() {
  const session = await getIronSession<IronSessionData>(
    await cookies(),
    sessionOptions,
  );

  return session;
}

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>;
}) => {
  const session = await getSession();

  if (!session?.user || session.user?.admin !== true) {
    redirect('/login');
  }

  return <NewLinkPage paramSlug={(await searchParams).slug} />;
};

export default Page;
