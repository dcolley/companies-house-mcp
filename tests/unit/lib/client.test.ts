import { CompaniesHouseClient } from '../../../src/lib/client.js';
import { APIError } from '../../../src/lib/errors.js';
import companiesFixture from '../../fixtures/companies.json';

// Mock fetch to avoid actual API calls
const mockFetchResponse = jest.fn();
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => mockFetchResponse(),
  })
) as jest.Mock;

describe('CompaniesHouseClient', () => {
  let client: CompaniesHouseClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    client = new CompaniesHouseClient(mockApiKey);
    mockFetchResponse.mockReset();
  });

  describe('Constructor', () => {
    it('should create client with default settings', () => {
      expect(client).toBeInstanceOf(CompaniesHouseClient);
    });

    it('should throw error if API key is not provided', () => {
      expect(() => new CompaniesHouseClient('')).toThrow('Companies House API key is required');
    });

    it('should expose API key through getter', () => {
      expect(client.getApiKey()).toBe(mockApiKey);
    });
  });

  describe('searchCompanies', () => {
    it('should search companies successfully', async () => {
      // Make sure we have fixture data
      expect(companiesFixture.searchResults).toBeDefined();
      expect(companiesFixture.searchResults.length).toBeGreaterThan(0);

      const fixtureCompany = companiesFixture.searchResults[0];

      // Prepare mock response using fixture - with null checks
      const mockApiResponse = {
        items: [
          {
            company_number: fixtureCompany?.companyNumber || '',
            title: fixtureCompany?.title || '',
            company_status: fixtureCompany?.companyStatus || '',
            type: fixtureCompany?.companyType || '',
            date_of_creation: fixtureCompany?.dateOfCreation || '',
            address: fixtureCompany?.address
              ? {
                  premises: fixtureCompany.address.line1 || '',
                  address_line_1: fixtureCompany.address.line2 || '',
                  postal_code: fixtureCompany.address.postalCode || '',
                  locality: fixtureCompany.address.locality || '',
                  region: fixtureCompany.address.region || '',
                }
              : undefined,
          },
        ],
        total_results: 1,
        items_per_page: 20,
        page_number: 1,
      };
      mockFetchResponse.mockResolvedValue(mockApiResponse);

      // Call the method
      const results = await client.searchCompanies('test company', 20, true);

      // Verify the results
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0) {
        expect(results[0]!.companyNumber).toEqual(fixtureCompany?.companyNumber || '');
      }

      // Verify the API was called correctly
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/search/companies?q=test+company&items_per_page=20&start_index=0'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic '),
          }),
        })
      );
    });

    it('should handle companies with missing address fields', async () => {
      // Mock a company without address
      const mockApiResponse = {
        items: [
          {
            company_number: '12345678',
            title: 'Test Company No Address',
            company_status: 'active',
            type: 'ltd',
            date_of_creation: '2020-01-01',
            // No address
          },
        ],
        total_results: 1,
        items_per_page: 20,
        page_number: 1,
      };
      mockFetchResponse.mockResolvedValue(mockApiResponse);

      const results = await client.searchCompanies('test company');

      expect(results.length).toBeGreaterThan(0);
      if (results.length > 0) {
        expect(results[0]!.address).toBeUndefined();
        expect(results[0]!.companyNumber).toBe('12345678');
        expect(results[0]!.title).toBe('Test Company No Address');
      }
    });

    it('should return empty array when no items returned', async () => {
      mockFetchResponse.mockResolvedValue({
        items: [],
        total_results: 0,
        items_per_page: 20,
        page_number: 1,
      });

      const results = await client.searchCompanies('nonexistent company');

      expect(results).toEqual([]);
    });

    it('should filter inactive companies when activeOnly is true', async () => {
      const mockApiResponse = {
        items: [
          {
            company_number: '12345678',
            title: 'Active Company',
            company_status: 'active',
            type: 'ltd',
          },
          {
            company_number: '87654321',
            title: 'Dissolved Company',
            company_status: 'dissolved',
            type: 'ltd',
          },
        ],
        total_results: 2,
        items_per_page: 20,
        page_number: 1,
      };
      mockFetchResponse.mockResolvedValue(mockApiResponse);

      const results = await client.searchCompanies('test', 20, true);

      expect(results.length).toBe(1);
      if (results.length > 0) {
        expect(results[0]!.companyNumber).toBe('12345678');
      }
    });
  });

  describe('getCompanyProfile', () => {
    it('should get company profile successfully', async () => {
      // Use fixture data
      mockFetchResponse.mockResolvedValue(companiesFixture.companyProfile);

      const profile = await client.getCompanyProfile('12345678');

      expect(profile).toEqual(companiesFixture.companyProfile);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/company/12345678'),
        expect.any(Object)
      );
    });

    it('should handle missing optional fields', async () => {
      // Minimal company profile
      const minimalProfile = {
        company_name: 'Minimal Company',
        company_number: '87654321',
        company_status: 'active',
        type: 'ltd',
        date_of_creation: '2020-01-01',
      };
      mockFetchResponse.mockResolvedValue(minimalProfile);

      const profile = await client.getCompanyProfile('87654321');

      expect(profile.company_name).toBe('Minimal Company');
      expect(profile.registered_office_address).toBeUndefined();
      expect(profile.accounts).toBeUndefined();
      expect(profile.confirmation_statement).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockReset();
    });

    it('should handle 401 unauthorized error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(client.searchCompanies('test')).rejects.toThrow(
        'Invalid Companies House API key'
      );
    });

    it('should handle 404 not found error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(client.getCompanyProfile('99999999')).rejects.toThrow('Resource not found');
    });

    it('should handle 429 rate limit exceeded error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
      });

      await expect(client.searchCompanies('test')).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle 500 server error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(client.searchCompanies('test')).rejects.toThrow(
        'Companies House API service error'
      );
    });

    it('should handle general fetch errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(client.searchCompanies('test')).rejects.toThrow('Network error');
    });
  });
});
