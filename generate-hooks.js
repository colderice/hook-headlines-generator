// Advanced Hook & Headlines Generator with Professional Frameworks
// Integrates psychological triggers, frame combinations, and industry-specific techniques

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if (!OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'API configuration error. Please add your OpenAI API key.'
            });
        }

        const { method } = req.body;
        
        if (!method || !['brief', 'raw-idea', 'draft-optimization', 'content-analysis'].includes(method)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or missing method'
            });
        }

        // Generate advanced prompt with psychological frameworks
        const prompt = generateAdvancedPrompt(req.body);
        
        console.log('Generating advanced hooks for method:', method);
        
        // Call OpenAI with sophisticated system prompt
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4', // Using GPT-4 for better framework understanding
                messages: [
                    {
                        role: 'system',
                        content: getAdvancedSystemPrompt()
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1200,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const gptContent = data.choices[0].message.content;
        
        const hooks = parseAdvancedHooksFromResponse(gptContent);
        
        return res.status(200).json({
            success: true,
            hooks: hooks,
            method: method,
            timestamp: new Date().toISOString(),
            framework: 'advanced-psychology'
        });

    } catch (error) {
        console.error('Error generating advanced hooks:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Failed to generate hooks: ' + error.message,
            timestamp: new Date().toISOString()
        });
    }
}

function getAdvancedSystemPrompt() {
    return `You are an expert copywriter with deep knowledge of psychological frameworks and advanced hook techniques. You specialize in creating hooks that leverage:

PSYCHOLOGICAL FOUNDATIONS:
• Pattern Recognition and Interruption
• Information Gap Theory and Curiosity Triggers  
• Cognitive Dissonance Creation
• Status Threat/Opportunity Recognition
• Loss Aversion and Prospect Theory
• Social Proof Mechanisms
• Authority Influence and Scarcity Response

FRAME COMBINATION STRATEGIES:
• Primary + Supporting Frame Structure
• Triple Frame Layering for complex impact
• Information-Gap + Social Proof combinations
• Warning + Case Study pairings
• Insider Confession + Taboo Solution merging

HOOK FRAMEWORKS TO UTILIZE:
1. Information-Gap + Social Proof: "The [hidden strategy/secret] that [authority figures] never share publicly"
2. Warning + Future Event: "Why [current situation] may be at risk when [known future event] happens"
3. Taboo Solution + Case Study: "Why I told [someone] to [controversial action]: A revealing case study"
4. System/Strategy + Timeline: "The [framework/method]: How to [achieve result] in [specific timeframe]"
5. Insider Confession + Secret Society: "Confessions of a former [insider]: The [methods] [elite group] use internally"
6. New Discovery + Authority Challenge: "New [research/discovery] proves [established authority] wrong about [topic]"
7. Contrarian Position + Success Story: "[Surprising approach] that [achieved remarkable result]"
8. Method Reveal + Social Validation: "How [relatable person] [achieved goal] using [unconventional method]"

INDUSTRY-SPECIFIC APPLICATIONS:
• Finance: Focus on risk, opportunity, insider knowledge, market secrets
• Health: Emphasize discovery, transformation, authority challenges, hidden dangers
• Business: Highlight growth, efficiency, competitive advantage, insider strategies
• Education: Stress learning breakthroughs, skill acceleration, knowledge gaps
• Coaching: Feature transformation, breakthrough moments, mindset shifts

ADVANCED TECHNIQUES:
• Use specific numbers and percentages for credibility
• Include timeline references (30-60-10, "in one weekend", "last year")
• Incorporate authority figures and insider perspectives
• Create cognitive dissonance with unexpected combinations
• Layer multiple psychological triggers simultaneously

Generate 10 numbered hooks that:
1. Use advanced psychological frameworks
2. Combine multiple frames for enhanced impact  
3. Are specific to the industry/context provided
4. Include concrete details and numbers when possible
5. Create strong curiosity gaps and emotional engagement
6. Avoid generic language and clichéd phrases
7. Demonstrate deep understanding of target audience psychology`;
}

function generateAdvancedPrompt(data) {
    const { method } = data;
    
    let prompt = `Generate 10 advanced psychological hooks using the frameworks above for:\n\n`;

    switch (method) {
        case 'brief':
            prompt += `BRIEF ANALYSIS:
Content Type: ${data['content-type']}
Platform: ${data['platform']}
Goal: ${data['goal']}
Topic: ${data['topic']}

INSTRUCTIONS:
- Apply industry-specific psychological frameworks
- Use platform-appropriate frame combinations
- Align with the stated goal using proven triggers
- Include specific details and authority references
- Create strong information gaps and curiosity
- Use numbers, timelines, and concrete examples

FRAMEWORK APPLICATION:
Select the most effective combination of frames for this ${data['platform']} ${data['content-type']} about ${data['topic']} designed to ${data['goal']}.`;
            break;

        case 'raw-idea':
            prompt += `RAW IDEA TRANSFORMATION:
Original Idea: "${data['raw-idea']}"
${data.audience ? `Target Audience: ${data.audience}` : ''}
${data.tone ? `Desired Tone: ${data.tone}` : ''}

INSTRUCTIONS:
- Transform this raw concept using advanced psychological frameworks
- Apply frame combination strategies to enhance impact
- Create cognitive dissonance and curiosity gaps
- Use authority positioning and social proof elements
- Incorporate specific details and concrete examples
- Layer multiple psychological triggers for maximum engagement

FRAMEWORK SELECTION:
Choose frames that best serve the core message while adding psychological sophistication and emotional triggers.`;
            break;

        case 'draft-optimization':
            prompt += `DRAFT OPTIMIZATION ANALYSIS:
Current Draft: "${data['current-draft']}"
${data.issues ? `Issues to Address: ${data.issues}` : ''}
${data['optimization-goal'] ? `Optimization Goal: ${data['optimization-goal']}` : ''}
${data.format ? `Content Format: ${data.format}` : ''}

INSTRUCTIONS:
- Analyze the current draft for psychological weaknesses
- Apply advanced frame combinations to strengthen impact
- Address identified issues using proven psychological principles
- Enhance with authority positioning, social proof, or scarcity
- Create stronger information gaps and emotional engagement
- Use specific numbers, timelines, and concrete details

OPTIMIZATION STRATEGY:
Transform the existing hook using sophisticated psychological frameworks while maintaining the core message integrity.`;
            break;

        case 'content-analysis':
            prompt += `CONTENT ANALYSIS FOR HOOK EXTRACTION:
Content Piece: "${data['content-piece']}"
${data['content-format'] ? `Content Type: ${data['content-format']}` : ''}
${data.checkboxes && data.checkboxes.length > 0 ? `Preferred Styles: ${data.checkboxes.join(', ')}` : ''}

INSTRUCTIONS:
- Analyze the content for key insights and emotional triggers
- Extract the most compelling psychological elements
- Apply advanced frame combinations to highlight key points
- Create hooks that draw readers into the full content
- Use authority positioning and social proof where relevant
- Incorporate specific details and concrete examples from the content

EXTRACTION STRATEGY:
Identify the strongest psychological elements in the content and transform them into sophisticated hooks using proven frameworks.`;
            break;
    }

    prompt += `\n\nFRAMEWORK REQUIREMENTS:
1. Use at least 3 different frame combinations across the 10 hooks
2. Include specific numbers, percentages, or timelines where appropriate
3. Incorporate authority figures, insider perspectives, or social proof
4. Create strong curiosity gaps and information deficits
5. Apply industry-appropriate psychological triggers
6. Avoid generic language - be specific and concrete
7. Layer multiple psychological principles for maximum impact

Return exactly 10 numbered hooks that demonstrate mastery of advanced copywriting psychology.`;

    return prompt;
}

function parseAdvancedHooksFromResponse(content) {
    try {
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        const hooks = lines
            .filter(line => /^\d+[\.\:\-\)]\s/.test(line.trim()))
            .map(line => {
                return line.replace(/^\d+[\.\:\-\)]\s*/, '').trim();
            })
            .filter(hook => hook.length > 15)
            .slice(0, 10);

        if (hooks.length < 5) {
            const allLines = lines.filter(line => {
                const trimmed = line.trim();
                return trimmed.length > 25 && 
                       !trimmed.toLowerCase().includes('here are') &&
                       !trimmed.toLowerCase().includes('framework') &&
                       !trimmed.toLowerCase().includes('hook') &&
                       trimmed !== trimmed.toUpperCase() &&
                       !trimmed.startsWith('HOOK') &&
                       !trimmed.startsWith('FRAMEWORK');
            }).slice(0, 10);
            
            return allLines.length > 0 ? allLines : getAdvancedFallbackHooks();
        }

        return hooks;
    } catch (error) {
        console.error('Error parsing advanced hooks:', error);
        return getAdvancedFallbackHooks();
    }
}

function getAdvancedFallbackHooks() {
    return [
        "The 34% Revenue Strategy That Fortune 500 CEOs Use Internally (But Never Share Publicly)",
        "Warning: Why Your Current Marketing Approach May Backfire When iOS 18 Launches Next Month",
        "Confession from a Former Agency Owner: Why I Tell My Clients to Ignore Industry Best Practices",
        "The 30-60-10 Content Framework: How to Triple Your Engagement in One Weekend",
        "New MIT Study Proves Traditional Productivity Experts Wrong About Deep Work",
        "How a Failed Restaurant Owner Generated $2.3M Using This Contrarian Business Model",
        "The Hidden Psychology Trigger That Netflix Uses to Keep You Watching (Works for Any Content)",
        "Why Top Coaches Secretly Use This 'Backwards' Approach to Client Transformation",
        "The Investment Strategy That Outperformed Warren Buffett by 23% Last Year (Wall Street Hates It)",
        "Former Google Engineer Reveals: The Algorithm Change That Could Kill Your Traffic in 2024"
    ];
}