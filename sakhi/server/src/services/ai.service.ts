import type { AIResponse } from '../schemas/symptom.schema'
import { AIResponseSchema } from '../schemas/symptom.schema'

/**
 * Provider-independent AI service.
 * 
 * Configured via environment variables:
 *   AI_PROVIDER   = openai | google | anthropic | demo
 *   AI_API_KEY    = <your key>
 *   AI_MODEL      = gpt-4o | gemini-1.5-flash | claude-3-haiku etc.
 * 
 * If AI_PROVIDER is not set or equals "demo", returns realistic sample responses.
 * 
 * Demo mode responses are clearly labeled as non-real analysis.
 */

export interface AIServiceInput {
  originalInput: string
  detectedLanguage: string
  preferredLanguage: string
  safetyLevel: 'safe' | 'prompt' | 'urgent'
}

const SYSTEM_PROMPT = `You are SAKHI, an educational women's health assistant specializing in PCOS guidance.

CRITICAL RULES:
1. You provide educational health information ONLY. You NEVER diagnose medical conditions.
2. Never claim a user has PCOS or any other condition.
3. Never invent a probability or percentage chance of having PCOS.
4. Never prescribe or recommend medications.
5. If care_urgency was set to 'urgent' by the safety system, you MUST keep it 'urgent'.
6. Be supportive, non-judgmental, and clear.
7. Respond in the user's preferred language.
8. Always include the disclaimer.

You must respond with ONLY valid JSON matching this exact schema:
{
  "original_language": string,
  "preferred_language": string,
  "symptoms_identified": string[],
  "duration": string | null,
  "plain_language_explanation": string,
  "possible_associations": string[],
  "pcos_education": string,
  "suggested_tracking": string[],
  "care_urgency": "routine" | "prompt" | "urgent",
  "care_guidance": string,
  "missing_information": string[],
  "disclaimer": "This is educational information, not a medical diagnosis."
}`

async function callOpenAI(prompt: string, input: AIServiceInput): Promise<AIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> }
  const content = data.choices[0]?.message?.content
  if (!content) throw new Error('Empty response from OpenAI')
  return JSON.parse(content) as AIResponse
}

async function callGoogleAI(prompt: string, _input: AIServiceInput): Promise<AIResponse> {
  const model = process.env.AI_MODEL || 'gemini-1.5-flash'
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Google AI API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> }
  const content = data.candidates[0]?.content?.parts[0]?.text
  if (!content) throw new Error('Empty response from Google AI')
  return JSON.parse(content) as AIResponse
}

function buildPrompt(input: AIServiceInput): string {
  return `
User's symptom description: "${input.originalInput}"
Detected language: ${input.detectedLanguage}
Preferred response language: ${input.preferredLanguage}
Safety system pre-assessment: ${input.safetyLevel}
${input.safetyLevel === 'urgent' ? 'IMPORTANT: The safety system has flagged this as URGENT. You MUST set care_urgency to "urgent".' : ''}

Please analyze the symptoms and respond with the JSON schema specified.`
}

/**
 * Returns one of several keyword-matched demo responses based on the detected
 * symptom content. All responses are clearly labeled as non-real AI analysis.
 */
function getDemoResponse(input: AIServiceInput): AIResponse {
  const text = input.originalInput.toLowerCase()
  const lang = input.detectedLanguage
  const care_urgency: 'routine' | 'prompt' | 'urgent' =
    input.safetyLevel === 'urgent' ? 'urgent' :
    input.safetyLevel === 'prompt' ? 'prompt' : 'routine'

  const demoNote = '[DEMO MODE — Not real AI analysis] '
  const disclaimer = 'This is educational information, not a medical diagnosis.'

  // Variant: Hair-related symptoms
  if (/hair\s*(loss|fall|thinning)|acne|facial\s*hair|hirsutism|ಕೂದಲ|बाल|முடி|జుట్టు|മുടി/.test(text)) {
    return {
      original_language: lang,
      preferred_language: input.preferredLanguage,
      symptoms_identified: ['Hair thinning or loss', 'Possible excess facial hair', 'Acne'],
      duration: null,
      plain_language_explanation:
        demoNote + 'Hair changes, acne, and excess facial or body hair can result from several causes, including thyroid dysfunction, adrenal conditions, medication effects, or elevated androgen (hormone) levels. ' +
        'PCOS is one condition that may involve elevated androgens, but this combination of symptoms can occur with or without PCOS. ' +
        'A blood test panel (including androgens and thyroid function) can help a doctor identify the underlying cause.',
      possible_associations: ['Thyroid disorder', 'Adrenal conditions', 'Elevated androgens', 'PCOS'],
      pcos_education:
        'Some people with PCOS have elevated androgens, which can contribute to acne, excess facial or body hair, and scalp hair thinning. ' +
        'However, these features can also occur in people who do not have PCOS, and not every person with PCOS experiences them. ' +
        'A clinical evaluation — including symptoms, physical examination, and blood tests — is needed to understand the cause. ' +
        'These symptoms alone cannot confirm or rule out PCOS.',
      suggested_tracking: ['Hair loss frequency', 'Acne severity and location', 'Period regularity'],
      care_urgency,
      care_guidance:
        'These symptoms are worth discussing with a doctor. A hormone panel and thyroid test are typically helpful first steps. ' +
        'Do not start, stop, or change any medications without medical guidance.',
      missing_information: ['How long have you noticed these changes?', 'Any changes in your menstrual cycle?', 'Family history of hormonal conditions or PCOS?'],
      disclaimer,
    }
  }

  // Variant: Fatigue / energy symptoms
  if (/fatigue|tired|exhausted|no energy|sleep|थकान|ದಣಿವು|சோர்வு|అలసట|ക്ഷീണം/.test(text)) {
    return {
      original_language: lang,
      preferred_language: input.preferredLanguage,
      symptoms_identified: ['Fatigue', 'Low energy', 'Possible sleep disruption'],
      duration: null,
      plain_language_explanation:
        demoNote + 'Persistent fatigue and low energy have many possible causes: iron deficiency anaemia, thyroid dysfunction, vitamin D deficiency, disrupted sleep, stress, or hormonal changes. ' +
        'PCOS is one hormonal condition sometimes associated with fatigue, but fatigue is not specific to PCOS — it is more commonly caused by other treatable conditions. ' +
        'Without testing, it is not possible to identify the cause.',
      possible_associations: ['Iron deficiency / anaemia', 'Thyroid disorder', 'Vitamin D deficiency', 'Sleep disorder', 'Stress', 'PCOS', 'Hormonal imbalance'],
      pcos_education:
        'Some people with PCOS report fatigue, which may be related to insulin resistance or disrupted sleep. ' +
        'However, fatigue is not a defining feature of PCOS and is far more commonly caused by anaemia, thyroid conditions, or nutritional deficiencies. ' +
        'Fatigue alone cannot be used to assess for PCOS. A full evaluation by a healthcare professional is needed.',
      suggested_tracking: ['Sleep duration and quality', 'Energy levels by time of day', 'Menstrual cycle dates'],
      care_urgency,
      care_guidance:
        'If fatigue is severe or accompanied by chest pain, shortness of breath, or fainting, seek care promptly. ' +
        'For persistent fatigue lasting more than 2–3 weeks, a blood test (thyroid, iron, vitamin D) is a reasonable first step with your doctor. ' +
        'Do not start, stop, or change any medications without medical advice.',
      missing_information: ['How long has fatigue been present?', 'Any changes in your period?', 'Any changes in weight?', 'Family history of thyroid or hormonal conditions?'],
      disclaimer,
    }
  }

  // Variant: Weight / metabolic symptoms
  if (/weight\s*(gain|loss)|obesity|insulin|metabolism|वजन|ತೂಕ|எடை|బరువు|ഭാരം/.test(text)) {
    return {
      original_language: lang,
      preferred_language: input.preferredLanguage,
      symptoms_identified: ['Weight changes', 'Possible metabolic changes'],
      duration: null,
      plain_language_explanation:
        demoNote + 'Unexplained weight changes can have many causes, including thyroid dysfunction, dietary and lifestyle factors, insulin resistance, or hormonal conditions. ' +
        'PCOS is one condition that can affect metabolism, but weight change alone — even with insulin resistance — is not sufficient to assess for PCOS. ' +
        'Many other medical conditions present in the same way. A proper evaluation is needed.',
      possible_associations: ['Thyroid dysfunction', 'Insulin resistance', 'Metabolic syndrome', 'PCOS', 'Dietary or lifestyle factors'],
      pcos_education:
        'Insulin resistance occurs in some — but not all — people with PCOS, and can sometimes contribute to weight gain. ' +
        'However, PCOS affects people of all body sizes, and weight gain with insulin resistance can occur without PCOS. ' +
        'Weight, even combined with other metabolic changes, is not sufficient to assess for PCOS. ' +
        'A clinical evaluation combining symptoms, blood tests, and imaging is needed — and should be guided by a doctor.',
      suggested_tracking: ['Weight trend over time', 'Dietary patterns', 'Period regularity', 'Energy levels'],
      care_urgency,
      care_guidance:
        'A consultation with a doctor and blood tests for thyroid and metabolic function is recommended. ' +
        'Do not start, stop, or change any medications, supplements, or diet interventions without medical guidance.',
      missing_information: ['Over what period has the weight changed?', 'Any changes in your period?', 'Any changes in energy or sleep?', 'Family history of diabetes or hormonal conditions?'],
      disclaimer,
    }
  }

  // Variant: Kannada input — irregular periods
  if (lang === 'Kannada' || /ಪಿರಿಯಡ್|ಮುಟ್ಟು/.test(text)) {
    return {
      original_language: 'Kannada',
      preferred_language: input.preferredLanguage,
      symptoms_identified: ['ಅನಿಯಮಿತ ಮುಟ್ಟು (Irregular periods)'],
      duration: null,
      plain_language_explanation:
        '[DEMO ಮೋಡ್ — ನೈಜ AI ವಿಶ್ಲೇಷಣೆ ಅಲ್ಲ] ' +
        'ನೀವು ವಿವರಿಸಿದ ಲಕ್ಷಣಗಳು — ಅನಿಯಮಿತ ಮುಟ್ಟು — ಹಲವು ಕಾರಣಗಳಿಂದ ಉಂಟಾಗಬಹುದು. ' +
        'ಥೈರಾಯ್ಡ್ ಸಮಸ್ಯೆ, ಒತ್ತಡ, ಹಾರ್ಮೋನ್ ಬದಲಾವಣೆ, ಅಥವಾ PCOS ನಂತಹ ಸ್ಥಿತಿಗಳು ಸೇರಿದಂತೆ ಅನೇಕ ಕಾರಣಗಳಿರಬಹುದು. ' +
        'ನಿಖರವಾದ ಕಾರಣ ತಿಳಿಯಲು ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡುವುದು ಅವಶ್ಯಕ.',
      possible_associations: ['ಥೈರಾಯ್ಡ್ ಸಮಸ್ಯೆ', 'ಒತ್ತಡ', 'ಹಾರ್ಮೋನ್ ಅಸಮತೋಲನ', 'PCOS'],
      pcos_education:
        'PCOS ಒಂದು ಸಾಮಾನ್ಯ ಹಾರ್ಮೋನ್ ಸ್ಥಿತಿ. ಅನಿಯಮಿತ ಮುಟ್ಟು PCOS ನ ಒಂದು ಸಂಭಾವ್ಯ ಲಕ್ಷಣವಾಗಿರಬಹುದು, ' +
        'ಆದರೆ ಇದು ಇತರ ಅನೇಕ ಕಾರಣಗಳಿಂದಲೂ ಉಂಟಾಗಬಹುದು. ' +
        'PCOS ಮೌಲ್ಯಮಾಪನಕ್ಕಾಗಿ ವೈದ್ಯರು ರಕ್ತ ಪರೀಕ್ಷೆ ಮತ್ತು ಅಲ್ಟ್ರಾಸೌಂಡ್ ಮಾಡಿಸಬಹುದು. ' +
        'ಆದರೆ ಈ ಪರೀಕ್ಷೆಗಳ ಫಲಿತಾಂಶಗಳು ಮಾತ್ರ PCOS ಅನ್ನು ಖಚಿತಗೊಳಿಸಲು ಸಾಕಾಗುವುದಿಲ್ಲ — ವೈದ್ಯಕೀಯ ಮೌಲ್ಯಮಾಪನ ಅಗತ್ಯ.',
      suggested_tracking: ['ಮುಟ್ಟಿನ ದಿನಾಂಕಗಳು', 'ರಕ್ತಸ್ರಾವದ ಪ್ರಮಾಣ', 'ಇತರ ಲಕ್ಷಣಗಳು'],
      care_urgency,
      care_guidance: 'ಮೂರು ತಿಂಗಳಿಗಿಂತ ಹೆಚ್ಚು ಅನಿಯಮಿತ ಮುಟ್ಟು ಇದ್ದರೆ, ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ. ಯಾವುದೇ ಔಷಧಿ ಬದಲಾಯಿಸಬೇಡಿ.',
      missing_information: ['ಎಷ್ಟು ತಿಂಗಳಿಂದ ಅನಿಯಮಿತ?', 'ಇತರ ಯಾವ ಲಕ್ಷಣಗಳಿವೆ?', 'ಕುಟುಂಬದಲ್ಲಿ PCOS ಅಥವಾ ಹಾರ್ಮೋನ್ ಸಮಸ್ಯೆ ಇದೆಯೇ?'],
      disclaimer,
    }
  }

  // Variant: Hindi input
  if (lang === 'Hindi' || /पीरियड|माहवारी/.test(text)) {
    return {
      original_language: 'Hindi',
      preferred_language: input.preferredLanguage,
      symptoms_identified: ['अनियमित पीरियड्स (Irregular periods)'],
      duration: null,
      plain_language_explanation:
        '[DEMO मोड — असली AI विश्लेषण नहीं] ' +
        'आपने जो लक्षण बताए हैं — अनियमित पीरियड्स — के कई कारण हो सकते हैं। ' +
        'थायराइड विकार, तनाव, हार्मोन असंतुलन, या PCOS इनमें से कुछ संभावित कारण हैं। ' +
        'बिना जाँच के सटीक कारण जानना संभव नहीं है। सही कारण जानने के लिए डॉक्टर से मिलें।',
      possible_associations: ['थायराइड विकार', 'तनाव', 'हार्मोन असंतुलन', 'PCOS'],
      pcos_education:
        'PCOS एक सामान्य हार्मोनल स्थिति है। अनियमित पीरियड्स इसका एक संभावित लक्षण हो सकता है, ' +
        'लेकिन इसके और भी कारण हो सकते हैं — जैसे थायराइड की समस्या या तनाव। ' +
        'PCOS के मूल्यांकन के लिए डॉक्टर रक्त परीक्षण और अल्ट्रासाउंड करवा सकते हैं, ' +
        'लेकिन ये परीक्षण अकेले PCOS का निदान नहीं कर सकते — इसके लिए पूरी चिकित्सीय जाँच आवश्यक है।',
      suggested_tracking: ['पीरियड्स की तारीखें', 'रक्तस्राव की मात्रा', 'अन्य लक्षण'],
      care_urgency,
      care_guidance: '3 महीने से अधिक समय से अनियमित पीरियड्स हों तो डॉक्टर से मिलें। बिना डॉक्टर की सलाह के कोई दवाई न लें।',
      missing_information: ['कब से अनियमित हैं?', 'कोई अन्य लक्षण हैं?', 'परिवार में PCOS या हार्मोन की समस्या है?'],
      disclaimer,
    }
  }

  // Default variant: general / insufficient info / multiple symptoms
  return {
    original_language: lang,
    preferred_language: input.preferredLanguage,
    symptoms_identified: ['Reported symptoms (details needed)', 'Possible hormonal or systemic changes'],
    duration: null,
    plain_language_explanation:
      demoNote + 'The symptoms you described may have several possible causes, including hormonal changes, thyroid conditions, nutritional deficiencies, stress, or other medical factors. ' +
      'PCOS is one condition that a doctor might consider as part of a broader evaluation, but it is just one of many possibilities. ' +
      'A healthcare professional can help identify the underlying cause through a proper evaluation — symptoms alone are not enough to determine the cause.',
    possible_associations: ['Thyroid dysfunction', 'Hormonal imbalance', 'Nutritional deficiency', 'Stress or lifestyle factors', 'PCOS (Polycystic Ovary Syndrome)'],
    pcos_education:
      'PCOS is a common hormonal condition. Symptoms sometimes associated with PCOS include irregular periods, acne, hair changes, and fatigue — but all of these can also be caused by other conditions. ' +
      'A healthcare professional evaluates PCOS through clinical assessment, blood tests, and sometimes imaging. ' +
      'No single symptom, test, or combination of symptoms can definitively confirm or rule out PCOS without a full clinical evaluation.',
    suggested_tracking: ['Period dates and flow', 'Symptom severity', 'Sleep quality', 'Stress levels'],
    care_urgency,
    care_guidance:
      'Consider scheduling an appointment with your doctor to discuss these symptoms, especially if they have persisted for more than 3 months. ' +
      'Do not start, stop, or change any medications without consulting your healthcare provider.',
    missing_information: ['How long have the symptoms been present?', 'Any acne, hair changes, or weight changes?', 'Any changes in menstrual cycle?', 'Family history of hormonal conditions or PCOS?'],
    disclaimer,
  }
}

export async function processSymptoms(input: AIServiceInput): Promise<AIResponse> {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || 'demo'

  if (provider === 'demo' || !process.env.AI_API_KEY) {
    console.info('[AI Service] Running in DEMO mode — no AI provider configured')
    return getDemoResponse(input)
  }

  const prompt = buildPrompt(input)

  let rawResponse: AIResponse

  try {
    if (provider === 'openai') {
      rawResponse = await callOpenAI(prompt, input)
    } else if (provider === 'google') {
      rawResponse = await callGoogleAI(prompt, input)
    } else {
      throw new Error(`Unknown AI provider: ${provider}. Supported: openai, google, demo`)
    }
  } catch (err) {
    console.error('[AI Service] Provider call failed:', err)
    throw new Error('AI service is temporarily unavailable. Please try again later.')
  }

  // Validate the AI output with Zod
  const parsed = AIResponseSchema.safeParse(rawResponse)
  if (!parsed.success) {
    console.error('[AI Service] Invalid AI response schema:', parsed.error)
    // Fall back to demo response with a note
    const fallback = getDemoResponse(input)
    fallback.plain_language_explanation =
      '[AI response could not be validated. Showing sample response.] ' +
      fallback.plain_language_explanation
    return fallback
  }

  return parsed.data
}
