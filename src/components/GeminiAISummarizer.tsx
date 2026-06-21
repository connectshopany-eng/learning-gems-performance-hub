import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, Clipboard, Check, AlertCircle } from 'lucide-react';

interface GeminiAISummarizerProps {
  action: 'generate-monthly-report' | 'generate-employee-summary' | 'generate-project-summary' | 'predict-best-performer' | 'summarize-team-productivity';
  payload: any;
  buttonLabel?: string;
  className?: string;
}

// Simple line-by-line Markdown renderer to guarantee compatibility with React 19
// without introducing cascading node_module dependency conflicts.
const SimpleMarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Headers
        if (trimmed.startsWith('###')) {
          return (
            <h4 key={idx} className="text-base font-bold text-slate-800 dark:text-white font-display mt-4 pt-2 border-b border-slate-100 dark:border-slate-800 pb-1">
              {trimmed.replace(/^###\s*/, '')}
            </h4>
          );
        }
        if (trimmed.startsWith('####')) {
          return (
            <h5 key={idx} className="text-sm font-semibold text-[#16A34A] dark:text-emerald-400 font-display mt-3 uppercase tracking-wider">
              {trimmed.replace(/^####\s*/, '')}
            </h5>
          );
        }
        if (trimmed.startsWith('##')) {
          return (
            <h3 key={idx} className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display mt-6 pt-3 border-b border-slate-200 dark:border-slate-850 pb-1">
              {trimmed.replace(/^##\s*/, '')}
            </h3>
          );
        }
        if (trim(trimmed).startsWith('#')) {
          return (
            <h2 key={idx} className="text-xl font-bold text-slate-900 dark:text-white font-display mt-6">
              {trimmed.replace(/^#\s*/, '')}
            </h2>
          );
        }

        // Bullet points
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const content = trimmed.replace(/^[-*]\s*/, '');
          return (
            <div key={idx} className="flex gap-2 pl-2">
              <span className="text-[#16A34A] dark:text-emerald-400 font-bold">•</span>
              <span>{renderInlineStyles(content)}</span>
            </div>
          );
        }

        // Numbered list
        if (/^\d+\./.test(trimmed)) {
          const content = trimmed.replace(/^\d+\.\s*/, '');
          const number = trimmed.match(/^\d+/)![0];
          return (
            <div key={idx} className="flex gap-2 pl-2">
              <span className="text-[#16A34A] dark:text-emerald-400 font-bold font-mono">{number}.</span>
              <span>{renderInlineStyles(content)}</span>
            </div>
          );
        }

        // Empty line
        if (trimmed === '') {
          return <div key={idx} className="h-2" />;
        }

        // Standard Paragraph
        return <p key={idx}>{renderInlineStyles(trimmed)}</p>;
      })}
    </div>
  );
};

// Simple tokenizer to parse bold, backticks code & inline markers
function renderInlineStyles(text: string) {
  // Regex to split on double sterisks ** (bold) and backticks ` (code)
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/);
  
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-slate-50">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="bg-slate-100 dark:bg-slate-800 text-[#16A34A] dark:text-emerald-400 px-1.5 py-0.5 rounded text-xs font-mono font-medium">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function trim(text: string): string {
  return text.trim();
}

export const GeminiAISummarizer: React.FC<GeminiAISummarizerProps> = ({
  action,
  payload,
  buttonLabel = 'Analyze with Gemini AI',
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const triggerAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { contain: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });

      if (!response.ok) {
        throw new Error('API request failed due to bad server connection.');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.result);
      // Automatically log to logs
      console.log(`[GEMINI] Analysis completed for action: ${action}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`mt-2 ${className}`}>
      {!result && !loading && !error && (
        <button
          onClick={triggerAnalysis}
          type="button"
          id={`ai-btn-${action}`}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-[#DCFCE7] bg-[#F1FDF4] hover:bg-[#DCFCE7] text-[#16A34A] dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 dark:text-emerald-400 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer font-display"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#16A34A] dark:text-emerald-400 animate-pulse" />
          {buttonLabel}
        </button>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl">
          <Loader2 className="w-8 h-8 text-[#16A34A] dark:text-emerald-400 animate-spin mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 animate-pulse font-display">
            Gemini is mining the Performance Database...
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-510 mt-1">Calculating weights, quality metrics, and log counts</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl text-xs space-y-2">
          <div className="flex gap-2 items-center text-red-800 dark:text-red-400 font-bold">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>AI Summarization Error</span>
          </div>
          <p className="text-red-600 dark:text-red-300 leading-normal">{error}</p>
          <button
            onClick={triggerAnalysis}
            className="flex items-center gap-1 bg-white dark:bg-slate-800 text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-[10px] hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Retry Generation
          </button>
        </div>
      )}

      {result && (
        <div className="bg-emerald-50/30 dark:bg-emerald-950/10 border border-[#DCFCE7] dark:border-emerald-900/30 rounded-xl p-5 relative transition-all duration-300">
          {/* Header Action bar */}
          <div className="flex justify-between items-center pb-3 mb-4 border-b border-emerald-100 dark:border-emerald-900/30 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-400 font-display">
              <Sparkles className="w-4.5 h-4.5 text-[#16A34A] dark:text-emerald-400" /> Generated by Learning Gems Gemini Coach
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded transition cursor-pointer"
                title="Copy markdown to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={triggerAnalysis}
                className="p-1.5 hover:bg-emerald-101 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded transition cursor-pointer"
                title="Regenerate Report"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Analysis View */}
          <SimpleMarkdownRenderer text={result} />
        </div>
      )}
    </div>
  );
};
