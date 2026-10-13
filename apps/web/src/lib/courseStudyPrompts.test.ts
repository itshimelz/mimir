// FILE: courseStudyPrompts.test.ts
// Purpose: Unit tests for pedagogical prompt generation and metadata.
// Layer: Web unit tests

import { describe, expect, it } from "vitest";
import {
  buildCourseStudyPrompt,
  COURSE_STUDY_ACTIONS,
  COURSE_STUDY_INTENTS,
  type CourseStudyIntent,
} from "./courseStudyPrompts";

describe("courseStudyPrompts", () => {
  describe("COURSE_STUDY_ACTIONS metadata", () => {
    it("exposes all four distinct study intents", () => {
      const ids = COURSE_STUDY_ACTIONS.map((action) => action.id);
      expect(ids).toEqual(["explain", "review-inbox", "practice-quiz", "breakdown-assignment"]);
    });

    it("has non-empty titles, descriptions, badges, and default prompts", () => {
      for (const action of COURSE_STUDY_ACTIONS) {
        expect(action.title.length).toBeGreaterThan(0);
        expect(action.description.length).toBeGreaterThan(0);
        expect(action.badge.length).toBeGreaterThan(0);
        expect(action.placeholder.length).toBeGreaterThan(0);
        expect(action.defaultPrompt.length).toBeGreaterThan(0);
      }
    });
  });

  describe("buildCourseStudyPrompt", () => {
    describe("explain", () => {
      it("returns default Socratic prompt when topic is omitted or whitespace", () => {
        expect(buildCourseStudyPrompt("explain")).toBe(COURSE_STUDY_INTENTS.explain.defaultPrompt);
        expect(buildCourseStudyPrompt("explain", "")).toBe(
          COURSE_STUDY_INTENTS.explain.defaultPrompt,
        );
        expect(buildCourseStudyPrompt("explain", "   ")).toBe(
          COURSE_STUDY_INTENTS.explain.defaultPrompt,
        );
        expect(buildCourseStudyPrompt("explain", null)).toBe(
          COURSE_STUDY_INTENTS.explain.defaultPrompt,
        );
      });

      it("interpolates trimmed topic and preserves Socratic check-in instructions", () => {
        const prompt = buildCourseStudyPrompt("explain", "  Cellular Respiration  ");
        expect(prompt).toContain('concept of "Cellular Respiration"');
        expect(prompt).toContain("step-by-step");
        expect(prompt).toContain("analogies");
        expect(prompt).toContain("check-in question");
      });
    });

    describe("review-inbox", () => {
      it("returns default inbox prompt when topic is omitted", () => {
        expect(buildCourseStudyPrompt("review-inbox")).toBe(
          COURSE_STUDY_INTENTS["review-inbox"].defaultPrompt,
        );
        expect(buildCourseStudyPrompt("review-inbox")).toContain("Inbox/");
      });

      it("interpolates trimmed topic into inbox review prompt", () => {
        const prompt = buildCourseStudyPrompt("review-inbox", "Lecture 3 Slides");
        expect(prompt).toContain('notes and files for "Lecture 3 Slides"');
        expect(prompt).toContain("Inbox/");
        expect(prompt).toContain("core principles");
      });
    });

    describe("practice-quiz", () => {
      it("returns default interactive drill prompt when topic is omitted", () => {
        const prompt = buildCourseStudyPrompt("practice-quiz");
        expect(prompt).toBe(COURSE_STUDY_INTENTS["practice-quiz"].defaultPrompt);
        expect(prompt).toContain("one question at a time");
        expect(prompt).toContain("Do not provide the answer upfront");
      });

      it("interpolates topic into quiz drill prompt", () => {
        const prompt = buildCourseStudyPrompt("practice-quiz", "Organic Chemistry");
        expect(prompt).toContain('Quiz me on "Organic Chemistry" one question at a time');
        expect(prompt).toContain("constructive feedback");
      });
    });

    describe("breakdown-assignment", () => {
      it("returns default breakdown prompt when topic is omitted", () => {
        const prompt = buildCourseStudyPrompt("breakdown-assignment");
        expect(prompt).toBe(COURSE_STUDY_INTENTS["breakdown-assignment"].defaultPrompt);
        expect(prompt).toContain("without doing the work for me");
      });

      it("interpolates topic into assignment breakdown prompt", () => {
        const prompt = buildCourseStudyPrompt("breakdown-assignment", "Final Research Paper");
        expect(prompt).toContain('assignment for "Final Research Paper"');
        expect(prompt).toContain("manageable milestones");
        expect(prompt).toContain("without doing the work for me");
      });
    });
  });
});
