import { GetCompanyOfficersTool } from "../../../src/tools/get-company-officers.js";
import { CompaniesHouseClient } from "../../../src/lib/client.js";
import { Officer, OfficersList } from "../../../src/types/companies-house.js";

// Mock the Companies House client
jest.mock("../../../src/lib/client.js");

describe("GetCompanyOfficersTool", () => {
  let tool: GetCompanyOfficersTool;
  let mockClient: jest.Mocked<CompaniesHouseClient>;

  beforeEach(() => {
    mockClient = {
      getCompanyOfficers: jest.fn(),
    } as any;

    tool = new GetCompanyOfficersTool(mockClient);
  });

  describe("Input Validation", () => {
    it("should validate company number format", async () => {
      const result = await tool.execute({ companyNumber: "invalid", activeOnly: true, limit: 35 });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("String must contain exactly 8 character(s)");
    });

    it("should accept valid company number", async () => {
      const mockOfficers: OfficersList = {
        items: [{
          name: "John Smith",
          officer_role: "director",
          appointed_on: "2020-01-01",
        }],
        total_results: 1,
        start_index: 0,
        items_per_page: 35,
      };

      mockClient.getCompanyOfficers.mockResolvedValue(mockOfficers);

      const result = await tool.execute({ companyNumber: "00006400", activeOnly: true, limit: 35 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0]?.text).toContain("John Smith");
    });

    it("should handle optional parameters", async () => {
      const mockOfficers: OfficersList = {
        items: [],
        total_results: 0,
        start_index: 0,
        items_per_page: 35,
      };

      mockClient.getCompanyOfficers.mockResolvedValue(mockOfficers);

      await tool.execute({
        companyNumber: "00006400",
        activeOnly: true,
        limit: 50
      });

      expect(mockClient.getCompanyOfficers).toHaveBeenCalledWith(
        "00006400",
        { activeOnly: true, limit: 50 }
      );
    });
  });

  describe("Response Formatting", () => {
    it("should format active officers list", async () => {
      const mockOfficers: OfficersList = {
        items: [
          {
            name: "John Smith",
            officer_role: "director",
            appointed_on: "2020-01-01",
            nationality: "British",
            occupation: "Company Director",
            address: {
              address_line_1: "123 Business Street",
              locality: "London",
              postal_code: "SW1A 1AA"
            }
          },
          {
            name: "Jane Doe",
            officer_role: "secretary",
            appointed_on: "2020-01-01",
            nationality: "British",
            address: {
              address_line_1: "456 Corporate Road",
              locality: "London",
              postal_code: "SW1A 1AB"
            }
          }
        ],
        total_results: 2,
        active_count: 2,
        start_index: 0,
        items_per_page: 35,
      };

      mockClient.getCompanyOfficers.mockResolvedValue(mockOfficers);

      const result = await tool.execute({ companyNumber: "00006400", activeOnly: true, limit: 35 });
      const text = result.content[0]?.text;

      expect(text).toContain("Found 2 officers (2 active)");
      expect(text).toContain("John Smith");
      expect(text).toContain("director");
      expect(text).toContain("Company Director");
      expect(text).toContain("123 Business Street");
      expect(text).toContain("Jane Doe");
      expect(text).toContain("secretary");
    });

    it("should handle resigned officers", async () => {
      const mockOfficers: OfficersList = {
        items: [
          {
            name: "John Smith",
            officer_role: "director",
            appointed_on: "2020-01-01",
            resigned_on: "2023-01-01",
          }
        ],
        total_results: 1,
        active_count: 0,
        resigned_count: 1,
        start_index: 0,
        items_per_page: 35,
      };

      mockClient.getCompanyOfficers.mockResolvedValue(mockOfficers);

      const result = await tool.execute({ companyNumber: "00006400", activeOnly: false, limit: 35 });
      const text = result.content[0]?.text;

      expect(text).toContain("Found 1 officer");
      expect(text).toContain("John Smith");
      expect(text).toContain("Resigned: 1 January 2023");
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors", async () => {
      mockClient.getCompanyOfficers.mockRejectedValue(new Error("Company not found"));

      const result = await tool.execute({ companyNumber: "00006400", activeOnly: true, limit: 35 });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("Company not found");
    });

    it("should handle empty results", async () => {
      const mockOfficers: OfficersList = {
        items: [],
        total_results: 0,
        start_index: 0,
        items_per_page: 35,
      };

      mockClient.getCompanyOfficers.mockResolvedValue(mockOfficers);

      const result = await tool.execute({ companyNumber: "00006400", activeOnly: true, limit: 35 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0]?.text).toContain("No officers found");
    });

    it("should handle pagination", async () => {
      const mockOfficers: OfficersList = {
        items: Array(35).fill({
          name: "John Smith",
          officer_role: "director",
          appointed_on: "2020-01-01",
        }),
        total_results: 50,
        start_index: 0,
        items_per_page: 35,
      };

      mockClient.getCompanyOfficers.mockResolvedValue(mockOfficers);

      const result = await tool.execute({ companyNumber: "00006400", activeOnly: true, limit: 35 });
      expect(result.content[0]?.text).toContain("Showing 35 of 50 officers");
    });
  });
}); 