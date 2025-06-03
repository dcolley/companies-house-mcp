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
      });

      expect(mockClient.searchCompanies).toHaveBeenCalledWith('test company', 1, true);
      
      // Get the first company from the fixture
      const company = companiesFixture.searchResults[0];
      expect(result.content[0]!.text).toContain(`**${company.title}**`);
      expect(result.content[0]!.text).toContain(`(No. ${company.companyNumber})`);
      expect(result.content[0]!.text).toContain(`Status: ${company.companyStatus}`);
      expect(result.content[0]!.text).toContain(`Incorporated: ${company.dateOfCreation}`);
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
      });

      expect(mockClient.searchCompanies).toHaveBeenCalledWith('nonexistent company', 20, true);
      expect(result.content[0]!.text).toContain('No companies found');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid parameters', async () => {
      const result = await tool.execute({
        query: '', // Empty query should fail validation
      });

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0]!.text).toContain('Search query is required');
    });

    it('should handle API errors', async () => {
      mockClient.searchCompanies.mockRejectedValue(new APIError('API error', 500));

      const result = await tool.execute({
        query: 'test company',
      });

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0]!.text).toContain('Error: API error');
    });

    it('should handle unexpected errors', async () => {
      mockClient.searchCompanies.mockRejectedValue(new Error('Unexpected error'));

      const result = await tool.execute({
        query: 'test company',
      });

      expect(result).toHaveProperty('isError', true);
      expect(result.content[0]!.text).toContain('An unexpected error occurred');
    });
  });
});
