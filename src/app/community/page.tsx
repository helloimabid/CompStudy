import { MessageSquare, Users, Heart } from "lucide-react";

export default function CommunityPage() {
  return (
    <main className="relative pt-32 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-6">
            Join the <span className="text-gradient">Community</span>
          </h1>
          <p className="text-zinc-500 max-w-2xl mx-auto">
            Connect with thousands of students who share your ambition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 rounded-xl bg-[#0a0a0a] border border-white/10 text-center">
            <div className="w-12 h-12 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
              <Users className="text-indigo-400" width={24} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">25k+</h3>
            <p className="text-zinc-500 text-sm">Active Students</p>
          </div>
          <div className="p-6 rounded-xl bg-[#0a0a0a] border border-white/10 text-center">
            <div className="w-12 h-12 mx-auto bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="text-purple-400" width={24} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">1.2M</h3>
            <p className="text-zinc-500 text-sm">Messages Sent</p>
          </div>
          <div className="p-6 rounded-xl bg-[#0a0a0a] border border-white/10 text-center">
            <div className="w-12 h-12 mx-auto bg-pink-500/10 rounded-full flex items-center justify-center mb-4">
              <Heart className="text-pink-400" width={24} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">500+</h3>
            <p className="text-zinc-500 text-sm">Study Groups</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl border border-white/10 bg-[#0a0a0a]">
            <h3 className="text-xl font-medium text-white mb-6">
              Recent Discussions
            </h3>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-zinc-200 font-medium text-sm mb-1">
                      Best techniques for deep work?
                    </h4>
                    <p className="text-zinc-500 text-xs line-clamp-2">
                      I've been struggling to maintain focus for more than 45
                      minutes. Does anyone have tips on how to extend this to 90
                      minute blocks?
                    </p>
                    <div className="flex gap-4 mt-2 text-[10px] text-zinc-600">
                      <span>Posted by User{i}</span>
                      <span>2h ago</span>
                      <span>12 replies</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-2xl border border-white/10 bg-[#0a0a0a]">
            <h3 className="text-xl font-medium text-white mb-6">
              Popular Study Groups
            </h3>
            <div className="space-y-4">
              {[
                {
                  name: "Medical School Prep",
                  members: 1240,
                  color: "bg-blue-500",
                },
                {
                  name: "Software Engineering",
                  members: 890,
                  color: "bg-green-500",
                },
                { name: "Law Students", members: 650, color: "bg-yellow-500" },
                {
                  name: "Creative Writing",
                  members: 320,
                  color: "bg-purple-500",
                },
              ].map((group, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${group.color}`}
                    ></div>
                    <span className="text-zinc-200 font-medium text-sm">
                      {group.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-zinc-500">
                      {group.members} members
                    </span>
                    <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors">
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
