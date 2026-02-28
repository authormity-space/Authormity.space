export interface GenerateOptions {
    prompt: string;
    systemPrompt: string;
    temperature?: number;
    maxTokens?: number;
}

interface OpenRouterChoice {
    message: {
        content: string;
    };
}

interface OpenRouterResponse {
    choices: OpenRouterChoice[];
}

/**
 * Sends a chat completion request to the OpenRouter API.
 *
 * @param options - Generation parameters including prompt, system prompt,
 *   optional temperature (default 0.7) and maxTokens (default 1000).
 * @returns The generated text from the model.
 * @throws A user-friendly error if the API call fails. Full details are
 *   logged server-side only — the API key is never logged.
 */
export async function generateText(options: GenerateOptions): Promise<string> {
    const { prompt, systemPrompt, temperature = 0.7, maxTokens = 1000 } = options;

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL ?? 'arcee-ai/arcee-trinity';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://authormity.space';

    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured.');
    }

    let response: Response;

    try {
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'HTTP-Referer': appUrl,
                'X-Title': 'Authormity',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                temperature,
                max_tokens: maxTokens,
            }),
        });
    } catch (err) {
        console.error('OpenRouter fetch failed:', err instanceof Error ? err.message : err);
        throw new Error('AI generation failed. Please try again.');
    }

    if (!response.ok) {
        const errText = await response.text();
        console.error(`OpenRouter error (${response.status}):`, errText);
        throw new Error('AI generation failed. Please try again.');
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        console.error('OpenRouter returned empty content:', JSON.stringify(data));
        throw new Error('AI generation failed. Please try again.');
    }

    return content;
}
