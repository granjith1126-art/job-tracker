import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, Clock, CheckCircle2, XCircle, AlertCircle, 
  ArrowRight, ArrowLeft, RefreshCw, Trophy, HelpCircle, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

export default function MockTests({ onActionRecorded }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Active test runner state
  const [activeTest, setActiveTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const data = await api.mockTests.list();
      setTests(data);
    } catch (err) {
      console.error('Failed to load mock tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  // Timer countdown hook
  useEffect(() => {
    let interval = null;
    if (activeTest && !testResult) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
        setTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTest, testResult]);

  const startTest = async (slug) => {
    try {
      const data = await api.mockTests.get(slug);
      setActiveTest(data);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setTimeRemaining(data.duration_minutes * 60);
      setTimeSpent(0);
      setTestResult(null);
    } catch (err) {
      console.error('Failed to start test:', err);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setUserAnswers((prev) => ({
      ...prev,
      [String(questionId)]: optionIndex
    }));
  };

  const handleAutoSubmit = async () => {
    if (!activeTest || submitting) return;
    await submitTest();
  };

  const submitTest = async () => {
    if (!activeTest) return;
    setSubmitting(true);
    try {
      const res = await api.mockTests.submit(activeTest.slug, userAnswers, timeSpent);
      setTestResult(res);
      if (onActionRecorded) onActionRecorded();
    } catch (err) {
      console.error('Failed to submit test:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Result Scorecard View
  if (testResult) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title="Assessment Results"
          subtitle={`Scorecard and detailed question analysis for ${testResult.test_title}.`}
        />

        {/* Score Summary Card */}
        <SectionCard className="p-6 text-center relative overflow-hidden">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Trophy className="w-8 h-8 text-indigo-400" />
            </div>

            <div>
              <h2 className="text-3xl font-black text-white">{testResult.score_percentage}%</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {testResult.correct_answers} of {testResult.total_questions} Questions Correct
              </p>
            </div>

            <div className="flex items-center gap-6 pt-3 text-xs border-t border-slate-800 w-full max-w-sm justify-center text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Time Taken</span>
                <span className="font-bold font-mono">{formatTime(testResult.time_spent_seconds)}</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Accuracy</span>
                <span className="font-bold text-emerald-400">{testResult.score_percentage}%</span>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={() => { setActiveTest(null); setTestResult(null); }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
              >
                Back to Assessments
              </button>
              <button
                onClick={() => startTest(activeTest.slug)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retake Test
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Question-by-Question Breakdown
          </h3>

          {testResult.detailed_review?.map((q, idx) => (
            <SectionCard key={idx} className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-slate-500 font-mono">Q{idx + 1}.</span> {q.question}
                </h4>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                  q.is_correct ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {q.is_correct ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {q.is_correct ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {q.options?.map((opt, oIdx) => {
                  const isChosen = q.chosen_index === oIdx;
                  const isCorrect = q.correct_index === oIdx;
                  let borderCls = 'border-slate-800 bg-slate-950/60 text-slate-400';

                  if (isCorrect) {
                    borderCls = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-semibold';
                  } else if (isChosen && !isCorrect) {
                    borderCls = 'border-rose-500/50 bg-rose-500/10 text-rose-300 font-semibold';
                  }

                  return (
                    <div key={oIdx} className={`p-3 rounded-lg border flex items-center gap-2 ${borderCls}`}>
                      <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800/80 text-xs text-slate-300 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">Explanation:</span>
                  <p className="text-slate-400 leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      </div>
    );
  }

  // 2. Active Test Runner View
  if (activeTest) {
    const questions = activeTest.questions || [];
    const currentQ = questions[currentQuestionIndex];
    const totalQ = questions.length;
    const answeredCount = Object.keys(userAnswers).length;

    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* Runner Header */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 shadow-lg">
          <div>
            <h2 className="text-sm font-bold text-white">{activeTest.title}</h2>
            <p className="text-[11px] text-slate-400">
              Question {currentQuestionIndex + 1} of {totalQ} • {answeredCount} Answered
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
              timeRemaining < 300 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse' : 'bg-slate-950 text-slate-200 border-slate-800'
            }`}>
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatTime(timeRemaining)}</span>
            </div>

            <button
              onClick={submitTest}
              disabled={submitting}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Finish & Submit'}
            </button>
          </div>
        </div>

        {/* Question Palette Indicator */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
          {questions.map((q, idx) => {
            const isAnswered = userAnswers[String(q.id)] !== undefined;
            const isCurrent = idx === currentQuestionIndex;

            return (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50'
                    : isAnswered
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        {currentQ && (
          <SectionCard className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                Question {currentQuestionIndex + 1}
              </span>
              <h3 className="text-base md:text-lg font-bold text-white leading-snug">
                {currentQ.question}
              </h3>
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              {currentQ.options?.map((opt, optIdx) => {
                const isSelected = userAnswers[String(currentQ.id)] === optIdx;

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQ.id, optIdx)}
                    className={`w-full text-left p-4 rounded-xl border text-xs md:text-sm font-medium transition-all flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/80 text-white shadow-md shadow-indigo-600/10 ring-1 ring-indigo-500/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isSelected ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-slate-700 text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>

              {currentQuestionIndex < totalQ - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(prev + 1, totalQ - 1))}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
                >
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={submitTest}
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30"
                >
                  Submit Test
                </button>
              )}
            </div>
          </SectionCard>
        )}
      </div>
    );
  }

  // 3. Main Mock Tests List
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-full">
      <PageHeader
        title="Technical Assessments & Mock Tests"
        subtitle="Benchmark your knowledge across DSA, Machine Learning, Python, and Cloud Engineering with timed tests."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <p className="text-xs text-slate-500 col-span-2 text-center py-12">Loading assessments...</p>
        ) : tests.map((t) => (
          <SectionCard key={t.id} className="p-6 flex flex-col justify-between hover:border-slate-700 transition-all group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {t.category}
                </span>
                <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t.duration_minutes} Mins</span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {t.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t.description}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                <span><strong>{t.questions?.length || 5}</strong> Multiple Choice Questions</span>
                <span>•</span>
                <span>Passing Score: <strong>70%</strong></span>
              </div>
            </div>

            <button
              onClick={() => startTest(t.slug)}
              className="mt-6 w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm group-hover:shadow-indigo-600/25"
            >
              <span>Start Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}

