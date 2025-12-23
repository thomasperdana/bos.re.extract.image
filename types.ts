
export interface PropertyImage {
  url: string;
  description: string;
}

export interface PropertyDetails {
  address: string;
  price?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  images: PropertyImage[];
}

export interface ExtractionResult {
  property: PropertyDetails;
  sources: Array<{ title: string; uri: string }>;
}
