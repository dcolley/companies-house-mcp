import { z } from 'zod';
import { CompaniesHouseClient } from '../lib/client.js';
import { MCPTool } from '../types/mcp.js';
import { formatDate } from '../lib/formatters.js';
import { ChargesList, CompanyCharge } from '../types/companies-house.js';

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
  limit: z.number().min(1).max(100).default(25),
  startIndex: z.number().min(0).default(0),
});

type GetCompanyChargesParameters = z.infer<typeof zodSchema>;

export class GetCompanyChargesTool implements MCPTool {
  private client: CompaniesHouseClient;
  name = 'get_company_charges';
  description = 'Get mortgage and charge information for a specific company';
  inputSchema = inputSchema;

  constructor(apiKey: string) {
    this.client = new CompaniesHouseClient(apiKey);
  }

  async execute(parameters: Record<string, unknown>): Promise<{
    isError?: boolean;
    content: Array<{
      type: string;
      text: string;
    }>;
  }> {
    try {
      // Validate and parse parameters
      const params = zodSchema.safeParse(parameters);
      if (!params.success) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error: Invalid input - ${params.error.errors[0]?.message}`,
            },
          ],
        };
      }

      const { companyNumber, limit, startIndex } = params.data;

      // Fetch charges from the API
      const chargesData = await this.client.getCompanyCharges(companyNumber, {
        limit,
        startIndex,
      });

      // Format the charges data into readable text
      const formattedText = this.formatCharges(chargesData, companyNumber);

      return {
        content: [
          {
            type: 'text',
            text: formattedText,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
      };
    }
  }

  private formatCharges(chargesData: ChargesList, companyNumber: string): string {
    if (!chargesData.items || chargesData.items.length === 0) {
      return `No charges found for company ${companyNumber}.`;
    }

    const charges = chargesData.items.map((charge: CompanyCharge, index: number) => {
      const lines: string[] = [];
      lines.push(`Charge ${charge.chargeId || `#${index + 1}`}`);
      lines.push(`Status: ${charge.status || 'Unknown'}`);

      if (charge.createdOn) {
        lines.push(`Created: ${formatDate(charge.createdOn)}`);
      }

      if (charge.deliveredOn) {
        lines.push(`Delivered: ${formatDate(charge.deliveredOn)}`);
      }

      if (charge.classification && charge.classification.description) {
        lines.push(`Type: ${charge.classification.description}`);
      }

      if (charge.particulars) {
        lines.push(`Details: ${charge.particulars}`);
      }

      return lines.join('\n');
    });

    const total = chargesData.total_count || chargesData.items.length;
    const showing = `Showing ${chargesData.items.length} of ${total} charges`;
    const header = `**Company Charges for ${companyNumber}**\n${showing}`;

    return `${header}\n\n${charges.join('\n\n')}`;
  }
}
