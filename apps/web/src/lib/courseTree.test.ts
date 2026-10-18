// FILE: courseTree.test.ts
// Purpose: Unit tests for Course Knowledge Tree hierarchy construction and file classifier.
// Layer: Web unit tests

import { describe, expect, it } from "vitest";
import type { ProjectId, ThreadId } from "@synara/contracts";
import type { Project, SidebarThreadSummary } from "~/types";
import { buildCourseTree, classifyFileKind, extractWeekNumber } from "./courseTree";

const mockProject: Project = {
  id: "course-neuro101" as ProjectId,
  kind: "project",
  name: "Cellular Neurobiology",
  remoteName: "BIO301",
  folderName: "BIO301",
  localName: null,
  cwd: "/Users/student/Courses/BIO301",
  defaultModelSelection: null,
  expanded: true,
  isPinned: false,
  spaceId: null,
  scripts: [],
  additionalFolders: [],
  createdAt: "2026-10-18T00:00:00Z",
  updatedAt: "2026-10-18T00:00:00Z",
};

describe("courseTree", () => {
  describe("classifyFileKind", () => {
    it("classifies audio recordings", () => {
      expect(classifyFileKind("Lecture_01.mp3")).toBe("recording");
      expect(classifyFileKind("Audio_discussion.m4a")).toBe("recording");
    });

    it("classifies slides and presentations", () => {
      expect(classifyFileKind("Lecture_02_Slides.pdf")).toBe("slides");
      expect(classifyFileKind("Overview_presentation.pptx")).toBe("slides");
    });

    it("classifies textbooks and chapter readings", () => {
      expect(classifyFileKind("Kandel_Chapter_4.pdf")).toBe("textbook");
      expect(classifyFileKind("Required_reading_week1.pdf")).toBe("textbook");
    });

    it("classifies assignments and problem sets", () => {
      expect(classifyFileKind("Problem_Set_1.pdf")).toBe("assignment");
      expect(classifyFileKind("Homework_2.pdf")).toBe("assignment");
    });

    it("classifies markdown notes", () => {
      expect(classifyFileKind("Action_Potentials_Notes.md")).toBe("notes");
    });
  });

  describe("extractWeekNumber", () => {
    it("extracts week numbers from various naming conventions", () => {
      expect(extractWeekNumber("Week 01 Slides.pdf")).toBe(1);
      expect(extractWeekNumber("week_03_notes.md")).toBe(3);
      expect(extractWeekNumber("Lecture 4 Discussion")).toBe(4);
      expect(extractWeekNumber("Mod2_Synthesis.md")).toBe(2);
      expect(extractWeekNumber("W5_Assignment.pdf")).toBe(5);
    });

    it("returns null for non-numbered strings", () => {
      expect(extractWeekNumber("Syllabus.pdf")).toBeNull();
      expect(extractWeekNumber("Course_Overview.md")).toBeNull();
    });
  });

  describe("buildCourseTree", () => {
    it("builds a scaffolded 4-week tree when given no files or threads", () => {
      const tree = buildCourseTree({ course: mockProject });
      expect(tree.courseId).toBe("course-neuro101");
      expect(tree.courseName).toBe("Cellular Neurobiology");
      expect(tree.modules.length).toBeGreaterThanOrEqual(4);
      expect(tree.modules[0]?.weekNumber).toBe(1);
      expect(tree.modules[0]?.title).toContain("Week 1");
    });

    it("places classified source files and synthesis notes into their respective weekly modules", () => {
      const filePaths = [
        "syllabus.pdf",
        "Inbox/Week_01_Slides.pdf",
        "Week 1/Lecture_01_Audio.mp3",
        "Week 1/Week_01_Synthesis_Notes.md",
        "Week 2/Problem_Set_2.pdf",
        "Outbox/Notes/Week_1_Summary.md",
      ];

      const threads: SidebarThreadSummary[] = [
        {
          id: "t-1" as ThreadId,
          projectId: mockProject.id,
          title: "Week 1 Derivation of Nernst Equation",
          createdAt: "2026-10-18T10:00:00Z",
          updatedAt: "2026-10-18T10:00:00Z",
        } as SidebarThreadSummary,
      ];

      const tree = buildCourseTree({ course: mockProject, filePaths, threads });

      expect(tree.syllabus.fileName).toBe("syllabus.pdf");
      expect(tree.inboxFiles.length).toBe(1);
      expect(tree.outboxCount).toBe(1);

      const week1 = tree.modules.find((m) => m.weekNumber === 1);
      expect(week1).toBeDefined();
      expect(week1?.synthesisNote?.name).toBe("Week_01_Synthesis_Notes.md");
      expect(week1?.studySessions.length).toBe(1);
      expect(week1?.studySessions[0]?.title).toContain("Nernst Equation");
    });
  });
});
