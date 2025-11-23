import React, { useState } from "react";
import {
  X,
  Sparkles,
  Mic,
  MessageSquare,
  TrendingUp,
  HelpCircle,
} from "lucide-react";

export default function OnboardingFlow({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Sparkles,
      title: "Welcome to Company Research Assistant!",
      description:
        "I'm your AI-powered assistant for researching companies and creating account plans.",
      content: (
        <div className="space-y-3">
          <p className="text-slate-600">Here's what I can help you with:</p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Research companies</strong> - Get comprehensive insights
                on any company
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Generate account plans</strong> - Create detailed
                strategic plans
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Compare companies</strong> - Analyze multiple companies
                side-by-side
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Update information</strong> - Modify and refine your
                account plans
              </span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      icon: MessageSquare,
      title: "How to Interact",
      description: "You can communicate with me in multiple ways:",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💬 Text Chat</h4>
            <p className="text-sm text-blue-800">
              Type your questions or commands in the chat panel
            </p>
            <div className="mt-2 bg-white rounded px-3 py-2 text-sm text-slate-600 italic">
              "Research Google"
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">
              🎤 Voice Commands
            </h4>
            <p className="text-sm text-purple-800">
              Use the voice assistant button (bottom-right) for hands-free
              interaction
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: TrendingUp,
      title: "Example Queries",
      description: "Here are some things you can ask me:",
      content: (
        <div className="space-y-2">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-sm font-medium text-slate-700">
              "Research Microsoft"
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Get comprehensive company information
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-sm font-medium text-slate-700">
              "Update the revenue to $200B"
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Modify existing company data
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-sm font-medium text-slate-700">
              "Compare with Apple"
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Research and compare companies
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-sm font-medium text-slate-700">
              "Generate best plan"
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Analyze all companies and recommend the best opportunity
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: HelpCircle,
      title: "I Adapt to You!",
      description: "I'll adjust my responses based on your interaction style:",
      content: (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <div>
              <p className="font-medium text-slate-700">Need guidance?</p>
              <p className="text-sm text-slate-600">
                I'll ask clarifying questions and provide step-by-step help
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-sm">⚡</span>
            </div>
            <div>
              <p className="font-medium text-slate-700">Want quick results?</p>
              <p className="text-sm text-slate-600">
                I'll keep responses concise and action-focused
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 text-sm">💬</span>
            </div>
            <div>
              <p className="font-medium text-slate-700">Like to chat?</p>
              <p className="text-sm text-slate-600">
                I'll engage naturally while keeping you on track
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition"
            aria-label="Skip onboarding"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Icon size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
              <p className="text-blue-100 mt-1">
                {currentStepData.description}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 bg-slate-50">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "bg-blue-600 w-8"
                    : index < currentStep
                    ? "bg-blue-300"
                    : "bg-slate-300"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={onSkip}
              className="text-slate-600 hover:text-slate-800 font-medium transition"
            >
              Skip Tutorial
            </button>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition"
                >
                  Back
                </button>
              )}

              <button
                onClick={() => {
                  if (isLastStep) {
                    onComplete();
                  } else {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transition"
              >
                {isLastStep ? "Get Started!" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
