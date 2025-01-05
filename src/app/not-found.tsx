import type { Metadata } from 'next';

import NotFound from '@/components/pages/not-found';
import { generateSeoMetadata } from '@/lib/generate-seo-metadata';

export const generateMetadata = (): Metadata => {
  return {
    ...generateSeoMetadata({ templateTitle: 'Not Found' }),
  };
};

const Page = async () => {
  return <NotFound />;
};

export default Page;
