import React from 'react';

function ResponseCard({ response }) {
  if (!response) {
    return null;
  }

  const { emotion, confidence, verse, meaning, explanation, videos } = response;

  return (
    <div style={{
      padding: '24px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      {confidence !== undefined && (
        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
          <strong>Confidence:</strong> {(confidence * 100).toFixed(0)}%
        </div>
      )}
      
      {verse && (
        <div style={{
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          borderLeft: '4px solid #4a90e2'
        }}>
          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Verse
          </div>
          <div style={{ fontSize: '18px', lineHeight: '1.6', color: '#333' }}>
            {verse}
          </div>
        </div>
      )}
      
      {meaning && (
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
          <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666', fontWeight: '600' }}>
            Meaning
          </div>
          <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#333' }}>
            {meaning}
          </div>
        </div>
      )}
      
      {explanation && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666', fontWeight: '600' }}>
            Explanation
          </div>
          <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#333' }}>
            {explanation}
          </div>
        </div>
      )}
      
      {videos && videos.length > 0 && (
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#666', fontWeight: '600' }}>
            Videos
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'none' }}>
            {videos.map((video, index) => (
              <li key={index} style={{ marginBottom: '12px' }}>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#4a90e2',
                    textDecoration: 'none',
                    fontSize: '15px',
                    display: 'inline-block',
                    padding: '4px 0'
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  {video.title || video.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ResponseCard;
