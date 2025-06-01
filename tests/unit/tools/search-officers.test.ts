import { SearchOfficersTool } from '../../../src/tools/search-officers.js';
import { CompaniesHouseClient } from '../../../src/lib/client.js';

jest.mock('../../../src/lib/client.js');

describe('SearchOfficersTool', () => {
  let tool: SearchOfficersTool;
  let mockClient: jest.Mocked<CompaniesHouseClient>;

  beforeEach(() => {
    mockClient = {
      searchOfficers: jest.fn(),
    } as any;
    tool = new SearchOfficersTool(mockClient);
  });

  describe('execute', () => {
    const mockOfficerData = {
      items: [
        {
          title: 'John SMITH',
          appointments: [
            {
              officer_role: 'director',
              company_name: 'Test Company Ltd',
              company_number: '12345678',
              appointed_on: '2020-01-01',
            },
          ],
          date_of_birth: { month: 1, year: 1980 },
          address: {
            locality: 'London',
            region: 'Greater London',
            country: 'United Kingdom',
          },
        },
      ],
      total_results: 1,
      start_index: 0,
    };

    it('should search officers successfully', async () => {
      mockClient.searchOfficers.mockResolvedValue(mockOfficerData);

      const result = await tool.execute({ query: 'John Smith', limit: 35, startIndex: 0 });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0]!.type).toBe('text');
      expect(result.content[0]!.text).toContain('**Officer Search Results for "John Smith"**');
      expect(result.content[0]!.text).toContain('John SMITH');
      expect(result.content[0]!.text).toContain('director at Test Company Ltd');
    });

    it('should handle no officers found', async () => {
      mockClient.searchOfficers.mockResolvedValue({ items: [], total_results: 0, start_index: 0 });

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
