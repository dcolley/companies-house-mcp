import { createApiClient } from "@companieshouse/api-sdk-node";
import { CompanyProfile, CompanySearchResult } from "../types/companies-house.js";
import { RateLimiter } from "./rate-limiter.js";
import { Cache } from "./cache.js";
import { APIError } from "./errors.js";

export class CompaniesHouseClient {
  private apiClient;
  private rateLimiter: RateLimiter;
  private cache: Cache;

  constructor(
    apiKey: string,
    requestsPerFiveMinutes: number = 500,
    cacheSize: number = 1000
  ) {
    if (!apiKey) {
      throw new Error("Companies House API key is required");
    }

    this.apiClient = createApiClient(apiKey);
    this.rateLimiter = new RateLimiter(requestsPerFiveMinutes, 5 * 60 * 1000); // 5 minutes in ms
    this.cache = new Cache(cacheSize);
  }

  /**
   * Search for companies by name
   */
  async searchCompanies(
    query: string,
    limit: number = 20,
    activeOnly: boolean = true
  ): Promise<CompanySearchResult[]> {
    const cacheKey = `search:${query}:${limit}:${activeOnly}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as CompanySearchResult[];
    }

    await this.rateLimiter.checkLimit();

    try {
      const response = await this.apiClient.companySearch.getCompanies({
        q: query,
        items_per_page: limit,
        start_index: 0,
      });

      if (!response.resource) {
        throw new APIError("No results found", 404);
      }

      const results = response.resource.items
        .filter((item) => !activeOnly || item.company_status === "active")
        .map((item) => ({
          company_number: item.company_number,
          title: item.title,
          company_status: item.company_status,
          company_type: item.company_type,
          date_of_creation: item.date_of_creation,
          address: item.address,
        }));

      this.cache.set(cacheKey, results, 5 * 60); // Cache for 5 minutes
      return results;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Get detailed company profile
   */
  async getCompanyProfile(companyNumber: string): Promise<CompanyProfile> {
    const cacheKey = `profile:${companyNumber}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as CompanyProfile;
    }

    await this.rateLimiter.checkLimit();

    try {
      const response = await this.apiClient.companyProfile.getCompanyProfile(companyNumber);

      if (!response.resource) {
        throw new APIError(`Company ${companyNumber} not found`, 404);
      }

      const profile: CompanyProfile = {
        company_number: response.resource.company_number,
        company_name: response.resource.company_name,
        company_status: response.resource.company_status,
        company_type: response.resource.type,
        date_of_creation: response.resource.date_of_creation,
        registered_office_address: response.resource.registered_office_address,
        accounts: response.resource.accounts,
        confirmation_statement: response.resource.confirmation_statement,
      };

      this.cache.set(cacheKey, profile, 30 * 60); // Cache for 30 minutes
      return profile;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleApiError(error: any): Error {
    if (error instanceof APIError) {
      return error;
    }

    const status = error.status || 500;
    let message = "An error occurred while accessing the Companies House API";

    switch (status) {
      case 401:
        message = "Invalid Companies House API key";
        break;
      case 404:
        message = "Company not found";
        break;
      case 429:
        message = "Rate limit exceeded. Please try again later";
        break;
      case 500:
        message = "Companies House API service error";
        break;
    }

    return new APIError(message, status);
  }
} 