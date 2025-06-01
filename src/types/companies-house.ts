// Companies House API TypeScript interfaces
// This will be implemented in Task 3

export interface CompanyProfile {
  // Placeholder - implementation coming in next task
  company_number: string;
  company_name: string;
  company_status: string;
  company_type: string;
  date_of_creation: string;
  registered_office_address: {
    line_1?: string;
    line_2?: string;
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

// Companies House API response types
// These will be expanded in Task 3 with the full API wrapper

export interface CompanySearchResult {
  company_number: string;
  title: string;
  company_status: string;
  company_type: string;
  date_of_creation?: string;
  address?: {
    line_1?: string;
    line_2?: string;
    postal_code?: string;
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
  officer_role: string;
  appointed_on?: string;
  resigned_on?: string;
  address?: any;
}

export interface FilingHistoryItem {
  transaction_id: string;
  description: string;
  category: string;
  date: string;
  type: string;
}

export interface CompanyCharge {
  id: string;
  charge_number?: number;
  description?: string;
  status: string;
  created_on?: string;
  delivered_on?: string;
}

export interface PersonWithSignificantControl {
  name: string;
  kind: string;
  notified_on?: string;
  natures_of_control?: string[];
  address?: any;
} 