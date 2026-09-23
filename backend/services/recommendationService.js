const REMEDIES_AND_TIPS = {
  anxiety: [
    {
      type: "remedy",
      title: "🌿 4-4-6 Calming Breath",
      description: "Inhale through your nose for 4 counts, hold gently for 4, and exhale slowly for 6. Do this 3 times right now to soothe your nervous system."
    },
    {
      type: "guidance",
      title: "🧘 Focus on the Step, Release the Story",
      description: "Ask yourself: 'What is the single small thing I can do in the next 15 minutes?' Pour your attention into that, and let tomorrow take care of itself."
    },
    {
      type: "daily_tip",
      title: "📝 Write Down Your 'Worry List' and Fold It",
      description: "Put all anxious thoughts onto a piece of paper, read it once, and put it away. Tell yourself: 'I have acknowledged these; now I return to my duty.'"
    }
  ],
  stress: [
    {
      type: "remedy",
      title: "🌿 The Long Exhale Reset",
      description: "Drop your shoulders away from your ears, unclench your jaw, and take 3 deep sighs with an audible exhale. Stress physically leaves through the breath."
    },
    {
      type: "guidance",
      title: "🧘 Single-Task Mindset",
      description: "Multi-tasking scatters prana (energy). Pick just one responsibility, turn off notifications, and work calmly on it without hurrying."
    },
    {
      type: "daily_tip",
      title: "📝 10-Minute Quiet Walk Without Devices",
      description: "Step away from screens. Walk slowly for 10 minutes, observing your surroundings to bring your awareness back into the physical present."
    }
  ],
  fear: [
    {
      type: "remedy",
      title: "🌿 Feet on the Earth Grounding",
      description: "Feel both feet flat on the ground. Take 5 deep breaths, reminding yourself: 'Right here, in this exact second, I am safe and whole.'"
    },
    {
      type: "guidance",
      title: "🧘 Name the Worst Case, Then Plan Your Strength",
      description: "Face the fear honestly: 'Even if the worst happened, how would I handle it?' Once you know you can endure, fear loses its power."
    },
    {
      type: "daily_tip",
      title: "📝 Ancient Shield of the Soul",
      description: "Remember Krishna's promise: your true self is indestructible. Situations come and go like seasons; your inner strength remains."
    }
  ],
  sadness: [
    {
      type: "remedy",
      title: "🌿 Heart-Hand Warmth",
      description: "Place your right hand gently over your heart. Feel the warmth of your palm. Breathe into that space with softness and self-compassion."
    },
    {
      type: "guidance",
      title: "🧘 Allow the Feeling Without Harsh Judgment",
      description: "Sadness is not a failure; it is proof of a caring heart. Allow yourself to rest today. Do not demand immediate cheerfulness from yourself."
    },
    {
      type: "daily_tip",
      title: "📝 Drink Warm Water & Connect Gently",
      description: "Nourish your body with warmth. Reach out to one trusted person or sit in morning sunlight for 10 minutes."
    }
  ],
  anger: [
    {
      type: "remedy",
      title: "🌿 The 10-Second Sacred Pause",
      description: "Before sending that message or saying that word, pause for 10 slow seconds. Cold logic dissolves heated anger."
    },
    {
      type: "guidance",
      title: "🧘 Cool the Internal Fire",
      description: "Anger clouds clarity and always harms the vessel carrying it first. Ask: 'Will this matter in one year?' If not, let it pass."
    },
    {
      type: "daily_tip",
      title: "📝 Physical Energy Release",
      description: "Splash cold water onto your face and wrists. Take a brisk walk or do gentle physical stretching to dispel agitated adrenaline."
    }
  ],
  happiness: [
    {
      type: "remedy",
      title: "🌿 Savor the Moment with Gratitude",
      description: "Pause and take a deep breath. Acknowledge this moment of lightness and mentally thank the circumstances that made it possible."
    },
    {
      type: "guidance",
      title: "🧘 Channel Joy into Kind Action",
      description: "When your cup is full, let it spill over. Share an encouraging word, help a colleague, or do a small anonymous kindness today."
    },
    {
      type: "daily_tip",
      title: "📝 Record This Feeling in Your Journal",
      description: "Write down what brought you peace today. It will serve as an anchor and reminder during future cloudy days."
    }
  ],
  neutral: [
    {
      type: "remedy",
      title: "🌿 Cultivate Stillness (Samatvam)",
      description: "Close your eyes for 60 seconds. Notice the quiet rhythm of your natural breath without trying to change it. This is pure balance."
    },
    {
      type: "guidance",
      title: "🧘 Be the Anchor for Others",
      description: "Because you are centered today, your calm can be a sanctuary for people around you who may be struggling. Listen patiently."
    },
    {
      type: "daily_tip",
      title: "📝 Dedicated Mindful Action",
      description: "Execute your daily duties with full presence and joy. Treat work not as a burden, but as an offering of excellence."
    }
  ]
};

function getRecommendations({ emotion, guidance }) {
  const remedies = REMEDIES_AND_TIPS[emotion] || REMEDIES_AND_TIPS.neutral;
  return remedies;
}

module.exports = { getRecommendations };
