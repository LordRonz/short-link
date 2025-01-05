export const sessionOptions = {
  cookieName: 'anjay_kue',
  password: process.env.COOKIE_PASS as string,
  // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};
