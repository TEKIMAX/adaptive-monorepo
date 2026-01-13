export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface StreamCallbacks {
    onDelta?: (delta: string) => void;
    onFinish?: (fullContent: string) => void;
    onError?: (error: any) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Custom streaming chat function to replace AI SDK.
 * Handles SSE parsing and raw fetch stream.
 */
export async function streamChat(
    apiKey: string,
    messages: Message[],
    callbacks: StreamCallbacks
) {
    try {
        const response = await fetch(`${API_URL}/v1/chat/stream`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'granite3-guardian:latest',
                messages
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No readable stream available in response.');

        const decoder = new TextDecoder();
        let accumulatedContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const dataString = line.slice(6).trim();
                        if (!dataString) continue;

                        const data = JSON.parse(dataString);

                        if (data.type === 'text-delta' && data.delta) {
                            accumulatedContent += data.delta;
                            if (callbacks.onDelta) {
                                callbacks.onDelta(data.delta);
                            }
                        }

                        if (data.type === 'text-end') {
                            if (callbacks.onFinish) {
                                callbacks.onFinish(accumulatedContent);
                            }
                        }
                    } catch (e) {
                        // Skip lines that aren't valid JSON (e.g. heartbeat or partial chunks)
                        // console.debug('Skipping partial/invalid SSE line:', line);
                    }
                }
            }
        }
    } catch (error) {
        if (callbacks.onError) {
            callbacks.onError(error);
        } else {
            console.error('Stream Error:', error);
        }
    }
}
