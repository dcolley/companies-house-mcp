import { createApiClient } from "@companieshouse/api-sdk-node";
import { ApiClient, CompanyProfile, CompanySearchResult, ApiCompanyProfile, OfficersList, FilingHistoryList } from "../types/companies-house.js";
import { RateLimiter } from "./rate-limiter.js";
import { Cache } from "./cache.js";
import { APIError } from "./errors.js";

export class CompaniesHouseClient {
  private apiClient: ApiClient;
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

    this.apiClient = createApiClient(apiKey) as unknown as ApiClient;
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
      const response = await this.apiClient.search.companies({
        q: query,
        items_per_page: limit,
        start_index: 0,
      });

      if (!response.resource) {
        throw new APIError("No results found", 404);
      }

      const results = response.resource.items
        .filter((item) => !activeOnly || item.company_status === "active")
        .map((item) => {
          const result: CompanySearchResult = {
            companyNumber: item.company_number,
            title: item.title,
            companyStatus: item.company_status,
            companyType: item.type,
            dateOfCreation: item.date_of_creation || "",
          };

          if (item.address) {
            const address: { [key: string]: string } = {};
            if (item.address.premises) address.line1 = item.address.premises;
            if (item.address.address_line_1) address.line2 = item.address.address_line_1;
            if (item.address.postal_code) address.postalCode = item.address.postal_code;
            if (item.address.locality) address.locality = item.address.locality;
            if (item.address.region) address.region = item.address.region;
            if (item.address.country) address.country = item.address.country;

            if (Object.keys(address).length > 0) {
              result.address = address;
            }
          }

          return result;
        });

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
      const response = await this.apiClient.company.getProfile(companyNumber);

      if (!response.resource) {
        throw new APIError(`Company ${companyNumber} not found`, 404);
      }

      const profile = this.transformCompanyProfile(response.resource);
      this.cache.set(cacheKey, profile, 30 * 60); // Cache for 30 minutes
      return profile;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async getCompanyOfficers(companyNumber: string, options: { activeOnly?: boolean; limit?: number } = {}): Promise<OfficersList> {
    const { activeOnly = true, limit = 35 } = options;
    const cacheKey = `officers:${companyNumber}:${activeOnly}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as OfficersList;
    }

    await this.rateLimiter.checkLimit();

    try {
      // Note: The actual API client method would be different
      // This is a placeholder implementation based on expected interface
      const response = await (this.apiClient as any).company.getOfficers(companyNumber, {
        items_per_page: limit,
        register_view: activeOnly ? 'active' : undefined
      });

      if (!response.resource) {
        throw new APIError(`Officers for company ${companyNumber} not found`, 404);
      }

      this.cache.set(cacheKey, response.resource, 10 * 60); // Cache for 10 minutes
      return response.resource;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async getFilingHistory(companyNumber: string, options: { category?: string; limit?: number; startIndex?: number } = {}): Promise<FilingHistoryList> {
    const { category, limit = 25, startIndex = 0 } = options;
    const cacheKey = `filings:${companyNumber}:${category || 'all'}:${limit}:${startIndex}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as FilingHistoryList;
    }

    await this.rateLimiter.checkLimit();

    try {
      // Note: The actual API client method would be different
      // This is a placeholder implementation based on expected interface
      const response = await (this.apiClient as any).company.getFilingHistory(companyNumber, {
        items_per_page: limit,
        start_index: startIndex,
        category: category
      });

      if (!response.resource) {
        throw new APIError(`Filing history for company ${companyNumber} not found`, 404);
      }

      this.cache.set(cacheKey, response.resource, 2 * 60); // Cache for 2 minutes
      return response.resource;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async getCompanyCharges(companyNumber: string, options: { limit?: number; startIndex?: number } = {}) {
    const { limit = 25, startIndex = 0 } = options;
    const cacheKey = `charges:${companyNumber}:${limit}:${startIndex}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    await this.rateLimiter.checkLimit();

    try {
      const response = await (this.apiClient as any).company.getCharges(companyNumber, {
        items_per_page: limit,
        start_index: startIndex
      });

      if (!response.resource) {
        throw new APIError(`Charges for company ${companyNumber} not found`, 404);
      }

      this.cache.set(cacheKey, response.resource, 30 * 60); // Cache for 30 minutes
      return response.resource;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async getPersonsWithSignificantControl(companyNumber: string, options: { limit?: number; startIndex?: number } = {}) {
    const { limit = 25, startIndex = 0 } = options;
    const cacheKey = `pscs:${companyNumber}:${limit}:${startIndex}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    await this.rateLimiter.checkLimit();

    try {
      const response = await (this.apiClient as any).company.getPersonsWithSignificantControl(companyNumber, {
        items_per_page: limit,
        start_index: startIndex
      });

      if (!response.resource) {
        throw new APIError(`PSCs for company ${companyNumber} not found`, 404);
      }

      this.cache.set(cacheKey, response.resource, 30 * 60); // Cache for 30 minutes
      return response.resource;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async searchOfficers(query: string, options: { limit?: number; startIndex?: number } = {}) {
    const { limit = 35, startIndex = 0 } = options;
    const cacheKey = `officer-search:${query}:${limit}:${startIndex}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    await this.rateLimiter.checkLimit();

    try {
      const response = await (this.apiClient as any).search.officers({
        q: query,
        items_per_page: limit,
        start_index: startIndex
      });

      if (!response.resource) {
        throw new APIError("No officers found", 404);
      }

      this.cache.set(cacheKey, response.resource, 5 * 60); // Cache for 5 minutes
      return response.resource;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  private transformCompanyProfile(apiProfile: ApiCompanyProfile): CompanyProfile {
    const profile: CompanyProfile = {
      company_name: apiProfile.company_name,
      company_number: apiProfile.company_number,
      company_status: apiProfile.company_status,
      date_of_creation: apiProfile.date_of_creation,
      type: apiProfile.type
    };

    if (apiProfile.registered_office_address) {
      const address: any = {};
      if (apiProfile.registered_office_address.premises) address.premises = apiProfile.registered_office_address.premises;
      if (apiProfile.registered_office_address.address_line_1) address.address_line_1 = apiProfile.registered_office_address.address_line_1;
      if (apiProfile.registered_office_address.postal_code) address.postal_code = apiProfile.registered_office_address.postal_code;
      if (apiProfile.registered_office_address.locality) address.locality = apiProfile.registered_office_address.locality;
      if (apiProfile.registered_office_address.region) address.region = apiProfile.registered_office_address.region;
      if (apiProfile.registered_office_address.country) address.country = apiProfile.registered_office_address.country;
      
      if (Object.keys(address).length > 0) {
        profile.registered_office_address = address;
      }
    }

    if (apiProfile.accounts?.next_due) {
      profile.accounts = {
        next_accounts: {
          due_on: apiProfile.accounts.next_due
        }
      };
    }

    if (apiProfile.confirmation_statement?.next_due) {
      profile.confirmation_statement = {
        next_due: apiProfile.confirmation_statement.next_due
      };
    }

    return profile;
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