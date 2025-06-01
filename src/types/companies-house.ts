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

export interface Address {
  premises?: string;
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  region?: string;
  country?: string;
  postal_code?: string;
}

export interface Accounts {
  last_accounts?: {
    made_up_to?: string;
    type?: string;
  };
  next_accounts?: {
    due_on?: string;
  };
}

export interface ConfirmationStatement {
  last_made_up_to?: string;
  next_due?: string;
}

export interface CompanyProfile {
  company_name: string;
  company_number: string;
  company_status: string;
  company_status_detail?: string;
  date_of_creation: string;
  date_of_dissolution?: string;
  type?: string;
  jurisdiction?: string;
  registered_office_address?: Address;
  accounts?: Accounts;
  confirmation_statement?: ConfirmationStatement;
  annual_return?: ConfirmationStatement;
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
  transaction_id: string;
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

export interface Officer {
  name: string;
  officer_role: string;
  appointed_on: string;
  resigned_on?: string;
  nationality?: string;
  occupation?: string;
  address?: Address;
}

export interface OfficersList {
  items: Officer[];
  total_results: number;
  active_count?: number;
  resigned_count?: number;
  start_index: number;
  items_per_page: number;
}

export interface FilingHistoryList {
  items: FilingHistoryItem[];
  total_count: number;
  start_index: number;
  items_per_page: number;
} 