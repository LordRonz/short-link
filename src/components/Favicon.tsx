import clsx from 'clsx';

import type { NextImageProps } from '@/components/NextImage';
import NextImage from '@/components/NextImage';

type FaviconProps = {
  fullUrl: string;
} & Omit<NextImageProps, 'src' | 'alt' | 'width' | 'height'>;

const Favicon = ({ className, fullUrl, ...rest }: FaviconProps) => {
  const FAVICON_URL = 'https://icons.duckduckgo.com/ip3/';
  const { hostname } = new URL(fullUrl);

  const src = FAVICON_URL + hostname + '.ico';

  return (
    <NextImage
      src={src}
      alt={`${hostname} favicon`}
      width='20'
      height='20'
      className={clsx('', className)}
      {...rest}
    />
  );
};

export default Favicon;
