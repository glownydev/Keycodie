const API_KEY = 'AIzaSyB9e1kKkLbBRFn6eoOCo_smiiLytgVFWtA';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function addMessage(message, sender) {
  const messageEl = document.createElement('div');
  messageEl.textContent = message;
  messageEl.classList.add(sender);
  chatContainer.appendChild(messageEl);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendToGemini(prompt) {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    const data = await response.json();
    
    // Robust error checking
    if (!data || !data.candidates || data.candidates.length === 0) {
      console.error('Invalid API response:', data);
      return 'Sorry, I could not process your request.';
    }

    // Safe navigation to extract text
    const responseText = data.candidates[0]?.content?.parts?.[0]?.text || 
                         'Sorry, I could not generate a response.';
    
    return responseText;
  } catch (error) {
    console.error('Error:', error);
    return 'Sorry, there was an error processing your request.';
  }
}

function initializeEventListeners() {
  if (sendBtn && userInput) {
    sendBtn.addEventListener('click', async () => {
      const userMessage = userInput.value.trim();
      if (userMessage) {
        addMessage(userMessage, 'user');
        userInput.value = '';

        const aiResponse = await sendToGemini(userMessage);
        addMessage(aiResponse, 'ai');
      }
    });

    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendBtn.click();
      }
    });
  } else {
    console.error('Could not find send button or user input element');
  }
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeEventListeners);
