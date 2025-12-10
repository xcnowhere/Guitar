export interface GuitarModel {
  id: string;
  name: string;
  brand: 'Fender' | 'Gibson';
  description?: string;
  imageUrl?: string;
}

export interface NodeData {
  id: string;
  label: string;
  type: 'root' | 'brand' | 'model';
  brand?: 'Fender' | 'Gibson';
  children?: NodeData[];
  data?: GuitarModel;
}

export interface GeneratedContent {
  text: string;
  imageUrl?: string;
}