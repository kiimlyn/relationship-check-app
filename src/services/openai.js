const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

export const analyzeRelationshipEntry = async (text) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a relationship counselor AI. Analyze the following relationship journal entry and determine if it contains red flags, green flags, or is neutral. 

            Red flags include: controlling behavior, verbal/emotional/physical abuse, isolation, manipulation, jealousy, threats, disrespect of boundaries.
            
            Green flags include: healthy communication, respect, support, trust, compromise, appreciation, quality time, emotional support.
            
            Respond in JSON format:
            {
              "flag": "red" | "green" | "neutral",
              "confidence": 0-100,
              "title": "Brief title",
              "message": "Explanation of analysis",
              "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
            }`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    // Add visual elements
    const icons = {
      red: '🚩',
      green: '✅',
      neutral: '⚪'
    };
    
    return {
      ...analysis,
      icon: icons[analysis.flag],
      color: analysis.flag
    };
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to analyze entry');
  }
};