// FILE: courseTree.ts
// Purpose: Pure domain models, file classifiers, and hierarchy resolvers for
//          the Mimir Course Knowledge Tree (replacing flat thread lists with
//          Course -> Syllabus -> Module -> Source Stack & Notes).
// Layer: Web domain logic

import type { ProjectId, ThreadId } from "@synara/contracts";
import type { Project, SidebarThreadSummary } from "~/types";

export type CourseSourceKind =
  | "slides"
  | "textbook"
  | "recording"
  | "assignment"
  | "handout"
  | "notes"
  | "other";

export interface CourseSourceItem {
  readonly id: string;
  readonly name: string;
  readonly kind: CourseSourceKind;
  readonly path: string;
  readonly size?: string | undefined;
}

export interface CourseSynthesisNote {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly updatedAt?: string | undefined;
}

export interface CourseStudySession {
  readonly threadId: ThreadId;
  readonly title: string;
  readonly updatedAt: string;
}

export interface CourseModuleMastery {
  readonly totalCards: number;
  readonly dueCards: number;
  readonly retrievability: number; // 0-100 percentage
}

export interface CourseModule {
  readonly id: string;
  readonly weekNumber: number;
  readonly title: string;
  readonly description: string;
  readonly sourceStack: ReadonlyArray<CourseSourceItem>;
  readonly synthesisNote: CourseSynthesisNote | null;
  readonly studySessions: ReadonlyArray<CourseStudySession>;
  readonly mastery: CourseModuleMastery;
}

export interface CourseMilestone {
  readonly name: string;
  readonly daysLeft: number;
  readonly date: string;
  readonly weight: string;
  readonly kind: "exam" | "assignment" | "quiz";
}

export interface CourseSyllabusInfo {
  readonly fileName: string | null;
  readonly totalWeeks: number;
  readonly nextMilestone: CourseMilestone | null;
  readonly overallMastery: number; // 0-100
}

export interface CourseKnowledgeTree {
  readonly courseId: ProjectId;
  readonly courseName: string;
  readonly courseCwd: string;
  readonly syllabus: CourseSyllabusInfo;
  readonly modules: ReadonlyArray<CourseModule>;
  readonly inboxFiles: ReadonlyArray<CourseSourceItem>;
  readonly outboxCount: number;
}

export function classifyFileKind(fileName: string): CourseSourceKind {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".mp3") || lower.endsWith(".m4a") || lower.endsWith(".wav")) {
    return "recording";
  }
  if (lower.includes("slide") || lower.includes("presentation") || lower.endsWith(".pptx")) {
    return "slides";
  }
  if (
    lower.includes("ch") ||
    lower.includes("chapter") ||
    lower.includes("textbook") ||
    lower.includes("reading")
  ) {
    return "textbook";
  }
  if (
    lower.includes("ps") ||
    lower.includes("problem") ||
    lower.includes("hw") ||
    lower.includes("homework") ||
    lower.includes("assignment")
  ) {
    return "assignment";
  }
  if (lower.includes("handout") || lower.includes("cheatsheet") || lower.includes("summary")) {
    return "handout";
  }
  if (lower.endsWith(".md") || lower.endsWith(".txt") || lower.includes("note")) {
    return "notes";
  }
  return "other";
}

export function extractWeekNumber(name: string): number | null {
  const match = name.match(/(?:week|wk|module|mod|lecture|lec|w)[_\s-]*0?([1-9][0-9]?)/i);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    return Number.isFinite(num) && num > 0 ? num : null;
  }
  return null;
}

export function buildCourseTree(input: {
  readonly course: Project;
  readonly filePaths?: ReadonlyArray<string> | undefined;
  readonly threads?: ReadonlyArray<SidebarThreadSummary> | undefined;
}): CourseKnowledgeTree {
  const { course, filePaths = [], threads = [] } = input;
  const courseThreads = threads.filter((t) => t.projectId === course.id);

  let syllabusFileName: string | null = null;
  const inboxFiles: CourseSourceItem[] = [];
  let outboxCount = 0;

  const moduleFilesMap = new Map<number, CourseSourceItem[]>();
  const moduleNotesMap = new Map<number, CourseSynthesisNote>();

  for (const filePath of filePaths) {
    const normalized = filePath.replace(/\\/g, "/");
    const segments = normalized.split("/");
    const fileName = segments[segments.length - 1] ?? "";

    if (!fileName || fileName.startsWith(".mimir")) continue;

    if (fileName.toLowerCase().includes("syllabus")) {
      syllabusFileName = fileName;
    }

    if (normalized.startsWith("Inbox/") || normalized.startsWith("inbox/")) {
      inboxFiles.push({
        id: `inbox:${fileName}`,
        name: fileName,
        kind: classifyFileKind(fileName),
        path: normalized,
      });
    }

    if (normalized.startsWith("Outbox/") || normalized.startsWith("outbox/")) {
      outboxCount++;
    }

    const weekNum = extractWeekNumber(normalized) ?? extractWeekNumber(fileName);
    if (weekNum !== null && weekNum > 0) {
      const kind = classifyFileKind(fileName);
      if (
        kind === "notes" &&
        (fileName.toLowerCase().includes("synthesis") || fileName.toLowerCase().includes("notes"))
      ) {
        moduleNotesMap.set(weekNum, {
          id: `note:${normalized}`,
          name: fileName,
          path: normalized,
        });
      } else {
        const list = moduleFilesMap.get(weekNum) ?? [];
        list.push({
          id: `src:${normalized}`,
          name: fileName,
          kind,
          path: normalized,
        });
        moduleFilesMap.set(weekNum, list);
      }
    }
  }

  // Map threads to modules
  const moduleThreadsMap = new Map<number, CourseStudySession[]>();
  for (const thread of courseThreads) {
    const weekNum = extractWeekNumber(thread.title);
    const targetWeek = weekNum ?? 1;
    const list = moduleThreadsMap.get(targetWeek) ?? [];
    list.push({
      threadId: thread.id,
      title: thread.title,
      updatedAt: thread.updatedAt ?? thread.createdAt ?? new Date().toISOString(),
    });
    moduleThreadsMap.set(targetWeek, list);
  }

  // Determine weeks count
  const detectedWeeks = Array.from(moduleFilesMap.keys()).concat(
    Array.from(moduleThreadsMap.keys()),
  );
  const maxWeek = detectedWeeks.length > 0 ? Math.max(...detectedWeeks, 4) : 4;
  const totalWeeks = Math.max(maxWeek, 4);

  const modules: CourseModule[] = [];
  for (let w = 1; w <= totalWeeks; w++) {
    const sources = moduleFilesMap.get(w) ?? [];
    const note = moduleNotesMap.get(w) ?? null;
    const sessions = moduleThreadsMap.get(w) ?? [];

    modules.push({
      id: `module-week-${w}`,
      weekNumber: w,
      title: `Week ${w}`,
      description:
        sources.length > 0
          ? `${sources.length} source file${sources.length === 1 ? "" : "s"}`
          : "Module materials",
      sourceStack: sources,
      synthesisNote: note,
      studySessions: sessions,
      mastery: {
        totalCards: 0,
        dueCards: 0,
        retrievability: 0,
      },
    });
  }

  return {
    courseId: course.id,
    courseName: course.name,
    courseCwd: course.cwd,
    syllabus: {
      fileName: syllabusFileName,
      totalWeeks,
      nextMilestone: null,
      overallMastery: 0,
    },
    modules,
    inboxFiles,
    outboxCount,
  };
}
