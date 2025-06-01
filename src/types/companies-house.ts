// Companies House API TypeScript interfaces
// This will be implemented in Task 3

import { Resource } from "@companieshouse/api-sdk-node";

export interface ApiClient {
  search: {
    companies(options: CompanySearchOptions): Promise<Resource<CompanySearchResponse>>;
  };
  company: {
    getProfile(number: string): Promise<Resource<ApiCompanyProfile>>;
  };
}

export interface CompanySearchOptions {
  q: string;
  items_per_page?: number;
  start_index?: number;
}

export interface ApiCompanyProfile {
  company_number: string;
  company_name: string;
  company_status: string;
  type: string;
  date_of_creation: string;
  registered_office_address?: {
    premises?: string;
    address_line_1?: string;
    postal_code?: string;
    locality?: string;
    region?: string;
    country?: string;
  };
  accounts?: {
    next_due?: string;
    next_made_up_to?: string;
    overdue?: boolean;
  };
  confirmation_statement?: {
    next_due?: string;
    next_made_up_to?: string;
    overdue?: boolean;
  };
}

export interface CompanyProfile {
  companyNumber: string;
  companyName: string;
  companyStatus: string;
  type: string;
  dateOfCreation: string;
  registeredOfficeAddress?: {
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
  } | undefined;
  confirmationStatement?: {
    nextDue?: string;
    nextMadeUpTo?: string;
    overdue?: boolean;
  } | undefined;
}

// Companies House API response types
// These will be expanded in Task 3 with the full API wrapper

export interface CompanySearchResult {
  companyNumber: string;
  title: string;
  companyStatus: string;
  companyType: string;
  dateOfCreation: string;
  address?: {
    line1?: string;
    line2?: string;
    postalCode?: string;
    locality?: string;
    region?: string;
    country?: string;
  } | undefined;
}

export interface CompanySearchResponse {
  items: Array<{
    company_number: string;
    title: string;
    company_status: string;
    type: string;
    date_of_creation?: string;
    address?: {
      premises?: string;
      address_line_1?: string;
      postal_code?: string;
      locality?: string;
      region?: string;
      country?: string;
    };
  }>;
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