export type FilterType = 'none' | 'blur' | 'pixelate';

export interface ImageState {
  path: string;
  url: string;
  // offset within the column (for panning/cropping)
  x: number;
  y: number;
  scale: number;
}

export interface FilterState {
  type: FilterType;
  blurRadius: number;  // 1–80
  pixelSize: number;   // 2–60
}

export interface ColumnState {
  id: string;
  /** Fraction of total width (all columns must sum to 1) */
  widthRatio: number;
  image: ImageState | null;
  filter: FilterState;
}
