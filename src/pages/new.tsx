import axios from 'axios';
import type { NextPage } from 'next';
import Image from 'next/image';
import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

import Button from '@/components/buttons/Button';
import ArrowLink from '@/components/links/ArrowLink';
import Seo from '@/components/Seo';

import shouko from '../../public/images/nishimiya_shouko.jpg';

const toastStyle = { background: '#333', color: '#eee' };

const NewLinkPage: NextPage = () => {
  const [slug, setSlug] = useState<string>('');
  const [link, setLink] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    toast.promise(
      axios.post('/api/new', {
        slug,
        link,
      }),
      {
        loading: 'Loading...',
        success: () => {
          return 'Success !, new link created!';
        },
        error: (e) => {
          if (axios.isAxiosError(e)) {
            return e.response?.data.message ?? e.message;
          }
          return 'Failed to create new link!';
        },
      }
    );
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setSlug(e.target.value);
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setLink(e.target.value);
  };

  return (
    <>
      <Seo templateTitle='New Link' />
      <main>
        <section className='bg-black text-primary-50'>
          <div className='layout flex flex-col justify-center items-center min-h-screen text-center gap-y-12'>
            <div>
              <h1 className='text-4xl text-primary-300 mb-4'>New Link</h1>
              <Image
                src={shouko}
                alt='Shouko Nishimiya'
                width={100}
                height={100}
              />
            </div>
            <form onSubmit={handleSubmit}>
              <label htmlFor='slug'>Slug</label>
              <input
                type='text'
                name='slug'
                className='block p-2 border-2 rounded-lg border-primary-300 bg-gray-900 mb-4'
                onChange={handleSlugChange}
              />
              <label htmlFor='link'>Link</label>
              <input
                type='text'
                name='link'
                className='block p-2 border-2 rounded-lg border-primary-300 bg-gray-900 mb-4'
                onChange={handleLinkChange}
              />
              <div className='mt-2'>
                <Button type='submit'>Shorten!</Button>
              </div>
            </form>

            <p className='text-xl text-primary-200'>
              <ArrowLink href='/' openNewTab={false} direction='left'>
                Back To Home
              </ArrowLink>
            </p>
          </div>
        </section>
      </main>
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

export default NewLinkPage;
