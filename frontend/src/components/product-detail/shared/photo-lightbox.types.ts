export interface IPhotoLightboxProps {
  images: { src: string }[];
  name: string;
  index: number;
  onIndexChange: (index: number) => void;
  /** The parent unmounts the lightbox and puts focus back where it came from. */
  onClose: () => void;
}
