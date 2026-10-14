import type { StandardDetail } from './standard-detail';

export interface IStandardGalleryProps {
  images: StandardDetail['images'];
  name: string;
}

export interface IStandardBuyPanelProps {
  documentId: string;
  slug: string;
  sizes: StandardDetail['sizes'];
  defaultSizeIndex: number;
}

export interface IStandardAccordionsProps {
  markdown: string;
}
