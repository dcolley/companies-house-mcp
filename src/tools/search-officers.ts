import { z } from "zod";
import { CompaniesHouseClient } from "../lib/client.js";
import { MCPTool } from "../types/mcp.js";
import { formatDate } from "../lib/formatters.js";

const inputSchema = {
  type: "object" as const,
  properties: {
    query: {
      type: "string",
      description: "Officer name or partial name to search for"
    },
    limit: {
      type: "number",
      description: "Maximum number of officers to return (default: 35, max: 100)",
      minimum: 1,
      maximum: 100
    },
    startIndex: {
      type: "number", 
      description: "Index to start results from (default: 0)",
      minimum: 0
    }
  },
  required: ["query"]
};

const zodSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().min(1).max(100).optional().default(35),
  startIndex: z.number().min(0).optional().default(0)
});

export class SearchOfficersTool implements MCPTool {
  name = "search_officers";
  description = "Search for UK company officers by name";
  inputSchema = inputSchema;

  constructor(private client: CompaniesHouseClient) {}

  async execute(args: z.infer<typeof zodSchema>) {
    try {
      // Validate input
      const { query, limit, startIndex } = zodSchema.parse(args);

      // Search officers
      const officerData = await this.client.searchOfficers(query, { limit, startIndex });

      // Format response
      const content = [
        {
          type: "text" as const,
          text: this.formatOfficers(officerData, query)
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
          text: `Error: ${error instanceof Error ? error.message : "Failed to search officers"}`
        }]
      };
    }
  }

  private formatOfficers(officerData: any, query: string): string {
    if (!officerData?.items || officerData.items.length === 0) {
      return `No officers found matching "${query}"`;
    }

    const header = `**Officer Search Results for "${query}"**\n`;
    const summary = `Found ${officerData.items.length} officers (showing ${officerData.start_index + 1}-${Math.min(officerData.start_index + officerData.items.length, officerData.total_results)} of ${officerData.total_results} total)\n\n`;

    const officers = officerData.items.map((officer: any, index: number) => {
      const sections = [
        `**${index + 1}. ${officer.title}**`,
        this.formatOfficerAppointments(officer.appointments),
        officer.date_of_birth && officer.date_of_birth.month && officer.date_of_birth.year ? 
          `Date of Birth: ${officer.date_of_birth.month}/${officer.date_of_birth.year}` : null,
        this.formatOfficerAddress(officer.address)
      ];

      return sections.filter(Boolean).join("\n");
    });

    return header + summary + officers.join("\n\n");
  }

  private formatOfficerAppointments(appointments: any[] | undefined): string | null {
    if (!appointments || appointments.length === 0) return null;
    
    const appointmentList = appointments.slice(0, 5).map(appointment => {
      const parts = [
        appointment.officer_role || 'Unknown Role',
        appointment.company_name ? `at ${appointment.company_name}` : null,
        appointment.company_number ? `(${appointment.company_number})` : null,
        appointment.appointed_on ? `from ${formatDate(appointment.appointed_on)}` : null,
        appointment.resigned_on ? `to ${formatDate(appointment.resigned_on)}` : null
      ];
      
      return parts.filter(Boolean).join(" ");
    });

    const moreText = appointments.length > 5 ? `\n... and ${appointments.length - 5} more appointments` : '';
    
    return `Current/Recent Appointments:\n${appointmentList.join("\n")}${moreText}`;
  }

  private formatOfficerAddress(address: any): string | null {
    if (!address) return null;
    
    // For officers, we only show general location for privacy
    const addressParts = [];
    if (address.locality) addressParts.push(address.locality);
    if (address.region) addressParts.push(address.region);
    if (address.country) addressParts.push(address.country);
    
    return addressParts.length > 0 ? `Location: ${addressParts.join(", ")}` : null;
  }
} 