const express = require('express');
const cors = require('cors');
const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const axios = require('axios');
const NodeCache = require('node-cache');

const IPTV_CHANNELS_URL = 'https://iptv-org.github.io/api/channels.json';
const IPTV_STREAMS_URL = 'https://iptv-org.github.io/api/streams.json';
const PORT = process.env.PORT || 3000;

// Configuration for the channels you want to include
const config = {
    includeLanguages: [],
    includeCountries: ['GR'],
    excludeLanguages: [],
    excludeCountries: [],
    excludeCategories: [],
};

const app = express();
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    optionsSuccessStatus: 204
}));
app.use(express.json());

// Create a cache instance
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

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

// Convert channel to Stremio accepted Meta object
const toMeta = (channel, guideDetails) => ({
    id: `iptv-${channel.id}`,
    name: channel.name,
    type: 'tv',
    genres: channel.categories || null,
    poster: guideDetails ? guideDetails.currentShowImage : channel.logo,
    posterShape: 'square',
    background: channel.logo || null,
    logo: channel.logo || null,
    description: guideDetails ? `Now Playing: ${guideDetails.nowPlaying}\nNext: ${guideDetails.next}` : null,
});

// Optimize getChannels function
const getChannels = async () => {
    console.log("Downloading channels");
    try {
        const [channelsResponse, streamsResponse] = await Promise.all([
            axios.get(IPTV_CHANNELS_URL),
            axios.get(IPTV_STREAMS_URL)
        ]);

        const streamSet = new Set(streamsResponse.data.map(stream => stream.channel));

        const filteredChannels = channelsResponse.data.filter((channel) =>
            (config.includeCountries.length === 0 || config.includeCountries.includes(channel.country)) &&
            (config.excludeCountries.length === 0 || !config.excludeCountries.includes(channel.country)) &&
            (config.includeLanguages.length === 0 || channel.languages.some(lang => config.includeLanguages.includes(lang))) &&
            (config.excludeLanguages.length === 0 || !channel.languages.some(lang => config.excludeLanguages.includes(lang))) &&
            !config.excludeCategories.some(cat => channel.categories.includes(cat)) &&
            streamSet.has(channel.id)
        );

        console.log("Finished downloading channels");
        return filteredChannels.map((channel) => toMeta(channel, null));
    } catch (error) {
        console.error('Error fetching channels:', error);
        return [];
    }
};

let cachedStreams = null;
let cachedChannelsInfo = null;

// Fetch Stream Info for the Channel
const getStreamInfo = async () => {
    if (!cachedStreams) {
        console.log("Downloading streams data");
        const streamsResponse = await axios.get(IPTV_STREAMS_URL);
        cachedStreams = streamsResponse.data;
    }
};

// Optimize verifyStreamURL function
const verifyStreamURL = async (url) => {
    const cachedResult = cache.get(url);
    if (cachedResult !== undefined) {
        return cachedResult;
    }

    try {
        const response = await axios.head(url, { timeout: 5000 });
        const result = response.status === 200;
        cache.set(url, result);
        return result;
    } catch (error) {
        console.log(`Stream URL verification failed for ${url}:`, error.message);
        cache.set(url, false);
        return false;
    }
};

// Optimize get_all_info function
const get_all_info = async () => {
    if (cachedChannelsInfo) {
        return cachedChannelsInfo;
    }

    await getStreamInfo();
    const channels = await getChannels();

    const channelsWithDetails = await Promise.all(channels.map(async (channel) => {
        const channelID = channel.id.startsWith('iptv-') ? channel.id.split('iptv-')[1] : channel.id;
        const streamInfo = cachedStreams.find((stream) => stream.channel === channelID);
        if (streamInfo && await verifyStreamURL(streamInfo.url)) {
            channel.streamInfo = {
                url: streamInfo.url,
                title: 'Live Stream',
            };
            return channel;
        }
        return null;
    }));

    cachedChannelsInfo = channelsWithDetails.filter(channel => channel !== null);
    return cachedChannelsInfo;
};

// Catalog Handler
addon.defineCatalogHandler(async (args) => {
    if (args.type === 'tv' && args.id === 'iptv-channels') {
        const metas = await get_all_info();
        console.log("Catalog", metas, args)
        return { metas: metas };
    }
    return { metas: [] };
});

// Meta Handler
addon.defineMetaHandler(async (args) => {
    if (args.type === 'tv' && args.id.startsWith('iptv-')) {
        const channelID = args.id.split('iptv-')[1];
        const channels = await get_all_info();
        const channel = channels.find((meta) => meta.id === args.id);
        if (channel) {
            console.log("Meta", channel, args)
            return { meta: channel };
        }
    }
    return { meta: {} };
});

// Stream Handler
addon.defineStreamHandler(async (args) => {
    if (args.type === 'tv' && args.id.startsWith('iptv-')) {
        const channelID = args.id.split('iptv-')[1];
        const channels = await get_all_info();
        const channel = channels.find((meta) => meta.id === args.id);
        if (channel && channel.streamInfo) {
            console.log("Steam", channel, args)
            return {
                streams: [
                    {
                        url: channel.streamInfo.url,
                        title: 'Live Stream',
                    },
                ],
            };
        } else {
            console.log('No matching stream found for channelID:', channelID);
        }
    }
    return { streams: [] };
});

// Serve Add-on on Port 3000
app.get('/manifest.json', (req, res) => {
    const manifest = addon.getInterface();
    console.log(manifest);
    res.setHeader('Content-Type', 'application/json');
    res.json(manifest);
});
serveHTTP(addon.getInterface(), { server: app, path: '/manifest.json', port: PORT });

// Optimize fetchAndCacheInfo function
const fetchAndCacheInfo = async () => {
    try {
        cachedChannelsInfo = null; // Clear the cache to force a refresh
        await get_all_info();
        console.log('Channel information cached successfully.');
    } catch (error) {
        console.error('Error caching channel information:', error);
    }
};

// Initial fetch
fetchAndCacheInfo();

// Schedule fetch every hour (3600000 milliseconds)
setInterval(fetchAndCacheInfo, 3600000);

console.clear();
// console.log(`config is at http://localhost:${PORT}/`);
