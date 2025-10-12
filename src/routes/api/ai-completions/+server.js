import { json } from '@sveltejs/kit';
import { ANTHROPIC_API_KEY, VITE_ANTHROPIC_API_KEY } from '$env/static/private';

/**
 * SvelteKit API route for AI completions to avoid CORS issues.
 * Proxies requests to Anthropic Claude API from server-side.
 */
export async function POST({ request }) {
    try {
        const { prompt, model = 'claude-sonnet-4-5' } = await request.json();
        
        // Get API key from environment (try both possible names)
        const apiKey = ANTHROPIC_API_KEY || VITE_ANTHROPIC_API_KEY;
        
        if (!apiKey) {
            console.error('No Anthropic API key found. Set ANTHROPIC_API_KEY in environment.');
            return json({ error: 'API key not configured' }, { status: 500 });
        }

        if (!prompt) {
            return json({ error: 'Prompt is required' }, { status: 400 });
        }

        console.log(`Making AI completion request for model: ${model}`);
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                max_tokens: 150,
                temperature: 0.3,
                messages: [{ 
                    role: 'user', 
                    content: prompt 
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Anthropic API error (${response.status}):`, errorText);
            return json({ 
                error: `AI API request failed: ${response.status}`,
                details: errorText 
            }, { status: response.status });
        }

        const result = await response.json();
        
        // Return the result in a consistent format
        return json({
            success: true,
            content: result.content,
            model: result.model,
            usage: result.usage
        });
        
    } catch (error) {
        console.error('AI completion server error:', error);
        return json({ 
            error: 'Failed to process AI completion request',
            details: error.message 
        }, { status: 500 });
    }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}