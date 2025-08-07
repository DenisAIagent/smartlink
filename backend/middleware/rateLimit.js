const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for login attempts to prevent brute-force attacks.
 * Limits each IP to 5 login requests per minute.
 */
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
        code: 'AUTH004',
        message: 'Too many login attempts. Please try again after a minute.'
    });
  }
});

module.exports = {
  loginLimiter,
};
