
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../../../types';
import { Save, ThumbsUp, ThumbsDown } from 'lucide-react';
import DataTable from './generative/DataTable';
import PlotlyChart from './generative/PlotlyChart';
import PitchDeck from './generative/PitchDeck';
import ImageResult from './generative/ImageResult';
import GroundingAccordion from './generative/GroundingAccordion';
import ModelCanvasCard from './generative/ModelCanvasCard';
import StartupJourneyTool from './generative/StartupJourneyTool';
import CustomerCard from './generative/CustomerCard';
import FinancialSnapshotCard from './generative/FinancialSnapshotCard';
import SWOTAnalysisCard from './generative/SWOTAnalysisCard';
import OKRCard from './generative/OKRCard';
import MarketSizingCard from './generative/MarketSizingCard';
import LegalRiskAssessmentCard from './generative/LegalRiskAssessmentCard';
import ProcessFlowCard from './generative/ProcessFlowCard';
import ActionCard from './generative/ActionCard';
import ExecutionAudit from './generative/ExecutionAudit';
import ExpenseAnalysisCard from './generative/ExpenseAnalysisCard';
import CodeBlock from './generative/CodeBlock';
import ThinkingStep from './generative/ThinkingStep';
import { Table, BarChart3, Presentation, Image as ImageIcon, Layout, Cpu, ChevronDown, ChevronRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  onSave?: (content: string, type: 'doc' | 'image' | 'file', metadata?: any) => void;
  onSendMessage?: (text: string) => void;
  onNavigate?: (view: any) => void;
  projectId?: string | null;
  onFeedback?: (messageId: string, rating: number) => void;
}


const MessageList: React.FC<MessageListProps> = ({ messages, onSave, onSendMessage, onNavigate, projectId, onFeedback }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If a message is streaming, auto-scroll more aggressively
    const isAnyStreaming = messages.some(m => m.isStreaming);
    if (isAnyStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-4 sm:px-8 py-12 space-y-12 scrollbar-hide no-scrollbar"
    >
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-10 animate-fade-in-up">
          <div className="relative">
            <div className="w-20 h-20 bg-nobel-dark rounded-3xl rotate-12 flex items-center justify-center shadow-2xl">
              <span className="text-4xl text-nobel-gold">✦</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-nobel-gold rounded-full border-4 border-nobel-cream flex items-center justify-center shadow-lg">
              <span className="text-[12px] text-nobel-dark font-bold">N</span>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-serif text-nobel-dark tracking-tight">Real-time Venture Audit</h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
              Beyond conversation, your assistant performs a Continuous Audit—monitoring strategic drift, identifying logical gaps, and flagging deviations in real-time.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-2xl px-4">
            {[
              { label: 'Generate Market Table', icon: Table, prompt: "Can you generate a market research table for my industry?" },
              { label: 'Create Growth Chart', icon: BarChart3, prompt: "Create a 5-year growth forecast chart for a startup in my sector." },
              { label: 'Draft Pitch Deck', icon: Presentation, prompt: "Help me draft a 10-slide pitch deck for investors." },
              { label: 'What is your objective?', icon: Sparkles, prompt: "Help me define my primary objective for this quarter." },
              { label: 'Refine Model Canvas', icon: Layout, prompt: "Help me refine my Business Model Canvas sections." },
              { label: 'Business Strategy', icon: Cpu, prompt: "Give me a high-level strategic roadmap for the next 12 months." },
            ].map((tool, i) => (
              <button
                key={i}
                onClick={() => onSendMessage?.(tool.prompt)}
                className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-full hover:border-nobel-gold hover:text-nobel-gold hover:shadow-md transition-all duration-300 text-xs font-bold uppercase tracking-wider"
              >
                <tool.icon size={14} className="group-hover:scale-110 transition-transform" />
                {tool.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`max-w-3xl mx-auto flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}
        >
          <div className={`group relative max-w-[90%] sm:max-w-[85%] ${msg.role === 'user'
            ? 'bg-nobel-dark text-white rounded-[24px] rounded-tr-sm px-6 py-4 shadow-xl border border-white/5'
            : 'text-gray-800 py-2 w-full'
            }`}>
            {msg.role === 'assistant' && (msg.reasoning || msg.content.length === 0) && (
              <ThinkingStep
                reasoning={msg.reasoning || ""}
                isStreaming={msg.isStreaming || false}
                hasContent={msg.content.length > 0}
              />
            )}
            <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-nobel text-[15.5px] leading-relaxed'}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    return (
                      <CodeBlock className={className} inline={inline} onNavigate={onNavigate}>
                        {children}
                      </CodeBlock>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="my-8 overflow-hidden border border-nobel-gold/10 rounded-2xl bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">{children}</table>
                      </div>
                    );
                  },
                  thead({ children }) {
                    return <thead className="bg-nobel-dark text-white font-serif">{children}</thead>;
                  },
                  th({ children }) {
                    return <th className="px-5 py-4 text-[11px] uppercase tracking-[0.2em] font-bold border-b border-white/10">{children}</th>;
                  },
                  td({ children }) {
                    return <td className="px-5 py-4 text-sm text-gray-600 border-b border-gray-50">{children}</td>;
                  },
                  h1: ({ children }) => <h1 className="font-serif text-3xl font-bold mb-6 mt-8">{children}</h1>,
                  h2: ({ children }) => <h2 className="font-serif text-2xl font-bold mb-4 mt-6">{children}</h2>,
                  h3: ({ children }) => <h3 className="font-serif text-xl font-bold mb-3 mt-4">{children}</h3>,
                  p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                }}
              >
                {String(msg.content)}
              </ReactMarkdown>
            </div>

            {msg.role === 'assistant' && msg.isStreaming && (
              <div className="inline-block w-2 h-5 ml-1 bg-nobel-gold animate-pulse align-middle rounded-sm"></div>
            )}

            {msg.role === 'assistant' && !msg.isStreaming && msg.groundingSources && (
              <GroundingAccordion sources={msg.groundingSources} accuracyScore={msg.accuracyScore} />
            )}



            {/* Save Button for Assistant Messages */}
            {msg.role === 'assistant' && !msg.isStreaming && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-4">
                {onFeedback && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => onFeedback(msg.id, 5)} className="text-stone-300 hover:text-green-600 transition-colors" title="Helpful">
                      <ThumbsUp size={14} />
                    </button>
                    <button onClick={() => onFeedback(msg.id, 1)} className="text-stone-300 hover:text-red-500 transition-colors" title="Not Helpful">
                      <ThumbsDown size={14} />
                    </button>
                  </div>
                )}
                {onSave && (
                  <button
                    onClick={() => onSave(msg.content, 'doc')}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-stone-400 hover:text-nobel-gold transition-colors"
                  >
                    <Save size={14} /> Save to Docs
                  </button>
                )}
              </div>
            )}
          </div>

          {msg.toolResults?.map((result, idx) => (
            <div key={idx} className="w-full mt-6">
              {result.type === 'table' && <DataTable {...result.data} />}
              {result.type === 'chart' && <PlotlyChart {...result.data} />}
              {result.type === 'pitch_deck' && <PitchDeck {...result.data} />}
              {result.type === 'image' && <ImageResult {...result.data} onSave={onSave} />}
              {result.type === 'model_canvas' && <ModelCanvasCard {...result.data} projectId={projectId} onNavigate={onNavigate} />}
              {(result.type as any) === 'startup_journey' && <StartupJourneyTool {...result.data} projectId={projectId} />}
              {(result.type as any) === 'customer_cards' && <CustomerCard {...result.data} projectId={projectId} onSendMessage={onSendMessage} />}
              {(result.type as any) === 'financial_snapshot' && <FinancialSnapshotCard {...result.data} projectId={projectId} onSendMessage={onSendMessage} />}
              {(result.type as any) === 'swot_analysis' && <SWOTAnalysisCard {...result.data} projectId={projectId} onSendMessage={onSendMessage} />}
              {(result.type as any) === 'okr_card' && <OKRCard {...result.data} projectId={projectId} onSendMessage={onSendMessage} />}
              {(result.type as any) === 'market_sizing' && <MarketSizingCard {...result.data} projectId={projectId} onSendMessage={onSendMessage} />}
              {(result.type as any) === 'legal_risk' && <LegalRiskAssessmentCard {...result.data} projectId={projectId} onSendMessage={onSendMessage} />}
              {(result.type as any) === 'process_flow' && <ProcessFlowCard {...result.data} projectId={projectId} onSendMessage={onSendMessage} />}
              {(result.type as any) === 'action_card' && <ActionCard {...result.data} onNavigate={onNavigate} />}
              {(result.type as any) === 'execution_audit' && <ExecutionAudit {...result.data} />}
              {(result.type as any) === 'expense_analysis' && <ExpenseAnalysisCard {...result.data} />}

              {/* Default Fallback for Unrecognized Tools */}
              {!['table', 'chart', 'pitch_deck', 'image', 'model_canvas', 'startup_journey', 'customer_cards', 'financial_snapshot', 'swot_analysis', 'okr_card', 'market_sizing', 'legal_risk', 'process_flow', 'action_card', 'execution_audit', 'expense_analysis'].includes(result.type) && (
                <div className="p-6 bg-stone-50/50 rounded-2xl border border-stone-100 animate-fade-in">
                  <div className="flex items-center gap-2 mb-4 text-stone-400 font-bold text-[10px] uppercase tracking-wider">
                    <Sparkles size={14} className="text-nobel-gold" /> Tool Results: {result.type}
                  </div>
                  <div className="prose prose-sm prose-stone max-w-none">
                    {typeof result.data === 'string' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.data}</ReactMarkdown>
                    ) : (
                      <pre className="text-[11px] font-mono bg-white p-4 rounded-xl border border-stone-100 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      <div ref={bottomRef} className="h-8" />
    </div >
  );
};

export default MessageList;
