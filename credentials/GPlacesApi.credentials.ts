import {
  ICredentialDataDecryptedObject,
  ICredentialType,
  IHttpRequestOptions,
  INodeProperties,
} from 'n8n-workflow';

export class GPlacesApi implements ICredentialType {
  name = 'gPlacesApi';
  displayName = 'Google Places API';
  documentationUrl = 'https://developers.google.com/maps/documentation/places/web-service/overview';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      placeholder: 'Enter your Google API key',
      description: 'Your Google Places API key. Get it from Google Cloud Console. Ensure Places API (New) is enabled.',
    },
  ];

  async authenticate(
    credentials: ICredentialDataDecryptedObject,
    requestOptions: IHttpRequestOptions,
  ): Promise<IHttpRequestOptions> {
    const apiKey = credentials.apiKey as string;

    return {
      ...requestOptions,
      headers: {
        ...requestOptions.headers,
        'X-Goog-Api-Key': apiKey,
      },
    };
  }
}
