import { z } from 'zod';
import { CompaniesHouseClient } from '../lib/client.js';
import { MCPTool } from '../types/mcp.js';
import { formatAddress, formatDate } from '../lib/formatters.js';
import { CompanyProfile, ConfirmationStatement } from '../types/companies-house.js';

const inputSchema = {
  type: 'object' as const,
  properties: {
    companyNumber: {
      type: 'string',
      description: "8-character company number (e.g., '00006400')",
      pattern: '^[0-9A-Z]{8}$',
    },
  },
  required: ['companyNumber'],
};

const zodSchema = z.object({
  companyNumber: z
    .string()
    .length(8)
    .regex(/^[0-9A-Z]{8}$/, "Company number must be 8 characters (e.g., '00006400')"),
});

export class GetCompanyProfileTool implements MCPTool {
  private client: CompaniesHouseClient;
  name = 'get_company_profile';
  description = 'Get detailed profile information for a specific company';
  inputSchema = inputSchema;

  constructor(apiKey: string) {
    this.client = new CompaniesHouseClient(apiKey);
  }

  async execute(args: z.infer<typeof zodSchema>) {
    try {
      // Validate input
      const { companyNumber } = zodSchema.parse(args);

      // Fetch company profile
      const profile = await this.client.getCompanyProfile(companyNumber);

      // Format response
      const content = [
        {
          type: 'text' as const,
          text: this.formatCompanyProfile(profile),
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
            text: `Error: ${error instanceof Error ? error.message : 'Failed to fetch company profile'}`,
          },
        ],
      };
    }
  }

  private formatCompanyProfile(profile: CompanyProfile) {
    const sections = [
      // Company header
      `**${profile.company_name}** (No. ${profile.company_number})`,

      // Company status
      `**Status**: ${profile.company_status}${profile.company_status_detail ? ` (${profile.company_status_detail})` : ''}`,

      // Key dates
      `**Incorporated**: ${formatDate(profile.date_of_creation)}${
        profile.date_of_dissolution
          ? `\n**Dissolved**: ${formatDate(profile.date_of_dissolution)}`
          : ''
      }`,

      // Type and jurisdiction
      profile.type && profile.jurisdiction
        ? `**Type**: ${profile.type} (${profile.jurisdiction})`
        : null,

      // Registered office
      profile.registered_office_address
        ? ['**Registered Office**:', formatAddress(profile.registered_office_address)].join('\n')
        : null,

      // Accounts information
      profile.accounts ? ['**Accounts**:', this.formatAccounts(profile.accounts)].join('\n') : null,

      // Annual return/confirmation statement
      profile.confirmation_statement || profile.annual_return
        ? [
            '**Annual Return/Confirmation Statement**:',
            this.formatConfirmationStatement(
              profile.confirmation_statement || profile.annual_return || {}
            ),
          ].join('\n')
        : null,
    ];

    return sections.filter(Boolean).join('\n\n');
  }

  private formatAccounts(accounts: NonNullable<CompanyProfile['accounts']>) {
    if (!accounts) return 'No accounts information available';

    const lastAccounts = accounts.last_accounts || {};
    const nextAccounts = accounts.next_accounts || {};

    const sections = [
      `Last accounts made up to: ${formatDate(lastAccounts.made_up_to) || 'Not filed'}`,
      `Next accounts due: ${formatDate(nextAccounts.due_on) || 'Not specified'}`,
      lastAccounts.type ? `Account type: ${lastAccounts.type}` : null,
    ];

    return sections.filter(Boolean).join('\n');
  }

  private formatConfirmationStatement(statement: ConfirmationStatement) {
    if (!statement) return 'No confirmation statement/annual return information available';

    const sections = [
      `Last made up to: ${formatDate(statement.last_made_up_to) || 'Not filed'}`,
      `Next due: ${formatDate(statement.next_due) || 'Not specified'}`,
    ];

    return sections.filter(Boolean).join('\n');
  }
}
