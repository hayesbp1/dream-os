import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

import type { Project } from '../types';

export interface Message {
    role: 'user' | 'model' | 'system';
    content: string;
}

interface GuardianState {
    activeView: string;
    energyLevel: string;
    projects: Project[];
}

export function useGuardian(_initialState: GuardianState) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: "Awaiting instructions." }
    ]);
    const [isThinking, setIsThinking] = useState(false);

    // We keep a ref to the latest messages to avoid closure staleness issues in callbacks if needed,
    // though the SDK usage is straightforward.

    // Initialize SDK
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const sendMessage = async (text: string, currentContext: GuardianState) => {
        if (!text.trim()) return;

        if (!GEMINI_API_KEY) {
            setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'model', content: "Error: API Key is missing." }]);
            return;
        }

        const userMsg: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setIsThinking(true);

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const systemContext = `
SYSTEM CONTEXT:
- Active View: ${currentContext.activeView}
- User Energy Level: ${currentContext.energyLevel}
- Active Projects: ${JSON.stringify(currentContext.projects)}

ROLE: You are "The Guardian", an intelligent system interface for DreamOS. 
TONE: Concise, calm, futuristic, highly efficient. 
OBJECTIVE: Assist the user with their coding, tasks, and system management. 
`;

            // Start a new chat session (or continue one if we tracked history object properly)
            // For now, we simulate "one-shot" with history to save state management complexity
            // properly mapping our message structure to Gemini's.
            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: systemContext }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "System Online. Awaiting input." }],
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 1000,
                },
            });

            // Note: Placeholder removed to prevent double-bubble glitch.
            // We adding it only when first chunk arrives.

            const result = await chat.sendMessageStream(text);

            let accumulatedText = "";
            let isFirstChunk = true;

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                accumulatedText += chunkText;

                if (isFirstChunk) {
                    setMessages(prev => [...prev, { role: 'model', content: accumulatedText }]);
                    isFirstChunk = false;
                } else {
                    setMessages(prev => {
                        const newHistory = [...prev];
                        const lastIdx = newHistory.length - 1;
                        if (newHistory[lastIdx]?.role === 'model') {
                            newHistory[lastIdx] = { ...newHistory[lastIdx], content: accumulatedText };
                        }
                        return newHistory;
                    });
                }
            }

        } catch (error: any) {
            console.error("Guardian Error:", error);
            let errorMsg = "Connection Error.";
            if (error?.message) {
                errorMsg += ` ${error.message}`;
            }
            setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
        } finally {
            setIsThinking(false);
        }
    };

    return { messages, isThinking, sendMessage };
}
