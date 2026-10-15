// FILE: courseStudyPrompts.ts
// Purpose: Pedagogical prompt templates and metadata for Socratic study sessions.
// Layer: Web study orchestration helper

export type CourseStudyIntent =
  | "explain"
  | "review-inbox"
  | "practice-quiz"
  | "breakdown-assignment";

export interface CourseStudyActionConfig {
  readonly id: CourseStudyIntent;
  readonly title: string;
  readonly badge: string;
  readonly description: string;
  readonly placeholder: string;
  readonly defaultPrompt: string;
}

export const COURSE_STUDY_INTENTS: Readonly<Record<CourseStudyIntent, CourseStudyActionConfig>> = {
  explain: {
    id: "explain",
    title: "Explain a Concept",
    badge: "Concept & Analogy",
    description:
      "Break down a complex idea with analogies, examples, and quick check-in questions.",
    placeholder: "e.g., Dijkstra's algorithm, cellular respiration, Keynesian economics",
    defaultPrompt:
      "Explain this concept step-by-step. Use analogies, and pause after the first key concept to ask a quick check-in question to test my understanding.",
  },
  "review-inbox": {
    id: "review-inbox",
    title: "Review Materials in Inbox",
    badge: "Course Notes",
    description: "Analyze uploaded lecture notes, readings, or slides placed in your course Inbox.",
    placeholder: "e.g., Chapter 4 slides, week 2 reading",
    defaultPrompt:
      "Analyze the notes and files in my course Inbox/. Extract the core principles, define key terminology, and highlight anything confusing or counter-intuitive.",
  },
  "practice-quiz": {
    id: "practice-quiz",
    title: "Practice Quiz",
    badge: "Interactive Drill",
    description: "Test your knowledge with an interactive, turn-by-turn question session.",
    placeholder: "e.g., organic chemistry reactions, calculus derivatives",
    defaultPrompt:
      "Quiz me on this topic one question at a time. Do not provide the answer upfront. Wait for my response, give constructive feedback, and then ask the next question.",
  },
  "breakdown-assignment": {
    id: "breakdown-assignment",
    title: "Break Down Assignment",
    badge: "Milestones",
    description: "Outline requirements and a step-by-step approach without doing the work for you.",
    placeholder: "e.g., Term paper draft, lab report 3, algorithm problem set",
    defaultPrompt:
      "Help me understand this assignment. Break down the requirements into manageable milestones and outline a step-by-step approach without doing the work for me.",
  },
};

export const COURSE_STUDY_ACTIONS: ReadonlyArray<CourseStudyActionConfig> = [
  COURSE_STUDY_INTENTS.explain,
  COURSE_STUDY_INTENTS["review-inbox"],
  COURSE_STUDY_INTENTS["practice-quiz"],
  COURSE_STUDY_INTENTS["breakdown-assignment"],
];

/**
 * Builds a Socratic prompt for the requested study intent.
 * If a topic is supplied, interpolates it into the prompt; otherwise uses the default template.
 */
export function buildCourseStudyPrompt(intent: CourseStudyIntent, topic?: string | null): string {
  const trimmed = topic?.trim();
  switch (intent) {
    case "explain":
      return trimmed
        ? `Explain the concept of "${trimmed}" step-by-step. Use analogies, and pause after the first key concept to ask a quick check-in question to test my understanding.`
        : COURSE_STUDY_INTENTS.explain.defaultPrompt;

    case "review-inbox":
      return trimmed
        ? `Analyze the notes and files for "${trimmed}" in my course Inbox/. Extract the core principles, define key terminology, and highlight anything confusing or counter-intuitive.`
        : COURSE_STUDY_INTENTS["review-inbox"].defaultPrompt;

    case "practice-quiz":
      return trimmed
        ? `Quiz me on "${trimmed}" one question at a time. Do not provide the answer upfront. Wait for my response, give constructive feedback, and then ask the next question.`
        : COURSE_STUDY_INTENTS["practice-quiz"].defaultPrompt;

    case "breakdown-assignment":
      return trimmed
        ? `Help me understand this assignment for "${trimmed}". Break down the requirements into manageable milestones and outline a step-by-step approach without doing the work for me.`
        : COURSE_STUDY_INTENTS["breakdown-assignment"].defaultPrompt;
  }
}
