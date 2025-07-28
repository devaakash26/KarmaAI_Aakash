# KarmaAI - AI-Powered Component Generator

KarmaAI is a platform that allows users to generate UI components using AI. Simply describe the component you want, and KarmaAI will generate the code and provide a live preview.

## Features

- **AI-Powered Generation**: Describe components in plain English and get production-ready code
- **Live Preview**: See your components in action instantly
- **Code Export**: Download or copy the generated code for use in your projects
- **User Authentication**: Secure login with Google OAuth or email/password
- **Component History**: Keep track of your previously generated components

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: MongoDB
- **AI**: OpenRouter API (Claude 3 Opus)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database
- Google OAuth credentials
- OpenRouter API key

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# MongoDB
MONGODB_URI=your_mongodb_uri_here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
```bash
npm run dev
```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Sign in with your Google account or create a new account
2. Navigate to the playground
3. Describe the component you want to create (e.g., "Make a red button with tailwind")
4. Click "Generate Component"
5. View the live preview and the generated code
6. Copy the code or download it as a file

## Project Structure

```
karmaai/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   ├── playground/       # Component generation playground
│   ├── layout.js         # Root layout
│   ├── page.js           # Home page
│   └── providers.js      # Auth providers
├── lib/                  # Utility functions and database connections
├── public/               # Static assets
└── README.md             # Project documentation
```

## Future Enhancements

- Component sharing functionality
- More export options (TypeScript, Vue, Svelte)
- Custom theming options
- Team collaboration features
- Integration with design tools

## License

This project is licensed under the MIT License.
