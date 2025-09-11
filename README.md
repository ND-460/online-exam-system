# Online Examination System

A comprehensive web-based examination platform built with Node.js, Express, React, and MongoDB. Features AI-powered question generation, real-time exam management, and detailed analytics.

## Features

- **User Management**: Student and Teacher registration/login with Google OAuth
- **AI Question Generation**: Generate questions from PDFs or text prompts using OpenAI, Gemini, or Hugging Face
- **Test Management**: Create, edit, and manage exams with multiple question types
- **Real-time Examination**: Secure online exam environment with timer
- **Analytics**: Detailed performance analytics and reporting
- **Modern UI**: Responsive design with Tailwind CSS and React

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ND-460/online-exam-system.git
   cd online-exam-system
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/online-exam-system
   
   # JWT
   JWT_SECRET=your_jwt_secret_key_here
   
   # Server
   PORT=3000
   BASE_URL=http://localhost:3000
   
   # AI Provider (choose one)
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Email
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   ```

## Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the backend server**
   ```bash
   npm start
   ```

3. **Start the frontend development server** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## AI Configuration

The system supports multiple AI providers for question generation:

### Option 1: Google Gemini (Recommended - FREE)
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

### Option 2: OpenAI
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
```

### Option 3: Hugging Face (FREE)
```env
AI_PROVIDER=huggingface
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

### Option 4: Local Mode (No API Key Required)
```env
AI_PROVIDER=local
```

## Project Structure

```
online-exam-system/
├── config/                 # Database and passport configuration
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── pages/         # React components/pages
│   │   ├── store/         # State management
│   │   └── assets/        # Static assets
├── middleware/             # Express middlewares
├── model/                  # MongoDB schemas
├── routes/                 # API routes
├── utils/                  # Utility functions
│   ├── aiService.js       # AI integration
│   ├── pdfProcessor.js    # PDF text extraction
│   └── fileUpload.js      # File upload handling
├── uploads/                # Uploaded files storage
└── index.js               # Main server file
```

## API Endpoints

### Authentication
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login
- `GET /api/user/oauth2/redirect/google` - Google OAuth callback

### Teacher Routes
- `GET /api/teacher/tests/:profileID` - Get teacher's tests
- `POST /api/teacher/create-test` - Create new test
- `PUT /api/teacher/update-test/:testid` - Update test
- `DELETE /api/teacher/delete-test/:testid` - Delete test
- `POST /api/teacher/generate-questions-pdf` - Generate questions from PDF
- `POST /api/teacher/generate-questions-prompt` - Generate questions from prompt

### Student Routes
- `GET /api/student/tests/:profileID` - Get assigned tests
- `POST /api/student/submit-test` - Submit test answers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please open an issue on GitHub or contact the development team.
