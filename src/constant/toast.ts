import type { AxiosError } from 'axios';
import axios from 'axios';

export const DEFAULT_TOAST_MESSAGE = {
  loading: 'Loading...',
  success: () => {
    return 'Logged in !, guten morgen sir!';
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (e: Error | AxiosError<{ message: string }>) => {
    if (axios.isAxiosError(e)) {
      return e.response?.data.message ?? e.message;
    }
    return 'Login failed, who tf are you';
  },
};

export const toastStyle = { background: '#333', color: '#eee' };
