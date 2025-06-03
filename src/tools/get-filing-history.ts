import { z } from 'zod';
import { CompaniesHouseClient } from '../lib/client.js';
import { MCPTool } from '../types/mcp.js';
import { formatDate } from '../lib/formatters.js';
import { FilingHistoryList, FilingHistoryItem } from '../types/companies-house.js';

const inputSchema = {
  type: 'object' as const,
  properties: {
    companyNumber: {
      type: 'string',
      description: "8-character company number (e.g., '00006400')",
      pattern: '^[0-9A-Z]{8}$',
    },
    category: {
      type: 'string',
      description: "Filter by filing category (e.g., 'accounts', 'annual-return', 'incorporation')",
    },
    limit: {
      type: 'number',
      description: 'Maximum number of filings to return (default: 25, max: 100)',
      minimum: 1,
      maximum: 100,
    },
    startIndex: {
      type: 'number',
      description: 'Start index for pagination (default: 0)',
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
  category: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(25),
  startIndex: z.number().min(0).optional().default(0),
});

export class GetFilingHistoryTool implements MCPTool {
  private client: CompaniesHouseClient;
  name = 'get_filing_history';
  description = 'Get filing history (annual returns, accounts, etc.) for a specific company';
  inputSchema = inputSchema;

  constructor(apiKey: string) {
    this.client = new CompaniesHouseClient(apiKey);
  }

  async execute(args: z.infer<typeof zodSchema>) {
    try {
      // Validate input
      const { companyNumber, category, limit, startIndex } = zodSchema.parse(args);

      // Build options object, filtering out undefined values
      const options: { category?: string; limit?: number; startIndex?: number } = {};
      if (category !== undefined) options.category = category;
      if (limit !== undefined) options.limit = limit;
      if (startIndex !== undefined) options.startIndex = startIndex;

      // Fetch filing history
      const filings = await this.client.getFilingHistory(companyNumber, options);

      // Format response
      const content = [
        {
          type: 'text' as const,
          text: this.formatFilingHistory(filings),
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
            text: `Error: ${error instanceof Error ? error.message : 'Failed to fetch filing history'}`,
          },
        ],
      };
    }
  }

  private formatFilingHistory(filings: FilingHistoryList) {
    if (!filings.items?.length) {
      return 'No filing history found for this company.';
    }

    const sections = [
      // Header with total count
      `Found ${filings.total_count} filing${filings.total_count === 1 ? '' : 's'}`,

      // Filings list
      ...filings.items.map(filing => this.formatFiling(filing)),
    ];

    // Add pagination info if applicable
    if (filings.items.length < filings.total_count) {
      sections.push(
        '',
        `Showing ${filings.items.length} of ${filings.total_count} filings. Use 'startIndex' and 'limit' parameters for pagination.`
      );
    }

    return sections.join('\n\n');
  }

  private formatFiling(filing: FilingHistoryItem) {
    const sections = [
      // Filing description and date
      `**${filing.description}**`,
      `Date: ${formatDate(filing.date)}`,

      // Category and type
      filing.category ? `Category: ${filing.category}` : null,
      filing.type ? `Type: ${filing.type}` : null,

      // Status and pages
      filing.status ? `Status: ${filing.status}` : null,
      filing.pages ? `Pages: ${filing.pages}` : null,

      // Barcode for document reference
      filing.barcode ? `Document ID: ${filing.barcode}` : null,
    ];

    return sections.filter(Boolean).join('\n');
  }
}
