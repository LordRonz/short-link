'use client';

import {
  QueryClient,
  QueryClientProvider,
  type QueryOptions,
} from '@tanstack/react-query';
import axios from 'axios';

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

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <main>{children}</main>
    </QueryClientProvider>
  );
};

export default ClientLayout;
