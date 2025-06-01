# Companies House API & SDK Reference

## Overview

The UK Companies House Public Data API provides read-only access to public company information. This document covers the official Node.js SDK and relevant API endpoints for our MCP server implementation.

## Official Node.js SDK

### Package Information
- **Package**: `@companieshouse/api-sdk-node`
- **Current Version**: 2.0.221 (updated regularly)
- **Repository**: https://github.com/companieshouse/api-sdk-node
- **Maintained by**: UK Government (Companies House)

### Authentication
```typescript
import { createApiClient } from "@companieshouse/api-sdk-node";

const apiClient = createApiClient("your-api-key");
```

### Basic Usage Pattern
```typescript
try {
  const response = await apiClient.companyProfile.getCompanyProfile("00006400");
  if (response.httpStatusCode === 200 && response.resource) {
    // Success - use response.resource
    console.log(response.resource.company_name);
  } else {
    // Handle non-200 responses
    console.error("API Error:", response.httpStatusCode);
  }
} catch (error) {
  // Handle network/parsing errors
  console.error("Request failed:", error.message);
}
```

## Core API Endpoints & SDK Methods

### 1. Company Search
**Endpoint**: `GET /search/companies`
**SDK Method**: `apiClient.search.companies(query, options)`

```typescript
interface SearchOptions {
  items_per_page?: number;  // Default: 20, Max: 100
  start_index?: number;     // For pagination, 0-based
  restrictions?: string;    // e.g., "active-companies"
}

// Example usage
const result = await apiClient.search.companies("acme", {
  items_per_page: 20,
  start_index: 0
});

// Response structure
interface SearchResponse {
  httpStatusCode: number;
  resource?: {
    items: CompanySearchItem[];
    total_results: number;
    start_index: number;
    items_per_page: number;
    kind: "search#companies";
  }
}

interface CompanySearchItem {
  title: string;              // Company name
  company_number: string;     // 8-character company number
  company_status: string;     // "active", "dissolved", etc.
  company_type: string;       // "ltd", "plc", "llp", etc.
  date_of_creation?: string;  // ISO date string
  registered_office_address?: Address;
  snippet?: string;           // Search result snippet
}
```

### 2. Company Profile
**Endpoint**: `GET /company/{company_number}`
**SDK Method**: `apiClient.companyProfile.getCompanyProfile(companyNumber)`

```typescript
// Example usage
const profile = await apiClient.companyProfile.getCompanyProfile("12345678");

// Response structure
interface CompanyProfile {
  company_name: string;
  company_number: string;
  company_status: string;           // "active", "dissolved", "liquidation"
  company_status_detail?: string;   // Additional status info
  date_of_creation: string;         // ISO date
  type: string;                     // Company type
  jurisdiction: string;             // Usually "england-wales"
  registered_office_address: Address;
  sic_codes?: string[];            // Standard Industrial Classification
  has_been_liquidated?: boolean;
  has_charges?: boolean;
  has_insolvency_history?: boolean;
  accounts?: {
    next_accounts?: {
      due_on: string;              // Next accounts due date
      overdue: boolean;
    };
    last_accounts?: {
      made_up_to: string;          // Last accounts period end
    };
    accounting_reference_date?: {
      day: string;
      month: string;
    };
  };
  confirmation_statement?: {
    next_due: string;              // Next confirmation statement due
    overdue: boolean;
    next_made_up_to: string;
  };
  links: {
    self: string;                  // API link to this company
    filing_history?: string;       // Link to filing history
    officers?: string;             // Link to officers
    charges?: string;              // Link to charges
  };
}

interface Address {
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;               // Town/city
  region?: string;                 // County/region
  postal_code?: string;
  country?: string;                // Usually "United Kingdom"
  care_of?: string;               // Care of address
  po_box?: string;
}
```

### 3. Company Officers
**Endpoint**: `GET /company/{company_number}/officers`
**SDK Method**: `apiClient.companyProfile.getCompanyOfficers(companyNumber, options)`

```typescript
interface OfficersOptions {
  items_per_page?: number;    // Default: 35, Max: 100
  start_index?: number;       // For pagination
  register_view?: boolean;    // Include register view
  register_type?: string;     // Type of register
  order_by?: string;         // "appointed_on", "resigned_on", "surname"
}

// Response structure
interface OfficersResponse {
  httpStatusCode: number;
  resource?: {
    items: Officer[];
    total_results: number;
    resigned_count: number;
    active_count: number;
    start_index: number;
    items_per_page: number;
    kind: "officer-list";
  }
}

interface Officer {
  name: string;                    // Full name
  officer_role: string;           // "director", "secretary", "llp-member"
  appointed_on: string;           // ISO date
  resigned_on?: string;           // ISO date if resigned
  address: Address;               // Service address
  date_of_birth?: {              // Directors only, partial info
    month: number;
    year: number;
  };
  nationality?: string;           // Directors only
  country_of_residence?: string;  // Directors only
  occupation?: string;            // Directors only
  former_names?: Array<{
    forenames?: string;
    surname?: string;
  }>;
  identification?: {              // Corporate officers
    identification_type: string;
    legal_authority: string;
    legal_form: string;
    place_registered: string;
    registration_number: string;
  };
  links: {
    officer?: {
      appointments: string;       // Link to all appointments
    };
  };
}
```

### 4. Filing History
**Endpoint**: `GET /company/{company_number}/filing-history`
**SDK Method**: `apiClient.companyProfile.getFilingHistory(companyNumber, options)`

```typescript
interface FilingHistoryOptions {
  items_per_page?: number;    // Default: 25, Max: 100
  start_index?: number;       // For pagination
  category?: string;          // Filter by category
}

// Common categories
type FilingCategory = 
  | "accounts"                  // Annual accounts
  | "annual-return"            // Annual returns (legacy)
  | "confirmation-statement"   // Confirmation statements
  | "incorporation"            // Incorporation documents
  | "capital"                  // Share capital changes
  | "officers"                 // Officer appointments/resignations
  | "mortgage"                 // Charges and mortgages
  | "miscellaneous"           // Other filings

// Response structure
interface FilingHistoryResponse {
  httpStatusCode: number;
  resource?: {
    items: Filing[];
    total_count: number;
    start_index: number;
    items_per_page: number;
    kind: "filing-history";
  }
}

interface Filing {
  category: FilingCategory;
  date: string;                    // Filing date (ISO)
  description: string;             // Human-readable description
  type: string;                   // Specific filing type code
  transaction_id: string;         // Unique filing identifier
  action_date?: string;           // When action took effect
  barcode?: string;               // Document barcode
  description_values?: {          // Template values for description
    [key: string]: string;
  };
  pages?: number;                 // Number of pages in document
  paper_filed?: boolean;          // Was filed on paper
  links?: {
    self: string;                 // Link to this filing
    document_metadata?: string;   // Link to document metadata
  };
  annotations?: Array<{
    annotation: string;
    category: string;
    date: string;
    description: string;
    type: string;
  }>;
  associated_filings?: Array<{
    category: string;
    date: string;
    description: string;
    type: string;
  }>;
}
```

### 5. Company Charges
**Endpoint**: `GET /company/{company_number}/charges`
**SDK Method**: `apiClient.companyProfile.getCharges(companyNumber, options)`

```typescript
interface ChargesOptions {
  items_per_page?: number;    // Default: 25, Max: 100
  start_index?: number;       // For pagination
}

// Response structure
interface ChargesResponse {
  httpStatusCode: number;
  resource?: {
    items: Charge[];
    total_count: number;
    unfiltered_count: number;
    part_satisfied_count: number;
    satisfied_count: number;
    start_index: number;
    items_per_page: number;
  }
}

interface Charge {
  charge_number?: number;
  charge_code?: string;
  classification?: {
    type: string;               // "charge-description"
    description: string;        // Human-readable type
  };
  status: string;              // "outstanding", "fully-satisfied", "part-satisfied"
  delivered_on: string;        // Date charge was registered
  created_on: string;          // Date charge was created
  satisfied_on?: string;       // Date charge was satisfied
  covering_instrument_date?: string;
  particulars?: string;        // Details of what is charged
  secured_details?: {
    type: string;              // Type of security
    description: string;       // Description of security
  };
  scottish_alterations?: {
    has_alterations: boolean;
    has_restrictive_provisions: boolean;
  };
  more_than_four_persons_entitled?: boolean;
  persons_entitled?: Array<{
    name: string;
  }>;
  transactions?: Array<{
    delivered_on: string;
    filing_type: string;
    links: {
      filing: string;
    };
  }>;
  links: {
    self: string;
  };
}
```

### 6. Persons with Significant Control (PSCs)
**Endpoint**: `GET /company/{company_number}/persons-with-significant-control`
**SDK Method**: `apiClient.companyProfile.getPersonsWithSignificantControl(companyNumber, options)`

```typescript
interface PSCOptions {
  items_per_page?: number;    // Default: 25, Max: 100
  start_index?: number;       // For pagination
}

// Response structure
interface PSCResponse {
  httpStatusCode: number;
  resource?: {
    items: PSC[];
    total_results: number;
    active_count: number;
    ceased_count: number;
    start_index: number;
    items_per_page: number;
  }
}

interface PSC {
  name: string;                    // Full name
  name_elements?: {
    forename?: string;
    surname?: string;
    title?: string;
  };
  nationality?: string;
  country_of_residence?: string;
  date_of_birth?: {               // Partial for privacy
    month: number;
    year: number;
  };
  address: Address;               // Service address
  notified_on: string;            // Date company was notified
  ceased_on?: string;             // Date PSC relationship ceased
  kind: string;                   // "individual-person-with-significant-control"
  natures_of_control: string[];  // Types of control exercised
  links: {
    self: string;
  };
  identification?: {              // For corporate PSCs
    country_registered?: string;
    legal_authority?: string;
    legal_form?: string;
    place_registered?: string;
    registration_number?: string;
  };
}

// Common natures of control
type NatureOfControl = 
  | "ownership-of-shares-25-to-50-percent"
  | "ownership-of-shares-50-to-75-percent"
  | "ownership-of-shares-75-to-100-percent"
  | "voting-rights-25-to-50-percent"
  | "voting-rights-50-to-75-percent"
  | "voting-rights-75-to-100-percent"
  | "right-to-appoint-and-remove-directors"
  | "significant-influence-or-control";
```

### 7. Officer Search
**Endpoint**: `GET /search/officers`
**SDK Method**: `apiClient.search.officers(query, options)`

```typescript
interface OfficerSearchOptions {
  items_per_page?: number;    // Default: 20, Max: 100
  start_index?: number;       // For pagination
}

// Response structure
interface OfficerSearchResponse {
  httpStatusCode: number;
  resource?: {
    items: OfficerSearchResult[];
    total_results: number;
    start_index: number;
    items_per_page: number;
    kind: "search#officers";
  }
}

interface OfficerSearchResult {
  title: string;                  // Officer name
  snippet?: string;               // Search snippet
  description: string;            // Role and company info
  description_identifiers?: string[];
  appointment_count: number;      // Total appointments
  date_of_birth?: {              // Partial birth date
    month: number;
    year: number;
  };
  address_snippet?: string;       // Address summary
  matches?: {
    title?: number[];            // Character positions of matches
    snippet?: number[];
  };
  links: {
    self: string;               // Link to officer appointments
  };
}
```

## Rate Limiting & Error Handling

### Rate Limits
- **Default Limit**: 600 requests per 5-minute window
- **Burst Capability**: Short bursts above limit may be allowed
- **Reset**: Rolling 5-minute window
- **Headers**: No specific rate limit headers provided

### Error Response Format
```typescript
interface APIError {
  httpStatusCode: number;
  error?: string;
  message?: string;
}

// Common error codes
// 400 - Bad Request (invalid parameters)
// 401 - Unauthorized (invalid/missing API key)
// 404 - Not Found (company/resource doesn't exist)
// 429 - Too Many Requests (rate limit exceeded)
// 500 - Internal Server Error (service issue)
```

### Best Practices
1. **Always check `httpStatusCode`** before accessing `resource`
2. **Implement exponential backoff** for 429 responses
3. **Cache responses** appropriately to reduce API calls
4. **Use pagination** for large result sets
5. **Handle partial data gracefully** (many fields are optional)

## Data Considerations

### Data Freshness
- **Real-time**: Company status, officer appointments
- **Daily updates**: Most filing information
- **Historical accuracy**: All data is point-in-time accurate

### Privacy & Legal
- **Public data only**: All information is publicly available
- **Personal data**: Officer DOB shown as month/year only
- **GDPR compliance**: Data is already public domain
- **No caching restrictions**: Data can be cached and processed

### Field Notes
- **Company numbers**: Always 8 characters, zero-padded (e.g., "00123456")
- **Dates**: ISO format strings (YYYY-MM-DD)
- **Currency**: All amounts in GBP (pence for some fields)
- **Addresses**: UK format, some international addresses for overseas companies
- **Status values**: Enumerated strings, see API documentation for full lists

This reference covers the core endpoints needed for our MCP server implementation. The official SDK handles authentication, connection pooling, and response parsing, making it the recommended approach over direct HTTP calls.