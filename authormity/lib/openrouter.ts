const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OpenRouterChoice {
    message: OpenRouterMessage;
}

interface OpenRouterResponse {
    choices: OpenRouterChoice[];
}

/**
 * Calls the OpenRouter API to generate text from a prompt.
 * Uses the model specified in the OPENROUTER_MODEL environment variable.
 * @param prompt - The user-facing prompt to send to the model.
 * @param systemPrompt - The system instruction that sets the model's behavior.
 * @param temperature - Sampling temperature (0–2). Higher = more creative.
 * @returns The generated text content from the model.
 * @throws An error with a readable message if the API call fails.
 */
export async function generateText(
    prompt: string,
    systemPrompt: string,
    temperature: number = 0.7
): Promise<string> {
    const model = process.env.OPENROUTER_MODEL ?? 'arcee-ai/arcee-trinity';
    const apiKey = process.env.OPENROUTER_API_KEY!;

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://authormity.space',
            'X-Title': 'Authormity',
        },
        body: JSON.stringify({
            model,
            temperature,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('OpenRouter returned an empty response.');
    }

    return content;
}
