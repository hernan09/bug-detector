import withPWA from '@ducanh2912/next-pwa';

const config = {
  reactStrictMode: true,
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})(config);
