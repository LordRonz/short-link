'use client';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { Toaster } from 'react-hot-toast';
import { HiCursorClick } from 'react-icons/hi';

import Accent from '@/components/Accent';
import CopyBox from '@/components/container/CopyBox';
import QRCode from '@/components/container/QRCode';
import Favicon from '@/components/Favicon';
import ArrowLink from '@/components/links/ArrowLink';
import PrimaryLink from '@/components/links/CustomLink';
import Skeleton from '@/components/Skeleton';
import { toastStyle } from '@/constant/toast';
import useRQWithToast from '@/hooks/toast/useRQWithToast';
import type { Url } from '@/lib/notion';
import trimHttps from '@/lib/trimHttp';

const DetailPage = ({ slug }: { slug: string }) => {
  //#region  //*=========== Get Route Param ===========
  const idParam = slug;
  //#endregion  //*======== Get Route Param ===========

  //#region  //*=========== Link ===========
  const [link, setLink] = React.useState<string>();

  React.useEffect(() => {
    const origin = trimHttps(window.location.href).replace('/detail', '');
    setLink(origin);
  }, [idParam]);
  //#endregion  //*======== Link ===========

  //#region  //*=========== Get Url Data ===========
  const { data: url } = useRQWithToast(
    useQuery<Url, Error>({ queryKey: [`/api/link/${idParam}`] }),
    {
      loading: 'Fetching url details...',
      success: 'Url detail fetched successfully',
    },
  );
  //#endregion  //*======== Get Url Data ===========

  return (
    <>
      <section className=''>
        <div className='layout flex flex-col justify-center items-center py-20 min-h-screen'>
          <h1 className='h0'>
            <Accent>Link Details</Accent>
          </h1>

          {link ? (
            <QRCode link={link} className='mt-8' />
          ) : (
            <Skeleton className='mt-8 w-64 h-64' />
          )}

          {link ? (
            <CopyBox link={link} className='mt-8' />
          ) : (
            <Skeleton className='mt-8 w-72 h-14 rounded' />
          )}

          <div className='mt-6'>
            <h2 className='h4'>Detail</h2>
            <div className='flex gap-4 items-center mt-2'>
              {url?.link ? (
                <Favicon fullUrl={url.link} />
              ) : (
                <Skeleton className='w-5 h-5' />
              )}
              <div className='w-full max-w-sm font-medium text-gray-300 break-all'>
                {url?.link ? url.link : <Skeleton className='w-64 h-5' />}
              </div>
            </div>
            <div className='flex gap-4 items-center mt-2'>
              <HiCursorClick className='w-5 h-5' />
              <span className='font-medium text-gray-300'>
                {url?.count ?? '—'} click{(url?.count ?? 0) > 1 && 's'}
              </span>
            </div>
          </div>

          <ArrowLink href='/new' className='mt-8' as={PrimaryLink}>
            <Accent>Shorten another</Accent>
          </ArrowLink>
        </div>
      </section>
      <Toaster
        toastOptions={{
          style: toastStyle,
          loading: {
            iconTheme: {
              primary: '#eb2754',
              secondary: 'black',
            },
          },
        }}
      />
    </>
  );
};

export default DetailPage;
