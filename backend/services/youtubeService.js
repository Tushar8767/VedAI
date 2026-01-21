const axios = require("axios");

async function getYouTubeVideos(emotion) {
  try {
    const queryMap = {
      fear: "Bhagavad Gita fear motivation",
      anxiety: "Bhagavad Gita anxiety stress",
      sadness: "Bhagavad Gita sadness motivation",
      anger: "Bhagavad Gita anger control",
      happiness: "Bhagavad Gita happiness",
      neutral: "Bhagavad Gita wisdom"
    };

    const searchQuery = queryMap[emotion] || "Bhagavad Gita motivation";

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: searchQuery,
          maxResults: 3,
          type: "video",
          key: process.env.YOUTUBE_API_KEY
        }
      }
    );

    return response.data.items.map(video => ({
      title: video.snippet.title,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`
    }));
  } catch (error) {
    console.error("YouTube API Error:", error.message);
    return [];
  }
}

module.exports = { getYouTubeVideos };
