/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        TAXJAR_API_KEY: process.env.TAXJAR_API_KEY,
    },
    // Silence warnings
    // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
    webpack: (config) => {
      config.externals.push('pino-pretty', 'lokijs', 'encoding');
      return config;
    },
    async headers() {
        return [
            {
                // Allow webhook endpoint to receive requests
                source: '/api/webhook',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type, x-cc-webhook-signature' },
                ],
            },
        ]
    },
};
  
export default nextConfig;
  