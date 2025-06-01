import { GetPersonsWithSignificantControlTool } from '../../../src/tools/get-persons-with-significant-control.js';
import { CompaniesHouseClient } from '../../../src/lib/client.js';

jest.mock('../../../src/lib/client.js');

describe('GetPersonsWithSignificantControlTool', () => {
  let tool: GetPersonsWithSignificantControlTool;
  let mockClient: jest.Mocked<CompaniesHouseClient>;

  beforeEach(() => {
    mockClient = {
      getPersonsWithSignificantControl: jest.fn(),
    } as any;
    tool = new GetPersonsWithSignificantControlTool(mockClient);
  });

  describe('execute', () => {
    const mockPSCData = {
      items: [
        {
          name: 'John Doe',
          kind: 'individual-person-with-significant-control',
          notified_on: '2020-01-01',
          natures_of_control: ['ownership-of-shares-25-to-50-percent'],
          nationality: 'British',
          country_of_residence: 'United Kingdom',
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
      expect(result.content[0]!.text).toContain('Type: Individual Person With Significant Control');
      expect(result.content[0]!.text).toContain('Nationality: British');
    });

    it('should handle no PSCs found', async () => {
      mockClient.getPersonsWithSignificantControl.mockResolvedValue({
        items: [],
        total_results: 0,
        start_index: 0,
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
