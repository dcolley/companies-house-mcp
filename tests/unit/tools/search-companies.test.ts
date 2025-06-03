import { SearchCompaniesTool } from '../../../src/tools/search-companies.js';
import { CompaniesHouseClient } from '../../../src/lib/client.js';
import { APIError } from '../../../src/lib/errors.js';
import companiesFixture from '../../__fixtures__/companies.json';

// We'll mock just the client's searchCompanies method, not the entire module
jest.mock('../../../src/lib/client.js');

describe('SearchCompaniesTool', () => {
  let tool: SearchCompaniesTool;
  let mockClient: jest.Mocked<CompaniesHouseClient>;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mocked client instance
    mockClient = {
      searchCompanies: jest.fn(),
      getApiKey: jest.fn().mockReturnValue(mockApiKey),
    } as unknown as jest.Mocked<CompaniesHouseClient>;
    
    // Make the constructor return our mock instance
    (CompaniesHouseClient as jest.Mock).mockImplementation(() => mockClient);
    
    // Create the tool with the mock client
    tool = new SearchCompaniesTool(mockApiKey);
  });

  describe('Tool Interface', () => {
    it('should have correct name and description', () => {
      expect(tool.name).toBe('search_companies');
      expect(tool.description).toContain('Search for UK companies');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties.query).toBeDefined();
      expect(tool.inputSchema.properties.verbose).toBeDefined();
      expect(tool.inputSchema.properties.pageSize).toBeDefined();
    });
  });

  describe('Execute', () => {
    it('should format company search results correctly', async () => {
      // Make sure we have fixture data
      expect(companiesFixture.searchResults).toBeDefined();
      expect(companiesFixture.searchResults.length).toBeGreaterThan(0);
      
      // Use data from fixture
      mockClient.searchCompanies.mockResolvedValue(companiesFixture.searchResults);

      const result = await tool.execute({
        query: 'test company',
        limit: 1,
        activeOnly: true,
        verbose: false,
        pageSize: 20
      });

      expect(mockClient.searchCompanies).toHaveBeenCalledWith('test company', 20, true);
      
      // Get the first company from the fixture
      const company = companiesFixture.searchResults[0];
      if (company) {
        expect(result.content[0]!.text).toContain(`**${company.title}**`);
        expect(result.content[0]!.text).toContain(`(No. ${company.companyNumber})`);
        expect(result.content[0]!.text).toContain(`Status: ${company.companyStatus}`);
        expect(result.content[0]!.text).toContain(`Incorporated: ${company.dateOfCreation}`);
      }
    });

    it('should handle missing optional fields', async () => {
      // Create a simplified version of a company without optional fields
      const companyWithoutOptionals = {
        companyNumber: '01453367',
        title: 'SIMPLIFIED TEST COMPANY',
        companyStatus: 'active',
        companyType: 'ltd',
        dateOfCreation: '1979-09-17',
        // No address field
      };

      mockClient.searchCompanies.mockResolvedValue([companyWithoutOptionals]);

      const result = await tool.execute({
        query: 'test company',
        verbose: false,
        pageSize: 20
      });

      expect(mockClient.searchCompanies).toHaveBeenCalledWith('test company', 20, true);
      expect(result.content[0]!.text).toContain(`**${companyWithoutOptionals.title}**`);
      expect(result.content[0]!.text).toContain(`Status: ${companyWithoutOptionals.companyStatus}`);
      expect(result.content[0]!.text).toContain(`Incorporated: ${companyWithoutOptionals.dateOfCreation}`);
      expect(result.content[0]!.text).not.toContain('Address:');
    });

    it('should handle no results', async () => {
      mockClient.searchCompanies.mockResolvedValue([]);

      const result = await tool.execute({
        query: 'nonexistent company',
        verbose: false,
        pageSize: 20
      });

      expect(mockClient.searchCompanies).toHaveBeenCalledWith('nonexistent company', 20, true);
      expect(result.content[0]!.text).toContain('No companies found');
    });
    
    it('should provide more details in verbose mode', async () => {
      const companyWithDetails = {
        companyNumber: '01453367',
        title: 'VERBOSE TEST COMPANY',
        companyStatus: 'active',
        companyType: 'ltd',
        dateOfCreation: '1979-09-17',
        address: {
          line1: '123 Main St',
          line2: 'Suite 100',
          locality: 'London',
          postalCode: 'EC1A 1BB',
          region: 'Greater London',
          country: 'United Kingdom'
        }
      };

      mockClient.searchCompanies.mockResolvedValue([companyWithDetails]);

      const result = await tool.execute({
        query: 'test company',
        verbose: true,
        pageSize: 20
      });

      expect(mockClient.searchCompanies).toHaveBeenCalledWith('test company', 20, true);
      expect(result.content[0]!.text).toContain(`**${companyWithDetails.title}**`);
      
      // Verbose-specific info should be present
      expect(result.content[0]!.text).toContain(`Company Type: ${companyWithDetails.companyType}`);
      expect(result.content[0]!.text).toContain(`Region: ${companyWithDetails.address.region}`);
      expect(result.content[0]!.text).toContain(`Country: ${companyWithDetails.address.country}`);
    });
    
    it('should use pageSize for API call and limit for display', async () => {
      // Create multiple companies
      const companies = Array(30).fill(0).map((_, i) => ({
        companyNumber: `0000${i}`.slice(-8),
        title: `Test Company ${i}`,
        companyStatus: 'active',
        companyType: 'ltd',
        dateOfCreation: '2020-01-01'
      }));
      
      mockClient.searchCompanies.mockResolvedValue(companies);
      
      const result = await tool.execute({
        query: 'test company',
        limit: 10,
        pageSize: 30,
        verbose: false
      });
      
      // Should call API with pageSize
      expect(mockClient.searchCompanies).toHaveBeenCalledWith('test company', 30, true);
      
      // Result should be limited by the limit parameter
      // Count the number of company entries in the text
      const matches = result.content[0]!.text.match(/Test Company \d+/g);
      expect(matches?.length).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid parameters', async () => {
      const result = await tool.execute({
        query: '', // Empty query should fail validation
        verbose: false,
        pageSize: 20
      });

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0]!.text).toContain('Search query is required');
    });

    it('should handle API errors', async () => {
      mockClient.searchCompanies.mockRejectedValue(new APIError('API error', 500));

      const result = await tool.execute({
        query: 'test company',
        verbose: false,
        pageSize: 20
      });

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0]!.text).toContain('Error: API error');
    });

    it('should handle unexpected errors', async () => {
      mockClient.searchCompanies.mockRejectedValue(new Error('Unexpected error'));

      const result = await tool.execute({
        query: 'test company',
        verbose: false,
        pageSize: 20
      });

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0]!.text).toContain('An unexpected error occurred');
    });
  });
});
