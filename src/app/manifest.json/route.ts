import type { MetadataRoute } from 'next'
import { brand } from '@/lib/brand'

export async function GET() {
  return Response.json({
    name: brand.appLongName,
    short_name: brand.appShortName,
    description: brand.description,
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#000000',
    scope: '/',
    lang: 'hu',
    categories: ['productivity', 'business'],
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon'
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ],
    shortcuts: [
      {
        name: 'New Break',
        short_name: 'New Break',
        description: 'Create a new break entry',
        url: '/my-account/breaks/new'
      },
      {
        name: 'My Breaks',
        short_name: 'My Breaks',
        description: 'View your break entries',
        url: '/my-account/breaks'
      }
    ]
  } as MetadataRoute.Manifest)
}