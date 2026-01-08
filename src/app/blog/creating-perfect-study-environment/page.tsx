import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  CheckCircle,
  Monitor,
  Headphones,
  Lamp,
  TreeDeciduous,
} from "lucide-react";
import EmailSubscription from "@/components/EmailSubscription";

export const metadata: Metadata = {
  title: "How to Create the Perfect Study Environment | CompStudy Blog",
  description:
    "Your environment shapes your focus. Learn how to optimize your study space for maximum concentration, comfort, and productivity.",
  keywords: [
    "study environment",
    "study space",
    "study room setup",
    "desk organization",
    "study atmosphere",
    "productivity environment",
  ],
};

export default function StudyEnvironmentArticle() {
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
            <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-sm font-medium border border-indigo-500/20">
              Study Tips
            </span>
            <span className="text-zinc-500 text-sm">December 5, 2025</span>
            <span className="text-zinc-500 text-sm">•</span>
            <span className="text-zinc-500 text-sm">8 min read</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-medium text-white mb-6 leading-tight">
            Creating the Perfect Study Environment
          </h1>

          <p className="text-xl text-zinc-400 leading-relaxed">
            Your surroundings have a profound impact on your ability to focus
            and learn. Here's how to design a study environment that works with
            your brain, not against it.
          </p>
        </header>

        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-zinc-300 leading-relaxed mb-6">
            Have you ever noticed how much easier it is to focus in certain
            places than others? That's not coincidence—your environment directly
            affects your cognitive performance. Research shows that factors like
            lighting, sound, temperature, and even the color of your walls can
            significantly impact concentration, memory, and learning efficiency.
          </p>
          <p className="text-zinc-300 leading-relaxed mb-6">
            The good news is that you don't need a perfect home office or
            expensive equipment to create an effective study space. With some
            strategic adjustments, you can transform almost any area into a
            productivity-enhancing environment.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4 flex items-center gap-3">
            <Lamp className="w-6 h-6 text-yellow-400" />
            Lighting
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Lighting is one of the most underrated factors in study
            productivity. Poor lighting causes eye strain, headaches, and
            fatigue—all enemies of effective studying.
          </p>

          <div className="bg-zinc-900/50 rounded-xl p-6 mb-6 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">
              Natural Light is Best
            </h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Natural daylight is ideal for studying. It reduces eye strain,
              supports circadian rhythms, and has been shown to improve mood and
              alertness. Position your desk near a window if possible, but avoid
              placing your monitor where it creates glare.
            </p>
            <div className="flex items-start gap-2 text-green-400 text-sm">
              <Lightbulb className="w-5 h-5 flex-shrink-0" />
              <span>
                Studies show that students with more natural light exposure
                perform 25% better on tests than those studying under artificial
                light alone.
              </span>
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-xl p-6 mb-6 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">
              Layer Your Artificial Lighting
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              When natural light isn't available or sufficient, use a
              combination of overhead lighting and a desk lamp. The desk lamp
              should provide focused task lighting without creating harsh
              shadows. Look for bulbs in the 4000-5000K color temperature
              range—bright enough for alertness but not so blue that it's harsh.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4 flex items-center gap-3">
            <Headphones className="w-6 h-6 text-purple-400" />
            Sound Environment
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Sound preferences vary widely between individuals. Some people need
            complete silence, while others work better with background noise.
            Understanding your own needs is key.
          </p>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-white">For silence-seekers:</strong>{" "}
                Noise-canceling headphones are a game-changer. Even without
                playing anything, they reduce ambient noise significantly.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-white">
                  For background noise lovers:
                </strong>{" "}
                Try lo-fi music, nature sounds, or coffee shop ambient noise.
                Avoid music with lyrics when doing reading or writing tasks.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-zinc-300">
                <strong className="text-white">
                  For unpredictable environments:
                </strong>{" "}
                Use white or brown noise to mask sudden sounds that might break
                concentration.
              </span>
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4 flex items-center gap-3">
            <Monitor className="w-6 h-6 text-blue-400" />
            Desk and Chair Setup
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Physical discomfort is a major concentration killer. If you're
            thinking about your aching back or stiff neck, you're not thinking
            about your studies.
          </p>

          <div className="bg-zinc-900/50 rounded-xl p-6 mb-6 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">
              Ergonomic Essentials
            </h3>
            <ul className="list-disc list-inside space-y-2 text-zinc-300">
              <li>Monitor at eye level, about arm's length away</li>
              <li>Feet flat on the floor or on a footrest</li>
              <li>Knees at approximately 90 degrees</li>
              <li>Keyboard and mouse at elbow height</li>
              <li>Back supported by the chair's lumbar support</li>
            </ul>
          </div>

          <div className="bg-zinc-900/50 rounded-xl p-6 mb-6 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">
              Desk Organization
            </h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              A cluttered desk leads to a cluttered mind. Keep only what you
              need for your current study session on your desk. Everything else
              should have a designated home.
            </p>
            <p className="text-zinc-300 leading-relaxed">
              Before each study session, take 2 minutes to clear your desk and
              gather only the materials you'll need. This simple ritual also
              signals to your brain that it's time to focus.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Temperature and Air Quality
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-6">
            The ideal temperature for cognitive work is around 20-22°C
            (68-72°F). Too warm and you'll feel drowsy; too cold and you'll be
            distracted by discomfort. If you can't control the temperature,
            adapt your clothing layers.
          </p>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Fresh air is equally important. Stale, CO2-rich air impairs
            cognitive function. Open a window periodically, or if that's not
            possible, take breaks in a well-ventilated area. Some people find
            that adding plants to their study space improves air quality and
            reduces stress.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Minimizing Digital Distractions
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Your physical environment is only half the battle. Your digital
            environment needs attention too.
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-300 mb-6">
            <li>Put your phone in another room, or at least in a drawer</li>
            <li>Use website blockers to prevent access to distracting sites</li>
            <li>Close all browser tabs not related to your current task</li>
            <li>Turn off all notifications on your computer</li>
            <li>Use fullscreen mode for your work to hide other apps</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4 flex items-center gap-3">
            <TreeDeciduous className="w-6 h-6 text-green-400" />
            Adding Natural Elements
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Research on "biophilic design" shows that incorporating natural
            elements into your environment reduces stress and improves
            concentration. Consider adding:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-300 mb-6">
            <li>Plants (real or high-quality artificial)</li>
            <li>Natural materials like wood</li>
            <li>Views of nature if possible</li>
            <li>Nature sounds or images</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Creating Context Cues
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Your brain associates environments with activities. If you do
            everything in one space—studying, gaming, sleeping—your brain
            doesn't know what mode to be in. Try to dedicate specific spaces to
            specific activities.
          </p>
          <p className="text-zinc-300 leading-relaxed mb-6">
            If you have limited space, create context cues to signal "study
            mode" to your brain:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-300 mb-6">
            <li>A specific lamp you only turn on while studying</li>
            <li>A particular playlist you only listen to while working</li>
            <li>A "study mode" desktop background or browser theme</li>
            <li>Wearing specific clothes or glasses</li>
          </ul>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Over time, these cues become triggers that help you transition into
            focused study mode more quickly.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            Virtual Study Environments
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Sometimes the best study environment isn't physical at all. Virtual
            study rooms and coworking spaces provide social accountability and a
            sense of community that can boost focus— especially if your physical
            environment is full of distractions.
          </p>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Platforms like CompStudy offer virtual study rooms where you can
            study alongside others from around the world. The social presence of
            fellow students creates positive pressure to stay focused, even when
            you're physically alone.
          </p>

          <div className="bg-indigo-500/10 rounded-xl p-8 border border-indigo-500/20 text-center">
            <h3 className="text-xl font-bold text-white mb-3">
              Study in a Focused Environment
            </h3>
            <p className="text-zinc-400 mb-6">
              Join CompStudy's virtual study rooms and create the perfect study
              atmosphere, no matter where you are.
            </p>
            <Link
              href="/focus"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors"
            >
              Join a Study Room
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
              href="/blog/how-to-stay-focused-while-studying"
              className="p-4 rounded-xl bg-[#0a0a0a] border border-white/10 hover:border-white/20 transition-colors"
            >
              <h4 className="font-semibold text-white mb-1">
                How to Stay Focused While Studying
              </h4>
              <p className="text-sm text-zinc-500">10 min read</p>
            </Link>
            <Link
              href="/blog/study-breaks-why-they-matter"
              className="p-4 rounded-xl bg-[#0a0a0a] border border-white/10 hover:border-white/20 transition-colors"
            >
              <h4 className="font-semibold text-white mb-1">
                Why Study Breaks Are Essential
              </h4>
              <p className="text-sm text-zinc-500">7 min read</p>
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
