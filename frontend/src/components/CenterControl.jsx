import React, { useState } from "react";
import { Search } from "lucide-react";

export default function CenterControl({ onSend }) {
  const [value, setValue] = useState("");

  function submit(e) {
    e?.preventDefault();
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-100">
          <Search className="text-blue-500 w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Ask about a company
          </h2>
          <p className="text-slate-500 mt-2">
            Type a question or use the voice assistant (bottom-right) to speak.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="w-full relative flex gap-2">
        <div className="relative flex-1">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g., Research 'Acme Corp' — funding, GTM, partners"
            className="w-full border border-slate-200 rounded-xl pl-4 pr-4 py-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
        >
          Search
        </button>
      </form>

      <div className="flex gap-2 text-sm text-slate-400">
        <span className="font-medium text-slate-500">Try:</span>
        <button
          onClick={() => onSend("Research Acme Inc funding history")}
          className="hover:text-blue-600 transition-colors"
        >
          "Acme Inc funding"
        </button>
        <span>•</span>
        <button
          onClick={() => onSend("Acme competitors and GTM")}
          className="hover:text-blue-600 transition-colors"
        >
          "Competitors & GTM"
        </button>
      </div>
    </div>
  );
}
