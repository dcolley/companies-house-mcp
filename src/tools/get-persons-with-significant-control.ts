import { z } from "zod";
import { CompaniesHouseClient } from "../lib/client.js";
import { MCPTool } from "../types/mcp.js";
import { formatDate, formatAddress } from "../lib/formatters.js";

const inputSchema = {
  type: "object" as const,
  properties: {
    companyNumber: {
      type: "string",
      description: "8-character company number (e.g., '00006400')",
      pattern: "^[0-9A-Z]{8}$"
    },
    limit: {
      type: "number",
      description: "Maximum number of PSCs to return (default: 25, max: 100)",
      minimum: 1,
      maximum: 100
    },
    startIndex: {
      type: "number", 
      description: "Index to start results from (default: 0)",
      minimum: 0
    }
  },
  required: ["companyNumber"]
};

const zodSchema = z.object({
  companyNumber: z.string()
    .length(8)
    .regex(/^[0-9A-Z]{8}$/, "Company number must be 8 characters (e.g., '00006400')"),
  limit: z.number().min(1).max(100).optional().default(25),
  startIndex: z.number().min(0).optional().default(0)
});

export class GetPersonsWithSignificantControlTool implements MCPTool {
  name = "get_persons_with_significant_control";
  description = "Get persons with significant control (PSC) for a company - individuals and entities with significant influence or ownership";
  inputSchema = inputSchema;

  constructor(private client: CompaniesHouseClient) {}

  async execute(args: z.infer<typeof zodSchema>) {
    try {
      // Validate input
      const { companyNumber, limit, startIndex } = zodSchema.parse(args);

      // Fetch PSCs
      const pscData = await this.client.getPersonsWithSignificantControl(companyNumber, { limit, startIndex });

      // Format response
      const content = [
        {
          type: "text" as const,
          text: this.formatPSCs(pscData, companyNumber)
        }
      ];

      return { content };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isError: true,
          content: [{
            type: "text" as const,
            text: `Error: Invalid input - ${error.errors[0]?.message}`
          }]
        };
      }

      // Handle API errors
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : "Failed to fetch persons with significant control"}`
        }]
      };
    }
  }

  private formatPSCs(pscData: any, companyNumber: string): string {
    if (!pscData?.items || pscData.items.length === 0) {
      return `No persons with significant control found for company ${companyNumber}`;
    }

    const header = `**Persons with Significant Control for ${companyNumber}**\n`;
    const summary = `Found ${pscData.items.length} PSCs (showing ${pscData.start_index + 1}-${Math.min(pscData.start_index + pscData.items.length, pscData.total_results)} of ${pscData.total_results} total)\n\n`;

    const pscs = pscData.items.map((psc: any, index: number) => {
      const sections = [
        `**${index + 1}. ${psc.name}**`,
        psc.kind ? `Type: ${psc.kind.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}` : null,
        psc.notified_on ? `Notified: ${formatDate(psc.notified_on)}` : null,
        psc.ceased_on ? `Ceased: ${formatDate(psc.ceased_on)}` : null,
        this.formatNatureOfControl(psc.natures_of_control),
        psc.nationality ? `Nationality: ${psc.nationality}` : null,
        psc.country_of_residence ? `Country of Residence: ${psc.country_of_residence}` : null,
        psc.date_of_birth && psc.date_of_birth.month && psc.date_of_birth.year ? 
          `Date of Birth: ${psc.date_of_birth.month}/${psc.date_of_birth.year}` : null,
        this.formatPSCAddress(psc.address)
      ];

      return sections.filter(Boolean).join("\n");
    });

    return header + summary + pscs.join("\n\n");
  }

  private formatNatureOfControl(natures: string[] | undefined): string | null {
    if (!natures || natures.length === 0) return null;
    
    const formattedNatures = natures.map(nature => 
      nature.replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
    );
    
    return `Nature of Control: ${formattedNatures.join(", ")}`;
  }

  private formatPSCAddress(address: any): string | null {
    if (!address) return null;
    
    // For PSCs, we only show partial address for privacy
    const addressParts = [];
    if (address.locality) addressParts.push(address.locality);
    if (address.region) addressParts.push(address.region);
    if (address.country) addressParts.push(address.country);
    
    return addressParts.length > 0 ? `Location: ${addressParts.join(", ")}` : null;
  }
} 