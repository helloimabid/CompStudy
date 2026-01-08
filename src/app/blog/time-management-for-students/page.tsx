import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle,
  Lightbulb,
  Target,
} from "lucide-react";
import EmailSubscription from "@/components/EmailSubscription";

export const metadata: Metadata = {
  title: "Time Management Strategies for Students | CompStudy Blog",
  description:
    "Master the art of balancing studies, activities, and life. Learn proven time management techniques that successful students use to accomplish more.",
  keywords: [
    "student time management",
    "study schedule",
    "time blocking",
    "academic planning",
    "productivity for students",
    "study planning",
  ],
};

export default function TimeManagementArticle() {
  return (
    <main className="min-h-screen bg-[#050505] pt-24 pb-16">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-100 bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none -z-10" />
      <article className="max-w-3xl mx-auto px-4">
        <header className="mb-12">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium border border-indigo-500/20">
              Productivity
            </span>
            <span className="text-zinc-500 text-sm">December 8, 2025</span>
            <span className="text-zinc-500 text-sm">•</span>
            <span className="text-zinc-500 text-sm">9 min read</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-medium text-white mb-6 leading-tight">
            Time Management Strategies That Actually Work for Students
          </h1>

          <p className="text-xl text-zinc-400 leading-relaxed">
            Between classes, assignments, extracurriculars, and maintaining a
            social life, managing time as a student is a constant challenge.
            Here are proven strategies to take control of your schedule.
          </p>
        </header>

        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-zinc-300 leading-relaxed mb-6">
            Time is the one resource everyone has in equal measure—24 hours each
            day. Yet some students seem to accomplish twice as much as others
            while still finding time for fun. The difference isn't talent or
            luck; it's strategy. Effective time management is a skill that can
            be learned, and mastering it will serve you far beyond your academic
            years.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Understanding Where Your Time Goes
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Before you can manage your time better, you need to understand how
            you're currently spending it. Most people significantly
            underestimate how much time they waste on low-value activities and
            overestimate how much productive time they have.
          </p>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Try this exercise: for one week, track how you spend every hour. Be
            honest—include the time spent scrolling social media, the extended
            "quick breaks," and the hours lost to procrastination. The results
            often reveal surprising opportunities for improvement.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Core Time Management Strategies
          </h2>

          <div className="bg-zinc-900/50 rounded-xl p-6 mb-6 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">
              1. Time Blocking
            </h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Instead of working from a simple to-do list, schedule specific
              blocks of time for specific tasks. During a block, you work on
              only that designated task—no multitasking, no "quick" checks of
              email or social media.
            </p>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Time blocking works because it forces you to realistically assess
              how long tasks take and creates a structure that resists
              interruptions. It also gives you permission to ignore other tasks
              during each block.
            </p>
            <div className="flex items-start gap-2 text-green-400 text-sm">
              <Lightbulb className="w-5 h-5 flex-shrink-0" />
              <span>
                Example: Block 9-11 AM for writing your essay, 11:30-12:30 for
                math problems, 2-3:30 PM for biology reading.
              </span>
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-xl p-6 mb-6 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">
              2. The Eisenhower Matrix
            </h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Named after President Eisenhower, this framework helps prioritize
              tasks by categorizing them into four quadrants based on urgency
              and importance:
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                <h4 className="font-semibold text-green-400 text-sm">
                  Urgent & Important
                </h4>
                <p className="text-zinc-400 text-sm mt-1">Do first</p>
              </div>
              <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                <h4 className="font-semibold text-blue-400 text-sm">
                  Not Urgent & Important
                </h4>
                <p className="text-zinc-400 text-sm mt-1">Schedule it</p>
              </div>
              <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
                <h4 className="font-semibold text-yellow-400 text-sm">
                  Urgent & Not Important
                </h4>
                <p className="text-zinc-400 text-sm mt-1">
                  Delegate if possible
                </p>
              </div>
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                <h4 className="font-semibold text-red-400 text-sm">
                  Not Urgent & Not Important
                </h4>
                <p className="text-zinc-400 text-sm mt-1">Eliminate</p>
              </div>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              Most students spend too much time in quadrant 4 (social media,
              excessive entertainment) at the expense of quadrant 2 (long-term
              projects, skill building). Shift your focus to quadrant 2 to
              prevent things from becoming urgent crises.
            </p>
          </div>

          <div className="bg-zinc-900/50 rounded-xl p-6 mb-6 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">
              3. The Two-Minute Rule
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              If a task takes less than two minutes, do it immediately. Small
              tasks pile up and create mental clutter when left undone. Quickly
              replying to that email, filing a document, or making a short phone
              call prevents these items from accumulating and becoming sources
              of stress.
            </p>
          </div>

          <div className="bg-zinc-900/50 rounded-xl p-6 mb-6 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">
              4. Weekly Reviews
            </h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Set aside 30 minutes each week (Sunday evening works well) to
              review the past week and plan the next. Ask yourself:
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-300">
              <li>What did I accomplish?</li>
              <li>What didn't get done? Why?</li>
              <li>What are my priorities for next week?</li>
              <li>What deadlines are approaching?</li>
              <li>What can I do to prevent last-minute crises?</li>
            </ul>
          </div>

          <div className="bg-zinc-900/50 rounded-xl p-6 mb-6 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">
              5. Eat the Frog
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              Mark Twain allegedly said that if you eat a live frog first thing
              in the morning, nothing worse will happen the rest of the day. In
              productivity terms: tackle your most challenging or dreaded task
              first. You have the most willpower and energy in the morning, and
              completing the hard task early gives you momentum and relief for
              the rest of the day.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Creating an Effective Study Schedule
          </h2>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-white">
                  Map your fixed commitments:
                </strong>{" "}
                Start with non-negotiable items like classes, work shifts, and
                recurring commitments.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-white">
                  Identify your peak hours:
                </strong>{" "}
                When are you most alert and focused? Schedule your most
                challenging work during these periods.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-white">Schedule study sessions:</strong>{" "}
                Block out specific times for studying each subject. Treat these
                blocks as seriously as you would a class.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-white">Include buffer time:</strong>{" "}
                Things always take longer than expected. Build in extra time
                between activities and for unexpected tasks.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-white">Protect your rest:</strong>{" "}
                Schedule breaks, meals, exercise, and sleep as non-negotiables.
                Burning out helps no one.
              </span>
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Dealing with Procrastination
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Even with perfect planning, procrastination can derail your
            schedule. Here's how to combat it:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-300 mb-6">
            <li>
              <strong className="text-white">
                Break tasks into tiny steps:
              </strong>{" "}
              Instead of "Write essay," start with "Open document and write one
              paragraph."
            </li>
            <li>
              <strong className="text-white">Use the 5-minute rule:</strong>{" "}
              Commit to working on something for just 5 minutes. Often, starting
              is the hardest part, and you'll continue once you begin.
            </li>
            <li>
              <strong className="text-white">Remove temptations:</strong> Put
              your phone in another room, use website blockers, or go to the
              library where distractions are minimal.
            </li>
            <li>
              <strong className="text-white">Create accountability:</strong>{" "}
              Tell someone your plan, study with others, or use tools that track
              your time.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Tools to Support Your System
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-6">
            The best time management system is one you'll actually use. Some
            people thrive with paper planners; others prefer digital tools.
            Experiment to find what works for you:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-300 mb-6">
            <li>
              Calendar apps (Google Calendar, Apple Calendar) for time blocking
            </li>
            <li>Task managers (Todoist, Notion, Things) for tracking to-dos</li>
            <li>
              Pomodoro timers (like CompStudy's built-in timer) for focused work
              sessions
            </li>
            <li>Time tracking apps to understand how you spend your time</li>
            <li>
              Website blockers (Freedom, Cold Turkey) to eliminate digital
              distractions
            </li>
          </ul>

          <div className="bg-indigo-500/10 rounded-xl p-8 border border-indigo-500/20 text-center">
            <h3 className="text-xl font-bold text-white mb-3">
              Track Your Study Time
            </h3>
            <p className="text-zinc-400 mb-6">
              Use CompStudy's timer to structure your study sessions and see how
              much you're actually studying each day.
            </p>
            <Link
              href="/timer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors"
            >
              <Target className="w-5 h-5" />
              Start Tracking Your Time
            </Link>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-16">
          <EmailSubscription
            topic="blog"
            variant="minimal"
            title="Enjoyed this article?"
            description="Get more study tips and productivity strategies delivered to your inbox."
          />
        </div>

        {/* Related Posts */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <h3 className="text-xl font-bold text-white mb-6">
            Related Articles
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/blog/pomodoro-technique-complete-guide"
              className="p-4 rounded-xl bg-[#0a0a0a] border border-white/10 hover:border-white/20 transition-colors"
            >
              <h4 className="font-semibold text-white mb-1">
                The Complete Guide to the Pomodoro Technique
              </h4>
              <p className="text-sm text-zinc-500">8 min read</p>
            </Link>
            <Link
              href="/blog/how-to-stay-focused-while-studying"
              className="p-4 rounded-xl bg-[#0a0a0a] border border-white/10 hover:border-white/20 transition-colors"
            >
              <h4 className="font-semibold text-white mb-1">
                How to Stay Focused While Studying
              </h4>
              <p className="text-sm text-zinc-500">10 min read</p>
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
