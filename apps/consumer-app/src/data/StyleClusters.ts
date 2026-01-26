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
        image: 'https://example.com/streetwear.jpg',
        centroid: randomVector(),
    },
    {
        id: 'dark_academia',
        name: 'Dark Academia',
        image: 'https://example.com/dark_academia.jpg',
        centroid: randomVector(),
    },
    {
        id: 'old_money',
        name: 'Old Money',
        image: 'https://example.com/old_money.jpg',
        centroid: randomVector(),
    },
    {
        id: 'minimalist',
        name: 'Minimalist',
        image: 'https://example.com/minimalist.jpg',
        centroid: randomVector(),
    },
    {
        id: 'boho',
        name: 'Boho Chic',
        image: 'https://example.com/boho.jpg',
        centroid: randomVector(),
    },
];
