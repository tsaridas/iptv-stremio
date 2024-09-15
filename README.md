# IPTV Stremio Addon

This is a Stremio addon that provides access to IPTV channels using M3U links, leveraging the excellent work of iptv-org and removing dead channels.

## Features

- Access to a wide range of IPTV channels
- Configurable channel filtering based on languages, countries, and categories
- Caching mechanism for improved performance

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

## Running Locally (Without Docker)

To run the IPTV Stremio Addon locally without Docker, follow these steps:

1. Ensure you have Node.js installed on your system (version 14.0.0 or higher).

2. Clone the repository:
   ```
   git clone https://github.com/your-username/iptv-stremio-addon.git
   cd iptv-stremio-addon
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Set up environment variables (optional):
   You can set environment variables directly in your terminal or create a `.env` file in the project root. For example:
   ```
   PORT=3000
   INCLUDE_COUNTRIES=US,UK
   EXCLUDE_CATEGORIES=news
   ```

5. Start the server:
   ```
   npm start
   ```

   If you want to run the server in development mode with auto-restart on file changes:
   ```
   npm run dev
   ```

6. The addon should now be running locally. You can access it at `http://localhost:3000/manifest.json`

7. To use the addon in Stremio, add the following URL in the Stremio addon section:
   ```
   http://localhost:3000/manifest.json
   ```

   Replace `localhost` with your local IP address if you want to access it from other devices on your network.

Remember to keep the terminal running while using the addon. To stop the server, press `Ctrl+C` in the terminal.

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
