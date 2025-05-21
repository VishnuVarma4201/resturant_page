const twilio = require("twilio");
const dotenv = require("dotenv");

dotenv.config();

// Development mode flag
const isDevelopment = process.env.NODE_ENV !== 'production';

// Initialize Twilio client only if not in development
let client;
if (!isDevelopment) {
  try {
    client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
  }
}

const validateTwilioConfig = () => {
  const required = {
    TWILIO_SID: process.env.TWILIO_SID,
    TWILIO_AUTH: process.env.TWILIO_AUTH,
    TWILIO_PHONE: process.env.TWILIO_PHONE
  };

  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Twilio configuration: ${missing.join(', ')}`);
  }
};

const formatPhoneNumber = (phone) => {
  if (!phone) throw new Error('Phone number is required');
  
  // Remove any non-digit characters except '+'
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure it has a '+' prefix
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  // Validate phone number format (basic check)
  if (cleaned.length < 10) {
    throw new Error('Invalid phone number format');
  }
  
  return cleaned;
};

const sendSMS = async (phone, otp) => {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    // In development mode, just log the OTP
    if (isDevelopment) {
      console.log('\n=== DEVELOPMENT MODE ===');
      console.log(`📱 SMS would be sent to: ${formattedPhone}`);
      console.log(`🔐 OTP for testing: ${otp}`);
      console.log('=====================\n');
      
      // Return a mock message object
      return {
        sid: 'DEVELOPMENT_MODE',
        status: 'delivered',
        to: formattedPhone,
        body: `Your OTP is: ${otp}`
      };
    }
    
    // Production mode - actually send SMS
    validateTwilioConfig();
    const formattedTwilioPhone = formatPhoneNumber(process.env.TWILIO_PHONE);
    
    const message = await client.messages.create({
      body: `Your OTP is: ${otp}`,
      from: formattedTwilioPhone,
      to: formattedPhone,
    });
    
    console.log('SMS sent successfully:', {
      sid: message.sid,
      status: message.status,
      direction: message.direction
    });
    
    return message;
  } catch (error) {
    console.error('SMS sending failed:', {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo
    });
    throw error;  }
};

// Export as default
module.exports = sendSMS;
