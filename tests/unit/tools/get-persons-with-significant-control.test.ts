import { GetPersonsWithSignificantControlTool } from '../../../src/tools/get-persons-with-significant-control.js';
import { CompaniesHouseClient } from '../../../src/lib/client.js';
import { PSCList } from '../../../src/types/companies-house.js';
import companiesFixture from '../../fixtures/companies.json';

jest.mock('../../../src/lib/client.js');

describe('GetPersonsWithSignificantControlTool', () => {
  let tool: GetPersonsWithSignificantControlTool;
  let mockClient: jest.Mocked<CompaniesHouseClient>;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    mockClient = {
      getPersonsWithSignificantControl: jest.fn(),
    } as any;

    // Make the constructor return our mock instance
    (CompaniesHouseClient as jest.Mock).mockImplementation(() => mockClient);

    // Create the tool with the API key
    tool = new GetPersonsWithSignificantControlTool(mockApiKey);
  });

  describe('execute', () => {
    // Create a properly typed mock data object
    const mockPSCData: PSCList = {
      items: [
        {
          name: 'John Doe',
          notifiedOn: '2020-01-01',
          natureOfControl: ['ownership-of-shares-25-to-50-percent'],
          nationality: 'British',
          countryOfResidence: 'United Kingdom',
          address: {
            line1: 'Address Line 1',
            locality: 'London',
            region: 'Greater London',
            country: 'United Kingdom',
          },
        },
      ],
      total_results: 1,
      start_index: 0,
      items_per_page: 25,
    };

    it('should get PSCs successfully', async () => {
      mockClient.getPersonsWithSignificantControl.mockResolvedValue(mockPSCData);

      const result = await tool.execute({ companyNumber: '12345678', limit: 25, startIndex: 0 });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0]!.type).toBe('text');
      expect(result.content[0]!.text).toContain(
        '**Persons with Significant Control for 12345678**'
      );
      expect(result.content[0]!.text).toContain('John Doe');
      expect(result.content[0]!.text).toContain('Nationality: British');
    });

    it('should handle no PSCs found', async () => {
      mockClient.getPersonsWithSignificantControl.mockResolvedValue({
        items: [],
        total_results: 0,
        start_index: 0,
        items_per_page: 25,
      });

      const result = await tool.execute({ companyNumber: '12345678', limit: 25, startIndex: 0 });

      expect(result.isError).toBeUndefined();
      expect(result.content[0]!.text).toContain(
        'No persons with significant control found for company 12345678'
      );
    });

    it('should handle validation errors', async () => {
      const result = await tool.execute({ companyNumber: 'invalid', limit: 25, startIndex: 0 });

      expect(result.isError).toBe(true);
      expect(result.content[0]!.text).toContain('Error: Invalid input');
    });

    it('should handle API errors', async () => {
      mockClient.getPersonsWithSignificantControl.mockRejectedValue(new Error('API error'));

      const result = await tool.execute({ companyNumber: '12345678', limit: 25, startIndex: 0 });

      expect(result.isError).toBe(true);
      expect(result.content[0]!.text).toContain('Error: API error');
    });
  });
});
