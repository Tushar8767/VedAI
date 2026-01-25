import React from 'react';

function EmotionBadge({ emotion }) {
  if (!emotion) {
    return null;
  }

  const getColor = (emotion) => {
    const emotionLower = emotion.toLowerCase();
    switch (emotionLower) {
      case 'anger':
        return '#dc3545';
      case 'fear':
        return '#fd7e14';
      case 'sadness':
        return '#0d6efd';
      case 'happiness':
        return '#198754';
      case 'neutral':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 12px',
        backgroundColor: getColor(emotion),
        color: 'white',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '500'
      }}
    >
      {emotion}
    </span>
  );
}

export default EmotionBadge;
