import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Mic, MicOff, Send, PhoneOff, RotateCcw, Award, CheckCircle2, 
  AlertTriangle, BookOpen, TrendingUp, Sparkles, Volume2, VolumeX, 
  Clock, Play, ShieldAlert, Check, HelpCircle, ChevronRight, BarChart3,
  Calendar, Layers, ArrowRight, RefreshCw, MessageSquare, Radio, ShieldCheck, 
  Compass, Code2, Terminal, Cpu, CheckCircle, XCircle, FileCode, PlayCircle
} from 'lucide-react';
import { api } from '../services/api';
import AiraAvatar from '../components/AiraAvatar';

const TARGET_ROLES = [
  'Software Engineer',
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'Machine Learning Engineer',
  'AI Engineer',
  'DevOps Engineer',
  'Cloud Architect',
  'Other'
];

const INTERVIEW_TYPES = [
  'Technical',
  'Behavioral',
  'HR',
  'System Design',
  'Coding',
  'Mixed'
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const EXPERIENCE_LEVELS = ['Fresher', 'Junior', 'Mid-Level', 'Senior'];

export default function AiraMockInterview({ userProfile, onInterviewCompleted }) {
  // View Modes: 'setup', 'interview', 'report', 'history'
  const [viewMode, setViewMode] = useState('setup');
  
  // Setup Parameters
  const [targetRole, setTargetRole] = useState(userProfile?.target_role || 'Software Engineer');
  const [interviewType, setInterviewType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [experienceLevel, setExperienceLevel] = useState('Junior');
  const [isStarting, setIsStarting] = useState(false);

  // Interaction Mode: 'voice' (conversational hands-free) | 'text' (manual type & send)
  const [interactionMode, setInteractionMode] = useState('voice');
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  // Active Session State
  const [session, setSession] = useState(null);
  const [turns, setTurns] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [inputAnswer, setInputAnswer] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentTopic, setCurrentTopic] = useState('');

  // Active Coding Challenge in Interview
  const [activeCodingChallenge, setActiveCodingChallenge] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [codeRunResults, setCodeRunResults] = useState(null);
  const [codeTab, setCodeTab] = useState('editor'); // 'editor', 'console', 'testcases'

  // Aira Avatar State: 'idle' | 'listening' | 'thinking' | 'speaking' | 'success' | 'error'
  const [airaState, setAiraState] = useState('idle');
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);

  // Audio Playback and Recognition Refs
  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const isAiraSpeakingRef = useRef(false);
  const currentAudioRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const latestAnswerRef = useRef('');

  // Scroll & Timer Refs
  const chatScrollRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Final Reports & History
  const [finalReport, setFinalReport] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [latestFeedback, setLatestFeedback] = useState("Hi! I'm Aira, your AI Interview Coach. Ready to begin?");
  const [liveScores, setLiveScores] = useState({
    communication: 78,
    confidence: 75,
    knowledge: 80,
    clarity: 76
  });

  // Synchronize latestAnswerRef with input/live transcript
  useEffect(() => {
    latestAnswerRef.current = inputAnswer || liveTranscript;
  }, [inputAnswer, liveTranscript]);

  /**
   * Initialize Web Speech Recognition
   */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      recognizer.onstart = () => {
        isRecordingRef.current = true;
      };

      recognizer.onresult = (event) => {
        if (isAiraSpeakingRef.current) return;

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript + ' ';
          } else {
            interim += item[0].transcript;
          }
        }

        const combined = (final + interim).trim();
        if (combined) {
          setLiveTranscript(combined);
          setInputAnswer(combined);

          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // In Voice Mode: Auto-submit on 1.5s pause after speaking (only if not currently coding)
          if (interactionMode === 'voice' && !isSubmittingRef.current && !isAiraSpeakingRef.current && !activeCodingChallenge) {
            const wordCount = combined.split(/\s+/).length;
            if (wordCount >= 2) {
              silenceTimerRef.current = setTimeout(() => {
                triggerAutoSubmitAnswer(combined);
              }, 1500);
            }
          }
        }
      };

      recognizer.onerror = (err) => {
        if (err.error === 'not-allowed') {
          setMicPermissionDenied(true);
          setInteractionMode('text');
        }
        isRecordingRef.current = false;
      };

      recognizer.onend = () => {
        isRecordingRef.current = false;
        if (interactionMode === 'voice' && !isAiraSpeakingRef.current && !isSubmittingRef.current && airaState === 'listening') {
          try {
            recognizer.start();
            isRecordingRef.current = true;
          } catch (e) {}
        }
      };

      recognitionRef.current = recognizer;
    }
  }, [interactionMode, airaState, activeCodingChallenge]);

  // Duration Timer
  useEffect(() => {
    if (viewMode === 'interview' && session) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [viewMode, session]);

  // Auto-scroll chat transcript
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [turns, isSubmitting, liveTranscript, airaState]);

  const startListening = () => {
    if (isAiraSpeakingRef.current || isSubmittingRef.current) return;
    if (recognitionRef.current && !isRecordingRef.current) {
      try {
        setAiraState('listening');
        recognitionRef.current.start();
        isRecordingRef.current = true;
      } catch (err) {}
    } else {
      setAiraState('listening');
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current && isRecordingRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      isRecordingRef.current = false;
    }
  };

  /**
   * Sweet, Natural, High-Fidelity Female Robot TTS Playback
   */
  const playAiraSpeech = async (text) => {
    stopListening();
    isAiraSpeakingRef.current = true;
    setAiraState('speaking');

    if (isVoiceMuted) {
      isAiraSpeakingRef.current = false;
      if (interactionMode === 'voice') startListening();
      else setAiraState('listening');
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    window.speechSynthesis?.cancel();

    // 1. Try High-Quality Backend TTS first ('shimmer' voice)
    try {
      const audioUrl = await api.interview.getTTSAudio(text);
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        audio.onplay = () => {
          isAiraSpeakingRef.current = true;
          setAiraState('speaking');
        };

        audio.onended = () => {
          isAiraSpeakingRef.current = false;
          currentAudioRef.current = null;
          if (interactionMode === 'voice') startListening();
          else setAiraState('listening');
        };

        audio.onerror = () => {
          fallbackWebSpeech(text);
        };

        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('Backend TTS failed, using WebSpeech:', e);
    }

    // 2. WebSpeech fallback
    fallbackWebSpeech(text);
  };

  const fallbackWebSpeech = (text) => {
    if (!window.speechSynthesis) {
      isAiraSpeakingRef.current = false;
      setAiraState('listening');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.12; // Natural, cute, clear feminine robot tone

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        (v.name.includes('Samantha') || 
         v.name.includes('Zira') || 
         v.name.includes('Victoria') || 
         v.name.includes('Female') || 
         v.name.includes('Google UK English Female') || 
         v.name.includes('Google US English')) && v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en'));

      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onstart = () => {
        isAiraSpeakingRef.current = true;
        setAiraState('speaking');
      };

      utterance.onend = () => {
        isAiraSpeakingRef.current = false;
        if (interactionMode === 'voice') startListening();
        else setAiraState('listening');
      };

      utterance.onerror = () => {
        isAiraSpeakingRef.current = false;
        setAiraState('listening');
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      isAiraSpeakingRef.current = false;
      setAiraState('listening');
    }
  };

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermissionDenied(false);
      setInteractionMode('voice');
      return true;
    } catch (e) {
      console.warn('Microphone permission denied:', e);
      setMicPermissionDenied(true);
      setInteractionMode('text');
      return false;
    }
  };

  /**
   * Start New Adaptive Aira Interview Session
   */
  const handleStartInterview = async () => {
    setIsStarting(true);
    
    if (interactionMode === 'voice') {
      const granted = await requestMicPermission();
      if (!granted) {
        setIsStarting(false);
        return;
      }
    }

    try {
      const res = await api.interview.start({
        target_role: targetRole,
        interview_type: interviewType,
        difficulty: difficulty,
        experience_level: experienceLevel
      });

      setSession(res);
      setElapsedSeconds(0);
      setFinalReport(null);
      setInputAnswer('');
      setLiveTranscript('');
      setActiveCodingChallenge(null);
      setUserCode('');
      setCodeRunResults(null);
      setCurrentTopic(targetRole);
      isSubmittingRef.current = false;

      const initialTurn = res.turns?.[0] || {
        turn_index: 1,
        ai_question: `Hi ${userProfile?.name ? userProfile.name.split(' ')[0] : 'there'}! I'm Aira, your AI Interview Coach. Shall we begin?`
      };

      setTurns([initialTurn]);
      setCurrentTurn(initialTurn);
      setLatestFeedback(initialTurn.ai_question);
      setViewMode('interview');

      setTimeout(() => {
        playAiraSpeech(initialTurn.ai_question);
      }, 350);

    } catch (err) {
      console.error('Failed to start interview:', err);
      alert('Could not initialize interview session. Please verify your connection and try again.');
      setAiraState('idle');
    } finally {
      setIsStarting(false);
    }
  };

  const triggerAutoSubmitAnswer = async (spokenText) => {
    const answer = (spokenText || latestAnswerRef.current || inputAnswer).trim();
    if (!answer || isSubmittingRef.current || isAiraSpeakingRef.current || !session) return;
    executeTurnSubmission({ answer });
  };

  const handleManualSubmit = (e) => {
    if (e) e.preventDefault();
    const answer = (inputAnswer || liveTranscript).trim();
    if (!answer || isSubmittingRef.current) return;
    executeTurnSubmission({ answer });
  };

  /**
   * Run Candidate Code in Sandbox
   */
  const handleRunCode = async () => {
    if (!activeCodingChallenge || !userCode.trim()) return;
    setIsRunningCode(true);
    setCodeTab('console');
    try {
      const res = await api.interview.runCode(
        userCode,
        activeCodingChallenge.test_cases || [],
        codeLanguage,
        activeCodingChallenge.starter_function || ''
      );
      setCodeRunResults(res);
    } catch (err) {
      console.error('Code execution failed:', err);
      setCodeRunResults({ status: 'Runtime Error', results: [{ error: 'Execution failed or timed out' }] });
    } finally {
      setIsRunningCode(false);
    }
  };

  /**
   * Submit Code Solution to Aira for Line-by-Line Technical Review
   */
  const handleSubmitCodeSolution = async () => {
    if (!activeCodingChallenge || !userCode.trim() || isSubmittingRef.current) return;
    
    // First run test cases if not already run
    let testRes = codeRunResults;
    if (!testRes) {
      try {
        testRes = await api.interview.runCode(
          userCode,
          activeCodingChallenge.test_cases || [],
          codeLanguage,
          activeCodingChallenge.starter_function || ''
        );
        setCodeRunResults(testRes);
      } catch (e) {
        testRes = { status: 'Submitted' };
      }
    }

    const summaryText = `[Submitted ${codeLanguage} code for "${activeCodingChallenge.title}"]
Status: ${testRes?.status || 'Submitted'} (${testRes?.test_cases_passed || 0}/${testRes?.total_test_cases || 0} passed)`;
    
    executeTurnSubmission({
      answer: summaryText,
      code: userCode,
      language: codeLanguage,
      testResults: testRes
    });
  };

  /**
   * Execute Turn Submission with Dialogue & Optional Code
   */
  const executeTurnSubmission = async ({ answer, code = null, language = 'python', testResults = null }) => {
    if (isSubmittingRef.current || !session) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    stopListening();
    setAiraState('thinking');

    // Update dialogue transcript immediately
    const currentTurns = [...turns];
    if (currentTurns.length > 0) {
      currentTurns[currentTurns.length - 1].user_answer = answer;
      setTurns(currentTurns);
    }

    setInputAnswer('');
    setLiveTranscript('');

    try {
      const res = await api.interview.submitTurn(session.id, {
        user_answer: answer,
        code: code,
        language: language,
        test_results: testResults,
        duration_seconds: elapsedSeconds
      });

      const interviewerText = res.interviewer_response || res.feedback || '';
      if (interviewerText) {
        setLatestFeedback(interviewerText);
      }
      if (res.topic) {
        setCurrentTopic(res.topic);
      }

      if (res.scores) {
        setLiveScores({
          communication: res.scores.communication || 75,
          confidence: Math.min((res.scores.clarity || 70) + 5, 95),
          knowledge: res.scores.technical || 78,
          clarity: res.scores.clarity || 74
        });
      }

      // Check if Aira introduced a new coding challenge
      if (res.is_coding_challenge && res.coding_challenge) {
        setActiveCodingChallenge(res.coding_challenge);
        setUserCode(res.coding_challenge.starter_code || '# Write your solution here\n');
        setCodeLanguage(res.coding_challenge.language || 'python');
        setCodeRunResults(null);
        setCodeTab('editor');
      } else if (code) {
        // Candidate submitted code and Aira is moving on to follow-up
        setActiveCodingChallenge(null);
      }

      if (res.is_finished || !res.next_turn) {
        await handleFinishInterview();
      } else {
        const nextT = res.next_turn;
        setTurns(prev => [...prev, nextT]);
        setCurrentTurn(nextT);

        // Aira speaks response + next drill-down question naturally
        await playAiraSpeech(nextT.ai_question);
      }
    } catch (err) {
      console.error('Turn submission failed:', err);
      setAiraState('error');
      setTimeout(() => {
        if (interactionMode === 'voice') startListening();
        else setAiraState('listening');
      }, 1500);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  /**
   * Finish & Generate Comprehensive Evidence-Based Final Evaluation Report
   */
  const handleFinishInterview = async () => {
    if (!session) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    stopListening();
    setAiraState('thinking');
    if (currentAudioRef.current) currentAudioRef.current.pause();
    window.speechSynthesis?.cancel();

    try {
      const report = await api.interview.finish(session.id, {
        duration_seconds: elapsedSeconds
      });
      setFinalReport(report);
      setAiraState('success');
      setViewMode('report');
      if (onInterviewCompleted) onInterviewCompleted(report);
    } catch (err) {
      console.error('Failed to finalize interview report:', err);
      setAiraState('idle');
      setViewMode('report');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleOpenHistory = async () => {
    setLoadingHistory(true);
    setViewMode('history');
    try {
      const data = await api.interview.getHistory();
      setHistoryData(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full min-h-screen bg-[#070A12] text-slate-100 flex flex-col select-none overflow-x-hidden font-sans">
      {/* Top Bar Header */}
      <header className="h-16 px-6 sm:px-8 border-b border-[#1A2234] bg-[#0B0F1D]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40 shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">AI Mock Interview</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                {interactionMode === 'voice' ? 'Conversational Voice' : 'Text Mode'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">Real-Time Technical & Coding Interviewer Powered by Gemini + OpenAI</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenHistory}
            className="h-9 px-3.5 rounded-xl bg-[#141C2E] hover:bg-[#1C263E] text-slate-300 hover:text-white border border-[#222E48] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Interview History</span>
          </button>

          {viewMode === 'interview' && (
            <button
              onClick={handleFinishInterview}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 flex items-center gap-1.5 transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Interview</span>
            </button>
          )}

          {viewMode !== 'setup' && viewMode !== 'interview' && (
            <button
              onClick={() => {
                setAiraState('idle');
                setViewMode('setup');
              }}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Interview</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full">

        {/* 1. SETUP VIEW */}
        {viewMode === 'setup' && (
          <div className="max-w-3xl mx-auto w-full my-auto py-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#12192C] to-[#0D1220] border border-[#202B45] shadow-2xl relative overflow-hidden text-center space-y-5">
              <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Aira Avatar in Setup */}
              <div className="py-2">
                <AiraAvatar 
                  state="idle" 
                  size="md" 
                  isMuted={isVoiceMuted}
                  onToggleMute={() => setIsVoiceMuted(!isVoiceMuted)}
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Meet Aira — Your AI Technical Interviewer</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                  Conversational technical mock interview with live coding challenges, code execution, complexity analysis, and real-time guidance.
                </p>
              </div>

              {/* Interaction Mode Selection */}
              <div className="flex items-center justify-center gap-3 p-1.5 bg-[#162035] rounded-2xl border border-[#253352] max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setInteractionMode('voice');
                    setMicPermissionDenied(false);
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    interactionMode === 'voice'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-900/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>Voice (Hands-Free)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInteractionMode('text')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    interactionMode === 'text'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Text Mode</span>
                </button>
              </div>

              {micPermissionDenied && interactionMode === 'voice' && (
                <div className="p-3 bg-amber-950/40 border border-amber-600/40 rounded-2xl text-xs text-amber-200 flex items-center justify-between gap-3 max-w-md mx-auto">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Microphone permission required for voice interaction.</span>
                  </div>
                  <button
                    onClick={requestMicPermission}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-[11px] rounded-lg shrink-0 cursor-pointer"
                  >
                    Allow Mic
                  </button>
                </div>
              )}

              {/* Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Target Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#162035] border border-[#243354] text-xs font-semibold text-white focus:outline-none focus:border-pink-500 cursor-pointer"
                  >
                    {TARGET_ROLES.map(role => (
                      <option key={role} value={role} className="bg-[#12192C] text-white">{role}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Interview Type</label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#162035] border border-[#243354] text-xs font-semibold text-white focus:outline-none focus:border-pink-500 cursor-pointer"
                  >
                    {INTERVIEW_TYPES.map(type => (
                      <option key={type} value={type} className="bg-[#12192C] text-white">{type} Interview</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Difficulty</label>
                  <div className="grid grid-cols-3 gap-2">
                    {DIFFICULTIES.map(diff => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`h-11 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          difficulty === diff
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-900/40 border border-pink-400/40'
                            : 'bg-[#162035] text-slate-400 hover:text-white border border-[#243354]'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Candidate Experience</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {EXPERIENCE_LEVELS.map(exp => (
                      <button
                        key={exp}
                        type="button"
                        onClick={() => setExperienceLevel(exp)}
                        className={`h-11 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          experienceLevel === exp
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-400/40'
                            : 'bg-[#162035] text-slate-400 hover:text-white border border-[#243354]'
                        }`}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start CTA */}
              <div className="pt-4">
                <button
                  type="button"
                  disabled={isStarting}
                  onClick={handleStartInterview}
                  className="w-full sm:w-80 h-12 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-900/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center gap-2 mx-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isStarting ? 'Connecting to Aira...' : 'START INTERVIEW'}</span>
                </button>
                <p className="text-[11px] text-slate-500 mt-2 font-normal">
                  {interactionMode === 'voice' 
                    ? 'Hands-free voice active: Speak naturally when Aira finishes speaking.'
                    : 'Text mode: Type answers or code whenever ready.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. ACTIVE CONVERSATIONAL + CODING INTERVIEW ROOM */}
        {viewMode === 'interview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
            
            {/* Left Column: Interactive Animated Aira Stage */}
            <div className={`flex flex-col gap-4 min-h-0 ${activeCodingChallenge ? 'lg:col-span-5' : 'lg:col-span-6'}`}>
              
              <div className="relative flex-1 min-h-[340px] sm:min-h-[400px] rounded-3xl bg-[#0B0F1D] border border-[#1E2942] shadow-2xl overflow-hidden flex flex-col justify-between p-5">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-transparent to-black/80 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Top Control Bar on Stage */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-emerald-500/30 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-emerald-300">
                      {airaState === 'speaking' ? '🔊 Aira is Speaking...' : airaState === 'listening' ? '🟢 Aira is Listening...' : airaState === 'thinking' ? '🧠 Aira is Thinking...' : 'Live with Aira'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsVoiceMuted(!isVoiceMuted)}
                      className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center transition-colors cursor-pointer"
                      title={isVoiceMuted ? 'Unmute Aira voice' : 'Mute Aira voice'}
                    >
                      {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
                    </button>
                  </div>
                </div>

                {/* Center Stage: Interactive Animated Aira Robot Avatar */}
                <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2">
                  <AiraAvatar 
                    state={airaState} 
                    size={activeCodingChallenge ? "md" : "hero"} 
                    isMuted={isVoiceMuted}
                    onToggleMute={() => setIsVoiceMuted(!isVoiceMuted)}
                  />
                </div>

                {/* Aira Subtitle Box */}
                <div className="relative z-10 bg-black/70 border border-slate-800/90 rounded-2xl p-3.5 backdrop-blur-md text-center max-w-xl mx-auto w-full">
                  <p className="text-xs sm:text-sm font-semibold text-pink-200 leading-snug">
                    "{latestFeedback || currentTurn?.ai_question || "I'm Aira, your AI Interview Coach."}"
                  </p>
                </div>

                {/* Stage Bottom Action Indicators */}
                <div className="relative z-10 flex items-center justify-center gap-3 pt-2">
                  {interactionMode === 'voice' ? (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#141C2E] border border-[#232F4C] text-xs font-semibold text-slate-300">
                      {airaState === 'speaking' ? (
                        <>
                          <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                          <span>Listening paused while Aira speaks</span>
                        </>
                      ) : airaState === 'listening' ? (
                        <>
                          <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span className="text-emerald-300">Microphone Active</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setInteractionMode('voice')}
                      className="h-9 px-3.5 rounded-2xl bg-[#141C2E] hover:bg-[#1E2944] border border-[#2A3B60] text-slate-300 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5 text-pink-400" />
                      <span>Switch to Voice</span>
                    </button>
                  )}

                  <button
                    onClick={handleFinishInterview}
                    disabled={isSubmitting}
                    className="h-9 px-4 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
                    <span>End Interview</span>
                  </button>
                </div>
              </div>

              {/* Progress & Live Scores Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#0D1220] border border-[#1C263D] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conversation Turns</span>
                    <p className="text-lg font-black text-white mt-0.5">
                      {turns.length} <span className="text-xs font-semibold text-pink-400">• {currentTopic || targetRole}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                    <p className="text-sm font-bold text-purple-400 font-mono mt-0.5">{formatTime(elapsedSeconds)}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0D1220] border border-[#1C263D] flex items-center justify-around">
                  <div className="text-center">
                    <span className="text-xs font-black text-pink-400">{liveScores.communication}%</span>
                    <span className="text-[9px] font-bold text-slate-400 block">Communication</span>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-800" />
                  <div className="text-center">
                    <span className="text-xs font-black text-purple-400">{liveScores.confidence}%</span>
                    <span className="text-[9px] font-bold text-slate-400 block">Confidence</span>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-800" />
                  <div className="text-center">
                    <span className="text-xs font-black text-indigo-400">{liveScores.knowledge}%</span>
                    <span className="text-[9px] font-bold text-slate-400 block">Technical</span>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-800" />
                  <div className="text-center">
                    <span className="text-xs font-black text-cyan-400">{liveScores.clarity}%</span>
                    <span className="text-[9px] font-bold text-slate-400 block">Clarity</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Interactive Coding Workspace OR Conversation Dialogue */}
            <div className={`flex flex-col gap-4 min-h-0 ${activeCodingChallenge ? 'lg:col-span-7' : 'lg:col-span-6'}`}>
              
              {/* If Active Coding Challenge is present: Show Split Code Workspace */}
              {activeCodingChallenge ? (
                <div className="flex-1 min-h-[460px] flex flex-col rounded-3xl bg-[#0D1220] border border-pink-500/30 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* Coding Header */}
                  <div className="px-5 py-3 bg-[#13192C] border-b border-[#212C46] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-pink-400" />
                      <span className="text-xs font-bold text-white">Live Coding Challenge: {activeCodingChallenge.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/30 uppercase">
                        {codeLanguage}
                      </span>
                    </div>
                  </div>

                  {/* Problem Description Bar */}
                  <div className="p-4 bg-[#090D18] border-b border-[#1A2338] text-xs text-slate-300 space-y-1">
                    <p className="font-medium">{activeCodingChallenge.description}</p>
                  </div>

                  {/* Editor Tab Navigation */}
                  <div className="flex items-center justify-between px-4 py-1.5 bg-[#0F1524] border-b border-[#1C263D] text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCodeTab('editor')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          codeTab === 'editor' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Code Editor
                      </button>
                      <button
                        onClick={() => setCodeTab('console')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          codeTab === 'console' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Console & Results
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRunCode}
                        disabled={isRunningCode}
                        className="h-8 px-3.5 rounded-xl bg-[#1A253D] hover:bg-[#243354] border border-[#2D3F66] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                        <span>{isRunningCode ? 'Running...' : 'Run Code'}</span>
                      </button>
                      <button
                        onClick={handleSubmitCodeSolution}
                        disabled={isSubmitting}
                        className="h-8 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-pink-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isSubmitting ? 'Evaluating...' : 'Submit Solution'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Editor or Console View */}
                  {codeTab === 'editor' ? (
                    <div className="flex-1 flex flex-col p-3 bg-[#060912] font-mono text-xs overflow-hidden">
                      <textarea
                        value={userCode}
                        onChange={(e) => setUserCode(e.target.value)}
                        placeholder="# Write your solution here..."
                        spellCheck="false"
                        className="w-full flex-1 p-3 bg-transparent text-pink-100 placeholder-slate-600 focus:outline-none resize-none leading-relaxed font-mono custom-scrollbar"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 p-4 bg-[#060912] overflow-y-auto space-y-3 font-mono text-xs custom-scrollbar">
                      {isRunningCode ? (
                        <div className="flex items-center gap-2 text-slate-400 py-8 justify-center">
                          <RefreshCw className="w-4 h-4 animate-spin text-pink-400" />
                          <span>Executing code in secure sandbox...</span>
                        </div>
                      ) : codeRunResults ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-[#10172A] border border-[#1E2942]">
                            <div className="flex items-center gap-2">
                              {codeRunResults.status === 'Passed' || codeRunResults.status === 'Accepted' ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-400" />
                              )}
                              <span className="font-bold text-white">Status: {codeRunResults.status}</span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {codeRunResults.test_cases_passed} / {codeRunResults.total_test_cases} test cases passed
                            </span>
                          </div>

                          {codeRunResults.results?.map((res, i) => (
                            <div key={i} className="p-3 rounded-xl bg-[#0B0F1D] border border-[#1A2234] space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-300">Test Case #{res.test_case}</span>
                                <span className={res.status === 'Passed' ? 'text-emerald-400' : 'text-rose-400'}>{res.status}</span>
                              </div>
                              {res.input !== undefined && (
                                <div className="text-[11px] text-slate-400">Input: <span className="text-slate-200">{JSON.stringify(res.input)}</span></div>
                              )}
                              {res.expected !== undefined && (
                                <div className="text-[11px] text-slate-400">Expected: <span className="text-slate-200">{JSON.stringify(res.expected)}</span></div>
                              )}
                              {res.actual !== undefined && (
                                <div className="text-[11px] text-slate-400">Output: <span className="text-slate-200">{JSON.stringify(res.actual)}</span></div>
                              )}
                              {res.error && (
                                <div className="text-[11px] text-rose-400 bg-rose-950/30 p-2 rounded-lg mt-1">{res.error}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-slate-500">
                          Click <strong>Run Code</strong> to execute your solution against test cases.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="px-4 py-2 bg-[#0C111E] border-t border-[#1C263D] flex items-center justify-between text-[11px] text-slate-400">
                    <span>Aira will inspect your code complexity and logic upon submission.</span>
                    <button
                      onClick={() => setActiveCodingChallenge(null)}
                      className="text-pink-400 hover:underline cursor-pointer"
                    >
                      Back to Dialogue
                    </button>
                  </div>
                </div>
              ) : (
                /* Dialogue Conversation List */
                <div className="flex-1 min-h-[420px] flex flex-col rounded-3xl bg-[#0D1220] border border-[#1C263D] overflow-hidden shadow-2xl">
                  
                  {/* Chat Header */}
                  <div className="px-5 py-3.5 bg-[#12192B] border-b border-[#1C263D] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-pink-400" />
                      <span className="text-xs font-bold text-white">Live Conversation</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {session?.target_role} ({session?.difficulty})
                    </span>
                  </div>

                  {/* Dialogue Scroll List */}
                  <div 
                    ref={chatScrollRef}
                    className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar"
                  >
                    {turns.map((turn, idx) => (
                      <div key={idx} className="space-y-3">
                        {/* Aira Question Bubble */}
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-pink-600/30 border border-pink-500/40 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-4 h-4 text-pink-300" />
                          </div>
                          <div className="flex-1 bg-[#151D30] border border-[#232F4C] rounded-2xl rounded-tl-none p-3.5 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-pink-300">Aira</span>
                              <button
                                onClick={() => playAiraSpeech(turn.ai_question)}
                                className="text-slate-400 hover:text-pink-300 transition-colors cursor-pointer"
                                title="Replay speech"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{turn.ai_question}</p>
                          </div>
                        </div>

                        {/* Candidate Answer Bubble */}
                        {turn.user_answer && (
                          <div className="flex items-start gap-3 justify-end">
                            <div className="flex-1 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-700/40 rounded-2xl rounded-tr-none p-3.5 shadow-sm text-right">
                              <div className="flex items-center justify-end mb-1">
                                <span className="text-[11px] font-bold text-purple-300">You</span>
                              </div>
                              <p className="text-xs text-slate-100 text-left leading-relaxed whitespace-pre-wrap">{turn.user_answer}</p>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold text-indigo-300 uppercase">
                              {userProfile?.name?.charAt(0) || 'U'}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Real-time speech transcription display */}
                    {interactionMode === 'voice' && airaState === 'listening' && liveTranscript && (
                      <div className="flex items-start gap-3 justify-end animate-pulse">
                        <div className="flex-1 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3 text-left">
                          <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">Listening to your voice...</span>
                          <p className="text-xs text-emerald-200 italic leading-relaxed">"{liveTranscript}"</p>
                        </div>
                      </div>
                    )}

                    {isSubmitting && (
                      <div className="flex items-center gap-2 p-3.5 bg-purple-950/30 border border-purple-800/40 rounded-2xl text-xs text-purple-300 animate-pulse">
                        <RefreshCw className="w-4 h-4 animate-spin text-pink-400 shrink-0" />
                        <span>Aira is understanding your answer & formulating response...</span>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  {interactionMode === 'text' ? (
                    <form onSubmit={handleManualSubmit} className="p-4 bg-[#12192B] border-t border-[#1C263D] space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                        <span>Type your answer:</span>
                        <button
                          type="button"
                          onClick={() => setInteractionMode('voice')}
                          className="text-pink-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Mic className="w-3 h-3" />
                          <span>Switch to Voice</span>
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={inputAnswer}
                        onChange={(e) => setInputAnswer(e.target.value)}
                        placeholder="Type your response here..."
                        disabled={isSubmitting}
                        className="w-full p-3 rounded-xl bg-[#090D18] border border-[#232F4C] focus:border-pink-500 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors resize-none"
                      />

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="text-[10px] text-slate-500">
                          Type 'end interview' or click End Interview anytime.
                        </span>

                        <button
                          type="submit"
                          disabled={!inputAnswer.trim() || isSubmitting}
                          className="h-10 px-5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-pink-900/30 flex items-center gap-2 transition-all cursor-pointer shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmitting ? 'Analyzing...' : 'SEND ANSWER'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 bg-[#12192B] border-t border-[#1C263D] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        {airaState === 'listening' ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                            <span className="font-bold text-emerald-300">Aira is listening. Speak naturally...</span>
                          </>
                        ) : airaState === 'speaking' ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse" />
                            <span className="font-bold text-pink-300">Aira is speaking...</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                            <span className="font-bold text-purple-300">Understanding your response...</span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setInteractionMode('text')}
                        className="px-3 py-1.5 rounded-xl bg-[#182238] hover:bg-[#202C48] border border-[#27375A] text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Text Mode</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Conversational & Coding Tips */}
              <div className="p-4 rounded-2xl bg-[#0D1220] border border-[#1C263D] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Adaptive Technical Interview Tips</span>
                  </div>
                  <span className="text-[10px] font-semibold text-pink-400">Live Code Execution Ready</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="p-2 rounded-xl bg-[#141C2E] border border-[#202C46]">
                    ✓ State time & space complexities explicitly
                  </div>
                  <div className="p-2 rounded-xl bg-[#141C2E] border border-[#202C46]">
                    ✓ Aira inspects your code line-by-line
                  </div>
                  <div className="p-2 rounded-xl bg-[#141C2E] border border-[#202C46]">
                    ✓ Say "I don't know" to get hints
                  </div>
                  <div className="p-2 rounded-xl bg-[#141C2E] border border-[#202C46]">
                    ✓ Click End Interview whenever finished
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 3. FINAL EVIDENCE-BASED ASSESSMENT REPORT VIEW */}
        {viewMode === 'report' && finalReport && (
          <div className="max-w-4xl mx-auto w-full py-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#171A30] via-[#1F1938] to-[#141C2E] border border-[#2D3356] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <span className="px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-bold">
                  Evidence-Based Performance Report
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
                  {finalReport.target_role || targetRole} Technical Evaluation
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Difficulty: <strong>{finalReport.difficulty || difficulty}</strong> • Type: <strong>{finalReport.interview_type || interviewType}</strong> • Duration: <strong>{formatTime(finalReport.duration_seconds || elapsedSeconds || 300)}</strong>
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-black/40 border border-pink-500/30 shrink-0">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400">
                  {Math.round(finalReport.overall_score || 78)}%
                </span>
                <span className="text-xs font-bold text-slate-400 mt-0.5">Overall Readiness</span>
              </div>
            </div>

            {/* Score Dimensions with Evidence ("Why this score was given") */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-5 rounded-3xl bg-[#0D1220] border border-[#1C263D] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Technical Depth</span>
                  <span className="text-lg font-black text-pink-400">{Math.round(finalReport.technical_score || 80)}%</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#141C2E] p-3 rounded-2xl border border-[#202C46]">
                  <strong className="text-pink-300 block mb-1">Evidence Breakdown:</strong>
                  {finalReport.why_technical || "Demonstrated solid technical understanding of core frameworks and data structures."}
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-[#0D1220] border border-[#1C263D] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Communication & Structure</span>
                  <span className="text-lg font-black text-purple-400">{Math.round(finalReport.communication_score || 78)}%</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#141C2E] p-3 rounded-2xl border border-[#202C46]">
                  <strong className="text-purple-300 block mb-1">Evidence Breakdown:</strong>
                  {finalReport.why_communication || "Communicated directly and engaged constructively with follow-up questions."}
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-[#0D1220] border border-[#1C263D] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Problem Solving & Adaptability</span>
                  <span className="text-lg font-black text-indigo-400">{Math.round(finalReport.problem_solving_score || 75)}%</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#141C2E] p-3 rounded-2xl border border-[#202C46]">
                  <strong className="text-indigo-300 block mb-1">Evidence Breakdown:</strong>
                  {finalReport.why_problem_solving || "Approached technical trade-offs methodically and adapted to guidance."}
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-[#0D1220] border border-[#1C263D] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Coding & Implementation</span>
                  <span className="text-lg font-black text-emerald-400">{Math.round(finalReport.coding_score || 80)}%</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#141C2E] p-3 rounded-2xl border border-[#202C46]">
                  <strong className="text-emerald-300 block mb-1">Evidence Breakdown:</strong>
                  {finalReport.coding_evidence || "Completed coding challenges with verified test cases and complexity analysis."}
                </p>
              </div>

            </div>

            {/* Coverage: Assessed Topics vs Unassessed Topics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-6 rounded-3xl bg-[#0D1220] border border-[#1C263D] space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white">Topics Assessed in Interview</h3>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(finalReport.assessed_topics || [
                    "FastAPI Architecture",
                    "JWT Authentication",
                    "PostgreSQL Indexing",
                    "Algorithmic Complexity"
                  ]).map((t, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Check className="w-3 h-3" />
                      <span>{t}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#0D1220] border border-[#1C263D] space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white">Topics Not Sufficiently Assessed</h3>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(finalReport.unassessed_topics || [
                    "Distributed System Scaling",
                    "Database Sharding & Replication",
                    "Kubernetes & CI/CD"
                  ]).map((t, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-xl bg-amber-950/40 border border-amber-600/40 text-xs font-semibold text-amber-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Strengths & Improvement Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-[#0D1220] border border-[#1C263D] space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white">Key Strengths Demonstrated</h3>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(finalReport.strengths || [
                    "Solid understanding of backend APIs and authentication flows",
                    "Clear practical code implementation and complexity analysis"
                  ]).map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-3xl bg-[#0D1220] border border-[#1C263D] space-y-3">
                <div className="flex items-center gap-2 text-pink-400">
                  <Sparkles className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-white">Aira's Recommended Next Focus</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#162035] p-3.5 rounded-2xl border border-[#233152]">
                  {finalReport.recommended_next_step || "Practice high-scale system design and database indexing in your next mock interview session."}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleOpenHistory}
                className="h-11 px-5 rounded-xl bg-[#151D30] hover:bg-[#1E2944] border border-[#2A3B60] text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                View History
              </button>
              <button
                onClick={() => {
                  setAiraState('idle');
                  setViewMode('setup');
                }}
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-pink-900/30 transition-transform hover:scale-105 cursor-pointer"
              >
                Start Another Interview
              </button>
            </div>

          </div>
        )}

        {/* 4. HISTORY VIEW */}
        {viewMode === 'history' && (
          <div className="max-w-4xl mx-auto w-full py-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Interview History & Progress</h2>
                <p className="text-xs text-slate-400 mt-0.5">Track your conversational and technical readiness over time.</p>
              </div>
              <button
                onClick={() => {
                  setAiraState('idle');
                  setViewMode('setup');
                }}
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                New Interview
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-16 text-center text-xs font-semibold text-slate-400">
                Loading interview history...
              </div>
            ) : !historyData || !historyData.history || historyData.history.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-[#0D1220] border border-[#1C263D] p-8 space-y-3">
                <Bot className="w-10 h-10 text-pink-400 mx-auto opacity-80" />
                <p className="text-sm font-bold text-white">No Completed Interviews Yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Complete your first mock interview with Aira to start tracking your skill readiness and improvement trends.
                </p>
                <button
                  onClick={() => {
                    setAiraState('idle');
                    setViewMode('setup');
                  }}
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold mt-2 cursor-pointer"
                >
                  Start Your First Interview
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-gradient-to-r from-[#12182B] to-[#18152B] border border-[#222B48] flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Average Readiness Score</span>
                    <p className="text-3xl font-black text-pink-400 mt-1">{historyData.average_score}%</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {historyData.score_trend?.map((pt, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-300">{Math.round(pt.score)}%</span>
                        <div 
                          className="w-7 rounded-lg bg-gradient-to-t from-purple-600 to-pink-500" 
                          style={{ height: `${Math.max(pt.score * 0.6, 20)}px` }} 
                        />
                        <span className="text-[9px] text-slate-500 font-mono">#{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-[#0D1220] border border-[#1C263D] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1C263D] bg-[#12192B] text-[11px] font-bold text-slate-400 h-11">
                        <th className="py-3 px-6">Date</th>
                        <th className="py-3 px-6">Role</th>
                        <th className="py-3 px-6">Type</th>
                        <th className="py-3 px-6">Difficulty</th>
                        <th className="py-3 px-6 text-center">Score</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#182136] text-xs text-slate-300">
                      {historyData.history.map((item) => (
                        <tr key={item.id} className="hover:bg-[#141C2E] transition-colors">
                          <td className="py-3.5 px-6 font-medium text-slate-400">
                            {item.completed_at ? new Date(item.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
                          </td>
                          <td className="py-3.5 px-6 font-bold text-white">{item.target_role}</td>
                          <td className="py-3.5 px-6 font-semibold text-purple-300">{item.interview_type}</td>
                          <td className="py-3.5 px-6">
                            <span className="px-2 py-0.5 rounded-md bg-[#162035] border border-[#243354] text-[11px] font-semibold text-slate-300">
                              {item.difficulty}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <span className="text-sm font-black text-pink-400">{Math.round(item.overall_score)}%</span>
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button
                              onClick={() => {
                                setFinalReport(item);
                                setViewMode('report');
                              }}
                              className="px-3 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-[11px] font-semibold border border-pink-500/30 transition-colors cursor-pointer"
                            >
                              View Report
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
