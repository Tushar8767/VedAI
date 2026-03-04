// VedAI - Frontend JavaScript

const API_URL = 'http://localhost:5000/process';

// DOM Elements
const userInput = document.getElementById('userInput');
const submitBtn = document.getElementById('submitBtn');
const resultsSection = document.getElementById('resultsSection');
const errorMessage = document.getElementById('errorMessage');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoader = submitBtn.querySelector('.btn-loader');

// Results Elements
const emotionBadge = document.getElementById('emotionBadge');
const emotionIcon = document.getElementById('emotionIcon');
const emotionText = document.getElementById('emotionText');
const confidence = document.getElementById('confidence');
const verse = document.getElementById('verse');
const meaning = document.getElementById('meaning');
const explanation = document.getElementById('explanation');
const videosSection = document.getElementById('videosSection');
const videoGrid = document.getElementById('videoGrid');

// Emotion Icons Mapping
const emotionIcons = {
    fear: '😨',
    anxiety: '😰',
    sadness: '😢',
    anger: '😠',
    happiness: '😊',
    neutral: '😌',
    joy: '😊'
};

// Event Listeners
submitBtn.addEventListener('click', handleSubmit);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        handleSubmit();
    }
});

// Main Handler
async function handleSubmit() {
    const text = userInput.value.trim();
    
    if (!text) {
        showError('Please share your thoughts first.');
        return;
    }

    // Show loading state
    setLoading(true);
    hideError();
    resultsSection.classList.add('hidden');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_text: text })
        });

        if (!response.ok) {
            throw new Error('Failed to get response from server');
        }

        const data = await response.json();
        displayResults(data);
        
    } catch (error) {
        console.error('Error:', error);
        
        if (error.message.includes('Failed to fetch')) {
            showError('Unable to connect to the server. Please make sure the backend is running.');
        } else {
            showError(error.message || 'Something went wrong. Please try again.');
        }
    } finally {
        setLoading(false);
    }
}

// Display Results
function displayResults(data) {
    // Display Emotion
    const emotion = data.emotion || 'neutral';
    emotionText.textContent = capitalizeFirst(emotion);
    emotionIcon.textContent = emotionIcons[emotion] || emotionIcons.neutral;
    
    // Display Confidence
    const confidenceValue = data.confidence ? Math.round(data.confidence * 100) : 0;
    confidence.textContent = confidenceValue;

    // Display Verse
    verse.textContent = data.verse || ' Verse not available';
    meaning.textContent = data.meaning || ' Meaning not available';
    
    // Display Explanation
    explanation.textContent = data.explanation || ' Explanation not available';

    // Display Videos
    displayVideos(data.videos);

    // Show results
    resultsSection.classList.remove('hidden');
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Display Videos
function displayVideos(videos) {
    videoGrid.innerHTML = '';

    if (!videos || videos.length === 0) {
        videosSection.classList.add('hidden');
        return;
    }

    videosSection.classList.remove('hidden');

    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <a href="${video.url}" target="_blank" rel="noopener noreferrer">
                <h4>${video.title}</h4>
            </a>
        `;
        videoGrid.appendChild(videoCard);
    });
}

// Loading State
function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    btnText.textContent = isLoading ? 'Processing...' : 'Get Guidance';
    btnLoader.classList.toggle('hidden', !isLoading);
}

// Error Handling
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

// Utility Functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('VedAI Frontend Initialized');
    
    // Focus input on load
    userInput.focus();
});

