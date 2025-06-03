#!/usr/bin/env node

// Quick debug script to test the Companies House API

import { createApiClient } from '@companieshouse/api-sdk-node';

async function testAPI() {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  
  if (!apiKey) {
    console.error('Please set COMPANIES_HOUSE_API_KEY environment variable');
    process.exit(1);
  }

  console.log('Testing Companies House API...');
  console.log('API Key length:', apiKey.length);
  console.log('API Key starts with:', apiKey.substring(0, 8) + '...');
  
  try {
    const client = createApiClient(apiKey);
    console.log('Client created successfully');
    console.log('Client structure:', Object.keys(client));
    
    // Check if client has the expected structure
    if (client.company) {
      console.log('Client.company exists:', Object.keys(client.company));
    } else {
      console.log('Client.company does not exist');
    }
    
    // Test company profile
    console.log('\nTesting company profile for 12056935 (Omaze)...');
    
    // Check what methods are available on companyProfile
    if (client.companyProfile) {
      console.log('Found client.companyProfile with methods:', Object.keys(client.companyProfile));
      
      // Check prototype methods of companyProfile itself
      const profileProto = Object.getPrototypeOf(client.companyProfile);
      if (profileProto) {
        console.log('companyProfile prototype methods:', Object.getOwnPropertyNames(profileProto));
      }
      
      // Try to call methods directly on companyProfile
      if (typeof client.companyProfile.getCompanyProfile === 'function') {
        try {
          console.log('\nTrying companyProfile.getCompanyProfile...');
          const response = await client.companyProfile.getCompanyProfile('12056935');
          console.log('Company profile response:', response);
        } catch (error) {
          console.log('getCompanyProfile failed:', error.message);
          console.log('Error details:', error);
        }
      }
      
      // Try other possible method names
      const possibleMethods = ['get', 'getProfile', 'fetchProfile', 'getCompany'];
      for (const method of possibleMethods) {
        if (typeof client.companyProfile[method] === 'function') {
          console.log(`Found method: ${method}`);
          try {
            const response = await client.companyProfile[method]('08599997');
            console.log(`${method} response:`, response);
            break; // Stop after first successful call
          } catch (error) {
            console.log(`${method} failed:`, error.message);
          }
        }
      }
    } else {
      console.log('No companyProfile found');
    }
    
    // Also check search functionality
    if (client.alphabeticalSearch) {
      console.log('\nTesting search with alphabeticalSearch...');
      console.log('alphabeticalSearch methods:', Object.keys(client.alphabeticalSearch));
      
      // Check prototype methods
      const searchProto = Object.getPrototypeOf(client.alphabeticalSearch);
      if (searchProto) {
        console.log('alphabeticalSearch prototype methods:', Object.getOwnPropertyNames(searchProto));
      }
      
      // Try to search for companies
      try {
        console.log('\nTrying search...');
        const searchResponse = await client.alphabeticalSearch.getCompanies('omaze');
        console.log('Search response:', searchResponse);
      } catch (error) {
        console.log('Search failed:', error.message);
        console.log('Search error details:', error);
      }
    }
    
    // Test with direct HTTP request to verify API key
    console.log('\n=== Testing with direct HTTP request ===');
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('https://api.company-information.service.gov.uk/company/12056935', {
        headers: {
          'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Direct HTTP response status:', response.status);
      console.log('Direct HTTP response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Direct HTTP response data:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('Direct HTTP error response:', errorText);
      }
    } catch (httpError) {
      console.log('Direct HTTP request failed:', httpError.message);
      
      // Try without node-fetch (using built-in fetch in newer Node.js)
      try {
        console.log('\nTrying with built-in fetch...');
        const response = await fetch('https://api.company-information.service.gov.uk/company/12056935', {
          headers: {
            'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
            'Accept': 'application/json'
          }
        });
        
        console.log('Built-in fetch response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Built-in fetch response data:', JSON.stringify(data, null, 2));
        } else {
          const errorText = await response.text();
          console.log('Built-in fetch error response:', errorText);
        }
      } catch (builtInError) {
        console.log('Built-in fetch also failed:', builtInError.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    if (error.message) {
      console.error('Error message:', error.message);
    }
  }
}

testAPI();
