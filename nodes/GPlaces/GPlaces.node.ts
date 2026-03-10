import {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
} from 'n8n-workflow';

export class GPlaces implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'GPlaces',
    name: 'gPlaces',
    icon: 'file:logo.png',
    group: ['output'],
    version: 1,
    description: 'Interact with Google Places API - Text Search',
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
            name: 'Search Places',
            value: 'searchPlaces',
            description: 'Search for places by text query',
          },
        ],
        default: 'searchPlaces',
      },
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
        description: 'Filter results to places matching this type (e.g., "restaurant", "bar", "pharmacy")',
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
        description: 'Bias results to a specific area. Supports circular (center + radius) or rectangular (low + high) format.',
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
        description: 'Restrict results to a specific area (rectangular viewport only). Only for categorical queries.',
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
        description: 'Language for results (e.g., en, es, fr). See Google\'s list of supported languages.',
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
        description: 'Minimum average user rating (0.0 to 5.0)',
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
        description: 'Return only places open for business at query time',
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
          { name: 'Inexpensive', value: 'PRICE_LEVEL_INEXPENSIVE' },
          { name: 'Moderate', value: 'PRICE_LEVEL_MODERATE' },
          { name: 'Pricey', value: 'PRICE_LEVEL_PRICY' },
          { name: 'Ultra High-End', value: 'PRICE_LEVEL_ULTRA_HIGH' },
        ],
        default: [],
        description: 'Filter by price level',
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
          { name: 'Relevance', value: 'RELEVANCE' },
          { name: 'Distance', value: 'DISTANCE' },
        ],
        default: 'RELEVANCE',
        description: 'How to rank results (RELEVANCE or DISTANCE)',
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
        description: 'Number of results per page (1-20)',
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
        description: 'Whether to return all results using pagination',
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
        description: 'When true, only places matching the includedType are returned',
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
        description: 'Include businesses without a physical location',
      },
      {
        displayName: 'Fields',
        name: 'fields',
        type: 'multiOptions',
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        options: [
          // ID Only SKU fields
          { name: 'Attributions', value: 'attributions' },
          { name: 'Place ID', value: 'id' },
          // Pro SKU fields
          { name: 'Display Name', value: 'displayName' },
          { name: 'Formatted Address', value: 'formattedAddress' },
          { name: 'Location', value: 'location' },
          { name: 'Types', value: 'types' },
          { name: 'Photos', value: 'photos' },
          { name: 'Plus Code', value: 'plusCode' },
          { name: 'Postal Address', value: 'postalAddress' },
          { name: 'Primary Type', value: 'primaryType' },
          { name: 'Short Formatted Address', value: 'shortFormattedAddress' },
          { name: 'Google Maps URI', value: 'googleMapsUri' },
          { name: 'UTC Offset Minutes', value: 'utcOffsetMinutes' },
          { name: 'Time Zone', value: 'timeZone' },
          { name: 'Viewport', value: 'viewport' },
          // Enterprise SKU fields
          { name: 'Rating', value: 'rating' },
          { name: 'Price Level', value: 'priceLevel' },
          { name: 'Current Opening Hours', value: 'currentOpeningHours' },
          { name: 'International Phone Number', value: 'internationalPhoneNumber' },
          { name: 'National Phone Number', value: 'nationalPhoneNumber' },
          { name: 'Website URI', value: 'websiteUri' },
          { name: 'User Rating Count', value: 'userRatingCount' },
          // Atmosphere fields
          { name: 'Reviews', value: 'reviews' },
          { name: 'Delivery', value: 'delivery' },
          { name: 'Dine In', value: 'dineIn' },
          { name: 'Takeout', value: 'takeout' },
          { name: 'Reservable', value: 'reservable' },
          { name: 'Serves Beer', value: 'servesBeer' },
          { name: 'Serves Wine', value: 'servesWine' },
          { name: 'Serves Coffee', value: 'servesCoffee' },
          { name: 'Serves Vegetarian Food', value: 'servesVegetarianFood' },
          { name: 'Outdoor Seating', value: 'outdoorSeating' },
          { name: 'Good for Children', value: 'goodForChildren' },
          { name: 'Good for Groups', value: 'goodForGroups' },
        ],
        default: ['displayName', 'id', 'formattedAddress', 'location'],
        description: 'Fields to return (controls cost - see Google documentation)',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

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
      } catch (error) {
        // Provide more helpful error messages for common issues
        let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        if (errorMessage.includes('403')) {
          errorMessage = 'Google Places API returned 403 Forbidden. This is usually caused by:\n' +
            '1. API key not having the Places API (New) enabled in Google Cloud Console\n' +
            '2. API key has IP or HTTP referrer restrictions that exclude your n8n server\n' +
            '3. API key quota has been exceeded\n' +
            '4. API key is invalid or expired\n\n' +
            'Please check your API key settings in Google Cloud Console.';
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
