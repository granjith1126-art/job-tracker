import React, { useState, useEffect } from 'react';
import { 
  Code2, Play, Send, CheckCircle2, XCircle, Clock, Search, Filter, 
  ChevronRight, Terminal, RotateCcw, AlertTriangle, ArrowLeft, Check, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

export default function CodingPractice({ onActionRecorded }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [problemDetail, setProblemDetail] = useState(null);
  
  // Filters
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Code editor & execution state
  const [userCode, setUserCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState('testcases');

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const data = await api.coding.listProblems(difficultyFilter, categoryFilter, searchQuery);
      setProblems(data);
    } catch (err) {
      console.error('Failed to fetch coding problems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [difficultyFilter, categoryFilter, searchQuery]);

  const openProblem = async (slug) => {
    try {
      setEvaluating(false);
      setEvalResult(null);
      const data = await api.coding.getProblem(slug);
      setSelectedProblem(data);
      setProblemDetail(data);
      const starter = data.starter_code?.python || '# Write your solution here\n';
      setUserCode(starter);
    } catch (err) {
      console.error('Failed to fetch problem detail:', err);
    }
  };

  const handleRun = async () => {
    if (!selectedProblem) return;
    setEvaluating(true);
    setActiveConsoleTab('result');
    try {
      const res = await api.coding.runCode(selectedProblem.slug, userCode, selectedLanguage);
      setEvalResult(res);
    } catch (err) {
      console.error('Execution failed:', err);
      setEvalResult({ status: 'Runtime Error', results: [{ actual: 'Network or execution error' }] });
    } finally {
      setEvaluating(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProblem) return;
    setEvaluating(true);
    setActiveConsoleTab('result');
    try {
      const res = await api.coding.submitCode(selectedProblem.slug, userCode, selectedLanguage);
      setEvalResult(res);
      if (res.status === 'Accepted') {
        fetchProblems();
        if (onActionRecorded) onActionRecorded();
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setEvalResult({ status: 'Runtime Error', results: [{ actual: 'Submission failed' }] });
    } finally {
      setEvaluating(false);
    }
  };

  // If a problem is selected, render the full-featured split Code Workspace
  if (selectedProblem && problemDetail) {
    return (
      <div className="p-4 md:p-6 h-[calc(100vh-64px)] flex flex-col gap-4 max-w-full overflow-hidden">
        {/* Workspace Top Bar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedProblem(null); setProblemDetail(null); }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Problem List
            </button>
            <div className="h-4 w-px bg-slate-800" />
            <h2 className="text-sm font-bold text-white truncate">{problemDetail.title}</h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              problemDetail.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              problemDetail.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {problemDetail.difficulty}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="python">Python 3</option>
              <option value="javascript" disabled>JavaScript (Coming soon)</option>
              <option value="cpp" disabled>C++ (Coming soon)</option>
            </select>

            <button
              onClick={handleRun}
              disabled={evaluating}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              Run Code
            </button>

            <button
              onClick={handleSubmit}
              disabled={evaluating}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              Submit
            </button>
          </div>
        </div>

        {/* Split Workspace View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
          {/* Left Panel: Problem Statement & Examples */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-y-auto custom-scrollbar flex flex-col gap-5 text-slate-300">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {problemDetail.tags?.map((tag, idx) => (
                  <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {problemDetail.description}
              </p>
            </div>

            {/* Examples */}
            {problemDetail.examples?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Examples</h3>
                {problemDetail.examples.map((ex, idx) => (
                  <div key={idx} className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 space-y-1.5 text-xs font-mono">
                    <p className="text-slate-400"><strong className="text-slate-300">Input:</strong> {ex.input}</p>
                    <p className="text-emerald-400"><strong className="text-slate-300">Output:</strong> {ex.output}</p>
                    {ex.explanation && (
                      <p className="text-slate-500 font-sans text-[11px] pt-1 border-t border-slate-800/60">
                        <strong>Explanation:</strong> {ex.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Constraints */}
            {problemDetail.constraints?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Constraints</h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-400 font-mono">
                  {problemDetail.constraints.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Panel: Code Editor & Console Output */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* Editor Box */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
              <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>solution.py</span>
                </div>
                <button
                  onClick={() => setUserCode(problemDetail.starter_code?.python || '')}
                  className="hover:text-slate-200 transition-colors flex items-center gap-1 text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                spellCheck="false"
                className="flex-1 w-full bg-slate-950 text-slate-100 font-mono text-xs md:text-sm p-4 focus:outline-none resize-none leading-relaxed custom-scrollbar selection:bg-indigo-600/30"
                placeholder="# Write your Python code solution here..."
              />
            </div>

            {/* Console Output Drawer */}
            <div className="h-44 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shrink-0">
              <div className="bg-slate-950/80 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveConsoleTab('result')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      activeConsoleTab === 'result' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Terminal className="w-3 h-3" /> Execution Results
                  </button>
                </div>

                {evalResult && (
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className={
                      evalResult.status === 'Accepted' ? 'text-emerald-400 flex items-center gap-1' :
                      'text-rose-400 flex items-center gap-1'
                    }>
                      {evalResult.status === 'Accepted' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {evalResult.status}
                    </span>
                    {evalResult.runtime_ms > 0 && (
                      <span className="text-slate-500 text-[11px] font-mono">({evalResult.runtime_ms}ms)</span>
                    )}
                  </div>
                )}
              </div>

              {/* Console Body */}
              <div className="flex-1 p-3 overflow-y-auto custom-scrollbar font-mono text-xs">
                {evaluating ? (
                  <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                    <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Executing code in secure sandbox...</span>
                  </div>
                ) : evalResult ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-400 font-sans">
                      Test Cases Passed: <strong className={evalResult.test_cases_passed === evalResult.total_test_cases ? 'text-emerald-400' : 'text-amber-400'}>{evalResult.test_cases_passed} / {evalResult.total_test_cases}</strong>
                    </p>
                    {evalResult.results?.map((res, idx) => (
                      <div key={idx} className={`p-2 rounded border text-[11px] space-y-0.5 ${
                        res.status === 'Passed' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                      }`}>
                        <div className="flex justify-between font-bold">
                          <span>Case {res.test_case}: {res.status}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{res.runtime_ms}ms</span>
                        </div>
                        {res.expected && <p className="text-slate-400">Expected: <span className="text-slate-200">{res.expected}</span></p>}
                        {res.actual && <p className="text-slate-400">Output: <span className="text-slate-200">{res.actual}</span></p>}
                        {res.error && <p className="text-rose-400 whitespace-pre-wrap">{res.error}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-6">
                    Press "Run Code" to test against sample cases or "Submit" to evaluate all cases.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Problem Catalog View
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-full">
      <PageHeader
        title="LeetCode-Style Coding Practice"
        subtitle="Master real data structures, algorithms, and SQL problems with live sandbox execution."
      />

      {/* Filter Bar */}
      <SectionCard className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Difficulty Tabs */}
            {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  difficultyFilter === diff
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff}
              </button>
            ))}

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Topics</option>
              <option value="Arrays & Hashing">Arrays & Hashing</option>
              <option value="Two Pointers">Two Pointers</option>
              <option value="Stack">Stack</option>
              <option value="Sliding Window">Sliding Window</option>
              <option value="Binary Search">Binary Search</option>
              <option value="Dynamic Programming">Dynamic Programming</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems or tags..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </SectionCard>

      {/* Problem List Table */}
      <SectionCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-16">Status</th>
                <th className="py-3 px-4">Problem Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    Loading problem bank...
                  </td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    No matching coding problems found.
                  </td>
                </tr>
              ) : (
                problems.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => openProblem(p.slug)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      {p.status === 'Solved' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : p.status === 'Attempted' ? (
                        <Clock className="w-4 h-4 text-amber-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {p.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {p.category}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        p.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); openProblem(p.slug); }}
                        className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold transition-all"
                      >
                        Solve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

