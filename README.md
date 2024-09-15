# IPTV Stremio Addon

This is a Stremio addon that provides access to IPTV channels using M3U links, leveraging the excellent work of iptv-org and removing dead channels.

You can try out the addon with Greek TV channels at this URL:
http://a0964931e94e-iptv-stremio.baby-beamup.club/manifest.json

## Features

- Access to a wide range of IPTV channels
- Configurable channel filtering based on languages, countries, and categories
- Caching mechanism for improved performance
- Proxy support for stream verification

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
- `PROXY_URL`: URL of the proxy server to use for stream verification (default: empty, no proxy)

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
   PROXY_URL=socks5://127.0.0.1:9150
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
   docker run -p 3000:3000 -e INCLUDE_COUNTRIES=US,UK -e EXCLUDE_CATEGORIES=news -e PROXY_URL=socks5://127.0.0.1:9150 iptv-stremio-addon
   ```

   This example runs the container, mapping port 3000 and setting some environment variables, including a proxy URL.

3. Access the addon at `http://localhost:3000/manifest.json`

You can adjust the environment variables as needed when running the container.

## Proxy Support

The addon now supports the use of a proxy server for stream verification. This can be useful if you're experiencing issues with stream verification due to geographical restrictions or other network-related problems.

To use a proxy:

1. Set the `PROXY_URL` environment variable to your proxy server's URL. The addon supports both SOCKS and HTTP proxies.

   For a SOCKS proxy:
   ```
   PROXY_URL=socks5://127.0.0.1:9150
   ```

   For an HTTP proxy:
   ```
   PROXY_URL=http://127.0.0.1:8080
   ```

2. The addon will automatically use the specified proxy for stream verification.

Note: Make sure your proxy server is reliable and fast enough to handle the stream verification requests. Using a slow or unreliable proxy may negatively impact the addon's performance.
