import clsx from 'clsx';
import * as React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import toast from 'react-hot-toast';
import { HiClipboard } from 'react-icons/hi';

import CustomLink from '@/components/links/CustomLink';
import trimHttps from '@/lib/trimHttp';

type CopyBoxProps = {
  link: string;
} & React.ComponentPropsWithoutRef<'div'>;

const CopyBox = ({ className, link, ...rest }: CopyBoxProps) => {
  return (
    <div
      className={clsx(
        'flex gap-2 items-center p-2 pl-4 max-w-sm rounded border border-gray-600',
        className
      )}
      {...rest}
    >
      <div className='flex-grow text-left'>
        <CustomLink href={link} className='text-lg'>
          {trimHttps(link)}
        </CustomLink>
      </div>

      <CopyToClipboard
        text={link}
        onCopy={() => toast.success(`${trimHttps(link)} copied to clipboard`)}
      >
        <button className='p-2 rounded-full hover:text-primary-400 focus:ring focus:ring-primary-400 focus:outline-none'>
          <HiClipboard className='text-lg' />
        </button>
      </CopyToClipboard>
    </div>
  );
};

export default CopyBox;
