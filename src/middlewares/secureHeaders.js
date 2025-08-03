const helmet = require('helmet')

const secureHeaders = helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "no-referrer" }
})

module.exports = secureHeaders
