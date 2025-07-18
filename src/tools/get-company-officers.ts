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
    pageSize: {
      type: 'number',
      description: 'Number of results per page for pagination (default: 35, max: 100)',
      minimum: 1,
      maximum: 100,
    },
    verbose: {
      type: 'boolean',
      description: 'Return more detailed information about each officer (default: false)',
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
  pageSize: z.number().min(1).max(100).optional().default(35),
  verbose: z.boolean().optional().default(false),
});

export class GetCompanyOfficersTool implements MCPTool {
  private client: CompaniesHouseClient;
  name = 'get_company_officers';
  description = 'Get officers (directors and secretaries) for a specific company';
  inputSchema = inputSchema;

  constructor(apiKey: string) {
    this.client = new CompaniesHouseClient(apiKey);
  }

  private log(message: string): void {
    if (process.env.DEBUG) {
      console.error(`[GetCompanyOfficersTool] ${new Date().toISOString()} - ${message}`);
    }
  }

  async execute(args: z.infer<typeof zodSchema>) {
    try {
      // Validate input
      const { companyNumber, activeOnly, limit, pageSize, verbose } = zodSchema.parse(args);
      this.log(
        `Getting officers for company ${companyNumber}, activeOnly: ${activeOnly}, limit: ${limit}, pageSize: ${pageSize}, verbose: ${verbose}`
      );

      // Fetch officers
      const officers = await this.client.getCompanyOfficers(companyNumber, {
        activeOnly,
        limit: pageSize, // Use pageSize for API requests
      });

      this.log(`Received ${officers.items?.length || 0} officers out of ${officers.total_results}`);

      // Format response
      const content = [
        {
          type: 'text' as const,
          text: this.formatOfficersList(officers, limit, verbose),
        },
      ];

      return { content };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'Invalid input';
        this.log(`Validation error: ${errorMessage}`);
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Error: Invalid input - ${errorMessage}`,
            },
          ],
        };
      }

      // Handle API errors
      this.log(
        `Error fetching company officers: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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

  private formatOfficersList(officers: OfficersList, limit: number, verbose: boolean = false) {
    this.log(`Formatting officers list, limit: ${limit}, verbose: ${verbose}`);

    if (!officers.items?.length) {
      return 'No officers found for this company.';
    }

    const sections = [
      // Header with total count
      `Found ${officers.total_results} officer${officers.total_results === 1 ? '' : 's'}${
        officers.active_count !== undefined ? ` (${officers.active_count} active)` : ''
      }`,

      // Officers list - limit the number of items shown
      ...officers.items.slice(0, limit).map(officer => this.formatOfficer(officer, verbose)),
    ];

    // Add pagination info if applicable
    if (officers.items.length < officers.total_results) {
      sections.push(
        '',
        `Showing ${Math.min(officers.items.length, limit)} of ${officers.total_results} officers. Use the 'limit' parameter to see more.`
      );
    }

    return sections.join('\n\n');
  }

  private formatOfficer(officer: Officer, verbose: boolean = false) {
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

    // Add verbose-only fields
    if (verbose) {
      // Add any other officer details that might be present in the raw API response
      // Currently we don't have these fields in our Officer interface
      // But we can add more verbose information about the role

      if (officer.officer_role) {
        let roleInfo = '';

        if (officer.officer_role.includes('director')) {
          roleInfo +=
            'This person is a director of the company. Directors are responsible for running the company and can be held personally liable for company actions.';
        } else if (officer.officer_role.includes('secretary')) {
          roleInfo +=
            'This person is a company secretary. The secretary handles administrative responsibilities but generally has fewer legal obligations than directors.';
        } else if (officer.officer_role.includes('llp-member')) {
          roleInfo +=
            'This person is a member of the Limited Liability Partnership. LLP members share management responsibilities.';
        }

        if (roleInfo) {
          sections.push(`Role Details: ${roleInfo}`);
        }
      }

      // Display full address details more prominently in verbose mode
      if (officer.address) {
        const addressLines = [];
        if (officer.address.premises) addressLines.push(officer.address.premises);
        if (officer.address.address_line_1) addressLines.push(officer.address.address_line_1);
        if (officer.address.address_line_2) addressLines.push(officer.address.address_line_2);
        if (officer.address.locality) addressLines.push(officer.address.locality);
        if (officer.address.region) addressLines.push(officer.address.region);
        if (officer.address.postal_code) addressLines.push(officer.address.postal_code);
        if (officer.address.country) addressLines.push(officer.address.country);

        if (addressLines.length > 0) {
          sections.push(`Full Address:\n${addressLines.join('\n')}`);
        }
      }
    }

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
