import React from "react";
import ReactMarkdown from "react-markdown";

export default function MessageBubble({ role, text }) {
  const isUser = role === "user";

  return (
    <div
      className={`w-full flex mb-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`
          px-4 py-2 rounded-2xl shadow-sm text-sm max-w-[85%] leading-relaxed
          ${
            isUser
              ? "bg-blue-600 text-white rounded-br-none"
              : "bg-white text-slate-800 rounded-bl-none border border-slate-100"
          }
        `}
      >
        {/* Simple markdown rendering or just text */}
        <div className="prose prose-sm max-w-none dark:prose-invert">
            {text}
        </div>
      </div>
    </div>
  );
}
