const fs = require('fs');
const path = require('path');

const envContent = `# Database Configuration
MONGO_URI=mongodb://localhost:27017/online-exam-system

# Server Configuration
PORT=3000
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-${Date.now()}

# Google OAuth Configuration (Optional - for Google login)
# Get these from Google Cloud Console: https://console.cloud.google.com/
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_SECRET_ID=your-google-client-secret

# Email Configuration (Optional - for email notifications)
# GMAIL_USER=your-email@gmail.com
# GMAIL_PASS=your-app-password

# AI Service Configuration (Optional)
AI_PROVIDER=local
# OPENAI_API_KEY=your-openai-api-key
# GEMINI_API_KEY=your-gemini-api-key
# HUGGINGFACE_API_KEY=your-huggingface-api-key

# Session Configuration
SESSION_SECRET=your-session-secret-key-${Date.now()}
`;

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📝 Please review and update the configuration as needed.');
  console.log('🔧 For Google OAuth, uncomment and fill in the Google credentials.');
  console.log('📧 For email notifications, uncomment and fill in the Gmail credentials.');
} else {
  console.log('⚠️  .env file already exists. Skipping creation.');
  console.log('📝 If you need to reset it, delete the .env file and run this script again.');
}

console.log('\n🚀 You can now start the server with: npm start');
console.log('🌐 Frontend can be started with: cd frontend && npm run dev');
