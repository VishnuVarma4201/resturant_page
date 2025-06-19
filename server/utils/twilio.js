const twilio = require('twilio');

// Initialize Twilio client
let client = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const sendSMS = async (to, message) => {
  try {
    // In development, just log the message
    if (process.env.NODE_ENV !== 'production') {
      console.log('SMS would be sent in production:');
      console.log('To:', to);
      console.log('Message:', message);
      return true;
    }

    // Check if Twilio is configured
    if (!client) {
      console.warn('Twilio is not configured. SMS will not be sent.');
      return false;
    }

    // Send the actual SMS
    const result = await client.messages.create({
      body: message,
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    console.log('SMS sent successfully:', result.sid);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
};

module.exports = {
  sendSMS,
  client
};
