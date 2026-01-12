const axios = require("axios");

async function getYouTubeVideos(emotion) {
  try {
    const queryMap = {
      fear: "Bhagavad Gita fear motivation",
      anxiety: "Bhagavad Gita anxiety stress",
      sadness: "Bhagavad Gita sadness motivation",
      anger: "Bhagavad Gita anger control",
      happiness: "Bhagavad Gita happiness"
    };

    const query = queryMap[emotion] || "Bhagavad Gita motivation";

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: query,
          maxResults: 3,
          type: "video",
          key: process.env.YOUTUBE_API_KEY
        }
      }
    );

    return response.data.items.map(item => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));
  } catch (error) {
    console.error("YouTube API error:", error.message);
    return [];
  }
}

module.exports = { getYouTubeVideos };
