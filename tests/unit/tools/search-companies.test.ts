import { SearchCompaniesTool } from "../../../src/tools/search-companies.js";
import { CompaniesHouseClient } from "../../../src/lib/client.js";
import { APIError } from "../../../src/lib/errors.js";

jest.mock("../../../src/lib/client.js");

describe("SearchCompaniesTool", () => {
  let tool: SearchCompaniesTool;
  const mockApiKey = "test-api-key";

  beforeEach(() => {
    jest.clearAllMocks();
    tool = new SearchCompaniesTool(mockApiKey);
  });

  describe("Tool Interface", () => {
    it("should have correct name", () => {
      expect(tool.getName()).toBe("search_companies");
    });

    it("should have descriptive description", () => {
      expect(tool.getDescription()).toContain("Search for UK companies");
    });

    it("should provide parameter schema", () => {
      const schema = tool.getParameterSchema();
      expect(schema).toBeDefined();
    });
  });

  describe("Execute", () => {
    const mockCompany = {
      companyNumber: "12345678",
      title: "Test Company Ltd",
      companyStatus: "active",
      companyType: "ltd",
      dateOfCreation: "2020-01-01",
      address: {
        line1: "123",
        line2: "Test Street",
        postalCode: "TE1 1ST",
        locality: "Testville",
      },
    };

    it("should format company search results correctly", async () => {
      const mockSearchCompanies = jest.fn().mockResolvedValue([mockCompany]);
      (CompaniesHouseClient.prototype.searchCompanies as jest.Mock) = mockSearchCompanies;

      const result = await tool.execute({
        query: "test company",
        limit: 1,
        activeOnly: true,
      });

      expect(result.content[0].text).toContain("**Test Company Ltd** (No. 12345678)");
      expect(result.content[0].text).toContain("Status: active");
      expect(result.content[0].text).toContain("Incorporated: 2020-01-01");
      expect(result.content[0].text).toContain("Address: 123, Test Street, Testville, TE1 1ST");
    });

    it("should handle missing optional fields", async () => {
      const companyWithoutOptionals = {
        companyNumber: "12345678",
        title: "Test Company Ltd",
        companyStatus: "active",
        companyType: "ltd",
        dateOfCreation: "2020-01-01",
      };

      const mockSearchCompanies = jest.fn().mockResolvedValue([companyWithoutOptionals]);
      (CompaniesHouseClient.prototype.searchCompanies as jest.Mock) = mockSearchCompanies;

      const result = await tool.execute({
        query: "test company",
      });

      expect(result.content[0].text).toContain("**Test Company Ltd** (No. 12345678)");
      expect(result.content[0].text).toContain("Status: active");
      expect(result.content[0].text).toContain("Incorporated: 2020-01-01");
      expect(result.content[0].text).not.toContain("Address:");
    });

    it("should handle no results", async () => {
      const mockSearchCompanies = jest.fn().mockResolvedValue([]);
      (CompaniesHouseClient.prototype.searchCompanies as jest.Mock) = mockSearchCompanies;

      const result = await tool.execute({
        query: "nonexistent company",
      });

      expect(result.content[0].text).toContain("No companies found");
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid parameters", async () => {
      const result = await tool.execute({
        query: "", // Empty query should fail validation
      });

      expect(result).toHaveProperty("isError", true);
      expect(result.content[0].text).toContain("Invalid parameters");
    });

    it("should handle API errors", async () => {
      const mockSearchCompanies = jest.fn().mockRejectedValue(new APIError("API error", 500));
      (CompaniesHouseClient.prototype.searchCompanies as jest.Mock) = mockSearchCompanies;

      const result = await tool.execute({
        query: "test company",
      });

      expect(result).toHaveProperty("isError", true);
      expect(result.content[0].text).toContain("Error: API error");
    });

    it("should handle unexpected errors", async () => {
      const mockSearchCompanies = jest.fn().mockRejectedValue(new Error("Unexpected error"));
      (CompaniesHouseClient.prototype.searchCompanies as jest.Mock) = mockSearchCompanies;

      const result = await tool.execute({
        query: "test company",
      });

      expect(result).toHaveProperty("isError", true);
      expect(result.content[0].text).toContain("unexpected error occurred");
    });
  });
}); 