import { createApiClient } from "@companieshouse/api-sdk-node";
import { ApiClient, CompanyProfile, CompanySearchResult, ApiCompanyProfile } from "../types/companies-house.js";
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

      const resource = response.resource as ApiCompanyProfile;
      const profile: CompanyProfile = {
        companyNumber: resource.company_number,
        companyName: resource.company_name,
        companyStatus: resource.company_status,
        type: resource.type,
        dateOfCreation: resource.date_of_creation,
      };

      if (resource.registered_office_address) {
        const address: { [key: string]: string } = {};
        if (resource.registered_office_address.premises) {
          address.line1 = resource.registered_office_address.premises;
        }
        if (resource.registered_office_address.address_line_1) {
          address.line2 = resource.registered_office_address.address_line_1;
        }
        if (resource.registered_office_address.postal_code) {
          address.postalCode = resource.registered_office_address.postal_code;
        }
        if (resource.registered_office_address.locality) {
          address.locality = resource.registered_office_address.locality;
        }
        if (resource.registered_office_address.region) {
          address.region = resource.registered_office_address.region;
        }
        if (resource.registered_office_address.country) {
          address.country = resource.registered_office_address.country;
        }

        if (Object.keys(address).length > 0) {
          profile.registeredOfficeAddress = address;
        }
      }

      if (resource.accounts) {
        const accounts: { [key: string]: string | boolean } = {};
        if (resource.accounts.next_due) {
          accounts.nextDue = resource.accounts.next_due;
        }
        if (resource.accounts.next_made_up_to) {
          accounts.nextMadeUpTo = resource.accounts.next_made_up_to;
        }
        if (typeof resource.accounts.overdue === 'boolean') {
          accounts.overdue = resource.accounts.overdue;
        }

        if (Object.keys(accounts).length > 0) {
          profile.accounts = accounts as CompanyProfile['accounts'];
        }
      }

      if (resource.confirmation_statement) {
        const statement: { [key: string]: string | boolean } = {};
        if (resource.confirmation_statement.next_due) {
          statement.nextDue = resource.confirmation_statement.next_due;
        }
        if (resource.confirmation_statement.next_made_up_to) {
          statement.nextMadeUpTo = resource.confirmation_statement.next_made_up_to;
        }
        if (typeof resource.confirmation_statement.overdue === 'boolean') {
          statement.overdue = resource.confirmation_statement.overdue;
        }

        if (Object.keys(statement).length > 0) {
          profile.confirmationStatement = statement as CompanyProfile['confirmationStatement'];
        }
      }

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