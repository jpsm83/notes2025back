// all allowed origins for CORS requests
const allowedOrigins = [
    process.env.PUBLIC_DOMAIN_BACK, // backend domain
    process.env.PUBLIC_DOMAIN_FRONT, // frontend domain
]

module.exports = allowedOrigins