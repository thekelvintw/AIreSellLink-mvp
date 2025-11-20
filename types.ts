export interface Candidate {
  label: string;
}

export interface Contact {
  type: 'LINE' | 'IG' | 'Email' | '';
  value: string;
}

export interface ListingDraft {
  originalImage?: {
    file: File;
    base64: string;
  };
  candidates?: string[];
  selectedLabel?: string;
  officialUrl?: string | null;
  enhancedImageUrl?: string;
  copy?: { brandStyle: string; resaleStyle: string };
  selectedCopyStyle?: 'brandStyle' | 'resaleStyle';
  priceHint?: { min: number; max: number };
  price?: number;
  nickname?: string;
  contact?: Contact;
  shareSlug?: string;
}