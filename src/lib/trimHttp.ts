const trimHttps = (url: string) => {
  return url.replace(/^https?:\/\//, '');
};

export default trimHttps;
