import { GetCompanyChargesTool } from '../../../src/tools/get-company-charges.js';
import { CompaniesHouseClient } from '../../../src/lib/client.js';
import companiesFixture from '../../fixtures/companies.json';
import { ChargesList } from '../../../src/types/companies-house.js';

jest.mock('../../../src/lib/client.js');

describe('GetCompanyChargesTool', () => {
  let tool: GetCompanyChargesTool;
  let mockClient: jest.Mocked<CompaniesHouseClient>;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    mockClient = {
      getCompanyCharges: jest.fn(),
    } as any;

    // Make the constructor return our mock instance
    (CompaniesHouseClient as jest.Mock).mockImplementation(() => mockClient);

    // Create the tool with the API key
    tool = new GetCompanyChargesTool(mockApiKey);
  });

  describe('execute', () => {
    // Transform the fixture data to match the CompanyCharge interface
    const transformedChargesList: ChargesList = {
      items: companiesFixture.chargesList.items.map(item => ({
        chargeId: item.charge_number,
        status: item.status,
        createdOn: item.delivered_on,
        deliveredOn: item.delivered_on,
        ...(item.satisfied_on ? { satisfiedOn: item.satisfied_on } : {}),
        classification: item.classification,
      })),
      total_count: companiesFixture.chargesList.total_count,
      start_index: companiesFixture.chargesList.start_index,
      items_per_page: companiesFixture.chargesList.items_per_page,
    };

    it('should get company charges successfully', async () => {
      mockClient.getCompanyCharges.mockResolvedValue(transformedChargesList);

      const result = await tool.execute({ companyNumber: '12345678', limit: 25, startIndex: 0 });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0]!.type).toBe('text');
      expect(result.content[0]!.text).toContain('**Company Charges for 12345678**');
    });

    it('should handle no charges found', async () => {
      mockClient.getCompanyCharges.mockResolvedValue({
        items: [],
        total_count: 0,
        start_index: 0,
        items_per_page: 25,
      });

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
