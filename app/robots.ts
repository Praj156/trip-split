import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/m/', '/dashboard', '/wizard', '/profile', '/auth/'] },
  };
}
