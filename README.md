# QuickAI

QuickAI is a full-stack AI-powered SaaS platform offering an all-in-one suite of generative tools—from content writing and automated resume analysis to image creation and background removal. The platform also features an interactive community showcase where users can publish creations and engage through public likes.

---

## Features

- **AI Content Generation:** Generate blog articles, catchy titles, and long-form written copy powered by Gemini API.
- **Image Generation & Editing:** Create images from text prompts and edit existing visuals with AI object and background removal using Clipdrop.
- **Resume Review:** Upload PDF resumes for structured AI evaluations and instant feedback using `pdf-parse` and LLM parsing.
- **Community Feed:** Publish generated artwork and prompts to a public gallery with real-time like toggling.
- **Authentication & Subscriptions:** User onboarding, session management, and billing handled via Clerk.
- **Media Optimization:** Fast, optimized cloud storage and transformation using Cloudinary.

---

## Tech Stack

### Client
- **Framework:** React 19, Vite
- **Styling:** Tailwind CSS v4, Lucide React
- **Routing & Networking:** React Router DOM, Axios
- **State & Notifications:** React Hot Toast, React Markdown
- **Auth:** Clerk React SDK

### Server
- **Runtime:** Node.js, Express 5
- **Database:** Neon Serverless PostgreSQL
- **AI & Processing:** Google Gemini API, Clipdrop API, `pdf-parse`, Multer
- **Storage:** Cloudinary SDK
- **Auth & Security:** Clerk Express SDK, CORS, Dotenv

---

## Project Structure

```text
├── client/          # Frontend React + Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   └── package.json
│
└── server/          # Backend Express API
    ├── controllers/
    ├── routes/
    ├── server.js
    └── package.json
