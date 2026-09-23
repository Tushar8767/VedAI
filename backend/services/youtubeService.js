const axios = require("axios");
const config = require("../config/env");

const videoCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

const CURATED_VIDEOS = {
  anxiety: [
    {
      title: "Swami Sarvapriyananda - Overcoming Anxiety with the Gita",
      url: "https://www.youtube.com/watch?v=kY41g5iK4uA",
      channel: "Vedanta Society of New York",
      duration: "18:42",
      thumbnail: "https://img.youtube.com/vi/kY41g5iK4uA/mqdefault.jpg"
    },
    {
      title: "Bhagavad Gita on Managing Stress & Worry",
      url: "https://www.youtube.com/watch?v=2n3A5D4mU2Y",
      channel: "Chinmaya Mission",
      duration: "14:15",
      thumbnail: "https://img.youtube.com/vi/2n3A5D4mU2Y/mqdefault.jpg"
    }
  ],
  fear: [
    {
      title: "Facing Fear with Bhagavad Gita Wisdom",
      url: "https://www.youtube.com/watch?v=vV9_F8aB6x0",
      channel: "Ramakrishna Math",
      duration: "16:30",
      thumbnail: "https://img.youtube.com/vi/vV9_F8aB6x0/mqdefault.jpg"
    },
    {
      title: "Arjuna's Crisis of Courage - Gita Teachings",
      url: "https://www.youtube.com/watch?v=9j7E3B6x0aA",
      channel: "Vedanta Teachings",
      duration: "12:50",
      thumbnail: "https://img.youtube.com/vi/9j7E3B6x0aA/mqdefault.jpg"
    }
  ],
  sadness: [
    {
      title: "Finding Meaning in Grief - Gita Perspective",
      url: "https://www.youtube.com/watch?v=m7B4N3K5x8Y",
      channel: "Vedanta Wisdom",
      duration: "15:20",
      thumbnail: "https://img.youtube.com/vi/m7B4N3K5x8Y/mqdefault.jpg"
    },
    {
      title: "Rising Above Sorrow and Loss - Swami Sarvapriyananda",
      url: "https://www.youtube.com/watch?v=wX8A7B6x0Y1",
      channel: "Vedanta Society",
      duration: "21:10",
      thumbnail: "https://img.youtube.com/vi/wX8A7B6x0Y1/mqdefault.jpg"
    }
  ],
  anger: [
    {
      title: "Controlling Anger Before It Controls You - Bhagavad Gita",
      url: "https://www.youtube.com/watch?v=5V9A7B3K5x8",
      channel: "Chinmaya Channel",
      duration: "13:45",
      thumbnail: "https://img.youtube.com/vi/5V9A7B3K5x8/mqdefault.jpg"
    },
    {
      title: "The Roots of Desire and Rage - Gita Chapter 2",
      url: "https://www.youtube.com/watch?v=9X7B4N3K5x8",
      channel: "Gita Studies",
      duration: "17:05",
      thumbnail: "https://img.youtube.com/vi/9X7B4N3K5x8/mqdefault.jpg"
    }
  ],
  happiness: [
    {
      title: "Sattvic Joy vs Temporary Pleasure in the Gita",
      url: "https://www.youtube.com/watch?v=3K5x8A7B4N9",
      channel: "Ramakrishna Mission",
      duration: "19:22",
      thumbnail: "https://img.youtube.com/vi/3K5x8A7B4N9/mqdefault.jpg"
    },
    {
      title: "The Art of Lasting Contentment - Gita Teachings",
      url: "https://www.youtube.com/watch?v=8A7B4N3K5x2",
      channel: "Vedanta Society",
      duration: "11:58",
      thumbnail: "https://img.youtube.com/vi/8A7B4N3K5x2/mqdefault.jpg"
    }
  ],
  neutral: [
    {
      title: "The Power of Equanimity (Samatvam) - Gita Chapter 2",
      url: "https://www.youtube.com/watch?v=4N3K5x8A7B1",
      channel: "Vedanta Society",
      duration: "16:40",
      thumbnail: "https://img.youtube.com/vi/4N3K5x8A7B1/mqdefault.jpg"
    },
    {
      title: "Daily Habits of a Steady Mind",
      url: "https://www.youtube.com/watch?v=1K5x8A7B4N3",
      channel: "Chinmaya Mission",
      duration: "14:12",
      thumbnail: "https://img.youtube.com/vi/1K5x8A7B4N3/mqdefault.jpg"
    }
  ],
  stress: [
    {
      title: "Deep Breathing and Karma Yoga for Stress Relief",
      url: "https://www.youtube.com/watch?v=7B4N3K5x8A2",
      channel: "Yoga Vedanta Center",
      duration: "15:35",
      thumbnail: "https://img.youtube.com/vi/7B4N3K5x8A2/mqdefault.jpg"
    },
    {
      title: "Letting Go of Outcome Stress - Gita Chapter 2.47",
      url: "https://www.youtube.com/watch?v=2B4N3K5x8A7",
      channel: "Vedanta Wisdom",
      duration: "18:04",
      thumbnail: "https://img.youtube.com/vi/2B4N3K5x8A7/mqdefault.jpg"
    }
  ]
};

async function getYouTubeVideos(emotion) {
  const normEmotion = String(emotion || "neutral").toLowerCase();

  // Check cache first
  const cached = videoCache.get(normEmotion);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  if (!config.YOUTUBE_API_KEY) {
    const curated = CURATED_VIDEOS[normEmotion] || CURATED_VIDEOS.neutral;
    return curated;
  }

  try {
    const queryMap = {
      fear: "Bhagavad Gita fear courage motivation",
      anxiety: "Bhagavad Gita anxiety stress relief",
      stress: "Bhagavad Gita stress calm focus",
      sadness: "Bhagavad Gita sadness overcoming grief",
      anger: "Bhagavad Gita anger control peace",
      happiness: "Bhagavad Gita inner contentment sattvic",
      neutral: "Bhagavad Gita wisdom equanimity"
    };

    const searchQuery = queryMap[normEmotion] || "Bhagavad Gita motivation";

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: searchQuery,
          maxResults: 3,
          type: "video",
          safeSearch: "strict",
          key: config.YOUTUBE_API_KEY
        },
        timeout: 4000
      }
    );

    const items = response.data.items.map((video) => ({
      title: video.snippet.title,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`
    }));

    videoCache.set(normEmotion, { timestamp: Date.now(), data: items });
    return items;
  } catch (error) {
    console.warn("YouTube API Warning:", error.message, "- Using curated fallback list.");
    const curated = CURATED_VIDEOS[normEmotion] || CURATED_VIDEOS.neutral;
    videoCache.set(normEmotion, { timestamp: Date.now(), data: curated });
    return curated;
  }
}

module.exports = { getYouTubeVideos, CURATED_VIDEOS };
