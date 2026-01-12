function getGitaGuidance(emotion) {
  const data = {
    fear: {
      verse: "क्लैब्यं मा स्म गमः पार्थ",
      meaning: "Do not yield to fear",
      explanation: "Face challenges with courage and duty"
    },
    anxiety: {
      verse: "योगस्थः कुरु कर्माणि",
      meaning: "Remain balanced in action",
      explanation: "Detach from results and focus on effort"
    },
    sadness: {
      verse: "न जायते म्रियते वा कदाचित्",
      meaning: "The soul is eternal",
      explanation: "Pain is temporary; the soul is permanent"
    }
  };

  return data[emotion] || {
    verse: "कर्मण्येवाधिकारस्ते",
    meaning: "You have the right to work",
    explanation: "Focus on action, not outcome"
  };
}

module.exports = { getGitaGuidance };
