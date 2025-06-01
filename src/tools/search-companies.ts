import { z } from 'zod';
import { CompaniesHouseClient } from '../lib/client.js';
import { APIError } from '../lib/errors.js';

interface Tool {
  getName(): string;
  getDescription(): string;
  getParameterSchema(): object;
  execute(parameters: unknown): Promise<ToolResponse>;
}

interface ToolResponse {
  isError?: boolean;
  content: Array<{
    type: string;
    text: string;
  }>;
}

const searchCompaniesSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().optional().default(20),
  activeOnly: z.boolean().optional().default(true),
});

type SearchCompaniesParameters = z.infer<typeof searchCompaniesSchema>;

export class SearchCompaniesTool implements Tool {
  private client: CompaniesHouseClient;

  constructor(apiKey: string) {
    this.client = new CompaniesHouseClient(apiKey);
  }

  getName(): string {
    return 'search_companies';
  }

  getDescription(): string {
    return 'Search for UK companies by name or company number';
  }

  getParameterSchema(): object {
    return searchCompaniesSchema;
  }

  async execute(parameters: unknown): Promise<ToolResponse> {
    try {
      const { query, limit, activeOnly } = searchCompaniesSchema.parse(
        parameters
      ) as SearchCompaniesParameters;

      const results = await this.client.searchCompanies(query, limit, activeOnly);

      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
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
            type: 'text',
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
              type: 'text',
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
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }

      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Error: An unexpected error occurred while searching companies',
          },
        ],
      };
    }
  }
}
