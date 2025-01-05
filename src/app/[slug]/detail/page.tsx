import type { Metadata } from 'next';

import DetailPage from '@/components/pages/detail';
import { generateSeoMetadata } from '@/lib/generate-seo-metadata';

export const generateMetadata = (): Metadata => {
  return {
    ...generateSeoMetadata({ templateTitle: 'Detail' }),
  };
};

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const slug = (await params).slug;

  return <DetailPage slug={slug} />;
};

export default Page;
