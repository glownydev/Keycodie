const API_KEY = 'AIzaSyB9e1kKkLbBRFn6eoOCo_smiiLytgVFWtA';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

function detectFileType() {
  const fileExtension = window.location.pathname.split('.').pop().toLowerCase();
  const codeExtensions = ['html', 'js', 'css', 'py', 'java', 'cpp', 'rb', 'php', 'ts'];
  return codeExtensions.includes(fileExtension) ? fileExtension : null;
}

async function analyzeCode(code, fileType) {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this ${fileType} code for potential errors or improvements:\n\n${code}`
          }]
        }]
      })
    });

    const data = await response.json();
    
    // Robust error checking
    if (!data || !data.candidates || data.candidates.length === 0) {
      console.error('Invalid API response:', data);
      return 'Sorry, I could not analyze the code.';
    }

    // Safe navigation to extract text
    const analysisText = data.candidates[0]?.content?.parts?.[0]?.text || 
                         'Sorry, I could not generate an analysis.';
    
    return analysisText;
  } catch (error) {
    console.error('Error analyzing code:', error);
    return 'Error analyzing code. Please check the console for details.';
  }
}

function createCodeAnalysisOverlay(analysis) {
  const overlay = document.createElement('div');
  overlay.id = 'keycodie-analysis-overlay';
  overlay.innerHTML = `
    <style>
      #keycodie-analysis-overlay {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        max-height: 400px;
        overflow-y: auto;
        background-color: var(--overlay-bg, white);
        border: 1px solid var(--overlay-border, #ddd);
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        color: var(--overlay-text, black);
        font-family: 'Roboto', sans-serif;
        line-height: 1.6;
      }
      #keycodie-analysis-overlay h3 {
        margin-top: 0;
        color: var(--heading-color, #333);
        border-bottom: 1px solid var(--border-color, #ddd);
        padding-bottom: 10px;
      }
      #keycodie-analysis-overlay p {
        margin-bottom: 15px;
      }
      #close-keycodie-overlay {
        background-color: var(--button-bg, #007bff);
        color: var(--button-text, white);
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      #close-keycodie-overlay:hover {
        background-color: var(--button-hover-bg, #0056b3);
      }
      @media (prefers-color-scheme: dark) {
        #keycodie-analysis-overlay {
          --overlay-bg: #1e1e1e;
          --overlay-border: #444;
          --overlay-text: #e0e0e0;
          --heading-color: #f0f0f0;
          --button-bg: #0056b3;
          --button-text: white;
          --button-hover-bg: #003d82;
        }
      }
    </style>
    <h3>Keycodie Code Analysis</h3>
    <p>${analysis}</p>
    <button id="close-keycodie-overlay">Close</button>
  `;

  document.body.appendChild(overlay);

  document.getElementById('close-keycodie-overlay').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}

function detectHTMLErrors() {
  const errors = [];
  
  // Check for missing alt text on images
  const images = document.querySelectorAll('img:not([alt])');
  if (images.length > 0) {
    errors.push(`${images.length} image(s) missing alt text`);
  }
  
  // Check for empty links
  const emptyLinks = document.querySelectorAll('a:not([href])');
  if (emptyLinks.length > 0) {
    errors.push(`${emptyLinks.length} empty link(s) found`);
  }
  
  // Check for deprecated HTML tags
  const deprecatedTags = document.querySelectorAll('font, center, strike');
  if (deprecatedTags.length > 0) {
    errors.push(`${deprecatedTags.length} deprecated HTML tag(s) used`);
  }
  
  // Check for accessibility issues
  const missingHeadings = document.body.querySelectorAll('h1, h2, h3, h4, h5, h6').length === 0;
  if (missingHeadings) {
    errors.push('No headings found (potential accessibility issue)');
  }
  
  return errors;
}

function suggestHTMLFixes(errors) {
  return errors.map(error => {
    switch(true) {
      case error.includes('missing alt text'):
        return 'Add descriptive alt text to images for better accessibility and SEO.';
      case error.includes('empty link(s)'):
        return 'Remove or add href attributes to links to improve user experience.';
      case error.includes('deprecated HTML tag(s)'):
        return 'Replace deprecated HTML tags with modern semantic HTML elements.';
      case error.includes('No headings found'):
        return 'Add semantic headings (h1-h6) to improve page structure and accessibility.';
      default:
        return 'General HTML improvement suggested.';
    }
  });
}

function init() {
  const fileType = detectFileType();
  if (fileType) {
    // Use textContent instead of innerText for better cross-browser compatibility
    const code = document.body.textContent || document.body.innerText;
    
    // Only analyze if code is not empty
    if (code && code.trim().length > 10) {
      // Interactive mode for HTML files
      if (fileType === 'html') {
        const htmlErrors = detectHTMLErrors();
        
        // Prepare context for AI analysis
        const context = {
          fileType: fileType,
          errors: htmlErrors,
          pageUrl: window.location.href,
          pageTitle: document.title
        };

        // Ask AI for comprehensive analysis
        sendToGemini(`Analyze this HTML page for potential improvements and interactions. 
Context:
${JSON.stringify(context, null, 2)}

Page Content (first 500 chars):
${code.substring(0, 500)}`)
          .then(aiResponse => {
            createCodeAnalysisOverlay(
              `HTML Analysis:

Errors Detected:
${htmlErrors.length > 0 ? htmlErrors.join('\n') : 'No critical errors found'}

AI Insights:
${aiResponse}`
            );
          })
          .catch(error => {
            console.error('Comprehensive analysis failed:', error);
            createCodeAnalysisOverlay(
              `Basic HTML Errors:
${htmlErrors.join('\n')}

AI Analysis unavailable. Please check your internet connection.`
            );
          });
      } else {
        // Standard code analysis for non-HTML files
        analyzeCode(code, fileType)
          .then(analysis => {
            createCodeAnalysisOverlay(analysis);
          })
          .catch(error => {
            console.error('Code analysis failed:', error);
            createCodeAnalysisOverlay('Unable to analyze code. Please check the console for details.');
          });
      }
    }
  }
}

function createFloatingKeycodieIcon() {
  // Create settings overlay
  const settingsOverlay = document.createElement('div');
  settingsOverlay.id = 'keycodie-settings-overlay';
  settingsOverlay.style.display = 'none';
  settingsOverlay.innerHTML = `
    <div id='keycodie-settings-modal'>
      <h2>Keycodie Settings</h2>
      <div class='setting'>
        <span style='color: #e0e0e0;'>Disable Chat Bubble</span>
        <input type='checkbox' id='disable-bubble' style='background-color: #333; color: #e0e0e0;'>
      </div>
      <div class='setting'>
        <span style='color: #e0e0e0;'>Language</span>
        <select id='language-selector' style='background-color: #333; color: #e0e0e0; border: 1px solid #444;'>
          <option value='fr' style='background-color: #2c2c2c;'>Français</option>
          <option value='en' style='background-color: #2c2c2c;'>English</option>
          <option value='es' style='background-color: #2c2c2c;'>Español</option>
        </select>
      </div>
      <div style='text-align: center; margin-top: 15px;'>
        <button id='save-settings' style='background-color: #007bff; color: white; border: none; padding: 10px; border-radius: 0;'>Save Settings</button>
      </div>
    </div>
  `;

  // Create icon container
  const keycodeIcon = document.createElement('div');
  keycodeIcon.id = 'keycodie-extension-icon';
  keycodeIcon.innerHTML = `
    <style>
      #keycodie-extension-icon {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: none;
        border: none;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        z-index: 9999;
        outline: none;
        transition: all 0.2s ease;
      }
      #keycodie-extension-icon img {
        width: 70px;
        height: 70px;
        object-fit: contain;
        transition: transform 0.1s;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        border-radius: 0;
      }
      #keycodie-extension-icon img:hover {
        transform: scale(1.05);
      }
      #keycodie-extension-icon img:active {
        transform: scale(0.95);
      }
      #keycodie-settings-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }
      #keycodie-settings-modal {
        background: #2c2c2c;
        width: 300px;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        border: 1px solid #444;
      }
      #keycodie-settings-modal h2 {
        margin-top: 0;
        text-align: center;
        color: #e0e0e0;
        border-bottom: 1px solid #444;
        padding-bottom: 10px;
      }
      #keycodie-settings-modal .setting {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding: 5px 0;
        border-bottom: 1px solid #444;
        color: #e0e0e0;
      }
      #keycodie-settings-modal .setting:last-child {
        border-bottom: none;
      }
      #keycodie-settings-modal select,
      #keycodie-settings-modal input[type='checkbox'] {
        cursor: pointer;
      }
      #save-settings {
        width: 100%;
        padding: 10px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      #save-settings:hover {
        background-color: #0056b3;
      }
      @media (prefers-color-scheme: dark) {
        #keycodie-settings-overlay {
          background: rgba(0,0,0,0.7);
        }
        #keycodie-settings-modal {
          background: #2c2c2c;
          color: #e0e0e0;
        }
      }
      #keycodie-messages-overlay {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 300px;
        height: auto;
        max-height: 400px;
        background-color: #1e1e1e;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        border: 1px solid #333;
        z-index: 10000;
        display: none;
        flex-direction: column;
        font-family: 'Roboto', sans-serif;
        border-radius: 0 !important;
      }
      #keycodie-messages-overlay.open {
        display: flex;
      }
      #keycodie-messages {
        flex-grow: 1;
        overflow-y: auto;
        padding: 10px;
        color: var(--text-color, black);
      }
      .keycodie-message {
        border-radius: 0;
        padding: 10px;
        margin-bottom: 10px;
        max-width: 80%;
        word-wrap: break-word;
      }
      .keycodie-ai-message {
        background-color: #2c2c2c;
        align-self: flex-start;
        color: #e0e0e0;
      }
      .keycodie-user-message {
        background-color: #004466;
        align-self: flex-end;
        color: #e0e0e0;
        text-align: right;
      }
      #keycodie-input-area {
        display: flex;
        padding: 10px;
        background-color: #2c2c2c;
        border-top: 1px solid #444;
      }
      #keycodie-input-area input {
        flex-grow: 1;
        margin-right: 10px;
        padding: 5px;
        background-color: #333;
        color: #e0e0e0;
        border: 1px solid #444;
      }
      #keycodie-input-area button {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 0;
      }
      @media (prefers-color-scheme: dark) {
        #keycodie-extension-icon {
          --icon-bg: #0056b3;
        }
        #keycodie-messages-overlay {
          --overlay-bg: #1e1e1e;
          --overlay-border: #444;
          --text-color: #e0e0e0;
        }
        .keycodie-ai-message {
          --ai-message-bg: #2c2c2c;
          --ai-message-text: #e0e0e0;
        }
        .keycodie-user-message {
          --user-message-bg: #004466;
          --user-message-text: #e0e0e0;
        }
        #keycodie-input-area {
          --input-bg: #2c2c2c;
          --input-border: #555;
        }
        #keycodie-input-area input {
          --input-field-bg: #333;
          --input-text: #e0e0e0;
          --input-border: #555;
        }
      }
    </style>
    <img src='https://imgur.com/1NdJAhU.png' alt='Keycodie Icon' style='width: 70px; height: 70px; border-radius: 50%;' onerror='console.error("Failed to load icon", this.src)'/>
  `;

  const messagesOverlay = document.createElement('div');
  messagesOverlay.id = 'keycodie-messages-overlay';
  messagesOverlay.innerHTML = `
    <div id='keycodie-messages' style='display: flex; flex-direction: column;'></div>
    <div id='keycodie-input-area'>
      <input type='text' placeholder='Ask Keycodie...'>
      <button>Send</button>
    </div>
  `;

  document.body.appendChild(keycodeIcon);
  document.body.appendChild(messagesOverlay);
  document.body.appendChild(settingsOverlay);

  const messages = messagesOverlay.querySelector('#keycodie-messages');
  const input = messagesOverlay.querySelector('input');
  const sendBtn = messagesOverlay.querySelector('button');

  // Load saved settings
  const savedSettings = JSON.parse(localStorage.getItem('keycodie-settings') || '{}');

  // Settings modal logic
  const disableBubbleCheckbox = settingsOverlay.querySelector('#disable-bubble');
  const languageSelector = settingsOverlay.querySelector('#language-selector');
  const saveSettingsBtn = settingsOverlay.querySelector('#save-settings');

  // Restore previous settings
  disableBubbleCheckbox.checked = savedSettings.disableBubble || false;
  languageSelector.value = savedSettings.language || 'fr';

  saveSettingsBtn.addEventListener('click', () => {
    const settings = {
      disableBubble: disableBubbleCheckbox.checked,
      language: languageSelector.value,
      borderRadius: false // Explicitly disable border radius
    };
    localStorage.setItem('keycodie-settings', JSON.stringify(settings));
    settingsOverlay.style.display = 'none';

    // Force dark mode
    document.body.classList.add('dark-mode');

    // Completely hide or show Keycodie interface
    if (settings.disableBubble) {
      keycodeIcon.style.display = 'none';
      messagesOverlay.style.display = 'none';
      // Ensure icon stays hidden on next page load
      localStorage.setItem('keycodie-bubble-hidden', 'true');
    } else {
      keycodeIcon.style.display = 'block';
      messagesOverlay.style.display = 'none';
      localStorage.removeItem('keycodie-bubble-hidden');
    }
    
    // Remove border radius
    if (settings.borderRadius === false) {
      messagesOverlay.style.borderRadius = '0';
    }

    // Update language (placeholder for future localization)
    console.log('Selected language:', settings.language);
  });

  // Icon click to toggle settings
  keycodeIcon.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    settingsOverlay.style.display = 'flex';
  });

  // Messages overlay toggle
  keycodeIcon.addEventListener('click', () => {
    // Check if bubble is disabled in settings
    const savedSettings = JSON.parse(localStorage.getItem('keycodie-settings') || '{}');
    
    if (!savedSettings.disableBubble) {
      if (messagesOverlay.style.display === 'none' || messagesOverlay.style.display === '') {
        messagesOverlay.style.display = 'flex';
      } else {
        messagesOverlay.style.display = 'none';
      }
    }
  });

  async function sendMessage() {
    const userMessage = input.value.trim();
    if (userMessage) {
      const userMessageEl = document.createElement('div');
      userMessageEl.textContent = userMessage;
      userMessageEl.classList.add('keycodie-message', 'keycodie-user-message');
      messages.appendChild(userMessageEl);
      input.value = '';

      try {
        const response = await sendToGemini(userMessage);
        const aiMessageEl = document.createElement('div');
        aiMessageEl.textContent = response;
        aiMessageEl.classList.add('keycodie-message', 'keycodie-ai-message');
        messages.appendChild(aiMessageEl);
        messages.scrollTop = messages.scrollHeight;
      } catch (error) {
        console.error('Chat error:', error);
      }
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

// Run analysis and create chat icon when page loads
window.addEventListener('load', () => {
  init();
  createFloatingKeycodieIcon();
});

// Reuse sendToGemini from earlier implementation
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
