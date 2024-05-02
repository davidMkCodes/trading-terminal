const { sign } = require('jsonwebtoken');
const crypto = require('crypto');

function generateToken(apiKey, apiSecret, requestMethod, requestPath) {
    const key_name = apiKey;
    const key_secret = apiSecret;
    const url = 'api.coinbase.com';
    const service_name = "retail_rest_api_proxy"

    const algorithm = 'ES256';
    const uri = requestMethod + ' ' + url + requestPath;

    const token = sign(
        {
            aud: [service_name],
            iss: 'coinbase-cloud',
            nbf: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 120,
            sub: key_name,
            uri,
        },
        key_secret,
        {
            algorithm,
            header: {
                kid: key_name,
                nonce: crypto.randomBytes(16).toString('hex'),
            },
        }
    );
    return token;
}

module.exports = { generateToken };
