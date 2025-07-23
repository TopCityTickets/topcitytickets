// filepath: topcitytickets/src/types/index.ts
export interface FormData {
  businessName: string;
  businessType: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
}