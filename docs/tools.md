# Tools Reference

## Available Tools

### get_company_profile
Get detailed information about a specific company.

**Parameters:**
- `companyNumber` (required): 8-character company number
- `verbose` (optional): Return detailed information

**Example:**
```
Get company profile for 00445790
```

### get_company_officers
Get directors and secretaries for a company.

**Parameters:**
- `companyNumber` (required): 8-character company number
- `activeOnly` (optional): Only return active officers (default: true)
- `verbose` (optional): Return detailed information

**Example:**
```
Get officers for company 00445790
```

### get_filing_history
Get filing history for a company.

**Parameters:**
- `companyNumber` (required): 8-character company number
- `category` (optional): Filter by filing category
- `limit` (optional): Maximum number of results

**Example:**
```
Get filing history for company 00445790
```

### get_company_charges
Get charges and mortgages for a company.

**Parameters:**
- `companyNumber` (required): 8-character company number
- `limit` (optional): Maximum number of results

**Example:**
```
Get charges for company 00445790
```

### get_persons_with_significant_control
Get persons with significant control (PSCs) for a company.

**Parameters:**
- `companyNumber` (required): 8-character company number
- `limit` (optional): Maximum number of results

**Example:**
```
Get PSCs for company 00445790
```

### search_companies
Search for companies by name or number.

**Parameters:**
- `query` (required): Company name or number to search for
- `activeOnly` (optional): Only return active companies (default: true)
- `limit` (optional): Maximum number of results
- `verbose` (optional): Return detailed information

**Example:**
```
Search for companies named "Tesco"
```

### search_officers
Search for officers by name.

**Parameters:**
- `query` (required): Officer name to search for
- `limit` (optional): Maximum number of results

**Example:**
```
Search for officers named "John Smith"
```

## Response Modes

All tools support verbose mode for detailed responses:

- **Compact mode** (default): Essential information only
- **Verbose mode**: Full details including all available fields

## Rate Limiting

The server implements rate limiting to comply with Companies House API limits:
- 500 requests per 5 minutes
- Automatic retry with exponential backoff
- Response caching to minimize API calls 