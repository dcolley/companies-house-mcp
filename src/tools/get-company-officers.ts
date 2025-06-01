import { z } from 'zod';
import { CompaniesHouseClient } from '../lib/client.js';
import { MCPTool } from '../types/mcp.js';
import { formatDate } from '../lib/formatters.js';
import { Officer, OfficersList } from '../types/companies-house.js';

const inputSchema = {
  type: 'object' as const,
  properties: {
    companyNumber: {
      type: 'string',
      description: "8-character company number (e.g., '00006400')",
      pattern: '^[0-9A-Z]{8}$',
    },
    activeOnly: {
      type: 'boolean',
      description: 'Only return active officers (default: true)',
    },
    limit: {
      type: 'number',
      description: 'Maximum number of officers to return (default: 35, max: 100)',
      minimum: 1,
      maximum: 100,
    },
  },
  required: ['companyNumber'],
};

const zodSchema = z.object({
  companyNumber: z
    .string()
    .length(8)
    .regex(/^[0-9A-Z]{8}$/, "Company number must be 8 characters (e.g., '00006400')"),
  activeOnly: z.boolean().optional().default(true),
  limit: z.number().min(1).max(100).optional().default(35),
});

export class GetCompanyOfficersTool implements MCPTool {
  name = 'get_company_officers';
  description = 'Get a list of company officers (directors, secretaries, etc.)';
  inputSchema = inputSchema;

  constructor(private client: CompaniesHouseClient) {}

  async execute(args: z.infer<typeof zodSchema>) {
    try {
      // Validate input
      const { companyNumber, activeOnly, limit } = zodSchema.parse(args);

      // Fetch officers
      const officers = await this.client.getCompanyOfficers(companyNumber, { activeOnly, limit });

      // Format response
      const content = [
        {
          type: 'text' as const,
          text: this.formatOfficersList(officers),
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
            text: `Error: ${error instanceof Error ? error.message : 'Failed to fetch company officers'}`,
          },
        ],
      };
    }
  }

  private formatOfficersList(officers: OfficersList) {
    if (!officers.items?.length) {
      return 'No officers found for this company.';
    }

    const sections = [
      // Header with total count
      `Found ${officers.total_results} officer${officers.total_results === 1 ? '' : 's'}${
        officers.active_count !== undefined ? ` (${officers.active_count} active)` : ''
      }`,

      // Officers list
      ...officers.items.map(officer => this.formatOfficer(officer)),
    ];

    // Add pagination info if applicable
    if (officers.items.length < officers.total_results) {
      sections.push(
        '',
        `Showing ${officers.items.length} of ${officers.total_results} officers. Use the 'limit' parameter to see more.`
      );
    }

    return sections.join('\n\n');
  }

  private formatOfficer(officer: Officer) {
    const sections = [
      // Name and role
      `**${officer.name}** - ${officer.officer_role}`,

      // Appointment dates
      `Appointed: ${formatDate(officer.appointed_on)}${
        officer.resigned_on ? `\nResigned: ${formatDate(officer.resigned_on)}` : ''
      }`,

      // Nationality and occupation (if available)
      officer.nationality ? `Nationality: ${officer.nationality}` : null,
      officer.occupation ? `Occupation: ${officer.occupation}` : null,

      // Service address (if available)
      officer.address ? `Service Address: ${this.formatOfficerAddress(officer.address)}` : null,
    ];

    return sections.filter(Boolean).join('\n');
  }

  private formatOfficerAddress(address: Officer['address']) {
    if (!address) return 'Address not available';

    const parts = [
      address.premises,
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.region,
      address.country,
      address.postal_code,
    ];

    return parts.filter(Boolean).join(', ');
  }
}
