const express = require('express');
const router = express.Router();
const db = require('../db');

// Clean text for speech synthesis (remove think tags, markdown formatting, tables, code blocks)
function sanitizeTextForSpeech(rawText) {
  if (!rawText) return '';
  
  // 1. Remove <think>...</think> reasoning blocks
  let text = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // 2. Remove Markdown links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 3. Remove Markdown headings (# Heading -> Heading)
  text = text.replace(/^#+\s+/gm, '');

  // 4. Remove bold/italics/backticks (**bold** -> bold, `code` -> code)
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  text = text.replace(/`([^`]+)`/g, '$1');

  // 5. Remove horizontal rules & blockquotes
  text = text.replace(/^---$/gm, '');
  text = text.replace(/^>\s*/gm, '');

  // 6. Remove table formatting pipes
  text = text.replace(/\|/g, ' ');

  // 7. Collapse repeated whitespace and trim
  text = text.replace(/\s+/g, ' ').trim();

  // Limit speech utterance length for responsiveness (first 1200 characters)
  if (text.length > 1200) {
    text = text.slice(0, 1200) + '...';
  }

  return text;
}

// Maps publisher/role to distinctive Gemini TTS voice styles
function resolveVoiceForRole(role, publisher, customVoice) {
  if (customVoice && customVoice.trim()) return customVoice.trim();

  if (role === 'advisor') {
    return 'Fenrir'; // Authoritative, measured Chief of Staff
  }

  switch (publisher) {
    case 'gloomberg':
      return 'Charon'; // Deep, analytical, market-focused
    case 'doll_street':
      return 'Aoede'; // Crisp, dynamic Wall Street broadcast
    case 'gotham':
      return 'Puck'; // Energetic, populist, community-focused
    case 'cashington':
    case 'capital_gazette':
      return 'Kore'; // Dignified, parliamentary, investigative
    default:
      return 'Puck';
  }
}

// Check TTS config
router.get('/config', (req, res) => {
  try {
    const keyRow = db.prepare("SELECT value FROM system_settings WHERE key = 'google_tts_api_key'").get();
    const modelRow = db.prepare("SELECT value FROM system_settings WHERE key = 'google_tts_model'").get();
    const voiceRow = db.prepare("SELECT value FROM system_settings WHERE key = 'google_tts_voice'").get();

    const hasKey = !!(keyRow && keyRow.value && keyRow.value.trim().length > 5);
    res.json({
      has_key: hasKey,
      model: (modelRow && modelRow.value) || 'gemini-3.8-flash-tts',
      voice: (voiceRow && voiceRow.value) || 'Puck'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Synthesize Text to Speech
router.post('/synthesize', async (req, res) => {
  try {
    const { text, role, publisher, speaker, voice } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS synthesis' });
    }

    const cleanText = sanitizeTextForSpeech(text);
    if (!cleanText) {
      return res.status(400).json({ error: 'No audible text found after sanitization' });
    }

    // Retrieve settings
    const keyRow = db.prepare("SELECT value FROM system_settings WHERE key = 'google_tts_api_key'").get();
    const modelRow = db.prepare("SELECT value FROM system_settings WHERE key = 'google_tts_model'").get();
    const voiceRow = db.prepare("SELECT value FROM system_settings WHERE key = 'google_tts_voice'").get();

    const apiKey = keyRow && keyRow.value ? keyRow.value.trim() : '';
    const model = (modelRow && modelRow.value ? modelRow.value.trim() : '') || 'gemini-3.8-flash-tts';
    const chosenVoice = resolveVoiceForRole(role, publisher, voice || (voiceRow && voiceRow.value));

    // If API key is provided, attempt Gemini 3.8 Flash TTS or Google Cloud TTS
    if (apiKey) {
      // Attempt 1: Gemini 3.8 Flash TTS via Google GenAI REST
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          signal: AbortSignal.timeout(8000),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: cleanText }]
              }
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: chosenVoice
                  }
                }
              }
            }
          })
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const candidate = geminiData.candidates && geminiData.candidates[0];
          const part = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
          
          if (part && part.inlineData && part.inlineData.data) {
            return res.json({
              audio_base64: part.inlineData.data,
              mime_type: part.inlineData.mimeType || 'audio/wav',
              model: model,
              voice: chosenVoice,
              text: cleanText,
              provider: 'gemini-3.8-flash-tts'
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini 3.8 Flash TTS call failed, attempting Google Cloud TTS fallback:', geminiErr.message);
      }

      // Attempt 2: Google Cloud Text-to-Speech API
      try {
        const cloudTtsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
        const cloudRes = await fetch(cloudTtsUrl, {
          method: 'POST',
          signal: AbortSignal.timeout(8000),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: cleanText },
            voice: {
              languageCode: 'en-US',
              name: 'en-US-Journey-F'
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: 1.05
            }
          })
        });

        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          if (cloudData.audioContent) {
            return res.json({
              audio_base64: cloudData.audioContent,
              mime_type: 'audio/mp3',
              model: 'google-cloud-tts',
              voice: 'en-US-Journey-F',
              text: cleanText,
              provider: 'google-cloud-tts'
            });
          }
        }
      } catch (cloudErr) {
        console.warn('Google Cloud TTS call failed:', cloudErr.message);
      }
    }

    // Fallback: Instruct client to play via browser SpeechSynthesis (Web Speech API)
    return res.json({
      fallback: true,
      text: cleanText,
      role: role || 'general',
      voice: chosenVoice,
      reason: apiKey ? 'External API unavailable' : 'No Google Cloud TTS API key configured in Admin Desk'
    });

  } catch (err) {
    console.error('Error in TTS route:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
