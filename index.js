const express = require('express');
const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const axios = require('axios');
const NodeCache = require('node-cache');

// Constants
const IPTV_CHANNELS_URL = 'https://iptv-org.github.io/api/channels.json';
const IPTV_STREAMS_URL = 'https://iptv-org.github.io/api/streams.json';
const PORT = process.env.PORT || 3000;
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 172800; // Cache TTL in seconds, default 2 days
const FETCH_INTERVAL = parseInt(process.env.FETCH_INTERVAL) || 86400000; // Fetch interval in milliseconds, default 1 day

// Configuration for channel filtering.
const config = {
    includeLanguages: process.env.INCLUDE_LANGUAGES ? process.env.INCLUDE_LANGUAGES.split(',') : [],
    includeCountries: process.env.INCLUDE_COUNTRIES ? process.env.INCLUDE_COUNTRIES.split(',') : ['GR'],
    excludeLanguages: process.env.EXCLUDE_LANGUAGES ? process.env.EXCLUDE_LANGUAGES.split(',') : [],
    excludeCountries: process.env.EXCLUDE_COUNTRIES ? process.env.EXCLUDE_COUNTRIES.split(',') : [],
    excludeCategories: process.env.EXCLUDE_CATEGORIES ? process.env.EXCLUDE_CATEGORIES.split(',') : [],
};

// Express app setup
const app = express();
app.use(express.json());

// Cache setup
const cache = new NodeCache({ stdTTL: CACHE_TTL });

// Addon Manifest
const addon = new addonBuilder({
    id: 'org.iptv',
    name: 'IPTV Addon',
    version: '0.0.1',
    description: 'Watch live TV from selected countries and languages',
    resources: ['catalog', 'meta', 'stream'],
    types: ['tv'],
    catalogs: [{
        type: 'tv',
        id: 'iptv-channels',
        name: 'IPTV',
        extra: [{ name: 'search' }],
    }],
    idPrefixes: ['iptv-'],
    behaviorHints: { configurable: true, configurationRequired: false },
    logo: "https://dl.strem.io/addon-logo.png",
    icon: "https://dl.strem.io/addon-logo.png",
    background: "https://dl.strem.io/addon-background.jpg",
});

// Helper Functions

// Convert channel to Stremio accepted Meta object
const toMeta = (channel) => ({
    id: `iptv-${channel.id}`,
    name: channel.name,
    type: 'tv',
    genres: [...(channel.categories || []), channel.country].filter(Boolean),
    poster: channel.logo,
    posterShape: 'square',
    background: channel.logo || null,
    logo: channel.logo || null,
});

// Fetch and filter channels
const getChannels = async () => {
    console.log("Downloading channels");
    try {
        const channelsResponse = await axios.get(IPTV_CHANNELS_URL);
        console.log("Finished downloading channels");
        return channelsResponse.data;
    } catch (error) {
        console.error('Error fetching channels:', error);
        return [];
    }
};

// Fetch Stream Info for the Channel
const getStreamInfo = async () => {
    if (!cache.has('streams')) {
        console.log("Downloading streams data");
        const streamsResponse = await axios.get(IPTV_STREAMS_URL);
        cache.set('streams', streamsResponse.data);
    }
    return cache.get('streams');
};

// Verify stream URL
const verifyStreamURL = async (url, userAgent, httpReferrer) => {
    const cachedResult = cache.get(url);
    if (cachedResult !== undefined) {
        return cachedResult;
    }

    const effectiveUserAgent = userAgent || 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 DMOST/2.0.0 (; LGE; webOSTV; WEBOS6.3.2 03.34.95; W6_lm21a;)';
    const effectiveReferer = httpReferrer || '';

    if (effectiveUserAgent !== 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 DMOST/2.0.0 (; LGE; webOSTV; WEBOS6.3.2 03.34.95; W6_lm21a;)') {
        console.log(`Using User-Agent: ${effectiveUserAgent}`);
    }
    if (httpReferrer) {
        console.log(`Using Referer: ${effectiveReferer}`);
    }

    try {
        const response = await axios.head(url, {
            timeout: 5000,
            headers: {
                'User-Agent': effectiveUserAgent,
                'Accept': '*/*',
                'Referer': effectiveReferer
            }
        });
        const result = response.status === 200;
        cache.set(url, result);
        return result;
    } catch (error) {
        console.log(`Stream URL verification failed for ${url}:`, error.message);
        cache.set(url, false);
        return false;
    }
};

// Get all channel information
const getAllInfo = async () => {
    if (cache.has('channelsInfo')) {
        return cache.get('channelsInfo');
    }

    const streams = await getStreamInfo();
    const channels = await getChannels();

    const streamMap = new Map(streams.map(stream => [stream.channel, stream]));

    const filteredChannels = channels.filter((channel) => {
        if (config.includeCountries.length > 0 && !config.includeCountries.includes(channel.country)) return false;
        if (config.excludeCountries.length > 0 && config.excludeCountries.includes(channel.country)) return false;
        if (config.includeLanguages.length > 0 && !channel.languages.some(lang => config.includeLanguages.includes(lang))) return false;
        if (config.excludeLanguages.length > 0 && channel.languages.some(lang => config.excludeLanguages.includes(lang))) return false;
        if (config.excludeCategories.some(cat => channel.categories.includes(cat))) return false;
        return streamMap.has(channel.id);
    });

    const channelsWithDetails = await Promise.all(filteredChannels.map(async (channel) => {
        const streamInfo = streamMap.get(channel.id);
        if (streamInfo && await verifyStreamURL(streamInfo.url, streamInfo.user_agent, streamInfo.http_referrer)) {
            const meta = toMeta(channel);
            meta.streamInfo = {
                url: streamInfo.url,
                title: 'Live Stream',
                httpReferrer: streamInfo.http_referrer
            };
            return meta;
        }
        return null;
    }));

    const filteredChannelsInfo = channelsWithDetails.filter(Boolean);
    cache.set('channelsInfo', filteredChannelsInfo);

    return filteredChannelsInfo;
};

// Addon Handlers

// Catalog Handler
addon.defineCatalogHandler(async ({ type, id }) => {
    if (type === 'tv' && id === 'iptv-channels') {
        const metas = await getAllInfo();
        console.log("Serving catalog with", metas.length, "channels");
        return { metas: metas };
    }
    return { metas: [] };
});

// Meta Handler
addon.defineMetaHandler(async ({ type, id }) => {
    if (type === 'tv' && id.startsWith('iptv-')) {
        const channels = await getAllInfo();
        const channel = channels.find((meta) => meta.id === id);
        if (channel) {
            return { meta: channel };
        }
    }
    return { meta: {} };
});

// Stream Handler
addon.defineStreamHandler(async ({ type, id }) => {
    if (type === 'tv' && id.startsWith('iptv-')) {
        const channels = await getAllInfo();
        const channel = channels.find((meta) => meta.id === id);
        if (channel?.streamInfo) {
            console.log("Serving stream id: ", channel.id);
            return { streams: [channel.streamInfo] };
        } else {
            console.log('No matching stream found for channelID:', id);
        }
    }
    return { streams: [] };
});

// Server setup
app.get('/manifest.json', (req, res) => {
    const manifest = addon.getInterface();
    console.log("Manifest requested");
    res.setHeader('Content-Type', 'application/json');
    res.json(manifest);
});
serveHTTP(addon.getInterface(), { server: app, path: '/manifest.json', port: PORT });

// Cache management
const fetchAndCacheInfo = async () => {
    try {
        cache.del('channelsInfo'); // Clear the cache to force a refresh
        await getAllInfo();
        console.log('Channel information cached successfully.');
    } catch (error) {
        console.error('Error caching channel information:', error);
    }
};

// Initial fetch
fetchAndCacheInfo();

// Schedule fetch based on FETCH_INTERVAL
setInterval(fetchAndCacheInfo, FETCH_INTERVAL);

console.clear();
