import {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
} from 'n8n-workflow';

interface GPlacesApiCredentials {
  apiKey: string;
}

export class GPlaces implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'GPlaces',
    name: 'gPlaces',
    icon: 'file:logo.png',
    group: ['output'],
    version: 1,
    description: 'Interact with Google Places API (New) - Text Search and Nearby Search',
    defaults: {
      name: 'GPlaces',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'gPlacesApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Text Search',
            value: 'searchPlaces',
            description: 'Search for places using a text query (e.g., "pizza in New York")',
          },
          {
            name: 'Nearby Search',
            value: 'nearbySearch',
            description: 'Search for places within a specific area (circle defined by latitude, longitude, and radius)',
          },
        ],
        default: 'searchPlaces',
      },
      // ==================== TEXT SEARCH PARAMETERS ====================
      {
        displayName: 'Text Query',
        name: 'textQuery',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        default: '',
        description: 'The text string to search for (e.g., "pizza in New York" or "coffee shop near Central Park")',
      },
      {
        displayName: 'Included Type',
        name: 'includedType',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        default: '',
        description: 'Filter results to places matching this type from Table A (e.g., "restaurant", "bar", "pharmacy", "hotel")',
      },
      {
        displayName: 'Location Bias',
        name: 'locationBias',
        type: 'json',
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        default: '{}',
        description: 'Bias results toward a specific area. Use circular (center latitude, longitude + radius in meters) or rectangular (viewport low/high coordinates) format. Example: {"circle": {"center": {"latitude": 37.4, "longitude": -122.1}, "radius": 5000}}',
      },
      {
        displayName: 'Location Restriction',
        name: 'locationRestriction',
        type: 'json',
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        default: '{}',
        description: 'Restrict results to a specific rectangular area. Only recommended for categorical queries. Use {"rectangle": {"low": {"latitude": ..., "longitude": ...}, "high": {"latitude": ..., "longitude": ...}}}',
      },
      {
        displayName: 'Language Code',
        name: 'languageCode',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        default: 'en',
        description: 'Language for results using BCP 47 language codes (e.g., en, es, fr, de, ja). See Google\'s supported languages list',
      },
      {
        displayName: 'Min Rating',
        name: 'minRating',
        type: 'number',
        typeOptions: {
          minValue: 0,
          maxValue: 5,
          numberPrecision: 0.5,
        },
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        default: 0,
        description: 'Minimum average user rating on a scale of 0.0 to 5.0. Results with lower ratings will be filtered out',
      },
      {
        displayName: 'Open Now',
        name: 'openNow',
        type: 'boolean',
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        default: false,
        description: 'When enabled, returns only places open for business at the time of the query',
      },
      {
        displayName: 'Price Levels',
        name: 'priceLevels',
        type: 'multiOptions',
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        options: [
          { name: 'Inexpensive (1)', value: 'PRICE_LEVEL_INEXPENSIVE' },
          { name: 'Moderate (2)', value: 'PRICE_LEVEL_MODERATE' },
          { name: 'Pricey (3)', value: 'PRICE_LEVEL_PRICY' },
          { name: 'Ultra High-End (4)', value: 'PRICE_LEVEL_ULTRA_HIGH' },
        ],
        default: [],
        description: 'Filter results by price level (1-4). Select multiple to include any of the selected levels',
      },
      {
        displayName: 'Rank Preference',
        name: 'rankPreference',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        options: [
          { name: 'Relevance', value: 'RELEVANCE', description: 'Sort by most relevant to the text query' },
          { name: 'Distance', value: 'DISTANCE', description: 'Sort by distance from location (requires locationBias or locationRestriction)' },
        ],
        default: 'RELEVANCE',
        description: 'How to rank results: RELEVANCE (default) or DISTANCE (requires a location to sort by distance)',
      },
      {
        displayName: 'Page Size',
        name: 'pageSize',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        default: 20,
        typeOptions: {
          minValue: 1,
          maxValue: 20,
        },
        description: 'Number of results to return per page (maximum 20). Use pagination to get more results',
      },
      {
        displayName: 'Return All',
        name: 'returnAll',
        type: 'boolean',
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        default: false,
        description: 'Enable to automatically fetch all pages of results (uses nextPageToken for pagination)',
      },
      {
        displayName: 'Strict Type Filtering',
        name: 'strictTypeFiltering',
        type: 'boolean',
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        default: false,
        description: 'When enabled, only places with the exact includedType as their primary type are returned (instead of broader categories)',
      },
      {
        displayName: 'Include Pure Service Area Businesses',
        name: 'includePureServiceAreaBusinesses',
        type: 'boolean',
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        default: false,
        description: 'Include businesses that serve customers at their locations (e.g., plumbers, locksmiths) without a physical storefront',
      },

      // ==================== NEARBY SEARCH PARAMETERS ====================
      {
        displayName: 'Location Restriction (Required)',
        name: 'nearbyLocationRestriction',
        type: 'json',
        displayOptions: {
          show: {
            operation: ['nearbySearch'],
          },
        },
        default: '{"circle": {"center": {"latitude": 37.4, "longitude": -122.1}, "radius": 1000}}',
        description: 'The search area defined as a circle with center coordinates (latitude, longitude) and radius in meters. Radius must be between 0 and 50000 meters. Required.',
      },
      {
        displayName: 'Included Types',
        name: 'nearbyIncludedTypes',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['nearbySearch'],
          },
        },
        default: '',
        description: 'Comma-separated list of place types to include in search (e.g., "restaurant,cafe,bar"). Uses Table A types. Leave empty for all types.',
      },
      {
        displayName: 'Excluded Types',
        name: 'nearbyExcludedTypes',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['nearbySearch'],
          },
        },
        default: '',
        description: 'Comma-separated list of place types to exclude from search (e.g., "gas_station,car_wash")',
      },
      {
        displayName: 'Included Primary Types',
        name: 'nearbyIncludedPrimaryTypes',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['nearbySearch'],
          },
        },
        default: '',
        description: 'Comma-separated list of primary place types to include (e.g., "restaurant,hotel"). Filters on the primary type assigned to a place.',
      },
      {
        displayName: 'Excluded Primary Types',
        name: 'nearbyExcludedPrimaryTypes',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['nearbySearch'],
          },
        },
        default: '',
        description: 'Comma-separated list of primary place types to exclude (e.g., "fast_food_restaurant")',
      },
      {
        displayName: 'Language Code',
        name: 'nearbyLanguageCode',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['nearbySearch'],
          },
        },
        default: 'en',
        description: 'Language for results using BCP 47 language codes (e.g., en, es, fr, de, ja)',
      },
      {
        displayName: 'Max Result Count',
        name: 'nearbyMaxResultCount',
        type: 'number',
        displayOptions: {
          show: {
            operation: ['nearbySearch'],
          },
        },
        default: 20,
        typeOptions: {
          minValue: 1,
          maxValue: 20,
        },
        description: 'Maximum number of results to return (1-20). Use pagination to get more results',
      },
      {
        displayName: 'Rank Preference',
        name: 'nearbyRankPreference',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['nearbySearch'],
          },
        },
        options: [
          { name: 'Popularity', value: 'POPULARITY', description: 'Sort by most popular (default)' },
          { name: 'Distance', value: 'DISTANCE', description: 'Sort by distance from the search center' },
        ],
        default: 'POPULARITY',
        description: 'Ranking method: POPULARITY (default) sorts by relevance/popularity, DISTANCE sorts by ascending distance from the center',
      },
      {
        displayName: 'Region Code',
        name: 'nearbyRegionCode',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['nearbySearch'],
          },
        },
        default: '',
        description: 'Region code as a two-character CLDR code (e.g., US, GB, JP). Affects address formatting and may influence results based on local law',
      },
      {
        displayName: 'Fields',
        name: 'fields',
        type: 'multiOptions',
        displayOptions: {
          show: {
            operation: ['searchPlaces', 'nearbySearch'],
          },
        },
        options: [
          // ID Only SKU fields
          { name: 'Attributions', value: 'attributions', description: 'Attributions for the place data' },
          { name: 'Place ID', value: 'id', description: 'Unique place identifier' },
          { name: 'Name', value: 'name', description: 'Place resource name (places/PLACE_ID)' },
          // Pro SKU fields
          { name: 'Display Name', value: 'displayName', description: 'Name of the place in multiple languages' },
          { name: 'Formatted Address', value: 'formattedAddress', description: 'Human-readable address' },
          { name: 'Location', value: 'location', description: 'Geographic coordinates (latitude, longitude)' },
          { name: 'Types', value: 'types', description: 'All place types' },
          { name: 'Photos', value: 'photos', description: 'Place photos' },
          { name: 'Plus Code', value: 'plusCode', description: 'Open Location Code' },
          { name: 'Postal Address', value: 'postalAddress', description: 'Structured postal address components' },
          { name: 'Primary Type', value: 'primaryType', description: 'Main type of the place' },
          { name: 'Short Formatted Address', value: 'shortFormattedAddress', description: 'Short address without country name' },
          { name: 'Google Maps URI', value: 'googleMapsUri', description: 'Link to open in Google Maps' },
          { name: 'UTC Offset Minutes', value: 'utcOffsetMinutes', description: 'Time zone offset from UTC' },
          { name: 'Time Zone', value: 'timeZone', description: 'IANA time zone identifier' },
          { name: 'Viewport', value: 'viewport', description: 'Recommended viewport for displaying the place' },
          // Enterprise SKU fields
          { name: 'Rating', value: 'rating', description: 'Average user rating (1.0-5.0)' },
          { name: 'Price Level', value: 'priceLevel', description: 'Price level (1-4)' },
          { name: 'Current Opening Hours', value: 'currentOpeningHours', description: 'Current operating hours' },
          { name: 'International Phone Number', value: 'internationalPhoneNumber', description: 'Full international phone number' },
          { name: 'National Phone Number', value: 'nationalPhoneNumber', description: 'National format phone number' },
          { name: 'Website URI', value: 'websiteUri', description: 'Official website URL' },
          { name: 'User Rating Count', value: 'userRatingCount', description: 'Number of user reviews' },
          // Atmosphere fields
          { name: 'Reviews', value: 'reviews', description: 'User reviews and ratings' },
          { name: 'Delivery', value: 'delivery', description: 'Offers delivery service' },
          { name: 'Dine In', value: 'dineIn', description: 'Offers dine-in service' },
          { name: 'Takeout', value: 'takeout', description: 'Offers takeout service' },
          { name: 'Reservable', value: 'reservable', description: 'Accepts reservations' },
          { name: 'Serves Beer', value: 'servesBeer', description: 'Serves beer' },
          { name: 'Serves Wine', value: 'servesWine', description: 'Serves wine' },
          { name: 'Serves Coffee', value: 'servesCoffee', description: 'Serves coffee' },
          { name: 'Serves Vegetarian Food', value: 'servesVegetarianFood', description: 'Has vegetarian options' },
          { name: 'Outdoor Seating', value: 'outdoorSeating', description: 'Has outdoor seating' },
          { name: 'Good for Children', value: 'goodForChildren', description: 'Family-friendly' },
          { name: 'Good for Groups', value: 'goodForGroups', description: 'Suitable for groups' },
        ],
        default: ['displayName', 'id', 'formattedAddress', 'location'],
        description: 'Fields to return in the response. See Google documentation for pricing details per field (Pro, Enterprise, Atmosphere SKUs)',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Get credentials with API key
    const credentials = await this.getCredentials<GPlacesApiCredentials>('gPlacesApi');
    const apiKey = credentials.apiKey;

    for (let i = 0; i < items.length; i++) {
      const operation = this.getNodeParameter('operation', i) as string;

      try {
        if (operation === 'searchPlaces') {
          const textQuery = this.getNodeParameter('textQuery', i) as string;
          const includedType = this.getNodeParameter('includedType', i) as string;
          const locationBiasStr = this.getNodeParameter('locationBias', i) as string;
          const locationRestrictionStr = this.getNodeParameter('locationRestriction', i) as string;
          const languageCode = this.getNodeParameter('languageCode', i) as string;
          const minRating = this.getNodeParameter('minRating', i) as number;
          const openNow = this.getNodeParameter('openNow', i) as boolean;
          const priceLevels = this.getNodeParameter('priceLevels', i) as string[];
          const rankPreference = this.getNodeParameter('rankPreference', i) as string;
          const pageSize = this.getNodeParameter('pageSize', i) as number;
          const returnAll = this.getNodeParameter('returnAll', i) as boolean;
          const strictTypeFiltering = this.getNodeParameter('strictTypeFiltering', i) as boolean;
          const includePureServiceAreaBusinesses = this.getNodeParameter('includePureServiceAreaBusinesses', i) as boolean;
          const fields = this.getNodeParameter('fields', i) as string[];

          if (!textQuery) {
            throw new NodeApiError(this.getNode(), {
              message: 'Text Query is required for search operation',
            });
          }

          // Parse location bias
          let locationBias: IDataObject | undefined;
          if (locationBiasStr && locationBiasStr !== '{}') {
            try {
              locationBias = JSON.parse(locationBiasStr) as IDataObject;
            } catch {
              throw new NodeApiError(this.getNode(), {
                message: 'Invalid JSON in Location Bias field',
              });
            }
          }

          // Parse location restriction
          let locationRestriction: IDataObject | undefined;
          if (locationRestrictionStr && locationRestrictionStr !== '{}') {
            try {
              locationRestriction = JSON.parse(locationRestrictionStr) as IDataObject;
            } catch {
              throw new NodeApiError(this.getNode(), {
                message: 'Invalid JSON in Location Restriction field',
              });
            }
          }

          // Build field mask
          const fieldMask = fields.map((f) => `places.${f}`).join(',');
          // Always include nextPageToken for pagination
          const fullFieldMask = fieldMask.includes('nextPageToken') 
            ? fieldMask 
            : `${fieldMask},nextPageToken`;

          let nextPageToken: string | undefined;
          let hasMore = true;
          let totalResults = 0;

          while (hasMore) {
            const body: IDataObject = {
              textQuery,
              pageSize: Math.min(Math.max(pageSize, 1), 20),
            };

            // Add optional parameters
            if (includedType) {
              body.includedType = includedType;
            }

            if (languageCode) {
              body.languageCode = languageCode;
            }

            if (minRating > 0) {
              body.minRating = minRating;
            }

            if (openNow) {
              body.openNow = openNow;
            }

            if (priceLevels && priceLevels.length > 0) {
              body.priceLevels = priceLevels;
            }

            if (rankPreference) {
              body.rankPreference = rankPreference;
            }

            if (strictTypeFiltering) {
              body.strictTypeFiltering = strictTypeFiltering;
            }

            if (includePureServiceAreaBusinesses) {
              body.includePureServiceAreaBusinesses = includePureServiceAreaBusinesses;
            }

            if (locationBias && Object.keys(locationBias).length > 0) {
              body.locationBias = locationBias;
            }

            if (locationRestriction && Object.keys(locationRestriction).length > 0) {
              body.locationRestriction = locationRestriction;
            }

            if (nextPageToken) {
              body.pageToken = nextPageToken;
            }

            const response = await this.helpers.httpRequest({
              method: 'POST',
              url: 'https://places.googleapis.com/v1/places:searchText',
              body,
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': fullFieldMask,
              },
            });

            const places = (response as { places?: unknown[] }).places || [];
            nextPageToken = (response as { nextPageToken?: string }).nextPageToken;

            for (const place of places) {
              returnData.push({ json: place as IDataObject });
            }

            totalResults += places.length;

            if (!returnAll || !nextPageToken) {
              hasMore = false;
            }

            // Add delay between pagination requests (Google requires this)
            if (hasMore) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          if (returnData.length === 0) {
            returnData.push({
              json: {
                message: 'No places found for query',
                query: textQuery,
              },
            });
          }
        }

        // ==================== NEARBY SEARCH ====================
        if (operation === 'nearbySearch') {
          const includedTypesStr = this.getNodeParameter('nearbyIncludedTypes', i) as string;
          const excludedTypesStr = this.getNodeParameter('nearbyExcludedTypes', i) as string;
          const includedPrimaryTypesStr = this.getNodeParameter('nearbyIncludedPrimaryTypes', i) as string;
          const excludedPrimaryTypesStr = this.getNodeParameter('nearbyExcludedPrimaryTypes', i) as string;
          const languageCode = this.getNodeParameter('nearbyLanguageCode', i) as string;
          const maxResultCount = this.getNodeParameter('nearbyMaxResultCount', i) as number;
          const rankPreference = this.getNodeParameter('nearbyRankPreference', i) as string;
          const regionCode = this.getNodeParameter('nearbyRegionCode', i) as string;
          const fields = this.getNodeParameter('fields', i) as string[];

          // Parse location restriction - required
          // Note: n8n's 'json' type can return either a string or an already-parsed object
          let locationRestrictionRaw = this.getNodeParameter('nearbyLocationRestriction', i);
          let locationRestriction: IDataObject | undefined;
          
          if (locationRestrictionRaw) {
            try {
              // Handle both string and object cases
              if (typeof locationRestrictionRaw === 'string') {
                if (locationRestrictionRaw.trim() !== '' && locationRestrictionRaw !== '{}') {
                  locationRestriction = JSON.parse(locationRestrictionRaw) as IDataObject;
                }
              } else if (typeof locationRestrictionRaw === 'object') {
                locationRestriction = locationRestrictionRaw as IDataObject;
              }
            } catch {
              throw new NodeApiError(this.getNode(), {
                message: 'Invalid JSON in Location Restriction field. Use format: {"circle": {"center": {"latitude": 37.4, "longitude": -122.1}, "radius": 1000}}',
              });
            }
          }

          if (!locationRestriction || !Object.keys(locationRestriction).length) {
            throw new NodeApiError(this.getNode(), {
              message: 'Location Restriction is required for Nearby Search. Use format: {"circle": {"center": {"latitude": 37.4, "longitude": -122.1}, "radius": 1000}}',
            });
          }

          // Parse included types
          let includedTypes: string[] | undefined;
          if (includedTypesStr) {
            includedTypes = includedTypesStr.split(',').map((t) => t.trim()).filter((t) => t);
          }

          // Parse excluded types
          let excludedTypes: string[] | undefined;
          if (excludedTypesStr) {
            excludedTypes = excludedTypesStr.split(',').map((t) => t.trim()).filter((t) => t);
          }

          // Parse included primary types
          let includedPrimaryTypes: string[] | undefined;
          if (includedPrimaryTypesStr) {
            includedPrimaryTypes = includedPrimaryTypesStr.split(',').map((t) => t.trim()).filter((t) => t);
          }

          // Parse excluded primary types
          let excludedPrimaryTypes: string[] | undefined;
          if (excludedPrimaryTypesStr) {
            excludedPrimaryTypes = excludedPrimaryTypesStr.split(',').map((t) => t.trim()).filter((t) => t);
          }

          // Build field mask
          const fieldMask = fields.map((f) => `places.${f}`).join(',');
          const fullFieldMask = fieldMask.includes('nextPageToken') 
            ? fieldMask 
            : `${fieldMask},nextPageToken`;

          let nextPageToken: string | undefined;
          let hasMore = true;

          while (hasMore) {
            const body: IDataObject = {
              locationRestriction,
              maxResultCount: Math.min(Math.max(maxResultCount, 1), 20),
            };

            // Add optional parameters
            if (includedTypes && includedTypes.length > 0) {
              body.includedTypes = includedTypes;
            }

            if (excludedTypes && excludedTypes.length > 0) {
              body.excludedTypes = excludedTypes;
            }

            if (includedPrimaryTypes && includedPrimaryTypes.length > 0) {
              body.includedPrimaryTypes = includedPrimaryTypes;
            }

            if (excludedPrimaryTypes && excludedPrimaryTypes.length > 0) {
              body.excludedPrimaryTypes = excludedPrimaryTypes;
            }

            if (languageCode) {
              body.languageCode = languageCode;
            }

            if (rankPreference) {
              body.rankPreference = rankPreference;
            }

            if (regionCode) {
              body.regionCode = regionCode;
            }

            if (nextPageToken) {
              body.pageToken = nextPageToken;
            }

            const response = await this.helpers.httpRequest({
              method: 'POST',
              url: 'https://places.googleapis.com/v1/places:searchNearby',
              body,
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': fullFieldMask,
              },
            });

            const places = (response as { places?: unknown[] }).places || [];
            nextPageToken = (response as { nextPageToken?: string }).nextPageToken;

            for (const place of places) {
              returnData.push({ json: place as IDataObject });
            }

            if (!nextPageToken) {
              hasMore = false;
            }

            // Add delay between pagination requests (Google requires this)
            if (hasMore) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          if (returnData.length === 0) {
            returnData.push({
              json: {
                message: 'No places found in the specified area',
              },
            });
          }
        }
      } catch (error) {
        // Provide more helpful error messages for common issues
        let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        let errorDetails = '';

        // Try to extract more details from the error response
        if (error && typeof error === 'object' && 'response' in error) {
          const response = (error as { response?: { data?: { error?: { message?: string } } } }).response;
          if (response?.data?.error?.message) {
            errorDetails = response.data.error.message;
            errorMessage = `Google API Error: ${errorDetails}`;
          }
        }

        if (errorMessage.includes('403') || errorDetails.includes('403')) {
          errorMessage = 'Google Places API returned 403 Forbidden. This is usually caused by:\n' +
            '1. API key not having the Places API (New) enabled in Google Cloud Console\n' +
            '2. API key has IP or HTTP referrer restrictions that exclude your n8n server\n' +
            '3. API key quota has been exceeded\n' +
            '4. API key is invalid or expired\n\n' +
            'Please check your API key settings in Google Cloud Console.';
        }

        if (errorMessage.includes('400') || errorDetails.includes('400')) {
          errorMessage = 'Google Places API returned 400 Bad Request. This is usually caused by:\n' +
            '1. Invalid location restriction format\n' +
            '2. Missing required parameters\n' +
            '3. Invalid field mask\n' +
            `4. Details: ${errorDetails}\n\n` +
            'Please check your location coordinates and other parameters.';
        }

        if (error instanceof NodeApiError) {
          throw error;
        }
        throw new NodeApiError(this.getNode(), {
          message: errorMessage,
        });
      }
    }

    return [returnData];
  }
}
