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
    description: 'Interact with Google Places API',
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
            description: 'Search for places by query',
          },
          {
            name: 'Place Details',
            value: 'placeDetails',
            description: 'Get details of a specific place',
          },
        ],
        default: 'searchPlaces',
      },
      {
        displayName: 'Query',
        name: 'query',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['searchPlaces'],
          },
        },
        default: '',
        description: 'The search query (e.g., "pizza in New York")',
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
        description: 'Bias results to a specific location (circular or rectangular)',
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
          { name: 'Distance', value: 'DISTANCE' },
          { name: 'Relevance', value: 'RELEVANCE' },
        ],
        default: 'RELEVANCE',
        description: 'How to rank results',
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
        description: 'Maximum number of results to return per page (1-20)',
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
        description: 'Whether to return all results (uses pagination)',
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
        description: 'Language code for results (e.g., en, es, fr)',
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
          { name: 'Display Name', value: 'displayName' },
          { name: 'Formatted Address', value: 'formattedAddress' },
          { name: 'Location', value: 'location' },
          { name: 'Place ID', value: 'id' },
          { name: 'Price Level', value: 'priceLevel' },
          { name: 'Rating', value: 'rating' },
          { name: 'Types', value: 'types' },
          { name: 'User Ratings Total', value: 'userRatingsTotal' },
        ],
        default: ['displayName', 'id', 'formattedAddress', 'location'],
        description: 'Fields to return in response',
      },
      {
        displayName: 'Place ID',
        name: 'placeId',
        type: 'string',
        displayOptions: {
          show: {
            operation: ['placeDetails'],
          },
        },
        default: '',
        description: 'The Google Place ID',
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
          const query = this.getNodeParameter('query', i) as string;
          const locationBiasStr = this.getNodeParameter('locationBias', i) as string;
          const rankPreference = this.getNodeParameter('rankPreference', i) as string;
          const pageSize = this.getNodeParameter('pageSize', i) as number;
          const languageCode = this.getNodeParameter('languageCode', i) as string;
          const fields = this.getNodeParameter('fields', i) as string[];
          const returnAll = this.getNodeParameter('returnAll', i) as boolean;

          if (!query) {
            throw new NodeApiError(this.getNode(), {
              message: 'Query is required for search operation',
            });
          }

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

          const fieldMask = fields.map((f) => `places.${f}`).join(',');

          let nextPageToken: string | undefined;
          let hasMore = true;

          while (hasMore) {
            const body: IDataObject = {
              textQuery: query,
              rankPreference,
              pageSize: Math.min(Math.max(pageSize, 1), 20),
              languageCode,
            };

            if (locationBias && Object.keys(locationBias).length > 0) {
              body.locationBias = locationBias;
            }

            if (nextPageToken) {
              body.pageToken = nextPageToken;
            }

            const response = await this.helpers.httpRequest({
              method: 'POST',
              url: 'https://places.googleapis.com/v1/places:searchText',
              body,
              headers: {
                'X-Goog-FieldMask': fieldMask,
              },
            });

            const places = (response as { places?: unknown[] }).places || [];
            nextPageToken = (response as { nextPageToken?: string }).nextPageToken;

            for (const place of places) {
              returnData.push({ json: place as IDataObject });
            }

            if (!returnAll || !nextPageToken) {
              hasMore = false;
            }

            // Add small delay between pagination requests (Google requires this)
            if (hasMore) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          if (returnData.length === 0) {
            returnData.push({
              json: {
                message: 'No places found for query',
                query,
              },
            });
          }
        } else if (operation === 'placeDetails') {
          const placeId = this.getNodeParameter('placeId', i) as string;

          if (!placeId) {
            throw new NodeApiError(this.getNode(), {
              message: 'Place ID is required for place details operation',
            });
          }

          returnData.push({
            json: {
              message: `Place details for ${placeId} not yet implemented`,
            },
          });
        }
      } catch (error) {
        if (error instanceof NodeApiError) {
          throw error;
        }
        throw new NodeApiError(this.getNode(), {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }

    return [returnData];
  }
}
