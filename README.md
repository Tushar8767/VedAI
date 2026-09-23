# VedAI - Emotional Wisdom System

VedAI is an emotion-aware mental well-being support system that combines modern AI with ancient Bhagavad Gita wisdom to provide personalized guidance based on your emotional state.

## Features

- **Emotion Detection**: Uses AI to analyze your text and detect emotions (fear, anxiety, sadness, anger, happiness, neutral)
- **Local Prototype Accounts**: Register/login with hashed passwords and signed bearer tokens
- **Saved Emotion History**: Authenticated reflections are persisted and used by the dashboard
- **Dashboard**: Shows current emotional estimate, recent emotions, emotion distribution, and a transparent VedAI Wellness Index
- **Journal**: Authenticated users can save private local journal entries
- **Personalized Gita Guidance**: Provides relevant verses from the Bhagavad Gita based on your emotional state
- **Video Recommendations**: Suggests helpful YouTube videos for your emotional needs
- **Beautiful UI**: Clean, calming interface designed for mental well-being

## Project Structure

```
VedAI/
├── backend/
│   ├── config/
│   │   └── env.js           # Environment configuration
│   ├── controllers/
│   │   └── processController.js  # Main processing logic
│   ├── routes/
│   │   └── processRoutes.js      # API routes
│   ├── services/
│   │   ├── emotionService.js     # Emotion detection
│   │   ├── gitaService.js        # Gita verses
│   │   └── youtubeService.js     # YouTube videos
│   ├── data/                     # Local JSON prototype database, gitignored
│   ├── middleware/               # Auth middleware
│   ├── test/                     # Node test runner tests
│   └── server.js                 # Express server
├── frontend/
│   ├── index.html                # Main HTML
│   ├── styles.css                # Styling
│   ├── app.js                    # Frontend JavaScript
│   └── package.json              # Frontend dependencies
├── ml_model/
│   ├── app.py                    # FastAPI ML model
│   └── requirements.txt          # ML dependencies
├── docs/
│   └── gitaData.json             # Gita verses data
├── package.json                  # Root dependencies
└── .env.example                  # Environment variables template
```

## Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- pip (Python package manager)

## Installation

1. **Clone the repository**

2. **Install Node.js dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. **Install Python dependencies**
   ```bash
   cd ml_model
   pip install -r requirements.txt
   cd ..
   ```

4. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Add your YouTube API key (optional - app works without it)

## Running the Application

### Option 1: Run all services together
```bash
npm run dev
```

### Option 2: Run services separately

**Terminal 1 - ML Model (Port 8001)**
```bash
cd ml_model
uvicorn app:app --reload --port 8001
```

**Terminal 2 - Backend API (Port 5000)**
```bash
npm start
```

**Terminal 3 - Frontend (Port 3000)**
```bash
cd frontend
npm start
```

## Usage

1. Open your browser to `http://localhost:3000`
2. Share your thoughts or feelings in the text box
3. Click "Get Guidance" to receive:
   - Your detected emotion
   - A relevant Bhagavad Gita verse
   - Its meaning and explanation
   - Helpful video recommendations

## API Endpoints

### POST /api/v1/auth/register
Creates a local prototype account.

### POST /api/v1/auth/login
Returns a signed bearer token.

### GET /api/v1/auth/me
Returns the current authenticated user.

### GET /api/v1/dashboard
Returns saved emotion history, journal summary, recommendation summary, and VedAI Wellness Index for the authenticated user.

### GET /api/v1/history
Returns authenticated user emotion history.

### GET /api/v1/journal
Returns authenticated user journal entries.

### POST /api/v1/journal
Creates an authenticated user journal entry.

### POST /api/v1/process
Analyzes user text and returns emotion-based guidance.

**Request:**
```json
{
  "user_text": "I'm feeling anxious about my exams..."
}
```

When called with `Authorization: Bearer <token>`, the result is also saved to the user's local emotion history.

**Response:**
```json
{
  "emotion": "anxiety",
  "confidence": 0.89,
  "verse": "योगस्थः कुरु कर्माणि",
  "meaning": "Remain balanced and focused while doing your duty.",
  "explanation": "Anxiety comes from attachment to results. Focus on effort.",
  "videos": [
    { "title": "Bhagavad Gita anxiety stress", "url": "..." }
  ]
}
```

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Axios
- **Backend**: Node.js, Express.js
- **ML Model**: Python, FastAPI, Transformers (RoBERTa)
- **Data**: Bhagavad Gita verses

## License

ISC

