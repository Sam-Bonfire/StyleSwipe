import { Effect } from "effect";

export interface OnboardingQuestion {
    id: string;
    question: string;
    options: string[];
}

export const getOnboardingQuestions = (): Effect.Effect<never, never, OnboardingQuestion[]> => {
    return Effect.succeed([
        { id: "gender", question: "Which collection should we show you?", options: ["Men", "Women", "Both"] },
        { id: "vibe", question: "What's your Saturday night vibe?", options: ["Party", "Chill", "Dinner", "Adventure"] },
        { id: "fit", question: "How do you like your clothes to fit?", options: ["Slim", "Regular", "Oversized"] },
        { id: "color", question: "Which colors do you gravitate towards?", options: ["Neutral", "Dark", "Pastel", "Vibrant"] },
        { id: "lifestyle", question: "What's your primary activity?", options: ["Work", "Gym", "Date Night", "Casual"] },
    ]);
};
