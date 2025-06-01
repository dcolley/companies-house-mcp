import { CompaniesHouseClient } from "../../../src/lib/client.js";
import { APIError } from "../../../src/lib/errors.js";

jest.mock("@companieshouse/api-sdk-node", () => ({
  createApiClient: jest.fn(() => ({
    search: {
      companies: jest.fn(),
    },
    company: {
      getProfile: jest.fn(),
    },
  })),
}));

describe("CompaniesHouseClient", () => {
  let client: CompaniesHouseClient;
  const mockApiKey = "test-api-key";

  beforeEach(() => {
    client = new CompaniesHouseClient(mockApiKey);
  });

  describe("Constructor", () => {
    it("should create client with default settings", () => {
      expect(client).toBeInstanceOf(CompaniesHouseClient);
    });

    it("should throw error if API key is not provided", () => {
      expect(() => new CompaniesHouseClient("")).toThrow("Companies House API key is required");
    });
  });

  describe("searchCompanies", () => {
    const mockCompany = {
      company_number: "12345678",
      title: "Test Company",
      company_status: "active",
      type: "ltd",
      date_of_creation: "2020-01-01",
      address: {
        premises: "123",
        address_line_1: "Test Street",
        postal_code: "TE1 1ST",
        locality: "Testville",
        region: "Testshire",
        country: "United Kingdom",
      },
    };

    it("should search companies successfully", async () => {
      const mockSearchCompanies = jest.fn().mockResolvedValue({
        resource: {
          items: [mockCompany],
        },
      });
      (client as any).apiClient.search.companies = mockSearchCompanies;

      const results = await client.searchCompanies("test", 20, true);

      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result).toEqual({
        companyNumber: "12345678",
        title: "Test Company",
        companyStatus: "active",
        companyType: "ltd",
        dateOfCreation: "2020-01-01",
        address: {
          line1: "123",
          line2: "Test Street",
          postalCode: "TE1 1ST",
          locality: "Testville",
          region: "Testshire",
          country: "United Kingdom",
        },
      });
    });

    it("should handle missing address fields", async () => {
      const companyWithoutAddress = {
        company_number: "12345678",
        title: "Test Company",
        company_status: "active",
        type: "ltd",
        date_of_creation: "2020-01-01",
      };

      const mockSearchCompanies = jest.fn().mockResolvedValue({
        resource: {
          items: [companyWithoutAddress],
        },
      });
      (client as any).apiClient.search.companies = mockSearchCompanies;

      const results = await client.searchCompanies("test");
      expect(results).toHaveLength(1);
      const result = results[0]!;
      expect(result).toBeDefined();
      expect(result.address).toBeUndefined();
    });

    it("should throw error when no results found", async () => {
      const mockSearchCompanies = jest.fn().mockResolvedValue({ resource: null });
      (client as any).apiClient.search.companies = mockSearchCompanies;

      await expect(client.searchCompanies("test")).rejects.toThrow("No results found");
    });
  });

  describe("getCompanyProfile", () => {
    const mockProfile = {
      company_number: "12345678",
      company_name: "Test Company Ltd",
      company_status: "active",
      type: "ltd",
      date_of_creation: "2020-01-01",
      registered_office_address: {
        premises: "123",
        address_line_1: "Test Street",
        postal_code: "TE1 1ST",
        locality: "Testville",
        region: "Testshire",
        country: "United Kingdom",
      },
      accounts: {
        next_due: "2024-01-01",
        next_made_up_to: "2023-12-31",
        overdue: false,
      },
      confirmation_statement: {
        next_due: "2024-06-01",
        next_made_up_to: "2024-05-31",
        overdue: false,
      },
    };

    it("should get company profile successfully", async () => {
      const mockGetProfile = jest.fn().mockResolvedValue({ resource: mockProfile });
      (client as any).apiClient.company.getProfile = mockGetProfile;

      const profile = await client.getCompanyProfile("12345678");

      expect(profile).toEqual({
        company_number: "12345678",
        company_name: "Test Company Ltd",
        company_status: "active",
        type: "ltd",
        date_of_creation: "2020-01-01",
        registered_office_address: {
          premises: "123",
          address_line_1: "Test Street",
          postal_code: "TE1 1ST",
          locality: "Testville",
          region: "Testshire",
          country: "United Kingdom",
        },
        accounts: {
          next_accounts: {
            due_on: "2024-01-01",
          },
        },
        confirmation_statement: {
          next_due: "2024-06-01",
        },
      });
    });

    it("should handle missing optional fields", async () => {
      const profileWithoutOptionals = {
        company_number: "12345678",
        company_name: "Test Company Ltd",
        company_status: "active",
        type: "ltd",
        date_of_creation: "2020-01-01",
      };

      const mockGetProfile = jest.fn().mockResolvedValue({ resource: profileWithoutOptionals });
      (client as any).apiClient.company.getProfile = mockGetProfile;

      const profile = await client.getCompanyProfile("12345678");

      expect(profile.registered_office_address).toBeUndefined();
      expect(profile.accounts).toBeUndefined();
      expect(profile.confirmation_statement).toBeUndefined();
    });

    it("should throw error when company not found", async () => {
      const mockGetProfile = jest.fn().mockResolvedValue({ resource: null });
      (client as any).apiClient.company.getProfile = mockGetProfile;

      await expect(client.getCompanyProfile("12345678")).rejects.toThrow("Company 12345678 not found");
    });
  });

  describe("Error Handling", () => {
    it("should handle API key error", async () => {
      const mockSearchCompanies = jest.fn().mockRejectedValue({ status: 401 });
      (client as any).apiClient.search.companies = mockSearchCompanies;

      await expect(client.searchCompanies("test")).rejects.toThrow("Invalid Companies House API key");
    });

    it("should handle rate limit error", async () => {
      const mockSearchCompanies = jest.fn().mockRejectedValue({ status: 429 });
      (client as any).apiClient.search.companies = mockSearchCompanies;

      await expect(client.searchCompanies("test")).rejects.toThrow("Rate limit exceeded");
    });

    it("should handle server error", async () => {
      const mockSearchCompanies = jest.fn().mockRejectedValue({ status: 500 });
      (client as any).apiClient.search.companies = mockSearchCompanies;

      await expect(client.searchCompanies("test")).rejects.toThrow("Companies House API service error");
    });
  });
}); 