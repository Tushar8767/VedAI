import axios from 'axios';

export const processUserText = async (userText) => {
  const response = await axios.post('/process', {
    user_text: userText
  });
  return response.data;
};



