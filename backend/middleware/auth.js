const jwt = require('jsonwebtoken');

// Middleware to verify JWT token for protected routes
module.exports = (req, res, next) => {
    // Extract the authorization header from the request
    const authHeader = req.headers.authorization;

    // Check if the authorization header is missing or doesn't start with 'Bearer'
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Respond with a 401 status code if no token is provided
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // Extract the token from the authorization header
    const token = authHeader.split(' ')[1];

    try {
        // Verify the token using the secret key from environment variables
        const decoded = jwt.verify(token, process.env.JWT_TOKEN);

        // If token is valid, attach the decoded user data to the request object
        req.user = decoded;

        // Call the next middleware or route handler
        next();
    } catch (err) {
        // Respond with a 401 status code if the token is invalid or expired
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
