import withPWA from '@ducanh2912/next-pwa';

const config = {
  reactStrictMode: true,
};

export default withPWA({
  dest: 'public',
  register: true,
  // Configuración adicional de PWA
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  }
})(config);
