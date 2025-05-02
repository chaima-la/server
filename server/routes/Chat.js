const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const MODEL_NAME = 'gemini-2.0-flash';
const REQUIRED_FIELDS = ['property_type', 'city', 'country'];

// Initialize AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyAZZyX06uPUQWvCnGIUUVDbFK5DP1cUHi8");
const model = genAI.getGenerativeModel({ model: MODEL_NAME });
 function cleanAIResponse(text) {
   return text.replace(/```(json)?/g, '').replace(/^json/, '').trim();
 }
 
router.post('/api/extract-filters', async (req, res) => {
    const { message, conversation = [], previousFilters = {}, askingAboutExtra = false } = req.body;
  
    // Basic input validation
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing message' });
    }
  
    try {
      const conversationContext = conversation.map(msg => 
        `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
      ).join('\n');
  
      let prompt;
      
      if (askingAboutExtra) {
        prompt = `
  You're a real estate assistant collecting additional property requirements.
  The user has already provided these details:
  - Property type: ${previousFilters.property_type || 'not specified'}
  - Location: ${previousFilters.city || 'not specified'}, ${previousFilters.country || 'not specified'}
  
  User's response about extra requirements: "${message}"
  
  Extract and CORRECT any typos in additional requirements, then respond with EXACTLY this JSON format:
  {
    "response": "your natural language reply confirming the requirements",
    "filters": {
      "extra_requirements": "extracted and corrected special requirements or empty string"
    },
    "is_complete": true
  }
  
  Rules:
  1. Only return valid JSON
  2. Never add explanations or markdown
  3. Correct any obvious typos in requirements while preserving meaning
  4. For ambiguous cases, keep the original wording
  5. Standardize terms (e.g., "parking spot" → "parking")
  `;
      } else {
        prompt = `
  You're a real estate assistant collecting property search criteria.
  Current conversation:
  ${conversationContext}
  
  User's latest message: "${message}"
  
  Previous filters (if any):
  ${JSON.stringify(previousFilters)}
  
  Extract and AUTOMATICALLY CORRECT any typos, then respond with EXACTLY this JSON format:
  {
    "response": "your natural language reply confirming the details",
    "filters": {
      "country": "extracted and corrected country name or empty",
      "city": "extracted and corrected city name or empty",
      "property_type": "extracted and corrected property type or empty",
      "extra_requirements": ""
    },
    "next_question": "what to ask next or empty if all required fields are collected",
    "is_complete": false
  }
  
  Required fields that must be collected:
  1. property_type (standardized to: apartment, house, villa, townhouse, land)
  2. city (proper capitalization)
  3. country (full official name)
  
  Correction Guidelines:
  - Property types: Correct to standard terms (e.g., "aparment" → "apartment")
  - Locations: Use official names (e.g., "UAE" → "United Arab Emirates")
  - Capitalization: Proper case for cities (e.g., "new york" → "New York")
  
  Rules:
  1. Only return valid JSON
  2. Never add explanations or markdown
  3. Ask about one missing field at a time
  4. When all required fields are collected, ask: "Would you like to add any special requirements?"
  5. Don't set is_complete=true until extra requirements are handled
  6. Correct typos automatically before returning values
  `;
      }
  
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = cleanAIResponse(text);
      const response = JSON.parse(cleaned);
      
      const finalFilters = { ...previousFilters, ...response.filters };
      
      if (response.is_complete) {
        console.log('\n=== FINAL EXTRACTED FILTERS ===');
        console.log(JSON.stringify(finalFilters, null, 2));
        console.log('==============================\n');
      }
      
      res.json({
        ...response,
        filters: finalFilters
      });
      
    } catch (err) {
      console.error('Error processing request:', err);
      res.status(500).json({
        response: "I'm having trouble understanding. Could you please rephrase that?",
        filters: previousFilters,
        next_question: "",
        is_complete: false
      });
    }
  }); 

module.exports = router;