import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CompStudy - Study Timer & Focus App',
    short_name: 'CompStudy',
    description: 'Free online study timer with Pomodoro technique, live study rooms, and productivity tracking',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['education', 'productivity', 'lifestyle'],
    orientation: 'portrait-primary',
    lang: 'en',
  }
}
