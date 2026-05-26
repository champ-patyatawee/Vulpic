export interface GalleryImage {
  id: string;
  name: string;
  path: string;
  dataUrl: string; // base64 thumbnail
  width: number;
  height: number;
  createdAt: number;
}

export interface EditedImage {
  id: string;
  sourceImageId?: string;
  prompt: string;
  modelId: string;
  dataUrl: string;
  createdAt: number;
}
