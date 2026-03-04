# VedAI - Emotional Wisdom System

VedAI is an emotion-aware mental well-being support system that combines modern AI with ancient Bhagavad Gita wisdom to provide personalized guidance based on your emotional state.

## Features

- **Emotion Detection**: Uses AI to analyze your text and detect emotions (fear, anxiety, sadness, anger, happiness, neutral)
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

### POST /process
Analyzes user text and returns emotion-based guidance.

**Request:**
```json
{
  "user_text": "I'm feeling anxious about my exams..."
}
```

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

