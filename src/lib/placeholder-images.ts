import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  name?: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;
export const ProductPlaceHolderImages: ImagePlaceholder[] = data.productImages;
export const CategoryImages: ImagePlaceholder[] = data.categoryImages;
