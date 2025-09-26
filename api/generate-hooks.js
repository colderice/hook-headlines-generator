/**
 * Hook Generation API Endpoint
 * Integrates with OpenAI GPT to generate compelling hooks and headlines
 * This is a Vercel serverless function
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { method, data } = req.body;

        if (!method || !data) {
            return res.status(400).json({ error: 'Missing required fields: method and data' });
        }

        // Rate limiting (simple implementation)
        const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        // In production, implement proper rate limiting with Redis or database

        // Generate hooks based on method
        const hooks = await generateHooks(method, data);

        if (!hooks || hooks.length === 0) {
            return res.status(500).json({ error: 'Failed to generate hooks' });
        }

        return res.status(200).json({
            success: true,
            hooks: hooks,
            method: method,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Hook generation error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}

async function generateHooks(method, data) {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
        console.warn('OpenAI API key not found, using fallback hooks');
        return generateFallbackHooks(method, data);
    }

    try {
        const prompt = buildPrompt(method, data);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert copywriter and marketing strategist specializing in creating compelling hooks and headlines that drive engagement and conversions. You understand the psychology of attention, the mechanics of viral content, and platform-specific best practices.

Your hooks should be:
- Attention-grabbing and curiosity-inducing
- Platform-appropriate and audience-specific
- Psychologically compelling (using proven triggers like loss aversion, social proof, urgency, etc.)
- Diverse in style and approach
- Professional yet engaging

Generate exactly 5 unique hooks/headlines. Each should be distinctly different in approach and style. Return only the hooks as a JSON array of strings, no additional text or formatting.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 800,
                temperature: 0.8,
                top_p: 0.9,
                frequency_penalty: 0.3,
                presence_penalty: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const result = await response.json();
        const content = result.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No content returned from OpenAI');
        }

        // Parse the JSON response
        try {
            const hooks = JSON.parse(content);
            if (Array.isArray(hooks) && hooks.length > 0) {
                return hooks.slice(0, 5); // Ensure max 5 hooks
            } else {
                throw new Error('Invalid hooks format from OpenAI');
            }
        } catch (parseError) {
            // If JSON parsing fails, try to extract hooks from text
            return extractHooksFromText(content);
        }

    } catch (error) {
        console.error('OpenAI API error:', error);
        return generateFallbackHooks(method, data);
    }
}

function buildPrompt(method, data) {
    switch (method) {
        case 'brief':
            return `Create 5 compelling hooks/headlines for:
- Content Type: ${data.contentType}
- Platform: ${data.platform}  
- Goal: ${data.goal}
- Topic: ${data.topic}

Focus on ${data.platform} best practices and make each hook unique in style (question, statement, number, controversy, story, etc.).`;

        case 'raw_idea':
            return `Transform this raw idea into 5 polished, compelling hooks/headlines:

Raw idea: "${data.rawIdea}"

Make each hook approach the idea from a different angle (controversial, educational, story-driven, problem/solution, emotional, etc.).`;

        case 'draft_optimization':
            return `Optimize and create 5 improved versions of this headline/hook:

Original: "${data.draftHeadline}"

Use different psychological triggers, improve clarity, add urgency/curiosity, and make each version distinctly different while maintaining the core message.`;

        case 'content_analysis':
            return `Analyze this content and create 5 compelling hooks/headlines that could be used to promote it:

Content: "${data.contentPiece}"

Extract key insights, benefits, or intriguing elements and craft hooks that would make people want to engage with this content.`;

        default:
            return `Create 5 compelling, attention-grabbing hooks/headlines for general marketing content. Make each unique and engaging.`;
    }
}

function extractHooksFromText(text) {
    // Fallback method to extract hooks from non-JSON text response
    const lines = text.split('\n').filter(line => line.trim());
    const hooks = [];
    
    for (const line of lines) {
        // Remove numbers, bullets, quotes, and clean up
        const cleaned = line
            .replace(/^\d+\.?\s*/, '') // Remove leading numbers
            .replace(/^[•\-\*]\s*/, '') // Remove bullets
            .replace(/^["']\s*/, '') // Remove leading quotes
            .replace(/\s*["']$/, '') // Remove trailing quotes
            .trim();
            
        if (cleaned && cleaned.length > 10 && cleaned.length < 200) {
            hooks.push(cleaned);
        }
        
        if (hooks.length >= 5) break;
    }
    
    return hooks.length > 0 ? hooks : generateFallbackHooks('general', {});
}

function generateFallbackHooks(method, data) {
    // High-quality fallback hooks for when OpenAI API is unavailable
    const fallbackHooks = {
        brief: [
            `🚨 STOP scrolling: This ${data.contentType || 'strategy'} will transform your ${data.platform || 'business'} results`,
            `The #1 ${data.contentType || 'mistake'} that's killing your ${data.goal || 'success'} (and how to fix it today)`,
            `I tried every ${data.topic || 'approach'} for ${data.platform || 'growth'}. Here's what actually works:`,
            `WARNING: 90% of ${data.platform || 'content'} advice is outdated. Here's the new playbook:`,
            `From zero to ${data.goal || 'results'}: The ${data.contentType || 'method'} that changed everything`
        ],
        raw_idea: [
            `🔥 Controversial opinion: ${data.rawIdea?.substring(0, 60) || 'Most advice'} is completely backwards`,
            `Everyone believes ${data.rawIdea?.substring(0, 50) || 'this myth'} but the data shows otherwise`,
            `I just discovered why ${data.rawIdea?.substring(0, 45) || 'common wisdom'} fails 87% of the time`,
            `Plot twist: ${data.rawIdea?.substring(0, 55) || 'What you think works'} is sabotaging your success`,
            `The uncomfortable truth about ${data.rawIdea?.substring(0, 40) || 'this topic'} nobody wants to admit`
        ],
        draft_optimization: [
            `🚨 ${data.draftHeadline || 'BREAKING'}: The hidden truth that changes everything`,
            `Why "${data.draftHeadline || 'this approach'}" works (when others fail miserably)`,
            `❌ "${data.draftHeadline || 'Old way'}" → ✅ Here's what actually gets results`,
            `The psychology behind "${data.draftHeadline || 'viral content'}" (steal this framework)`,
            `I analyzed 10,000 examples of "${data.draftHeadline || 'successful campaigns'}" - here's the pattern`
        ],
        content_analysis: [
            `🎯 The hidden psychology that makes ${data.contentPiece?.substring(0, 40) || 'this content'} irresistible`,
            `I reverse-engineered ${data.contentPiece?.substring(0, 35) || 'viral content'} and found 3 genius tactics`,
            `Why ${data.contentPiece?.substring(0, 45) || 'this approach'} gets 10x more engagement (breakdown)`,
            `🧠 The neuroscience secret behind ${data.contentPiece?.substring(0, 35) || 'addictive content'}`,
            `Steal this: The exact formula from ${data.contentPiece?.substring(0, 30) || 'top performers'} (works every time)`
        ]
    };

    const hooks = fallbackHooks[method] || fallbackHooks.brief;
    
    // Add some variation to prevent identical results
    return hooks.map(hook => {
        const variations = [
            hook,
            hook.replace('🚨', '🔥'),
            hook.replace('WARNING:', 'ALERT:'),
            hook.replace('The #1', 'The biggest'),
            hook.replace('Here\'s', 'This is')
        ];
        return variations[Math.floor(Math.random() * variations.length)];
    });
}

// Input validation and sanitization
function validateInput(method, data) {
    const validMethods = ['brief', 'raw_idea', 'draft_optimization', 'content_analysis'];
    
    if (!validMethods.includes(method)) {
        throw new Error('Invalid generation method');
    }
    
    // Sanitize input data
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            // Basic sanitization - remove potential harmful content
            sanitized[key] = value
                .trim()
                .substring(0, 2000) // Limit length
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
                .replace(/javascript:/gi, '') // Remove javascript: URLs
                .replace(/on\w+\s*=/gi, ''); // Remove event handlers
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

// Error handling wrapper
async function withErrorHandling(fn) {
    try {
        return await fn();
    } catch (error) {
        console.error('Function error:', error);
        throw error;
    }
}