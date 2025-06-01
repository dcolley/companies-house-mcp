import { GetCompanyProfileTool } from "../../../src/tools/get-company-profile.js";
import { CompaniesHouseClient } from "../../../src/lib/client.js";
import { CompanyProfile } from "../../../src/types/companies-house.js";

// Mock the Companies House client
jest.mock("../../../src/lib/client.js");

describe("GetCompanyProfileTool", () => {
  let tool: GetCompanyProfileTool;
  let mockClient: jest.Mocked<CompaniesHouseClient>;

  beforeEach(() => {
    mockClient = {
      getCompanyProfile: jest.fn(),
    } as any;

    tool = new GetCompanyProfileTool(mockClient);
  });

  describe("Input Validation", () => {
    it("should validate company number format", async () => {
      const result = await tool.execute({ companyNumber: "invalid" });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("String must contain exactly 8 character(s)");
    });

    it("should accept valid company number", async () => {
      const mockProfile: CompanyProfile = {
        company_name: "Test Company",
        company_number: "00006400",
        company_status: "active",
        date_of_creation: "2020-01-01",
      };

      mockClient.getCompanyProfile.mockResolvedValue(mockProfile);

      const result = await tool.execute({ companyNumber: "00006400" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0]?.text).toContain("Test Company");
    });
  });

  describe("Response Formatting", () => {
    it("should format active company profile", async () => {
      const mockProfile: CompanyProfile = {
        company_name: "Test Company Ltd",
        company_number: "00006400",
        company_status: "active",
        type: "ltd",
        jurisdiction: "england-wales",
        date_of_creation: "2020-01-01",
        registered_office_address: {
          address_line_1: "123 Test Street",
          locality: "London",
          postal_code: "SW1A 1AA",
        },
        accounts: {
          last_accounts: {
            made_up_to: "2022-12-31",
            type: "full",
          },
          next_accounts: {
            due_on: "2024-01-01",
          },
        },
        confirmation_statement: {
          last_made_up_to: "2023-01-01",
          next_due: "2024-01-01",
        },
      };

      mockClient.getCompanyProfile.mockResolvedValue(mockProfile);

      const result = await tool.execute({ companyNumber: "00006400" });
      const text = result.content[0]?.text;

      expect(text).toContain("Test Company Ltd");
      expect(text).toContain("No. 00006400");
      expect(text).toContain("**Status**: active");
      expect(text).toContain("Type: ltd");
      expect(text).toContain("123 Test Street");
      expect(text).toContain("Last accounts made up to");
      expect(text).toContain("Next accounts due");
    });

    it("should handle dissolved company", async () => {
      const mockProfile: CompanyProfile = {
        company_name: "Dissolved Ltd",
        company_number: "00006401",
        company_status: "dissolved",
        date_of_creation: "2020-01-01",
        date_of_dissolution: "2023-01-01",
      };

      mockClient.getCompanyProfile.mockResolvedValue(mockProfile);

      const result = await tool.execute({ companyNumber: "00006401" });
      const text = result.content[0]?.text;

      expect(text).toContain("Dissolved Ltd");
      expect(text).toContain("**Status**: dissolved");
      expect(text).toContain("**Dissolved**: 1 January 2023");
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors", async () => {
      mockClient.getCompanyProfile.mockRejectedValue(new Error("Company not found"));

      const result = await tool.execute({ companyNumber: "00006400" });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("Company not found");
    });

    it("should handle missing data gracefully", async () => {
      const mockProfile: CompanyProfile = {
        company_name: "Minimal Ltd",
        company_number: "00006400",
        company_status: "active",
        date_of_creation: "2020-01-01",
      };

      mockClient.getCompanyProfile.mockResolvedValue(mockProfile);

      const result = await tool.execute({ companyNumber: "00006400" });
      expect(result.isError).toBeUndefined();
      expect(result.content[0]?.text).toContain("Minimal Ltd");
    });
  });
}); 