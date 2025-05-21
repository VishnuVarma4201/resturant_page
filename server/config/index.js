const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
    env: 'production',
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    email: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    twilio: {
        sid: process.env.TWILIO_SID,
        auth: process.env.TWILIO_AUTH,
        phone: process.env.TWILIO_PHONE
    },
    huggingface: {
        token: process.env.HUGGINGFACE_API_TOKEN
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    },
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? process.env.ALLOWED_ORIGINS?.split(',') 
            : '*'
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: process.env.NODE_ENV === 'production' ? 100 : 1000
    }
};
