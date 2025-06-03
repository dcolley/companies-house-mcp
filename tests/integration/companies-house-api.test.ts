/**
 * Integration tests for Companies House API
 * 
 * NOTE: These tests make real API calls to Companies House
 * and require a valid API key in the COMPANIES_HOUSE_API_KEY environment variable.
 * 
 * To run: COMPANIES_HOUSE_API_KEY=your_api_key npm run test:integration
 */

import { CompaniesHouseClient } from '../../src/lib/client.js';

// Check if we're in an environment with fetch support
const hasFetchSupport = typeof globalThis.fetch === 'function';

// Skip tests if no API key is provided or if fetch is not available
const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
const runTests = (apiKey && hasFetchSupport) ? describe : describe.skip;

runTests('Companies House API Integration', () => {
  let client: CompaniesHouseClient;
  
  beforeAll(() => {
    client = new CompaniesHouseClient(apiKey as string);
  });
  
  // Use longer timeouts for API calls
  jest.setTimeout(10000);
  
  it('should search for companies by name', async () => {
    // Use a well-known company that's unlikely to disappear
    const results = await client.searchCompanies('Tesco', 3);
    
    expect(results.length).toBeGreaterThan(0);
    
    // Check that the expected structure is returned
    const company = results[0];
    expect(company).toHaveProperty('companyNumber');
    expect(company).toHaveProperty('title');
    expect(company).toHaveProperty('companyStatus');
  });
  
  it('should retrieve a company profile by number', async () => {
    // Tesco PLC company number
    const companyNumber = '00445790';
    
    const profile = await client.getCompanyProfile(companyNumber);
    
    expect(profile).toHaveProperty('company_name');
    expect(profile).toHaveProperty('company_number', companyNumber);
    expect(profile).toHaveProperty('company_status');
    expect(profile).toHaveProperty('registered_office_address');
  });
  
  it('should handle API errors gracefully', async () => {
    // Invalid company number
    try {
      await client.getCompanyProfile('99999999');
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as Error).message).toContain('Resource not found');
    }
  });
}); 