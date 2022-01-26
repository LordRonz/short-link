/* eslint-disable @next/next/no-img-element */
import type { NextPage } from 'next';

import CustomLink from '@/components/links/CustomLink';
import Seo from '@/components/Seo';

const Home: NextPage = () => {
  return (
    <>
      <Seo />
      <main>
        <section className='bg-black text-primary-50'>
          <div className='layout flex flex-col justify-center items-center min-h-screen text-center'>
            <h1>Link Shortener with Notion API</h1>
            <CustomLink href='/login'>Login</CustomLink>

            <footer className='absolute bottom-2'>
              © Aaron Christopher {new Date().getFullYear()}
            </footer>
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;
