# IPTV Stremio Addon

This is a Stremio addon that provides access to IPTV channels using M3U links, leveraging the excellent work of iptv-org and removing and dead channels.

## Features

- Access to a wide range of IPTV channels
- Configurable channel filtering based on languages, countries, and categories
- Caching mechanism for improved performance

## Installation

1. Install the addon in Stremio by adding the following URL: `https://your-addon-url.com/manifest.json`
2. Configure the addon settings if needed (see Environment Variables section)

## Environment Variables

The following environment variables can be used to configure the addon:

- `PORT`: The port on which the server will run (default: 3000)
- `CACHE_TTL`: Cache time-to-live in seconds (default: 172800, which is 2 days)
- `FETCH_INTERVAL`: Interval for fetching and caching channel information in milliseconds (default: 86400000, which is 1 day)
- `INCLUDE_LANGUAGES`: Comma-separated list of languages to include (default: empty, include all)
- `INCLUDE_COUNTRIES`: Comma-separated list of countries to include (default: 'GR')
- `EXCLUDE_LANGUAGES`: Comma-separated list of languages to exclude (default: empty, exclude none)
- `EXCLUDE_COUNTRIES`: Comma-separated list of countries to exclude (default: empty, exclude none)
- `EXCLUDE_CATEGORIES`: Comma-separated list of categories to exclude (default: empty, exclude none)

## Docker

To build and run the Docker container:

1. Build the Docker image:
   ```
   docker build -t iptv-stremio-addon .
   ```

2. Run the Docker container:
   ```
   docker run -p 3000:3000 -e INCLUDE_COUNTRIES=US,UK -e EXCLUDE_CATEGORIES=news iptv-stremio-addon
   ```

   This example runs the container, mapping port 3000 and setting some environment variables.

3. Access the addon at `http://localhost:3000/manifest.json`

You can adjust the environment variables as needed when running the container.