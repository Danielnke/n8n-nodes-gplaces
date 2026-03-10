# n8n-nodes-gplaces

Google Places API v1 node for n8n - Text Search, Nearby Search, Place Details

## Overview

This is an n8n community node package that provides integration with **Google Places API v1** (the new Places API). It allows you to search for places using natural language queries directly from your n8n workflows.

## Features

- **Text Search**: Search places using natural language queries (e.g., "pizza in New York")
- **Field Selection**: Choose which fields to return to control costs
- **Location Bias**: Bias results to a specific location (circular or rectangular)
- **Pagination**: Return all results with automatic pagination
- **Multiple Languages**: Support for various language codes

## Prerequisites

- n8n instance (version 1.0.0 or higher)
- Google Cloud Platform account with **Places API (New)** enabled
- Google API key

## Installation

### From npm (recommended)

```bash
npm install n8n-nodes-gplaces
```

### Manual Installation

1. Navigate to your n8n custom nodes folder:
   ```
   ~/.n8n/custom/
   ```

2. Clone this repository:
   ```
   git clone https://github.com/Danielnke/n8n-nodes-gplaces.git
   ```

3. Install dependencies:
   ```
   cd n8n-nodes-gplaces
   npm install
   ```

4. Build the project:
   ```
   npm run build
   ```

5. Restart your n8n instance

## Configuration

### Creating Credentials

1. Click on "Credentials" in n8n
2. Create a new credential of type "Google Places API"
3. Enter your Google API key
4. Save the credential

### Enabling Google Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the **Places API (New)** 
4. Create an API key in Credentials

## Operations

### Search Places

Search for places using a text query.

**Parameters:**
- **Query**: The search query (e.g., "pizza in New York", "coffee shop near Central Park")
- **Location Bias**: Optional JSON to bias results to a location
- **Rank Preference**: How to rank results (Distance or Relevance)
- **Page Size**: Number of results per page (1-20)
- **Return All**: Fetch all pages of results
- **Language Code**: Language for results (e.g., en, es, fr)
- **Fields**: Select which fields to return (controls cost)

**Example Location Bias (Circular):**
```json
{
  "circle": {
    "center": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "radius": 5000
  }
}
```

**Example Location Bias (Rectangular):**
```json
{
  "rectangle": {
    "low": {
      "latitude": 40.477398,
      "longitude": -74.259087
    },
    "high": {
      "latitude": 40.91618,
      "longitude": -73.70018
    }
  }
}
```

### Place Details

Get detailed information about a specific place using its Place ID.

## Field Selection

The Fields parameter lets you select which data to return. This directly affects pricing:

| Field | Pricing Tier |
|-------|-------------|
| displayName, id, formattedAddress, location, types | Basic |
| rating, photos, priceLevel | Pro |
| reviews, openingHours | Enterprise |

## Development

### Building
```bash
npm run build
```

### Development mode (watch)
```bash
npm run dev
```

### Testing
```bash
npm test
```

## License

MIT - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [n8n](https://n8n.io/) - Workflow automation platform
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service) - Places API documentation
