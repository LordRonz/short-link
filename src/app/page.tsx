import type { Metadata } from 'next';

import { getSocialTreeAction } from '@/actions/notion';
import { Home } from '@/components/pages/home';
import { generateSeoMetadata } from '@/lib/generate-seo-metadata';

export const generateMetadata = (): Metadata => {
  return {
    ...generateSeoMetadata(),
  };
};

export const revalidate = 30;

const Page = async () => {
  const urls = await getSocialTreeAction();

  return <Home urls={urls} />;
};

export default Page;
