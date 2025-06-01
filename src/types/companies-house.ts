// Companies House API TypeScript interfaces
// This will be implemented in Task 3

export interface CompanyProfile {
  companyNumber: string;
  companyName: string;
  companyStatus: string;
  type: string;
  dateOfCreation: string;
  registeredOfficeAddress: {
    line1?: string;
    line2?: string;
    postalCode?: string;
    locality?: string;
    region?: string;
    country?: string;
  };
  accounts?: {
    nextDue?: string;
    nextMadeUpTo?: string;
    overdue?: boolean;
  };
  confirmationStatement?: {
    nextDue?: string;
    nextMadeUpTo?: string;
    overdue?: boolean;
  };
}

// Companies House API response types
// These will be expanded in Task 3 with the full API wrapper

export interface CompanySearchResult {
  companyNumber: string;
  title: string;
  companyStatus: string;
  companyType: string;
  dateOfCreation?: string;
  address?: {
    line1?: string;
    line2?: string;
    postalCode?: string;
    locality?: string;
    region?: string;
    country?: string;
  };
}

export interface CompanySearchResponse {
  items: CompanySearchResult[];
  total_results: number;
  items_per_page: number;
  page_number: number;
}

// Placeholder interfaces for other API endpoints
export interface CompanyOfficer {
  name: string;
  role: string;
  appointedOn: string;
  resignedOn?: string;
  nationality?: string;
  occupation?: string;
  address?: {
    line1?: string;
    line2?: string;
    postalCode?: string;
    locality?: string;
    region?: string;
    country?: string;
  };
}

export interface FilingHistoryItem {
  transactionId: string;
  category: string;
  description: string;
  date: string;
  type: string;
  pages?: number;
  barcode?: string;
  status?: string;
}

export interface CompanyCharge {
  chargeId: string;
  classification: {
    type: string;
    description: string;
  };
  status: string;
  createdOn: string;
  deliveredOn: string;
  satisfiedOn?: string;
  particulars?: string;
  securedAmount?: string;
}

export interface PersonWithSignificantControl {
  name: string;
  notifiedOn: string;
  ceasedOn?: string;
  natureOfControl: string[];
  countryOfResidence?: string;
  nationality?: string;
  address?: {
    line1?: string;
    line2?: string;
    postalCode?: string;
    locality?: string;
    region?: string;
    country?: string;
  };
} 