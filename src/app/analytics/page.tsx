"use client";

import { useState, useEffect } from "react";
import { databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { Query } from "appwrite";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { Clock, TrendingUp, Calendar, Target } from "lucide-react";

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week"); // week, month, all

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, timeRange]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      let queries = [
        Query.equal("userId", user.$id),
        Query.orderDesc("startTime"),
        Query.limit(100), // Adjust limit as needed
      ];

      if (timeRange === "week") {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        queries.push(Query.greaterThan("startTime", date.toISOString()));
      } else if (timeRange === "month") {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        queries.push(Query.greaterThan("startTime", date.toISOString()));
      }

      const response = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.STUDY_SESSIONS,
        queries
      );
      setSessions(response.documents);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const processData = () => {
    // Total Study Time
    const totalSeconds = sessions.reduce(
      (acc, session) => acc + (session.duration || 0),
      0
    );
    const totalHours = (totalSeconds / 3600).toFixed(1);

    // Sessions by Day
    const sessionsByDay = sessions.reduce((acc: any, session) => {
      const date = new Date(session.startTime).toLocaleDateString();
      acc[date] = (acc[date] || 0) + (session.duration || 0) / 3600;
      return acc;
    }, {});

    const dailyData = Object.keys(sessionsByDay).map((date) => ({
      date,
      hours: parseFloat(sessionsByDay[date].toFixed(2)),
    }));

    // Sessions by Subject (if available) or Type
    const sessionsByType = sessions.reduce((acc: any, session) => {
      const type = session.subject || session.type || "Uncategorized";
      acc[type] = (acc[type] || 0) + (session.duration || 0);
      return acc;
    }, {});

    const typeData = Object.keys(sessionsByType).map((type) => ({
      name: type,
      value: sessionsByType[type],
    }));

    return { totalHours, dailyData, typeData };
  };

  const { totalHours, dailyData, typeData } = processData();

  if (loading) {
    return (
      <main className="relative pt-32 pb-20 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </main>
    );
  }

  const statCards = [
    {
      label: "Total Study Time",
      value: `${totalHours} hrs`,
      icon: Clock,
      color: "indigo",
    },
    {
      label: "Total Sessions",
      value: sessions.length.toString(),
      icon: Calendar,
      color: "emerald",
    },
    {
      label: "Avg. Session",
      value: `${
        sessions.length > 0
          ? (
              sessions.reduce((acc, s) => acc + (s.duration || 0), 0) /
              sessions.length /
              60
            ).toFixed(0)
          : 0
      } min`,
      icon: Target,
      color: "amber",
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string }> = {
    indigo: { bg: "bg-indigo-500/20", text: "text-indigo-400" },
    emerald: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
    amber: { bg: "bg-amber-500/20", text: "text-amber-400" },
  };

  return (
    <main className="relative pt-24 md:pt-28 pb-20 min-h-screen overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-2">
              Study <span className="text-indigo-400">Analytics</span>
            </h1>
            <p className="text-zinc-500 text-sm md:text-base">
              Track your study habits and optimize your learning.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {["week", "month", "all"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  timeRange === range
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-white/20"
                }`}
              >
                {range === "week"
                  ? "7 Days"
                  : range === "month"
                  ? "30 Days"
                  : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const colors = colorClasses[stat.color];
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl border border-white/10 bg-[#0a0a0a]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <span className="text-sm text-zinc-500">{stat.label}</span>
                </div>
                <p className="text-3xl font-medium text-white">{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Study Trends Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 md:p-8 rounded-2xl border border-white/10 bg-[#0a0a0a]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Study Trends</h3>
                <p className="text-xs text-zinc-500">Hours studied per day</p>
              </div>
            </div>
            <div className="h-[280px]">
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#27272a"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#52525b"
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={{ stroke: "#27272a" }}
                    />
                    <YAxis
                      stroke="#52525b"
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={{ stroke: "#27272a" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                      }}
                      itemStyle={{ color: "#fff" }}
                      labelStyle={{ color: "#a1a1aa" }}
                    />
                    <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                  No data for this period
                </div>
              )}
            </div>
          </motion.div>

          {/* Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 md:p-8 rounded-2xl border border-white/10 bg-[#0a0a0a]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Distribution</h3>
                <p className="text-xs text-zinc-500">Study time by subject</p>
              </div>
            </div>
            <div className="h-[280px]">
              {typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={90}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {typeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                  No data for this period
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Empty State */}
        {sessions.length === 0 && (
          <div className="text-center py-20 mt-8">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900/50 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              No study sessions yet
            </h3>
            <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">
              Start a study session to see your analytics and track your
              progress over time.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
