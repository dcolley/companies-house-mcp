import { GetCompanyChargesTool } from '../../../src/tools/get-company-charges.js';
import { CompaniesHouseClient } from '../../../src/lib/client.js';

jest.mock('../../../src/lib/client.js');

describe('GetCompanyChargesTool', () => {
  let tool: GetCompanyChargesTool;
  let mockClient: jest.Mocked<CompaniesHouseClient>;

  beforeEach(() => {
    mockClient = {
      getCompanyCharges: jest.fn(),
    } as any;
    tool = new GetCompanyChargesTool(mockClient);
  });

  describe('execute', () => {
    const mockChargesData = {
      items: [
        {
          charge_number: '001',
          status: 'outstanding',
          charge_creation_date: '2020-01-01',
          delivered_on: '2020-01-02',
          classification: {
            type: 'charge-description',
            description: 'A charge',
          },
          particulars: 'Test charge particulars',
        },
      ],
      total_count: 1,
      start_index: 0,
    };

    it('should get company charges successfully', async () => {
      mockClient.getCompanyCharges.mockResolvedValue(mockChargesData);

      const result = await tool.execute({ companyNumber: '12345678', limit: 25, startIndex: 0 });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0]!.type).toBe('text');
      expect(result.content[0]!.text).toContain('**Company Charges for 12345678**');
      expect(result.content[0]!.text).toContain('Charge 001');
      expect(result.content[0]!.text).toContain('Status: outstanding');
    });

    it('should handle no charges found', async () => {
      mockClient.getCompanyCharges.mockResolvedValue({ items: [], total_count: 0, start_index: 0 });

      const result = await tool.execute({ companyNumber: '12345678', limit: 25, startIndex: 0 });

      expect(result.isError).toBeUndefined();
      expect(result.content[0]!.text).toContain('No charges found for company 12345678');
    });

    it('should handle validation errors', async () => {
      const result = await tool.execute({ companyNumber: 'invalid', limit: 25, startIndex: 0 });

      expect(result.isError).toBe(true);
      expect(result.content[0]!.text).toContain('Error: Invalid input');
    });

    it('should handle API errors', async () => {
      mockClient.getCompanyCharges.mockRejectedValue(new Error('API error'));

      const result = await tool.execute({ companyNumber: '12345678', limit: 25, startIndex: 0 });

      expect(result.isError).toBe(true);
      expect(result.content[0]!.text).toContain('Error: API error');
    });
  });
});
