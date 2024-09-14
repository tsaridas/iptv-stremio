# IPTV Stremio Addon

This is a Stremio addon that provides access to IPTV channels.

## Environment Variables

The following environment variables can be used to configure the addon:

- \`PORT\`: The port on which the server will run (default: 3000)
- \`CACHE_TTL\`: Cache time-to-live in seconds (default: 172800, which is 2 days)
- \`FETCH_INTERVAL\`: Interval for fetching and caching channel information in milliseconds (default: 86400000, which is 1 day)
- \`INCLUDE_LANGUAGES\`: Comma-separated list of languages to include (default: empty, include all)
- \`INCLUDE_COUNTRIES\`: Comma-separated list of countries to include (default: 'GR')
- \`EXCLUDE_LANGUAGES\`: Comma-separated list of languages to exclude (default: empty, exclude none)
- \`EXCLUDE_COUNTRIES\`: Comma-separated list of countries to exclude (default: empty, exclude none)
- \`EXCLUDE_CATEGORIES\`: Comma-separated list of categories to exclude (default: empty, exclude none)

Example:
\`\`\`
PORT=3000
CACHE_TTL=172800
FETCH_INTERVAL=86400000
INCLUDE_LANGUAGES=en,es
INCLUDE_COUNTRIES=US,UK
EXCLUDE_LANGUAGES=ru
EXCLUDE_COUNTRIES=CN
EXCLUDE_CATEGORIES=news,sports
\`\`\`