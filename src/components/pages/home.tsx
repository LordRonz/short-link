/** eslint-disable @next/next/no-img-element */
import clsx from 'clsx';

import Accent from '@/components/Accent';
import CustomLink from '@/components/links/CustomLink';
import { Tree } from '@/lib/notion';

export const Home = ({ urls }: { urls: Tree[] }) => {
  return (
    <section className='bg-black text-primary-50'>
      <div className='layout flex flex-col justify-center items-center py-20 min-h-screen'>
        <h1 className='text-3xl md:text-7xl'>
          <Accent>Aaron{"'"}s link tree</Accent>
        </h1>
        <CustomLink href='/login' className='text-xl'>
          Login
        </CustomLink>
        <div className='grid gap-4 mx-auto mt-8 w-full max-w-sm text-center'>
          {urls.map(({ id, display, link, icon }) => (
            <div className='group relative' key={id}>
              <div
                className={clsx(
                  'opacity-0 group-hover:opacity-100',
                  'animate-tilt absolute -inset-0.5 z-0 rounded blur',
                  'bg-gradient-to-r from-rose-800 to-amber-700',
                  'transition duration-300 group-hover:duration-200',
                  'pointer-events-none',
                )}
              />

              <a
                href={link}
                className={clsx(
                  'flex relative gap-2 justify-center items-center',
                  'px-4 py-4 font-semibold transition-colors md:text-lg ',
                  'bg-dark',
                  'border border-gray-700',
                  'focus:outline-none focus-visible:ring focus-visible:ring-primary-500',
                )}
              >
                {icon &&
                  (icon.type === 'emoji' ? (
                    icon.emoji + ' '
                  ) : icon.type === 'external' ? (
                    <img
                      src={icon.external.url}
                      width={20}
                      height={20}
                      alt={`${display} Icon`}
                    />
                  ) : (
                    <img
                      src={icon.file.url}
                      width={20}
                      height={20}
                      alt={`${display} Icon`}
                    />
                  ))}
                {display}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
