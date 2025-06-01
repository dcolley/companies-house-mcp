import { z } from 'zod';
import { CompaniesHouseClient } from '../lib/client.js';
import { MCPTool } from '../types/mcp.js';
import { formatDate } from '../lib/formatters.js';

const inputSchema = {
  type: 'object' as const,
  properties: {
    companyNumber: {
      type: 'string',
      description: "8-character company number (e.g., '00006400')",
      pattern: '^[0-9A-Z]{8}$',
    },
    limit: {
      type: 'number',
      description: 'Maximum number of charges to return (default: 25, max: 100)',
      minimum: 1,
      maximum: 100,
    },
    startIndex: {
      type: 'number',
      description: 'Index to start results from (default: 0)',
      minimum: 0,
    },
  },
  required: ['companyNumber'],
};

const zodSchema = z.object({
  companyNumber: z
    .string()
    .length(8)
    .regex(/^[0-9A-Z]{8}$/, "Company number must be 8 characters (e.g., '00006400')"),
  limit: z.number().min(1).max(100).optional().default(25),
  startIndex: z.number().min(0).optional().default(0),
});

export class GetCompanyChargesTool implements MCPTool {
  name = 'get_company_charges';
  description = 'Get charges (mortgages and debentures) registered against a company';
  inputSchema = inputSchema;

  constructor(private client: CompaniesHouseClient) {}

  async execute(args: z.infer<typeof zodSchema>) {
    try {
      // Validate input
      const { companyNumber, limit, startIndex } = zodSchema.parse(args);

      // Fetch company charges
      const chargesData = await this.client.getCompanyCharges(companyNumber, { limit, startIndex });

      // Format response
      const content = [
        {
          type: 'text' as const,
          text: this.formatCharges(chargesData, companyNumber),
        },
      ];

      return { content };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Error: Invalid input - ${error.errors[0]?.message}`,
            },
          ],
        };
      }

      // Handle API errors
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Error: ${error instanceof Error ? error.message : 'Failed to fetch company charges'}`,
          },
        ],
      };
    }
  }

  private formatCharges(chargesData: any, companyNumber: string): string {
    if (!chargesData?.items || chargesData.items.length === 0) {
      return `No charges found for company ${companyNumber}`;
    }

    const header = `**Company Charges for ${companyNumber}**\n`;
    const summary = `Found ${chargesData.items.length} charges (showing ${chargesData.start_index + 1}-${Math.min(chargesData.start_index + chargesData.items.length, chargesData.total_count)} of ${chargesData.total_count} total)\n\n`;

    const charges = chargesData.items.map((charge: any, index: number) => {
      const sections = [
        `**${index + 1}. Charge ${charge.charge_number || charge.charge_code || 'Unknown'}**`,
        `Status: ${charge.status || 'Unknown'}`,
        charge.charge_creation_date ? `Created: ${formatDate(charge.charge_creation_date)}` : null,
        charge.delivered_on ? `Delivered: ${formatDate(charge.delivered_on)}` : null,
        charge.satisfied_on ? `Satisfied: ${formatDate(charge.satisfied_on)}` : null,
        charge.classification?.type ? `Type: ${charge.classification.type}` : null,
        charge.classification?.description
          ? `Description: ${charge.classification.description}`
          : null,
        charge.secured_details?.amount_secured
          ? `Amount Secured: ${charge.secured_details.amount_secured}`
          : null,
        charge.particulars ? `Particulars: ${charge.particulars}` : null,
      ];

      return sections.filter(Boolean).join('\n');
    });

    return header + summary + charges.join('\n\n');
  }
}
