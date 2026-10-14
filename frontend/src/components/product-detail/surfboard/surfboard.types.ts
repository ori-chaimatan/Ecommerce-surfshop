import type { SurfboardDetail } from './surfboard-detail';

export interface ISurfboardDetailProps {
  detail: SurfboardDetail;
}

export interface ISurfboardGalleryProps {
  images: SurfboardDetail['images'];
  name: string;
}

export interface ISurfboardBuyPanelProps {
  documentId: string;
  slug: string;
  price: string;
  sizes: SurfboardDetail['sizes'];
  defaultSizeIndex: number;
}
