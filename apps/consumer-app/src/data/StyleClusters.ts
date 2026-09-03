import { Vector384 } from '@app/core';

export interface StyleClusterData {
  id: string;
  name: string;
  image: string;
  centroid: Vector384;
}

// Helper to generate random 384-dim vector
const randomVector = (): Vector384 => Array.from({ length: 384 }, () => Math.random() - 0.5);

export const STYLE_CLUSTERS: StyleClusterData[] = [
  {
    id: 'streetwear',
    name: 'Streetwear',
    image: 'https://placehold.co/400x500/CD0268/FFFFFF?text=Streetwear',
    centroid: randomVector(),
  },
  {
    id: 'dark_academia',
    name: 'Dark Academia',
    image: 'https://placehold.co/400x500/212739/FFFFFF?text=Dark+Academia',
    centroid: randomVector(),
  },
  {
    id: 'old_money',
    name: 'Old Money',
    image: 'https://placehold.co/400x500/34889E/FFFFFF?text=Old+Money',
    centroid: randomVector(),
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    image: 'https://placehold.co/400x500/F8F9FA/212739?text=Minimalist',
    centroid: randomVector(),
  },
  {
    id: 'boho',
    name: 'Boho Chic',
    image: 'https://placehold.co/400x500/E8338A/FFFFFF?text=Boho+Chic',
    centroid: randomVector(),
  },
  {
    id: 'athleisure',
    name: 'Athleisure',
    image: 'https://placehold.co/400x500/10B981/FFFFFF?text=Athleisure',
    centroid: randomVector(),
  },
  {
    id: 'y2k',
    name: 'Y2K',
    image: 'https://placehold.co/400x500/F59E0B/FFFFFF?text=Y2K',
    centroid: randomVector(),
  },
  {
    id: 'cottagecore',
    name: 'Cottagecore',
    image: 'https://placehold.co/400x500/60A5FA/FFFFFF?text=Cottagecore',
    centroid: randomVector(),
  },
  {
    id: 'smart_casual',
    name: 'Smart Casual',
    image: 'https://placehold.co/400x500/6C757D/FFFFFF?text=Smart+Casual',
    centroid: randomVector(),
  },
  {
    id: 'luxe',
    name: 'Luxe',
    image: 'https://placehold.co/400x500/212739/CD0268?text=Luxe',
    centroid: randomVector(),
  },
];
