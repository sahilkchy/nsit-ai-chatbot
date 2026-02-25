# NSIT Bihta AI Support Assistant

An AI-powered chatbot for Netaji Subhash Institute of Technology (NSIT), Bihta. This assistant helps students, staff, and parents find information about admissions, courses, fees, and campus facilities directly from the official website.

## Features

- **Official Data Integration**: Answers are grounded in the official NSIT Bihta website (nsit.in).
- **Quick Actions**: One-click buttons for common queries like Admissions, Fees, and Logins.
- **Modern UI**: Built with React, Tailwind CSS, and Framer Motion for a smooth, app-like experience.
- **AI Powered**: Utilizes Google's Gemini 3 Flash model for fast and accurate responses.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4
- **AI**: Google Gemini API (@google/genai)
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Gemini API Key (Get one at [aistudio.google.com](https://aistudio.google.com/))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/nsit-ai-assistant.git
   cd nsit-ai-assistant
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
   *(Note: In this specific implementation, we use `process.env.GEMINI_API_KEY` which is handled by the build tool. For local dev, ensure your `vite.config.ts` matches your env setup.)*

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## Project Structure

- `src/App.tsx`: Main UI and chat logic.
- `src/services/geminiService.ts`: Integration with Google Gemini API.
- `src/index.css`: Global styles and Tailwind configuration.
- `public/`: Static assets.

## Credits

Developed by **Raunak & Sahil**.

## License

This project is licensed under the Apache-2.0 License.
