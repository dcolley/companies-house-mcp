import {
  CompanyProfile,
  CompanySearchResult,
  OfficersList,
  FilingHistoryList,
  CompanySearchResponse,
  ChargesList,
  PSCList,
  OfficerSearchResponse,
} from '../types/companies-house.js';
import { RateLimiter } from './rate-limiter.js';
import { Cache } from './cache.js';
import {
  APIError,
  ValidationError,
  ConfigurationError,
  CompaniesHouseError,
  NotFoundError,
} from './errors.js';

interface CompanySearchResponseItem {
  company_number: string;
  title: string;
  company_status: string;
  type: string;
  company_type?: string;
  date_of_creation?: string;
  address?: {
    premises?: string;
    address_line_1?: string;
    postal_code?: string;
    locality?: string;
    region?: string;
    country?: string;
  };
}

export class CompaniesHouseClient {
  private apiKey: string;
  private rateLimiter: RateLimiter;
  private cache: Cache;
  private baseUrl = 'https://api.company-information.service.gov.uk';

  constructor(apiKey: string, requestsPerFiveMinutes: number = 500, cacheSize: number = 1000) {
    if (!apiKey) {
      throw new ConfigurationError('Companies House API key is required');
    }

    this.apiKey = apiKey;
    this.rateLimiter = new RateLimiter(requestsPerFiveMinutes, 5 * 60 * 1000); // 5 minutes in ms
    this.cache = new Cache(cacheSize);
    this.log('Client initialized');
  }

  /**
   * Get the API key for tools that need direct access
   */
  public getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Debug logging helper
   */
  private log(message: string): void {
    if (process.env.DEBUG) {
      console.error(`[CompaniesHouseClient] ${new Date().toISOString()} - ${message}`);
    }
  }

  /**
   * Make an authenticated HTTP request to the Companies House API
   */
  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      this.log(`Making request to ${endpoint}`);
      await this.rateLimiter.checkLimit();

      const url = `${this.baseUrl}${endpoint}`;
      this.log(`Fetching from ${url}`);
      const response = await fetch(url, {
        headers: {
          Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const status = response.status;
        this.log(`Request failed with status ${status}`);
        throw APIError.fromStatus(status);
      }

      this.log('Request completed successfully');
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof Error) {
        this.log(`Network error: ${error.message}`);
        throw new APIError(`Network error: ${error.message}`, 500, 'NETWORK_ERROR');
      }

      this.log('Unknown error occurred during API request');
      throw new APIError('Unknown error occurred during API request', 500);
    }
  }

  /**
   * Search for companies by name
   */
  async searchCompanies(
    query: string,
    limit: number = 20,
    activeOnly: boolean = true
  ): Promise<CompanySearchResult[]> {
    this.log(
      `Searching companies with query: "${query}", limit: ${limit}, activeOnly: ${activeOnly}`
    );
    if (!query || query.trim() === '') {
      throw new ValidationError('Search query cannot be empty', 'query');
    }

    const cacheKey = `search:${query}:${limit}:${activeOnly}`;
    const cached = this.cache.get<CompanySearchResult[]>(cacheKey);
    if (cached) {
      this.log(`Returning cached search results for "${query}"`);
      return cached;
    }

    try {
      const params = new URLSearchParams({
        q: query,
        items_per_page: limit.toString(),
        start_index: '0',
      });

      this.log(`Fetching company search results with params: ${params.toString()}`);
      const data = await this.makeRequest<CompanySearchResponse>(
        `/search/companies?${params.toString()}`
      );

      if (!data.items) {
        this.log('No items found in search response');
        return [];
      }

      this.log(`Received ${data.items.length} companies from API`);
      const results = data.items
        .filter(
          (item: CompanySearchResponseItem) => !activeOnly || item.company_status === 'active'
        )
        .map((item: CompanySearchResponseItem): CompanySearchResult => {
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

      this.log(`Returning ${results.length} formatted company results`);
      this.cache.set(cacheKey, results, 5 * 60); // Cache for 5 minutes
      return results;
    } catch (error) {
      this.log(
        `Error searching companies: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      if (error instanceof CompaniesHouseError) {
        throw error;
      }
      throw new APIError(
        `Failed to search companies: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
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
      const data = await this.makeRequest<CompanyProfile>(`/company/${companyNumber}`);

      // Ensure all required fields are present and properly typed
      const profile: CompanyProfile = {
        company_name: data.company_name,
        company_number: data.company_number,
        company_status: data.company_status,
        date_of_creation: data.date_of_creation,
        type: data.type || '', // Ensure type is always a string
      };

      // Add optional fields only if they exist in the response
      if (data.registered_office_address) {
        profile.registered_office_address = data.registered_office_address;
      }
      if (data.accounts) {
        profile.accounts = data.accounts;
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
      throw error instanceof APIError
        ? error
        : new APIError(`Failed to get company profile for ${companyNumber}`, 500);
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

      const data = await this.makeRequest<OfficersList>(
        `/company/${companyNumber}/officers?${params.toString()}`
      );

      this.cache.set(cacheKey, data, 10 * 60); // Cache for 10 minutes
      return data;
    } catch (error) {
      throw error instanceof APIError
        ? error
        : new APIError(`Failed to get officers for company ${companyNumber}`, 500);
    }
  }

  async getFilingHistory(
    companyNumber: string,
    options: { category?: string; limit?: number; startIndex?: number } = {}
  ): Promise<FilingHistoryList> {
    const { category, limit = 25, startIndex = 0 } = options;
    this.log(
      `Getting filing history for company ${companyNumber}, category: ${category || 'all'}, limit: ${limit}, startIndex: ${startIndex}`
    );

    const cacheKey = `filings:${companyNumber}:${category || 'all'}:${limit}:${startIndex}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.log(`Returning cached filing history for company ${companyNumber}`);
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

      this.log(`Fetching filing history with params: ${params.toString()}`);
      const data = await this.makeRequest<FilingHistoryList>(
        `/company/${companyNumber}/filing-history?${params.toString()}`
      );

      this.log(`Got ${data.items?.length || 0} filing history items for company ${companyNumber}`);
      this.cache.set(cacheKey, data, 2 * 60); // Cache for 2 minutes
      return data;
    } catch (error) {
      this.log(
        `Error getting filing history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error instanceof APIError
        ? error
        : new APIError(`Failed to get filing history for company ${companyNumber}`, 500);
    }
  }

  async getCompanyCharges(
    companyNumber: string,
    options: { limit?: number; startIndex?: number } = {}
  ): Promise<ChargesList> {
    const { limit = 25, startIndex = 0 } = options;
    this.log(
      `Getting charges for company ${companyNumber}, limit: ${limit}, startIndex: ${startIndex}`
    );

    const cacheKey = `charges:${companyNumber}:${limit}:${startIndex}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.log(`Returning cached charges for company ${companyNumber}`);
      return cached as ChargesList;
    }

    try {
      const params = new URLSearchParams({
        items_per_page: limit.toString(),
        start_index: startIndex.toString(),
      });

      this.log(`Fetching company charges with params: ${params.toString()}`);
      const data = await this.makeRequest<ChargesList>(
        `/company/${companyNumber}/charges?${params.toString()}`
      );

      this.log(`Got ${data.items?.length || 0} charges for company ${companyNumber}`);
      this.cache.set(cacheKey, data, 30 * 60); // Cache for 30 minutes
      return data;
    } catch (error) {
      this.log(
        `Error getting company charges: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error instanceof APIError
        ? error
        : new APIError(`Failed to get charges for company ${companyNumber}`, 500);
    }
  }

  async getPersonsWithSignificantControl(
    companyNumber: string,
    options: { limit?: number; startIndex?: number } = {}
  ): Promise<PSCList> {
    const { limit = 25, startIndex = 0 } = options;
    this.log(
      `Getting PSCs for company ${companyNumber}, limit: ${limit}, startIndex: ${startIndex}`
    );

    const cacheKey = `pscs:${companyNumber}:${limit}:${startIndex}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.log(`Returning cached PSCs for company ${companyNumber}`);
      return cached as PSCList;
    }

    try {
      const params = new URLSearchParams({
        items_per_page: limit.toString(),
        start_index: startIndex.toString(),
      });

      this.log(`Fetching PSCs with params: ${params.toString()}`);
      const data = await this.makeRequest<PSCList>(
        `/company/${companyNumber}/persons-with-significant-control?${params.toString()}`
      );

      this.log(`Got ${data.items?.length || 0} PSCs for company ${companyNumber}`);
      this.cache.set(cacheKey, data, 30 * 60); // Cache for 30 minutes
      return data;
    } catch (error) {
      this.log(`Error getting PSCs: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error instanceof APIError
        ? error
        : new APIError(`Failed to get PSCs for company ${companyNumber}`, 500);
    }
  }

  async searchOfficers(
    query: string,
    options: { limit?: number; startIndex?: number } = {}
  ): Promise<OfficerSearchResponse> {
    const { limit = 35, startIndex = 0 } = options;
    this.log(
      `Searching officers with query: "${query}", limit: ${limit}, startIndex: ${startIndex}`
    );

    const cacheKey = `officer-search:${query}:${limit}:${startIndex}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.log(`Returning cached officer search results for "${query}"`);
      return cached as OfficerSearchResponse;
    }

    try {
      const params = new URLSearchParams({
        q: query,
        items_per_page: limit.toString(),
        start_index: startIndex.toString(),
      });

      this.log(`Fetching officer search results with params: ${params.toString()}`);
      const data = await this.makeRequest<OfficerSearchResponse>(
        `/search/officers?${params.toString()}`
      );

      this.log(`Got ${data.items?.length || 0} officers matching "${query}"`);
      this.cache.set(cacheKey, data, 5 * 60); // Cache for 5 minutes
      return data;
    } catch (error) {
      this.log(
        `Error searching officers: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error instanceof APIError ? error : new APIError('Failed to search officers', 500);
    }
  }
}
