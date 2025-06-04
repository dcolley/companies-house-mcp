# Companies House MCP Server API Reference

This document provides detailed information about all available MCP tools, their parameters, responses, and usage examples.

## Overview

The Companies House MCP Server provides 7 tools for accessing UK Companies House public data:

1. [search_companies](#search_companies) - Search for companies
2. [get_company_profile](#get_company_profile) - Get detailed company information
3. [get_company_officers](#get_company_officers) - Get company officers/directors
4. [get_filing_history](#get_filing_history) - Get company filing history
5. [get_company_charges](#get_company_charges) - Get company charges/securities
6. [get_persons_with_significant_control](#get_persons_with_significant_control) - Get PSC information
7. [search_officers](#search_officers) - Search for officers by name

## Tool Specifications

### search_companies

Search for companies by name or keywords.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | ✅ | Search query - company name or keywords |
| `limit` | number | ❌ | Maximum results to return (default: 20, max: 100) |
| `activeOnly` | boolean | ❌ | Only return active companies (default: true) |

#### Response Format

```
**COMPANY NAME LTD** (No. 12345678)
Status: active
Incorporated: 15 March 2010
Address: 123 Business Street, London, EC1A 1AA

**ANOTHER COMPANY PLC** (No. 87654321)
Status: dissolved
Incorporated: 5 January 2005
Dissolved: 12 December 2020
Address: 456 Corporate Avenue, Manchester, M1 1AA
```

#### Example Usage

```typescript
// Search for active companies containing "acme"
await searchCompanies({
  query: "acme",
  limit: 10,
  activeOnly: true
});
```

#### Error Scenarios

- **Validation Error**: Invalid or missing query parameter
- **No Results**: No companies found matching the search criteria
- **API Error**: Companies House API unavailable or rate limited

---

### get_company_profile

Get detailed information about a specific company.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyNumber` | string | ✅ | 8-character company number (e.g., "12345678") |

#### Response Format

```
**EXAMPLE COMPANY LIMITED** (No. 12345678)
**Status**: active
**Incorporated**: 15 March 2010
**Type**: ltd (private-limited-guarant-nsc-limited-exemption)
**SIC Codes**: 62012 - Business and domestic software development

**Registered Office**:
123 Business Street
London
EC1A 1AA
United Kingdom

**Accounts**:
Last accounts made up to: 31 March 2023
Next accounts due: 31 December 2024
Account type: full

**Annual Return/Confirmation Statement**:
Last made up to: 15 March 2023
Next due: 15 March 2024
```

#### Example Usage

```typescript
// Get profile for company number 12345678
await getCompanyProfile({
  companyNumber: "12345678"
});
```

#### Error Scenarios

- **Validation Error**: Invalid company number format
- **Not Found**: Company number doesn't exist
- **API Error**: Companies House API issues

---

### get_company_officers

Get current and former officers (directors/secretaries) of a company.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyNumber` | string | ✅ | 8-character company number |
| `activeOnly` | boolean | ❌ | Only return active officers (default: true) |
| `limit` | number | ❌ | Maximum results to return (default: 35) |

#### Response Format

```
**Current Officers for EXAMPLE COMPANY LIMITED (No. 12345678)**

**John Smith** - Director
Appointed: 15 March 2010
Nationality: British
Occupation: Company Director

**Jane Doe** - Secretary  
Appointed: 1 April 2015
Nationality: British
Occupation: Company Secretary

**Former Officers** (when activeOnly=false):

**Robert Johnson** - Director (Resigned)
Appointed: 1 January 2010
Resigned: 31 December 2020
```

#### Example Usage

```typescript
// Get all active officers
await getCompanyOfficers({
  companyNumber: "12345678",
  activeOnly: true,
  limit: 50
});
```

#### Error Scenarios

- **Validation Error**: Invalid company number
- **No Officers**: No officers found (rare but possible)
- **API Error**: Service unavailable

---

### get_filing_history

Get the filing history for a company, showing recent documents and submissions.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyNumber` | string | ✅ | 8-character company number |
| `category` | string | ❌ | Filter by category (e.g., "accounts", "annual-return") |
| `limit` | number | ❌ | Maximum results to return (default: 25) |
| `startIndex` | number | ❌ | Pagination start index (default: 0) |

#### Response Format

```
**Filing History for EXAMPLE COMPANY LIMITED (No. 12345678)**

**Accounts filed** - 15 July 2023
Document ID: MzM2NjExOTU5MmFkaXF6a2N4
Description: Annual accounts for period ending 31 March 2023

**Confirmation statement filed** - 15 March 2023
Document ID: MzM2NjExOTU5MmFkaXF6a2N4
Description: Confirmation statement made on 15 March 2023

**Officer appointment** - 1 January 2023
Document ID: MzM2NjExOTU5MmFkaXF6a2N4
Description: Appointment of John Smith as director on 1 January 2023

Showing results 1-25 of 150 total filings.
Use startIndex parameter for pagination.
```

#### Available Categories

- `accounts` - Annual accounts
- `annual-return` - Annual returns
- `confirmation-statement` - Confirmation statements
- `incorporation` - Incorporation documents
- `officers` - Officer appointments/resignations
- `mortgage` - Mortgage and charge documents
- `miscellaneous` - Other filings

#### Example Usage

```typescript
// Get recent accounts filings
await getFilingHistory({
  companyNumber: "12345678",
  category: "accounts",
  limit: 10
});
```

#### Error Scenarios

- **Validation Error**: Invalid parameters
- **No Filings**: No filing history available
- **API Error**: Service issues

---

### get_company_charges

Get charges (mortgages, debentures, etc.) registered against a company.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyNumber` | string | ✅ | 8-character company number |
| `limit` | number | ❌ | Maximum results to return (default: 25) |

#### Response Format

```
**Charges for EXAMPLE COMPANY LIMITED (No. 12345678)**

**Charge 1** - Created: 15 March 2020
Status: outstanding
Amount: £500,000
Secured details: All that freehold property known as...
Persons entitled: HSBC Bank plc

**Charge 2** - Created: 1 January 2019
Status: satisfied
Amount: £250,000
Satisfied: 15 March 2020
Secured details: Fixed and floating charges over...
Persons entitled: Barclays Bank PLC

Total charges: 2
Outstanding charges: 1
```

#### Charge Statuses

- `outstanding` - Active charge
- `satisfied` - Paid off/discharged
- `part-satisfied` - Partially satisfied

#### Example Usage

```typescript
// Get all charges for a company
await getCompanyCharges({
  companyNumber: "12345678",
  limit: 50
});
```

#### Error Scenarios

- **Validation Error**: Invalid company number
- **No Charges**: No charges registered (common for many companies)
- **API Error**: Service unavailable

---

### get_persons_with_significant_control

Get information about persons with significant control (PSCs) over the company.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyNumber` | string | ✅ | 8-character company number |
| `limit` | number | ❌ | Maximum results to return (default: 25) |

#### Response Format

```
**Persons with Significant Control for EXAMPLE COMPANY LIMITED (No. 12345678)**

**John Smith**
Kind: individual-person-with-significant-control
Nature of control: ownership-of-shares-75-to-100-percent
Notified: 6 April 2016
Address: 123 Residential Street, London, SW1A 1AA

**PARENT COMPANY LIMITED**  
Kind: corporate-entity-person-with-significant-control
Nature of control: ownership-of-shares-50-to-75-percent
Company Number: 87654321
Notified: 1 January 2020

**John Doe (via HOLDING TRUST)**
Kind: legal-person-person-with-significant-control
Nature of control: right-to-appoint-and-remove-directors
Notified: 15 March 2019
```

#### Control Types

- Ownership of shares (25-50%, 50-75%, 75-100%)
- Voting rights
- Right to appoint/remove directors
- Significant influence or control

#### Example Usage

```typescript
// Get PSC information
await getPersonsWithSignificantControl({
  companyNumber: "12345678"
});
```

#### Error Scenarios

- **Validation Error**: Invalid company number
- **No PSCs**: No PSC information available
- **API Error**: Service issues

---

### search_officers

Search for officers by name to find their current and previous company appointments.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | ✅ | Officer name to search for |
| `limit` | number | ❌ | Maximum results to return (default: 20, max: 100) |
| `activeOnly` | boolean | ❌ | Only return current appointments (default: true) |

#### Response Format

```
**Officer Search Results for "john smith"**

**John Smith** 
Current appointment: Director at EXAMPLE COMPANY LIMITED (12345678)
Appointed: 15 March 2010
Address: *****, London

**John Smith**
Current appointment: Director at ANOTHER COMPANY PLC (87654321)  
Appointed: 1 January 2015
Address: *****, Manchester

**John Smith** (Former)
Former appointment: Secretary at OLD COMPANY LTD (11111111)
Appointed: 1 June 2005
Resigned: 31 December 2014
```

#### Example Usage

```typescript
// Search for officers named "john smith"
await searchOfficers({
  query: "john smith",
  limit: 25,
  activeOnly: true
});
```

#### Error Scenarios

- **Validation Error**: Invalid or empty query
- **No Results**: No officers found with that name
- **API Error**: Service unavailable

---

## Common Response Patterns

### Success Response

All tools return responses in this format:

```typescript
{
  content: [
    {
      type: "text",
      text: "Formatted response content..."
    }
  ]
}
```

### Error Response

Error responses follow this pattern:

```typescript
{
  isError: true,
  content: [
    {
      type: "text", 
      text: "Error: Clear description of what went wrong"
    }
  ]
}
```

## Rate Limiting

- **Default limit**: 500 requests per 5 minutes
- **Companies House limit**: 600 requests per 5 minutes
- **Automatic throttling**: Built-in rate limiting prevents API abuse
- **Caching**: Responses cached to reduce API calls

## Data Freshness

Data freshness varies by endpoint:

- **Company profiles**: Updated daily
- **Officers**: Updated when filed (usually within 24 hours)
- **Filing history**: Updated in real-time
- **Charges**: Updated when filed
- **PSCs**: Updated when filed

## Privacy and Data Protection

- **Personal addresses**: Officer residential addresses are redacted for privacy
- **Sensitive information**: PSC data shows only business-relevant control information
- **GDPR compliance**: All data handling follows GDPR requirements
- **No data storage**: Server doesn't persistently store personal data

## Error Codes

| Error | Description | Action |
|-------|-------------|---------|
| `INVALID_COMPANY_NUMBER` | Company number format invalid | Check format (8 characters) |
| `COMPANY_NOT_FOUND` | Company doesn't exist | Verify company number |
| `RATE_LIMITED` | Too many requests | Wait and retry |
| `API_UNAVAILABLE` | Companies House API down | Try again later |
| `INVALID_PARAMETERS` | Request parameters invalid | Check parameter format |

## Examples and Use Cases

### Due Diligence Workflow

```typescript
// 1. Search for company
await searchCompanies({ query: "Example Ltd" });

// 2. Get detailed profile  
await getCompanyProfile({ companyNumber: "12345678" });

// 3. Check officers
await getCompanyOfficers({ companyNumber: "12345678" });

// 4. Review recent filings
await getFilingHistory({ companyNumber: "12345678", limit: 10 });

// 5. Check for charges
await getCompanyCharges({ companyNumber: "12345678" });

// 6. Verify control structure
await getPersonsWithSignificantControl({ companyNumber: "12345678" });
```

### Officer Background Check

```typescript
// Search for officer across all companies
await searchOfficers({ 
  query: "John Smith", 
  activeOnly: false,
  limit: 50 
});
```

### Compliance Monitoring

```typescript
// Check recent filings for compliance
await getFilingHistory({ 
  companyNumber: "12345678",
  category: "accounts",
  limit: 5 
});
```

For more examples, see the [examples directory](../examples/) in the repository.