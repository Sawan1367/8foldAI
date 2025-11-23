import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Briefcase,
} from "lucide-react";

export default function AccountPlanPanel({
  data,
  companies = [],
  currentIndex = 0,
  onNavigate,
  onSelectCompany,
}) {
  if (!data)
    return (
      <div className="card h-[calc(100vh-140px)] flex flex-col items-center justify-center text-slate-400 p-8 text-center border-dashed">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <Building2 className="text-slate-300" size={32} />
        </div>
        <h3 className="text-lg font-medium text-slate-600">No Company Data</h3>
        <p className="text-sm mt-2 max-w-xs">
          Company insights and account plans will appear here after you ask a
          question.
        </p>
      </div>
    );

  const partners = data.partners || [];
  const funding = data.funding_history || [];
  const revenueTrend = data.revenue_trend || [];
  const competitors = data.competitors || [];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="card h-[calc(100vh-140px)] overflow-y-auto border-slate-200/60 shadow-sm bg-slate-50/30">
      {/* ---------- NAVIGATION HEADER ---------- */}
      {companies.length > 1 && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">
                Company {currentIndex + 1} of {companies.length}
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                {data.name || "Unknown"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate("prev")}
                disabled={currentIndex === 0}
                className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={() => onNavigate("next")}
                disabled={currentIndex === companies.length - 1}
                className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Company Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {companies.map((company, idx) => (
              <button
                key={idx}
                onClick={() => onSelectCompany(idx)}
                className={`
                  whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition
                  ${
                    idx === currentIndex
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }
                `}
              >
                {company.name || `Company ${idx + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------- HEADER SECTION ---------- */}
      <div className="p-6 bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {data.name || "Company Name"}
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                {data.industry || "Industry N/A"}
              </span>
              <span>•</span>
              <span>{data.tagline || "No tagline available"}</span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase">
                Revenue
              </p>
              <p className="font-semibold text-slate-900">
                {data.revenue || "N/A"}
              </p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase">
                Employees
              </p>
              <p className="font-semibold text-slate-900">
                {data.employees || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* ---------- GTM / SALES STRATEGY ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <Target size={18} className="text-blue-500" />
              Go-To-Market Strategy
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {data.gtm_strategy || "No GTM strategy available."}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <Briefcase size={18} className="text-purple-500" />
              Sales Motion
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {data.sales_strategy || "Sales strategy details unavailable."}
            </p>
          </div>
        </div>

        {/* ---------- CHARTS ROW 1 ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FUNDING HISTORY */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">
              Funding History
            </h3>
            {funding.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funding}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      cursor={{ fill: "#f8fafc" }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                No funding data available
              </div>
            )}
          </div>

          {/* REVENUE TREND */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">
              Revenue Trend
            </h3>
            {revenueTrend.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                No revenue trend data available
              </div>
            )}
          </div>
        </div>

        {/* ---------- CHARTS ROW 2 ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PARTNER ECOSYSTEM */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">
              Partner Ecosystem
            </h3>
            {partners.length > 0 ? (
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={partners}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {partners.map((entry, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                No partner data available
              </div>
            )}
          </div>

          {/* COMPETITOR MATRIX */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide">
              Competitor Matrix
            </h3>
            <div className="relative w-full h-64 border border-slate-100 rounded-lg bg-slate-50/50">
              {/* Labels */}
              <div className="absolute top-2 right-2 text-[10px] font-medium text-slate-400">
                High Quality →
              </div>
              <div className="absolute bottom-2 left-2 text-[10px] font-medium text-slate-400">
                Low Presence
              </div>
              <div className="absolute top-2 left-2 text-[10px] font-medium text-slate-400">
                High Presence
              </div>

              {/* Grid Lines */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-slate-200"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-full w-px bg-slate-200"></div>
              </div>

              {/* Dots */}
              {competitors.map((c, idx) => (
                <div
                  key={idx}
                  className="absolute w-3 h-3 rounded-full border-2 border-white shadow-sm transform -translate-x-1/2 -translate-y-1/2 cursor-help group"
                  style={{
                    backgroundColor: COLORS[idx % COLORS.length],
                    left: `${c.x}%`,
                    bottom: `${c.y}%`,
                  }}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
                    {c.name}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {competitors.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-xs text-slate-600"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></span>
                  {c.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
