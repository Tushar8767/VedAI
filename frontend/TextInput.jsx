import React, { useState } from 'react';

function TextInput({ onSubmit }) {
  const [userText, setUserText] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= 500) {
      setUserText(value);
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!userText.trim()) {
      setError('Please enter some text');
      return;
    }

    if (onSubmit) {
      onSubmit(userText);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={userText}
        onChange={handleChange}
        placeholder="Share how you're feeling…"
        rows={6}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontFamily: 'inherit',
          resize: 'vertical'
        }}
      />
      <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
        {userText.length}/500
      </div>
      {error && (
        <div style={{ marginTop: '8px', color: 'red', fontSize: '14px' }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        style={{
          marginTop: '12px',
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#4a90e2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Get Guidance
      </button>
    </form>
  );
}

export default TextInput;
