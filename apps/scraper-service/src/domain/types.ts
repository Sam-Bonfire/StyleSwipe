export interface ScrapedProduct {
  myntraId: string;
  title: string;
  brand: string;
  price: number;
  mrp: number;
  discount: number;
  images: string[];
  sizes: string[];
  description: string;
  materials: Record<string, string>;
  rating: number;
  reviewCount: number;
  url: string;
  status: 'active' | 'out_of_stock';
}

export interface MyntraInitialData {
  pdpData: {
    id: number;
    name: string;
    brand: { name: string };
    price: { discounted: number; mrp: number };
    media: { albums: { images: { src: string }[] }[] };
    sizes: { label: string; available: boolean }[];
    descriptors: { description: string }[];
    ratings: { averageRating: number; totalCount: number };
  };
}
