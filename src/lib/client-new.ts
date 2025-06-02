import {
  CompanyProfile,
  CompanySearchResult,
  OfficersList,
  FilingHistoryList,
} from '../types/companies-house.js';
import { RateLimiter } from './rate-limiter.js';
import { Cache } from './cache.js';
import { APIError } from './errors.js';

export class CompaniesHouseClient {
  private apiKey: string;
  private rateLimiter: RateLimiter;
  private cache: Cache;
  private baseUrl = 'https://api.company-information.service.gov.uk';

  constructor(apiKey: string, requestsPerFiveMinutes: number = 500, cacheSize: number = 1000) {
    if (!apiKey) {
      throw new Error('Companies House API key is required');
    }

    this.apiKey = apiKey;
    this.rateLimiter = new RateLimiter(requestsPerFiveMinutes, 5 * 60 * 1000); // 5 minutes in ms
    this.cache = new Cache(cacheSize);
  }

  /**
   * Make an authenticated HTTP request to the Companies House API
   */
  private async makeRequest(endpoint: string): Promise<any> {
    await this.rateLimiter.checkLimit();

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const status = response.status;
      let message = 'An error occurred while accessing the Companies House API';

      switch (status) {
        case 401:
          message = 'Invalid Companies House API key';
          break;
        case 404:
          message = 'Resource not found';
          break;
        case 429:
          message = 'Rate limit exceeded. Please try again later';
          break;
        case 500:
          message = 'Companies House API service error';
          break;
      }

      throw new APIError(message, status);
    }

    return await response.json();
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

    try {
      const params = new URLSearchParams({
        q: query,
        items_per_page: limit.toString(),
        start_index: '0',
      });

      const data = await this.makeRequest(`/search/companies?${params.toString()}`);

      if (!data.items) {
        return [];
      }

      const results = data.items
        .filter((item: any) => !activeOnly || item.company_status === 'active')
        .map((item: any) => {
          const result: CompanySearchResult = {
            companyNumber: item.company_number,
            title: item.title,
            companyStatus: item.company_status,
            companyType: item.company_type || item.type,
            dateOfCreation: item.date_of_creation || '',
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
      throw error instanceof APIError ? error : new APIError('Failed to search companies', 500);
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

    try {
      const data = await this.makeRequest(`/company/${companyNumber}`);

      const profile: CompanyProfile = {
        company_name: data.company_name,
        company_number: data.company_number,
        company_status: data.company_status,
        date_of_creation: data.date_of_creation,
        type: data.type,
      };

      if (data.registered_office_address) {
        profile.registered_office_address = {
          premises: data.registered_office_address.premises,
          address_line_1: data.registered_office_address.address_line_1,
          postal_code: data.registered_office_address.postal_code,
          locality: data.registered_office_address.locality,
          region: data.registered_office_address.region,
          country: data.registered_office_address.country,
        };
      }

      if (data.accounts) {
        profile.accounts = {
          next_accounts: data.accounts.next_accounts,
          accounting_reference_date: data.accounts.accounting_reference_date,
          last_accounts: data.accounts.last_accounts,
        };
      }

      if (data.confirmation_statement) {
        profile.confirmation_statement = data.confirmation_statement;
      }

      if (data.sic_codes) {
        profile.sic_codes = data.sic_codes;
      }

      if (data.previous_company_names) {
        profile.previous_company_names = data.previous_company_names;
      }

      this.cache.set(cacheKey, profile, 30 * 60); // Cache for 30 minutes
      return profile;
    } catch (error) {
      throw error instanceof APIError ? error : new APIError(`Failed to get company profile for ${companyNumber}`, 500);
    }
  }

  async getCompanyOfficers(
    companyNumber: string,
    options: { activeOnly?: boolean; limit?: number } = {}
  ): Promise<OfficersList> {
    const { activeOnly = true, limit = 35 } = options;
    const cacheKey = `officers:${companyNumber}:${activeOnly}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as OfficersList;
    }

    try {
      const params = new URLSearchParams({
        items_per_page: limit.toString(),
        start_index: '0',
      });

      if (activeOnly) {
        params.append('register_view', 'true');
      }

      const data = await this.makeRequest(`/company/${companyNumber}/officers?${params.toString()}`);

      this.cache.set(cacheKey, data, 10 * 60); // Cache for 10 minutes
      return data;
    } catch (error) {
      throw error instanceof APIError ? error : new APIError(`Failed to get officers for company ${companyNumber}`, 500);
    }
  }

  async getFilingHistory(
    companyNumber: string,
    options: { category?: string; limit?: number; startIndex?: number } = {}
  ): Promise<FilingHistoryList> {
    const { category, limit = 25, startIndex = 0 } = options;
    const cacheKey = `filings:${companyNumber}:${category || 'all'}:${limit}:${startIndex}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached as FilingHistoryList;
    }

    try {
      const params = new URLSearchParams({
        items_per_page: limit.toString(),
        start_index: startIndex.toString(),
      });

      if (category) {
        params.append('category', category);
      }

      const data = await this.makeRequest(`/company/${companyNumber}/filing-history?${params.toString()}`);

      this.cache.set(cacheKey, data, 2 * 60); // Cache for 2 minutes
      return data;
    } catch (error) {
      throw error instanceof APIError ? error : new APIError(`Failed to get filing history for company ${companyNumber}`, 500);
    }
  }

  async getCompanyCharges(
    companyNumber: string,
    options: { limit?: number; startIndex?: number } = {}
  ) {
    const { limit = 25, startIndex = 0 } = options;
    const cacheKey = `charges:${companyNumber}:${limit}:${startIndex}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        items_per_page: limit.toString(),
        start_index: startIndex.toString(),
      });

      const data = await this.makeRequest(`/company/${companyNumber}/charges?${params.toString()}`);

      this.cache.set(cacheKey, data, 30 * 60); // Cache for 30 minutes
      return data;
    } catch (error) {
      throw error instanceof APIError ? error : new APIError(`Failed to get charges for company ${companyNumber}`, 500);
    }
  }

  async getPersonsWithSignificantControl(
    companyNumber: string,
    options: { limit?: number; startIndex?: number } = {}
  ) {
    const { limit = 25, startIndex = 0 } = options;
    const cacheKey = `pscs:${companyNumber}:${limit}:${startIndex}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        items_per_page: limit.toString(),
        start_index: startIndex.toString(),
      });

      const data = await this.makeRequest(`/company/${companyNumber}/persons-with-significant-control?${params.toString()}`);

      this.cache.set(cacheKey, data, 30 * 60); // Cache for 30 minutes
      return data;
    } catch (error) {
      throw error instanceof APIError ? error : new APIError(`Failed to get PSCs for company ${companyNumber}`, 500);
    }
  }

  async searchOfficers(query: string, options: { limit?: number; startIndex?: number } = {}) {
    const { limit = 35, startIndex = 0 } = options;
    const cacheKey = `officer-search:${query}:${limit}:${startIndex}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        q: query,
        items_per_page: limit.toString(),
        start_index: startIndex.toString(),
      });

      const data = await this.makeRequest(`/search/officers?${params.toString()}`);

      this.cache.set(cacheKey, data, 5 * 60); // Cache for 5 minutes
      return data;
    } catch (error) {
      throw error instanceof APIError ? error : new APIError('Failed to search officers', 500);
    }
  }
}
