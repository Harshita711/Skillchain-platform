const https = require('https');
const { URL } = require('url');

// Simple Nominatim geocoding helper. Returns { lat, lon } or null.
// Respects optional env var GEOCODER_USER (used for User-Agent header).
exports.geocodeAddress = async function(address) {
    if (!address) return null;

    const base = 'https://nominatim.openstreetmap.org/search';
    const params = new URL(base);
    params.searchParams.append('q', address);
    params.searchParams.append('format', 'json');
    params.searchParams.append('limit', '1');

    const options = {
        headers: {
            'User-Agent': process.env.GEOCODER_USER || 'SkillChain/1.0 (contact@skillchain.example)'
        }
    };

    return new Promise((resolve) => {
        https.get(params, options, (res) => {
            let raw = '';
            res.on('data', (d) => raw += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(raw);
                    if (Array.isArray(json) && json.length > 0) {
                        const { lat, lon } = json[0];
                        resolve({ lat: Number(lat), lon: Number(lon) });
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
};

// Geocode with retries and exponential backoff
exports.geocodeWithRetry = async function(address, attempts = 3, delay = 800) {
    if (!address) return null;
    for (let i = 0; i < attempts; i++) {
        const result = await exports.geocodeAddress(address);
        if (result) return result;
        // Exponential backoff
        await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
    return null;
};
