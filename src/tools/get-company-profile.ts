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
    verbose: {
      type: 'boolean',
      description: 'Return more detailed information about the company (default: false)',
    },
  },
  required: ['companyNumber'],
};

const zodSchema = z.object({
  companyNumber: z
    .string()
    .length(8)
    .regex(/^[0-9A-Z]{8}$/, "Company number must be 8 characters (e.g., '00006400')"),
  verbose: z.boolean().optional().default(false),
});

export class GetCompanyProfileTool implements MCPTool {
  private client: CompaniesHouseClient;
  name = 'get_company_profile';
  description = 'Get detailed profile information for a specific company';
  inputSchema = inputSchema;

  constructor(apiKey: string) {
    this.client = new CompaniesHouseClient(apiKey);
  }

  private log(message: string): void {
    if (process.env.DEBUG) {
      console.error(`[GetCompanyProfileTool] ${new Date().toISOString()} - ${message}`);
    }
  }

  async execute(args: z.infer<typeof zodSchema>) {
    try {
      // Validate input
      const { companyNumber, verbose } = zodSchema.parse(args);
      this.log(`Getting profile for company number: ${companyNumber}, verbose: ${verbose}`);

      // Fetch company profile
      const profile = await this.client.getCompanyProfile(companyNumber);
      this.log(`Received profile for company: ${profile.company_name}`);

      // Format response
      const content = [
        {
          type: 'text' as const,
          text: this.formatCompanyProfile(profile, verbose),
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
        `Error fetching company profile: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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

  private formatCompanyProfile(profile: CompanyProfile, verbose: boolean = false) {
    this.log(`Formatting company profile for ${profile.company_name}, verbose: ${verbose}`);

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

    // Add verbose-only sections
    if (verbose) {
      if (profile.sic_codes && profile.sic_codes.length > 0) {
        sections.push(`**SIC Codes**: ${profile.sic_codes.join(', ')}`);
      }

      if (profile.previous_company_names && profile.previous_company_names.length > 0) {
        const previousNames = profile.previous_company_names
          .map(
            name =>
              `${name.name} (from ${formatDate(name.effective_from)} to ${formatDate(name.ceased_on)})`
          )
          .join('\n- ');
        sections.push(`**Previous Names**:\n- ${previousNames}`);
      }

      if (profile.links) {
        sections.push(
          '**Additional Information Available**:' +
            (profile.links.filing_history ? '\n- Filing History' : '') +
            (profile.links.officers ? '\n- Officers' : '') +
            (profile.links.persons_with_significant_control_statements
              ? '\n- Persons with Significant Control'
              : '')
        );
      }
    }

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
