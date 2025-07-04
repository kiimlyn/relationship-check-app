const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

export const analyzeRelationshipEntry = async (text) => {
  if (!GEMINI_API_KEY) {
    throw new Error('No API key found');
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a relationship safety expert. Be STRICT about red flags.

RED FLAGS: lying, deception, secretive behavior, hiding phone, bathroom for hours with phone, cheating signs, verbal abuse, control, manipulation, isolation, jealousy, threats

GREEN FLAGS: honest communication, openness, trust, respect, support

If someone is secretive with their phone or acting suspicious, that's a RED FLAG.

Respond with just: RED, GREEN, or NEUTRAL followed by brief explanation.

Entry: ${text}`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    
    // More aggressive detection
    const lowerText = text.toLowerCase();
const isRed = responseText.toLowerCase().includes('red') || 
              (lowerText.includes('bathroom') && lowerText.includes('phone')) ||
              lowerText.includes('secretive') ||
              lowerText.includes('hiding') ||
              lowerText.includes('suspicious');
    const isGreen = responseText.toLowerCase().includes('green');
    
    let flag = 'neutral';
    if (isRed) flag = 'red';
    else if (isGreen) flag = 'green';
    
    return {
      flag: flag,
      icon: flag === 'red' ? '🚩' : flag === 'green' ? '✅' : '⚪',
      color: flag,
      title: flag === 'red' ? 'Red Flag Detected' : flag === 'green' ? 'Green Flag' : 'Neutral',
      message: responseText || 'Analysis completed',
      suggestions: flag === 'red' ? ['Trust your instincts', 'This behavior is concerning', 'Consider discussing boundaries'] : ['Continue observing patterns', 'Trust your feelings']
    };
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};