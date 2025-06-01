import { GetFilingHistoryTool } from "../../../src/tools/get-filing-history.js";
import { CompaniesHouseClient } from "../../../src/lib/client.js";
import { FilingHistoryList, FilingHistoryItem } from "../../../src/types/companies-house.js";

// Mock the Companies House client
jest.mock("../../../src/lib/client.js");

describe("GetFilingHistoryTool", () => {
  let tool: GetFilingHistoryTool;
  let mockClient: jest.Mocked<CompaniesHouseClient>;

  beforeEach(() => {
    mockClient = {
      getFilingHistory: jest.fn(),
    } as any;

    tool = new GetFilingHistoryTool(mockClient);
  });

  describe("Input Validation", () => {
    it("should validate company number format", async () => {
      const result = await tool.execute({ companyNumber: "invalid", limit: 25, startIndex: 0 });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("Company number must be 8 characters");
    });

    it("should accept valid company number", async () => {
      const mockFilings: FilingHistoryList = {
        items: [{
          transaction_id: "123456789",
          category: "accounts",
          description: "Annual accounts",
          date: "2023-01-01",
          type: "AA",
        }],
        total_count: 1,
        start_index: 0,
        items_per_page: 25,
      };

      mockClient.getFilingHistory.mockResolvedValue(mockFilings);

      const result = await tool.execute({ companyNumber: "00006400", limit: 25, startIndex: 0 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0]?.text).toContain("Annual accounts");
    });

    it("should handle optional parameters", async () => {
      const mockFilings: FilingHistoryList = {
        items: [],
        total_count: 0,
        start_index: 0,
        items_per_page: 25,
      };

      mockClient.getFilingHistory.mockResolvedValue(mockFilings);

      await tool.execute({
        companyNumber: "00006400",
        category: "accounts",
        limit: 50,
        startIndex: 10
      });

      expect(mockClient.getFilingHistory).toHaveBeenCalledWith(
        "00006400",
        { category: "accounts", limit: 50, startIndex: 10 }
      );
    });
  });

  describe("Response Formatting", () => {
    it("should format filing history list", async () => {
      const mockFilings: FilingHistoryList = {
        items: [
          {
            transaction_id: "123456789",
            category: "accounts",
            description: "Annual accounts made up to 31 December 2022",
            date: "2023-01-15",
            type: "AA",
            pages: 15,
            barcode: "X9ABC123",
            status: "available"
          },
          {
            transaction_id: "987654321",
            category: "annual-return",
            description: "Annual return made up to 31 December 2022",
            date: "2023-01-01",
            type: "AR01",
            pages: 3,
            barcode: "Y8DEF456"
          }
        ],
        total_count: 2,
        start_index: 0,
        items_per_page: 25,
      };

      mockClient.getFilingHistory.mockResolvedValue(mockFilings);

      const result = await tool.execute({ companyNumber: "00006400", limit: 25, startIndex: 0 });
      const text = result.content[0]?.text;

      expect(text).toContain("Found 2 filings");
      expect(text).toContain("Annual accounts made up to 31 December 2022");
      expect(text).toContain("Category: accounts");
      expect(text).toContain("Type: AA");
      expect(text).toContain("Pages: 15");
      expect(text).toContain("Document ID: X9ABC123");
      expect(text).toContain("Status: available");
      expect(text).toContain("Annual return made up to 31 December 2022");
    });

    it("should handle pagination", async () => {
      const mockFilings: FilingHistoryList = {
        items: Array(25).fill({
          transaction_id: "123456789",
          category: "accounts",
          description: "Annual accounts",
          date: "2023-01-01",
          type: "AA",
        }),
        total_count: 100,
        start_index: 0,
        items_per_page: 25,
      };

      mockClient.getFilingHistory.mockResolvedValue(mockFilings);

      const result = await tool.execute({ companyNumber: "00006400", limit: 25, startIndex: 0 });
      expect(result.content[0]?.text).toContain("Showing 25 of 100 filings");
      expect(result.content[0]?.text).toContain("Use 'startIndex' and 'limit' parameters for pagination");
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors", async () => {
      mockClient.getFilingHistory.mockRejectedValue(new Error("Company not found"));

      const result = await tool.execute({ companyNumber: "00006400", limit: 25, startIndex: 0 });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("Company not found");
    });

    it("should handle empty results", async () => {
      const mockFilings: FilingHistoryList = {
        items: [],
        total_count: 0,
        start_index: 0,
        items_per_page: 25,
      };

      mockClient.getFilingHistory.mockResolvedValue(mockFilings);

      const result = await tool.execute({ companyNumber: "00006400", limit: 25, startIndex: 0 });
      expect(result.isError).toBeUndefined();
      expect(result.content[0]?.text).toContain("No filing history found");
    });
  });
}); 