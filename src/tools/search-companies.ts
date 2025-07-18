import { z } from 'zod';
import { CompaniesHouseClient } from '../lib/client.js';
import { APIError } from '../lib/errors.js';
import { MCPTool, MCPResponse } from '../types/mcp.js';

const searchCompaniesSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().optional().default(20),
  activeOnly: z.boolean().optional().default(true),
  verbose: z.boolean().optional().default(false),
  pageSize: z.number().optional().default(20),
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
        description: 'Company name or number to search for',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of companies to return (default: 20, max: 100)',
        minimum: 1,
        maximum: 100,
      },
      activeOnly: {
        type: 'boolean',
        description: 'Only return active companies (default: true)',
      },
      verbose: {
        type: 'boolean',
        description: 'Return more detailed information about each company (default: false)',
      },
      pageSize: {
        type: 'number',
        description: 'Number of results per page for pagination (default: 20, max: 100)',
        minimum: 1,
        maximum: 100,
      },
    },
    required: ['query'],
  };

  constructor(apiKey: string) {
    this.client = new CompaniesHouseClient(apiKey);
  }

  private log(message: string): void {
    if (process.env.DEBUG) {
      console.error(`[SearchCompaniesTool] ${new Date().toISOString()} - ${message}`);
    }
  }

  async execute(parameters: unknown): Promise<MCPResponse> {
    try {
      const { query, limit, activeOnly, verbose, pageSize } = searchCompaniesSchema.parse(
        parameters
      ) as SearchCompaniesParameters;

      this.log(
        `Searching for companies with query: "${query}", limit: ${limit}, activeOnly: ${activeOnly}, verbose: ${verbose}, pageSize: ${pageSize}`
      );

      const results = await this.client.searchCompanies(query, pageSize, activeOnly);

      if (results.length === 0) {
        this.log(`No companies found matching "${query}"`);
        return {
          content: [
            {
              type: 'text' as const,
              text: `No companies found matching "${query}"`,
            },
          ],
        };
      }

      this.log(`Found ${results.length} companies matching "${query}"`);

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

        // Add more details in verbose mode
        if (verbose) {
          text += `Company Type: ${company.companyType || 'Unknown'}\n`;

          if (company.address) {
            if (company.address.region) text += `Region: ${company.address.region}\n`;
            if (company.address.country) text += `Country: ${company.address.country}\n`;
          }
        }

        return text;
      });

      const limitedResults = formattedResults.slice(0, limit);
      this.log(`Returning ${limitedResults.length} formatted company results`);

      return {
        content: [
          {
            type: 'text' as const,
            text: limitedResults.join('\n'),
          },
        ],
      };
    } catch (error) {
      if (error instanceof z.ZodError && error.errors.length > 0) {
        const errorMessage = error.errors[0]?.message || 'Invalid parameters';
        this.log(`Validation error: ${errorMessage}`);
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
        this.log(`API error: ${error.message}`);
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

      this.log(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
