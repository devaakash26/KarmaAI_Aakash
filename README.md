# KarmaAI - AI-Powered Component Generator

<div align="center">
  <img src="public/logo.png" alt="KarmaAI Logo" width="200" height="auto" style="margin-bottom: 20px"/>
  <p><em>Generate, preview, and export UI components with AI</em></p>
</div>

## 📋 Overview

KarmaAI is a sophisticated platform that leverages AI to generate UI components based on natural language descriptions. Built with Next.js and powered by OpenRouter's AI models, it provides an intuitive interface for developers to quickly create, preview, and export UI components without writing code from scratch.

### ✨ Key Features

- **AI Component Generation**: Transform text prompts like "Make a red button with tailwind" into production-ready JSX/TSX code
- **Live Preview**: Instantly visualize components in an interactive viewport with customizable background
- **Code Export**: Copy or download generated code for seamless integration into your projects
- **User Authentication**: Secure access with Google OAuth or email/password
- **Component History**: Track and revisit your previously generated components
- **Professional UI/UX**: Responsive design with Indian-inspired aesthetics and modern animations
- **Profile Management**: Update profile information and customize your avatar
- **Support System**: Submit and track support requests with priority levels
- **Interactive Property Editor**: Click on elements in the preview to edit their properties in real-time with visual controls

## 🛠️ Tech Stack

### Frontend
- **Next.js 15**: App Router, Server Components, Client Components
- **React 19**: Hooks, Context API
- **Tailwind CSS**: Responsive styling with custom configuration
- **Framer Motion**: Advanced animations and transitions

### Backend
- **Next.js API Routes**: RESTful endpoints for data operations
- **MongoDB/Mongoose**: Data persistence and schema validation
- **NextAuth.js**: Authentication and session management
- **Cloudinary**: Image storage and transformation
- **Nodemailer**: Transactional email service

### AI/External Services
- **OpenRouter API**: Access to various AI models for code generation
- **Google OAuth**: Secure third-party authentication

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (Atlas or local)
- Google OAuth credentials
- OpenRouter API key
- Cloudinary account
- SMTP server access for emails

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Core NextAuth settings
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_32_char_string_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/karmaai?retryWrites=true&w=majority

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (SMTP)
EMAIL_SERVER_HOST=smtp.yourprovider.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_SECURE=true
EMAIL_SERVER_USER=your_email_user
EMAIL_SERVER_PASSWORD=your_email_password
EMAIL_FROM="KarmaAI <no-reply@yourdomain.com>"
```

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/devaakash26/KarmaAI_Aakash.git
   cd karmaai
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Deployment

For deploying to Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Set `NEXTAUTH_URL` to your production URL (e.g., https://karmaai.vercel.app)
4. Update Google OAuth redirect URIs to include your production callback URL
5. Deploy!

## 📱 Usage Guide

### Creating a Component

1. Sign in with your Google account or email/password
2. Navigate to the Playground
3. Enter a descriptive prompt (e.g., "Create a responsive navbar with logo, links, and a mobile menu")
4. Select an AI model from the dropdown
5. Click "Generate Component"
6. View the live preview and generated code
7. Edit the code if needed
8. Copy the code or download it as a file

### Using the Interactive Property Editor

1. In the Preview tab, click on any element in your component (button, text, etc.)
2. A floating Property Editor panel will appear
3. Use the controls to adjust:
   - Text content
   - Padding and font size
   - Background and text colors
   - Border radius and width
   - Shadow effects
4. Changes are applied in real-time to both the preview and code
5. Drag the panel by its header to reposition it
6. Click the minimize button to collapse the panel
7. Click the X button to close the editor

### Managing Your Profile

1. Click on your profile picture in the navbar
2. Select "Settings" from the dropdown
3. Update your name or upload a new profile picture
4. Changes are saved automatically

### Getting Support

1. Click on your profile picture and select "Help"
2. Fill out the support form with your query details
3. Submit the form
4. You'll receive an email acknowledgment and the admin will be notified

## 🗂️ Project Structure

```
karmaai/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── auth/             # Authentication endpoints
│   │   ├── generate/         # AI code generation
│   │   ├── history/          # Component history
│   │   ├── support/          # Support tickets
│   │   ├── upload/           # File uploads
│   │   └── user/             # User management
│   ├── components/           # Reusable UI components
│   │   ├── Hero.js           # Landing page hero section
│   │   └── PropertyEditor.js # Interactive property editor
│   ├── help/                 # Help and support page
│   ├── login/                # Login page
│   ├── playground/           # Component generation interface
│   ├── settings/             # User settings page
│   ├── signup/               # Signup page
│   ├── globals.css           # Global styles
│   ├── layout.js             # Root layout with providers
│   ├── page.js               # Home page (hero section)
│   └── providers.js          # Auth providers wrapper
├── lib/                      # Utility functions
│   ├── email.js              # Email templates and sending
│   ├── mongodb.js            # MongoDB connection
│   └── mongoose.js           # Mongoose connection and models
├── public/                   # Static assets and images
├── .env.local                # Environment variables (local)
├── next.config.mjs           # Next.js configuration
├── package.json              # Dependencies and scripts
├── postcss.config.mjs        # PostCSS configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── README.md                 # Project documentation
```

## 🔄 Workflow

1. **Authentication Flow**:
   - User signs in via Google OAuth or email/password
   - NextAuth creates a session and JWT
   - User is redirected to the playground

2. **Component Generation Flow**:
   - User enters a prompt and selects an AI model
   - Request is sent to the OpenRouter API
   - AI generates JSX/TSX code
   - Code is displayed and rendered in the preview
   - Component is saved to user's history

3. **Interactive Editing Flow**:
   - User clicks on an element in the preview
   - Property Editor panel appears with controls for that element
   - User adjusts properties using visual controls
   - Changes are applied in real-time to both preview and code
   - User can continue refining the component visually

4. **Profile Update Flow**:
   - User uploads a new profile picture
   - Image is processed and uploaded to Cloudinary
   - User record is updated in MongoDB
   - Session is refreshed to reflect changes

## 🧠 Advanced Features

### Interactive Property Editor
The Property Editor provides a visual way to customize components without writing code. Users can:
- Edit text content directly
- Adjust padding, font size, and border properties with sliders
- Pick colors using color pickers
- Add and adjust shadows
- See changes reflected in real-time in both the preview and code

### AI Model Selection
Users can choose from different AI models available through OpenRouter, each with different capabilities and token limits.

### Component History
All generated components are saved to the user's history, allowing them to revisit and reuse previous work.

### Live Preview with Customization
The preview area renders components in real-time with options for fullscreen view and background customization.

### Responsive Design
All pages are fully responsive, providing an optimal experience on devices of all sizes.

### Email Notifications
Automated emails for account creation, support tickets, and important updates.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For questions or support, please submit a ticket through the Help page or reach out to the admin email.

---

<div align="center">
  <p>Made with ❤️ by Aakash</p>
</div>
