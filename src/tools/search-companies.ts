import { z } from 'zod';
import { CompaniesHouseClient } from '../lib/client.js';
import { APIError } from '../lib/errors.js';
import { MCPTool, MCPResponse } from '../types/mcp.js';

const searchCompaniesSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().optional().default(20),
  activeOnly: z.boolean().optional().default(true),
});

type SearchCompaniesParameters = z.infer<typeof searchCompaniesSchema>;

export class SearchCompaniesTool implements MCPTool {
  private client: CompaniesHouseClient;
  name = 'search_companies';
  description = 'Search for UK companies by name or company number';
  inputSchema = {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Company name or number to search for'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of companies to return (default: 20, max: 100)',
        minimum: 1,
        maximum: 100
      },
      activeOnly: {
        type: 'boolean',
        description: 'Only return active companies (default: true)'
      }
    },
    required: ['query']
  };

  constructor(apiKey: string) {
    this.client = new CompaniesHouseClient(apiKey);
  }

  async execute(parameters: unknown): Promise<MCPResponse> {
    try {
      const { query, limit, activeOnly } = searchCompaniesSchema.parse(
        parameters
      ) as SearchCompaniesParameters;

      const results = await this.client.searchCompanies(query, limit, activeOnly);

      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No companies found matching "${query}"`,
            },
          ],
        };
      }

      const formattedResults = results.map(company => {
        let text = `**${company.title}** (No. ${company.companyNumber})\n`;
        text += `Status: ${company.companyStatus}\n`;

        if (company.dateOfCreation) {
          text += `Incorporated: ${company.dateOfCreation}\n`;
        }

        if (company.address) {
          const addressParts: string[] = [];
          if (company.address.line1) addressParts.push(company.address.line1);
          if (company.address.line2) addressParts.push(company.address.line2);
          if (company.address.locality) addressParts.push(company.address.locality);
          if (company.address.postalCode) addressParts.push(company.address.postalCode);
          if (addressParts.length > 0) {
            text += `Address: ${addressParts.join(', ')}\n`;
          }
        }

        return text;
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: formattedResults.join('\n'),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError && error.errors.length > 0) {
        const errorMessage = error.errors[0]?.message || 'Invalid parameters';
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Error: Invalid parameters - ${errorMessage}`,
            },
          ],
        };
      }

      if (error instanceof APIError) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Error: ${error.message}`,
            },
          ],
        };
      }

      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: 'Error: An unexpected error occurred while searching companies',
          },
        ],
      };
    }
  }
}
