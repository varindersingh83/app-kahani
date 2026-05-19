export type LearningLessonInput = {
  pageNumber?: number;
  failures: string[];
  retryCount: number;
};

export type LearningHintRow = {
  lesson: string;
};

export function buildRetryLearningLesson(input: LearningLessonInput) {
  const target = input.pageNumber ? `Page ${input.pageNumber}` : "Book setup";
  const reason = input.failures.length > 0 ? input.failures.join("; ") : "unknown failure";
  return `${target} needed retry ${input.retryCount} because ${reason}`;
}

export function formatLearningHints(rows: LearningHintRow[]) {
  if (rows.length === 0) return "";

  return `Recent production lessons to avoid repeating:\n${rows
    .map((row) => `- ${row.lesson}`)
    .join("\n")}`;
}
