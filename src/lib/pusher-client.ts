import PusherClient from 'pusher-js';

// Client-side Pusher instance factory
export const getPusherClient = () => {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    console.warn('Pusher client configuration missing. Real-time sync disabled.');
    return null;
  }

  return new PusherClient(key, {
    cluster: cluster,
    authEndpoint: '/api/pusher/auth',
  });
};
