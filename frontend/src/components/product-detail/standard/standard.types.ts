import type { StandardDetail } from './standard-detail';

export interface IStandardGalleryProps {
  images: StandardDetail['images'];
  name: string;
}

export interface IStandardBuyPanelProps {
  sizes: StandardDetail['sizes'];
  defaultSizeIndex: number;
}

export interface IStandardAccordionsProps {
  markdown: string;
}
