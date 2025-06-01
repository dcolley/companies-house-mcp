# Due Diligence Workflow Example

This example demonstrates how to perform comprehensive due diligence on a UK company using the Companies House MCP Server with Claude.

## Scenario

You're considering a business partnership with "Acme Technology Solutions Ltd" and need to perform due diligence.

## Step 1: Initial Company Search

**Prompt to Claude:**
```
Search for companies named "Acme Technology Solutions"
```

**Expected Response:**
Claude will use the `search_companies` tool to find companies matching this name, showing their status, incorporation dates, and basic information.

## Step 2: Get Company Profile

**Prompt to Claude:**
```
Get the detailed profile for company number 12345678
```

**Expected Response:**
Claude will retrieve comprehensive company information including:
- Company status and type
- Incorporation date and jurisdiction  
- Registered office address
- SIC codes (business activities)
- Accounts and filing status
- Key compliance dates

## Step 3: Review Company Officers

**Prompt to Claude:**
```
Who are the current directors and officers of company 12345678?
```

**Expected Response:**
A list of current officers including:
- Names and roles (Director, Secretary, etc.)
- Appointment dates
- Nationalities and occupations
- Business addresses

## Step 4: Check Filing History

**Prompt to Claude:**
```
Show me the recent filing history for company 12345678, focusing on accounts and annual returns
```

**Expected Response:**
Recent filings including:
- Annual accounts submissions
- Confirmation statements
- Officer changes
- Any other significant filings

## Step 5: Investigate Financial Charges

**Prompt to Claude:**
```
Does company 12345678 have any charges or mortgages against it?
```

**Expected Response:**
Information about any registered charges:
- Outstanding vs satisfied charges
- Amounts and security details
- Lenders/persons entitled
- Creation and satisfaction dates

## Step 6: Verify Ownership Structure

**Prompt to Claude:**
```
Who are the persons with significant control for company 12345678?
```

**Expected Response:**
PSC information showing:
- Individual and corporate controllers
- Nature of control (shareholding, voting rights, etc.)
- Notification dates
- Control percentages

## Step 7: Background Check on Key Officers

**Prompt to Claude:**
```
Search for other companies where John Smith (the main director) holds positions
```

**Expected Response:**
Cross-reference showing:
- Current and former appointments
- Other companies the officer is involved with
- Pattern of business activities

## Analysis Questions to Ask Claude

After gathering the data, you can ask Claude analytical questions:

### Financial Health
```
Based on the filing history, is this company maintaining good compliance with its filing obligations?
```

### Red Flags
```
Are there any red flags in this company's profile that I should be concerned about?
```

### Business Stability
```
How long has this company been operating and do the officers appear experienced?
```

### Ownership Transparency
```
Is the ownership structure of this company clear and transparent?
```

## Sample Complete Workflow

Here's how a complete conversation might look:

---

**You:** Search for companies named "Acme Technology Solutions"

**Claude:** I'll search for companies with that name.

*[Uses search_companies tool]*

I found 3 companies matching "Acme Technology Solutions":

**ACME TECHNOLOGY SOLUTIONS LIMITED** (No. 12345678)
Status: active
Incorporated: 15 March 2015
Address: Tech Hub, 123 Innovation Street, London, EC2A 1AA

**ACME TECHNOLOGY SOLUTIONS (NORTH) LTD** (No. 87654321)  
Status: active
Incorporated: 2 January 2018
Address: Business Centre, 456 Digital Drive, Manchester, M1 2BB

**ACME TECHNOLOGY SOLUTIONS GROUP PLC** (No. 11111111)
Status: dissolved
Incorporated: 10 June 2010
Dissolved: 31 December 2020
Address: Former Office, 789 Old Street, Birmingham, B1 1CC

Would you like me to get detailed information about any of these companies?

---

**You:** Get the detailed profile for the first company, number 12345678

**Claude:** I'll get the comprehensive profile for ACME TECHNOLOGY SOLUTIONS LIMITED.

*[Uses get_company_profile tool]*

**ACME TECHNOLOGY SOLUTIONS LIMITED** (No. 12345678)
**Status**: active
**Incorporated**: 15 March 2015
**Type**: ltd (private-limited-shares-section-30-exemption)
**SIC Codes**: 62012 - Business and domestic software development

**Registered Office**:
Tech Hub
123 Innovation Street
London
EC2A 1AA
United Kingdom

**Accounts**:
Last accounts made up to: 31 March 2023
Next accounts due: 31 December 2024
Account type: full

**Annual Return/Confirmation Statement**:
Last made up to: 15 March 2023
Next due: 15 March 2024

This company appears to be a legitimate software development business with good compliance - their accounts and confirmation statements are up to date.

---

**You:** Who are the current directors of this company?

**Claude:** I'll get the current officer information for the company.

*[Uses get_company_officers tool]*

**Current Officers for ACME TECHNOLOGY SOLUTIONS LIMITED (No. 12345678)**

**Sarah Johnson** - Director
Appointed: 15 March 2015
Nationality: British
Occupation: Software Engineer

**Michael Chen** - Director  
Appointed: 1 September 2016
Nationality: British
Occupation: Business Development Manager

**Emma Wilson** - Secretary
Appointed: 15 March 2015
Nationality: British
Occupation: Company Administrator

The company has a stable management team with the founder (Sarah Johnson) still actively involved since incorporation, plus additional expertise in business development.

---

**You:** Are there any red flags I should be aware of?

**Claude:** Based on the information gathered, this company appears to have a clean profile:

**Positive indicators:**
- Active status with good compliance record
- Stable management team since incorporation
- Up-to-date filing obligations
- Clear business focus (software development)
- Reasonable incorporation age (8+ years)

**No major red flags detected:**
- No dissolution or liquidation history
- No overdue filings
- Management team appears stable
- Business address looks professional

To complete the due diligence, you may want me to check for any charges against the company and verify the ownership structure through PSC information.

---

This workflow demonstrates how you can systematically gather and analyze company information using the MCP server tools with Claude's analytical capabilities.

## Tips for Effective Due Diligence

1. **Start broad, then narrow**: Begin with company search, then dive into specifics
2. **Check compliance**: Recent filings indicate operational health
3. **Verify stability**: Long-term officers suggest business continuity
4. **Cross-reference**: Check officers' other appointments for conflicts
5. **Ask analytical questions**: Let Claude help interpret the data
6. **Document findings**: Keep records of your research

## Legal Disclaimer

This information is for due diligence purposes only and should not be the sole basis for business decisions. Always consult with legal and financial professionals for comprehensive advice. 