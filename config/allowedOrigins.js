// all allowed origins for CORS requests
const allowedOrigins = [
    process.env.PUBLIC_DOMAIN, // public domain is on PORT 5000
    'http://localhost:3500', // if for some reason PORT 5000 is not available, run on 3500
    'https://real_web_site_when_in_production.com'
]

module.exports = allowedOrigins