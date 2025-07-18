import { SearchOfficersTool } from '../../../src/tools/search-officers.js';
import { CompaniesHouseClient } from '../../../src/lib/client.js';
import { OfficerSearchResponse } from '../../../src/types/companies-house.js';
import companiesFixture from '../../fixtures/companies.json';

jest.mock('../../../src/lib/client.js');

describe('SearchOfficersTool', () => {
  let tool: SearchOfficersTool;
  let mockClient: jest.Mocked<CompaniesHouseClient>;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    mockClient = {
      searchOfficers: jest.fn(),
    } as any;

    // Make the constructor return our mock instance
    (CompaniesHouseClient as jest.Mock).mockImplementation(() => mockClient);

    // Create the tool with the API key
    tool = new SearchOfficersTool(mockApiKey);
  });

  describe('execute', () => {
    // Create mock data that matches the format expected by the tool
    const mockOfficerData = {
      items: [
        {
          title: 'John SMITH',
          name: 'John SMITH', // Added name field to match what the tool expects
          officer_role: 'director',
          appointed_on: '2020-01-01',
          address: {
            locality: 'London',
            region: 'Greater London',
            country: 'United Kingdom',
          },
        },
      ],
      total_results: 1,
      start_index: 0,
      items_per_page: 35,
    };

    it('should search officers successfully', async () => {
      mockClient.searchOfficers.mockResolvedValue(mockOfficerData);

      const result = await tool.execute({ query: 'John Smith', limit: 35, startIndex: 0 });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0]!.type).toBe('text');
      expect(result.content[0]!.text).toContain('**Officer Search Results for "John Smith"**');
      expect(result.content[0]!.text).toContain('John SMITH');
    });

    it('should handle no officers found', async () => {
      mockClient.searchOfficers.mockResolvedValue({
        items: [],
        total_results: 0,
        start_index: 0,
        items_per_page: 35,
      });

      const result = await tool.execute({ query: 'Nonexistent Officer', limit: 35, startIndex: 0 });

      expect(result.isError).toBeUndefined();
      expect(result.content[0]!.text).toContain('No officers found matching "Nonexistent Officer"');
    });

    it('should handle validation errors', async () => {
      const result = await tool.execute({ query: '', limit: 35, startIndex: 0 });

      expect(result.isError).toBe(true);
      expect(result.content[0]!.text).toContain('Error: Invalid input');
    });

    it('should handle API errors', async () => {
      mockClient.searchOfficers.mockRejectedValue(new Error('API error'));

      const result = await tool.execute({ query: 'John Smith', limit: 35, startIndex: 0 });

      expect(result.isError).toBe(true);
      expect(result.content[0]!.text).toContain('Error: API error');
    });
  });
});
