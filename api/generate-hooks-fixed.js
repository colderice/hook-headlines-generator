// Vercel Serverless Function for Hook & Headlines Generation

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check if API key exists
        if (!OPENAI_API_KEY) {
            console.error('Missing OPENAI_API_KEY environment variable');
            return res.status(500).json({
                success: false,
                error: 'API configuration error. Please add your OpenAI API key to environment variables.',
                debug: 'Missing API key'
            });
        }

        // Validate input
        const { method } = req.body;
        
        if (!method || !['brief', 'raw-idea', 'draft-optimization', 'content-analysis'].includes(method)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or missing method'
            });
        }

        // Generate GPT prompt based on method
        const prompt = generatePrompt(req.body);
        
        console.log('Calling OpenAI API for method:', method);
        
        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert copywriter specializing in creating compelling hooks and headlines that convert. Generate exactly 10 numbered hooks/headlines based on the user input.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const gptContent = data.choices[0].message.content;
        
        // Parse the response into hooks array
        const hooks = parseHooksFromResponse(gptContent);
        
        return res.status(200).json({
            success: true,
            hooks: hooks,
            method: method,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating hooks:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Failed to generate hooks: ' + error.message,
            timestamp: new Date().toISOString()
        });
    }
}

function generatePrompt(data) {
    const { method } = data;
    
    let prompt = 'Generate 10 compelling hooks and headlines for:\n\n';

    switch (method) {
        case 'brief':
            prompt += `Content Type: ${data['content-type']}\n`;
            prompt += `Platform: ${data['platform']}\n`;
            prompt += `Goal: ${data['goal']}\n`;
            prompt += `Topic: ${data['topic']}\n\n`;
            prompt += 'Create hooks that are attention-grabbing, specific to the platform, and aligned with the goal.';
            break;

        case 'raw-idea':
            prompt += `Raw Idea: ${data['raw-idea']}\n`;
            if (data.audience) prompt += `Target Audience: ${data.audience}\n`;
            if (data.tone) prompt += `Tone: ${data.tone}\n`;
            prompt += '\nTransform this raw idea into polished, compelling hooks that capture the essence while adding structure and emotional appeal.';
            break;

        case 'draft-optimization':
            prompt += `Current Draft: ${data['current-draft']}\n`;
            if (data.issues) prompt += `Issues to Fix: ${data.issues}\n`;
            if (data['optimization-goal']) prompt += `Goal: ${data['optimization-goal']}\n`;
            prompt += '\nOptimize and enhance this headline using proven copywriting techniques, emotional triggers, and curiosity gaps.';
            break;

        case 'content-analysis':
            prompt += `Content Piece: ${data['content-piece']}\n`;
            if (data['content-format']) prompt += `Content Type: ${data['content-format']}\n`;
            prompt += '\nAnalyze this content and create hooks that highlight the most compelling insights and draw readers in.';
            break;
    }

    prompt += '\n\nReturn exactly 10 numbered hooks (1. 2. 3. etc.) that are:\n- Attention-grabbing\n- Curiosity-inducing\n- Specific and actionable\n- Optimized for engagement';

    return prompt;
}

function parseHooksFromResponse(content) {
    try {
        // Split by lines and find numbered items
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        const hooks = lines
            .filter(line => /^\d+[\.\:\-\)]\s/.test(line.trim()))
            .map(line => {
                return line.replace(/^\d+[\.\:\-\)]\s*/, '').trim();
            })
            .filter(hook => hook.length > 10)
            .slice(0, 10);

        // If we don't have enough hooks, try alternative parsing
        if (hooks.length < 5) {
            const allLines = lines.filter(line => {
                const trimmed = line.trim();
                return trimmed.length > 20 && 
                       !trimmed.toLowerCase().includes('here are') &&
                       !trimmed.toLowerCase().includes('hook') &&
                       trimmed !== trimmed.toUpperCase();
            }).slice(0, 10);
            
            return allLines.length > 0 ? allLines : getDefaultHooks();
        }

        return hooks;
    } catch (error) {
        console.error('Error parsing hooks:', error);
        return getDefaultHooks();
    }
}

function getDefaultHooks() {
    return [
        "The Secret Strategy That's Transforming How Businesses Grow",
        "Why 90% of Entrepreneurs Are Doing This Wrong (And How to Fix It)",
        "The 10-Minute Method That Doubled My Results",
        "Stop Following This Outdated Advice (Try This Instead)",
        "The Hidden Truth About Success That Nobody Talks About",
        "What Most People Get Wrong About This Topic",
        "The Simple Truth That Will Shift Your Perspective",
        "Why Everything You've Been Told Is Backwards",
        "The One Thing That Makes All the Difference",
        "The Counterintuitive Approach That Changes Everything"
    ];
}