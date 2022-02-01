import '@/styles/globals.css';

import axios from 'axios';
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider, QueryOptions } from 'react-query';

const defaultQueryFn = async ({ queryKey }: QueryOptions) => {
  const { data } = await axios.get(`${queryKey?.[0]}`);
  return data;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
    },
  },
});

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute='class' defaultTheme='dark' enableSystem={false}>
        <Component {...pageProps} />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default MyApp;
