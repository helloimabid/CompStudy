/**
 * Spaced Repetition Library
 * Supports both SM-2 algorithm and custom review patterns
 */

// Quality ratings for review responses
export enum ReviewQuality {
  BLACKOUT = 0,      // Complete blackout, no recall
  INCORRECT = 1,     // Incorrect response, but remembered upon seeing answer
  HARD = 2,          // Incorrect response, but answer felt familiar
  DIFFICULT = 3,     // Correct response with significant difficulty
  GOOD = 4,          // Correct response after some hesitation
  PERFECT = 5,       // Perfect response with no hesitation
}

// Review mode types
export type ReviewMode = 'sm2' | 'custom';

// Preset patterns for custom review intervals
export interface ReviewPattern {
  id: string;
  name: string;
  description: string;
  intervals: number[]; // Array of days between reviews
}

// Preset patterns users can choose from
export const PRESET_PATTERNS: ReviewPattern[] = [
  {
    id: 'standard',
    name: 'Standard (1-4-7-14-30)',
    description: 'Classic spaced repetition pattern',
    intervals: [1, 4, 7, 14, 30, 60, 120],
  },
  {
    id: 'aggressive',
    name: 'Aggressive (1-2-4-7-14)',
    description: 'More frequent reviews for difficult material',
    intervals: [1, 2, 4, 7, 14, 30, 60],
  },
  {
    id: 'relaxed',
    name: 'Relaxed (1-7-14-30-60)',
    description: 'Longer intervals for easier material',
    intervals: [1, 7, 14, 30, 60, 90, 180],
  },
  {
    id: 'exam-prep',
    name: 'Exam Prep (1-2-3-5-7)',
    description: 'Intensive review for upcoming exams',
    intervals: [1, 2, 3, 5, 7, 10, 14],
  },
  {
    id: 'weekly',
    name: 'Weekly (7-14-21-28)',
    description: 'Review once a week pattern',
    intervals: [7, 14, 21, 28, 35, 42, 56],
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create your own pattern',
    intervals: [1, 3, 7, 14, 30],
  },
];

export interface SpacedRepetitionItem {
  $id: string;
  userId: string;
  topicId: string;
  subjectId: string;
  curriculumId: string;
  topicName: string;
  subjectName?: string;
  curriculumName?: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate?: string;
  totalReviews: number;
  correctReviews: number;
  status: 'active' | 'paused' | 'completed' | 'archived';
  emailReminderSent: boolean;
  // New fields for custom patterns
  reviewMode?: ReviewMode;
  patternId?: string;
  customIntervals?: string; // JSON string of custom intervals
  currentStep?: number; // Current position in the pattern
}

export interface UserSRSettings {
  $id: string;
  userId: string;
  emailRemindersEnabled: boolean;
  reminderTime: string;
  timezone: string;
  maxDailyReviews: number;
  weekendReminders: boolean;
  reminderDaysBefore: number;
  // Review pattern preferences
  reviewMode?: ReviewMode;
  selectedPatternId?: string;
  customIntervals?: string;
}

export interface ReviewResult {
  newEaseFactor: number;
  newInterval: number;
  newRepetitions: number;
  nextReviewDate: Date;
  newStep?: number;
}

/**
 * Calculate the next review using custom pattern
 */
export function calculateCustomPatternReview(
  currentStep: number,
  intervals: number[],
  isCorrect: boolean
): ReviewResult {
  let newStep = currentStep;
  let newInterval: number;

  if (isCorrect) {
    // Move to next step in pattern
    newStep = Math.min(currentStep + 1, intervals.length - 1);
    newInterval = intervals[newStep];
  } else {
    // Reset to beginning or go back one step
    newStep = Math.max(0, currentStep - 1);
    newInterval = intervals[newStep];
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    newEaseFactor: 2.5, // Not used in custom mode but kept for compatibility
    newInterval,
    newRepetitions: newStep,
    nextReviewDate,
    newStep,
  };
}

/**
 * Calculate next review with manual interval selection
 */
export function calculateManualReview(intervalDays: number): ReviewResult {
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    newEaseFactor: 2.5,
    newInterval: intervalDays,
    newRepetitions: 0,
    nextReviewDate,
  };
}

/**
 * Get intervals from pattern ID or custom string
 */
export function getIntervalsFromPattern(
  patternId?: string,
  customIntervalsStr?: string
): number[] {
  if (patternId === 'custom' && customIntervalsStr) {
    try {
      return JSON.parse(customIntervalsStr);
    } catch {
      return PRESET_PATTERNS[0].intervals;
    }
  }
  
  const pattern = PRESET_PATTERNS.find(p => p.id === patternId);
  return pattern?.intervals || PRESET_PATTERNS[0].intervals;
}

/**
 * Parse custom intervals string (e.g., "1,4,7,14,30")
 */
export function parseCustomIntervals(input: string): number[] {
  return input
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n) && n > 0);
}

/**
 * Calculate the next review schedule using SM-2 algorithm
 * @param easeFactor Current ease factor (default 2.5)
 * @param interval Current interval in days
 * @param repetitions Number of successful repetitions
 * @param quality Quality of the response (0-5)
 * @returns New scheduling parameters
 */
export function calculateNextReview(
  easeFactor: number,
  interval: number,
  repetitions: number,
  quality: ReviewQuality
): ReviewResult {
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  // Calculate new ease factor
  // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Ease factor should not go below 1.3
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }
  
  // Cap ease factor at 5.0
  if (newEaseFactor > 5.0) {
    newEaseFactor = 5.0;
  }

  // If quality is less than 3, reset the repetitions
  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Successful review
    newRepetitions = repetitions + 1;
    
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    newEaseFactor: Math.round(newEaseFactor * 100) / 100, // Round to 2 decimal places
    newInterval,
    newRepetitions,
    nextReviewDate,
  };
}

/**
 * Get items due for review
 * @param items List of spaced repetition items
 * @param maxItems Maximum number of items to return
 * @returns Items that are due for review
 */
export function getDueItems(
  items: SpacedRepetitionItem[],
  maxItems: number = 20
): SpacedRepetitionItem[] {
  const now = new Date();
  
  return items
    .filter(item => {
      if (item.status !== 'active') return false;
      const reviewDate = new Date(item.nextReviewDate);
      return reviewDate <= now;
    })
    .sort((a, b) => {
      // Sort by review date (oldest first)
      return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
    })
    .slice(0, maxItems);
}

/**
 * Get items due for review within a certain number of days
 * @param items List of spaced repetition items
 * @param days Number of days to look ahead
 * @returns Items that will be due within the specified days
 */
export function getUpcomingItems(
  items: SpacedRepetitionItem[],
  days: number = 7
): SpacedRepetitionItem[] {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return items
    .filter(item => {
      if (item.status !== 'active') return false;
      const reviewDate = new Date(item.nextReviewDate);
      return reviewDate > now && reviewDate <= futureDate;
    })
    .sort((a, b) => {
      return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
    });
}

/**
 * Calculate retention rate for an item
 * @param item Spaced repetition item
 * @returns Retention rate as a percentage (0-100)
 */
export function calculateRetentionRate(item: SpacedRepetitionItem): number {
  if (item.totalReviews === 0) return 0;
  return Math.round((item.correctReviews / item.totalReviews) * 100);
}

/**
 * Get statistics for a collection of items
 */
export interface SRStatistics {
  totalItems: number;
  activeItems: number;
  dueToday: number;
  dueThisWeek: number;
  averageRetention: number;
  totalReviews: number;
  streakDays: number;
}

export function calculateStatistics(items: SpacedRepetitionItem[]): SRStatistics {
  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  
  const activeItems = items.filter(item => item.status === 'active');
  
  const dueToday = activeItems.filter(item => {
    const reviewDate = new Date(item.nextReviewDate);
    return reviewDate <= now;
  }).length;
  
  const dueThisWeek = activeItems.filter(item => {
    const reviewDate = new Date(item.nextReviewDate);
    return reviewDate <= weekFromNow;
  }).length;
  
  const totalReviews = items.reduce((sum, item) => sum + item.totalReviews, 0);
  const totalCorrect = items.reduce((sum, item) => sum + item.correctReviews, 0);
  
  const averageRetention = totalReviews > 0
    ? Math.round((totalCorrect / totalReviews) * 100)
    : 0;
  
  return {
    totalItems: items.length,
    activeItems: activeItems.length,
    dueToday,
    dueThisWeek,
    averageRetention,
    totalReviews,
    streakDays: 0, // This would need to be calculated from review history
  };
}

/**
 * Format interval for display
 * @param days Number of days
 * @returns Human-readable interval string
 */
export function formatInterval(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `${days} days`;
  if (days < 14) return '1 week';
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days < 60) return '1 month';
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} year${days >= 730 ? 's' : ''}`;
}

/**
 * Get quality label for display
 */
export function getQualityLabel(quality: ReviewQuality): string {
  switch (quality) {
    case ReviewQuality.BLACKOUT:
      return 'Complete blackout';
    case ReviewQuality.INCORRECT:
      return 'Incorrect';
    case ReviewQuality.HARD:
      return 'Hard';
    case ReviewQuality.DIFFICULT:
      return 'Difficult';
    case ReviewQuality.GOOD:
      return 'Good';
    case ReviewQuality.PERFECT:
      return 'Perfect';
    default:
      return 'Unknown';
  }
}

/**
 * Get quality color for UI
 */
export function getQualityColor(quality: ReviewQuality): string {
  switch (quality) {
    case ReviewQuality.BLACKOUT:
    case ReviewQuality.INCORRECT:
      return 'bg-red-500';
    case ReviewQuality.HARD:
      return 'bg-orange-500';
    case ReviewQuality.DIFFICULT:
      return 'bg-yellow-500';
    case ReviewQuality.GOOD:
      return 'bg-green-500';
    case ReviewQuality.PERFECT:
      return 'bg-emerald-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Generate email content for review reminder
 */
export function generateReminderEmailContent(
  username: string,
  dueItems: SpacedRepetitionItem[],
  upcomingItems: SpacedRepetitionItem[]
): { subject: string; html: string; text: string } {
  const dueCount = dueItems.length;
  const upcomingCount = upcomingItems.length;
  
  const subject = dueCount > 0
    ? `📚 You have ${dueCount} topic${dueCount > 1 ? 's' : ''} to review today!`
    : `📅 ${upcomingCount} topic${upcomingCount > 1 ? 's' : ''} coming up for review`;

  // Group items by curriculum
  const groupedDue = groupItemsByCurriculum(dueItems);
  const groupedUpcoming = groupItemsByCurriculum(upcomingItems);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Study Reminder</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .section { background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .section h2 { margin-top: 0; color: #4f46e5; font-size: 18px; }
    .curriculum { margin-bottom: 15px; }
    .curriculum-name { font-weight: 600; color: #1f2937; margin-bottom: 8px; }
    .topic { padding: 8px 12px; background: white; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #6366f1; }
    .topic-name { font-weight: 500; }
    .subject-name { font-size: 12px; color: #6b7280; }
    .cta { text-align: center; margin: 30px 0; }
    .cta a { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; }
    .stats { display: flex; justify-content: center; gap: 30px; margin: 20px 0; }
    .stat { text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #6366f1; }
    .stat-label { font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📚 Time to Study, ${username}!</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Keep your learning streak going</p>
  </div>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-value">${dueCount}</div>
      <div class="stat-label">Due Today</div>
    </div>
    <div class="stat">
      <div class="stat-value">${upcomingCount}</div>
      <div class="stat-label">This Week</div>
    </div>
  </div>
  
  ${dueCount > 0 ? `
  <div class="section">
    <h2>🔴 Topics Due for Review</h2>
    ${Object.entries(groupedDue).map(([curriculum, items]) => `
      <div class="curriculum">
        <div class="curriculum-name">📖 ${curriculum}</div>
        ${(items as SpacedRepetitionItem[]).map(item => `
          <div class="topic">
            <div class="topic-name">${item.topicName}</div>
            ${item.subjectName ? `<div class="subject-name">${item.subjectName}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  ${upcomingCount > 0 ? `
  <div class="section">
    <h2>📅 Upcoming Reviews</h2>
    ${Object.entries(groupedUpcoming).slice(0, 5).map(([curriculum, items]) => `
      <div class="curriculum">
        <div class="curriculum-name">📖 ${curriculum}</div>
        ${(items as SpacedRepetitionItem[]).slice(0, 3).map(item => `
          <div class="topic">
            <div class="topic-name">${item.topicName}</div>
            ${item.subjectName ? `<div class="subject-name">${item.subjectName}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  <div class="cta">
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://compstudy.com'}/spaced-repetition">Start Reviewing</a>
  </div>
  
  <div class="footer">
    <p>This email was sent because you have spaced repetition reminders enabled.</p>
    <p>You can manage your reminder settings in your <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://compstudy.com'}/profile">profile settings</a>.</p>
    <p>© ${new Date().getFullYear()} CompStudy. Happy studying!</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Hi ${username}!

${dueCount > 0 ? `You have ${dueCount} topic${dueCount > 1 ? 's' : ''} due for review today.` : ''}
${upcomingCount > 0 ? `You have ${upcomingCount} topic${upcomingCount > 1 ? 's' : ''} coming up for review this week.` : ''}

Topics due:
${dueItems.map(item => `- ${item.topicName} (${item.curriculumName || 'Unknown'})`).join('\n')}

Start reviewing: ${process.env.NEXT_PUBLIC_APP_URL || 'https://compstudy.com'}/spaced-repetition

Happy studying!
CompStudy Team
  `.trim();

  return { subject, html, text };
}

function groupItemsByCurriculum(items: SpacedRepetitionItem[]): Record<string, SpacedRepetitionItem[]> {
  return items.reduce((acc, item) => {
    const curriculum = item.curriculumName || 'Uncategorized';
    if (!acc[curriculum]) {
      acc[curriculum] = [];
    }
    acc[curriculum].push(item);
    return acc;
  }, {} as Record<string, SpacedRepetitionItem[]>);
}

/**
 * Default settings for new users
 */
export const DEFAULT_SR_SETTINGS: Omit<UserSRSettings, '$id' | 'userId'> = {
  emailRemindersEnabled: true,
  reminderTime: '09:00',
  timezone: 'UTC',
  maxDailyReviews: 20,
  weekendReminders: true,
  reminderDaysBefore: 0,
  reviewMode: 'custom',
  selectedPatternId: 'standard',
  customIntervals: '[1,4,7,14,30,60,120]',
};
