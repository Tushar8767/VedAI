import React, { useState } from 'react';
import TextInput from '../components/TextInput';
import ResponseCard from '../components/ResponseCard';
import EmotionBadge from '../components/EmotionBadge';
import { processUserText } from '../services/api';

function Home() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTextSubmit = async (userText) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await processUserText(userText);
      setResponse(response);
      setLoading(false);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '24px 16px',
      minHeight: '100vh'
    }}>
      <TextInput onSubmit={handleTextSubmit} />
      {loading && (
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '16px', color: '#666' }}>
          Loading...
        </div>
      )}
      {error && (
        <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#fee', color: '#c33', borderRadius: '4px', border: '1px solid #fcc' }}>
          {error}
        </div>
      )}
      {response && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ marginBottom: '16px' }}>
            <EmotionBadge emotion={response.emotion} />
          </div>
          <ResponseCard response={response} />
        </div>
      )}
    </div>
  );
}

export default Home;
