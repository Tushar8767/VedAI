import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ExplainabilityDrawer } from '../components/ExplainabilityDrawer';
import { 
  Sparkles, 
  Camera, 
  CameraOff, 
  Send, 
  Check, 
  BookOpen, 
  Feather, 
  Save, 
  RefreshCw, 
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  SkipForward,
  RotateCw,
  Square,
  MessageSquare,
  Compass,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  ExternalLink
} from 'lucide-react';

const REFLECTION_SPACES = [
  { id: 'mind', label: 'Something on my mind', placeholder: 'What is currently occupying your thoughts?' },
  { id: 'difficult', label: 'Difficult situation', placeholder: 'Describe the pressure or challenge you are navigating...' },
  { id: 'decision', label: 'Decision', placeholder: 'What choices are in front of you, and what feels uncertain?' },
  { id: 'learned', label: 'Something I learned', placeholder: 'What realization or lesson caught your attention recently?' },
  { id: 'day', label: 'My day', placeholder: 'How did today unfold, and what moments stood out?' },
  { id: 'free', label: 'Free reflection', placeholder: 'Write whatever is in your heart without structure...' }
];

export const ReflectPage = ({ initialPrompt = '', setTab, onOpenAuth }) => {
  const { isGuest } = useAuth();
  
  // Modes: 'GUIDED' | 'FREE' | 'GITA'
  const [reflectionMode, setReflectionMode] = useState('GUIDED');
  const [selectedSpace, setSelectedSpace] = useState('mind');
  const [userInput, setUserInput] = useState(initialPrompt);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Human-in-the-loop and explainability state
  const [customCorrection, setCustomCorrection] = useState('');
  const [selectedValidation, setSelectedValidation] = useState(null);
  const [showCorrectionInput, setShowCorrectionInput] = useState(false);
  const [isExplainDrawerOpen, setIsExplainDrawerOpen] = useState(false);
  const [userCorrectionConfirmed, setUserCorrectionConfirmed] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [anonymousSessionId] = useState(() => 'anon_sess_' + Math.random().toString(36).substring(2, 10));

  // Question interaction state (Answer, Skip, Change Question, Stop)
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [questionAnswerInput, setQuestionAnswerInput] = useState('');
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [inquiryStopped, setInquiryStopped] = useState(false);

  // Journal save state
  const [userNote, setUserNote] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (initialPrompt) {
      handleOrchestrate();
    }
  }, []);

  const handleSpaceSelect = (space) => {
    setSelectedSpace(space.id);
    if (!userInput.trim()) {
      setUserInput('');
    }
  };

  const dispatchTelemetryIfConsented = (res, validationChoice = null, hasCorrection = false) => {
    if (!researchConsent || !res) return;
    const fusion = res.multimodalFusion || res.emotionIntelligence?.fusion;
    const meta = fusion?.researchMetadata || {};
    api.sendTelemetryEvent({
      anonymousSessionId,
      fusionState: fusion?.fusionState || 'TEXT_ONLY',
      modalitiesUsed: fusion?.modalitiesUsed || ['text'],
      wText: meta.wText !== undefined ? meta.wText : 1.0,
      wFace: meta.wFace !== undefined ? meta.wFace : 0.0,
      textQualityScore: meta.textQuality || 0.8,
      faceQualityScore: meta.faceQuality || 0.0,
      conflictScore: meta.conflictScore,
      validationChoice: validationChoice || selectedValidation || 'UNVALIDATED',
      userCorrectionPresent: hasCorrection,
      gitaRetrieved: Boolean(res.gitaWisdom && res.gitaWisdom.length > 0),
      userConsent: true
    }).catch(err => console.debug('Telemetry skipped or offline:', err));
  };

  const handleOrchestrate = async (validationOverride = null) => {
    if (!userInput.trim()) return;
    setLoading(true);
    setError('');
    setSaveSuccess(false);

    // Ephemeral face signals if camera enabled (never recorded or transmitted)
    const faceData = cameraActive
      ? { faceDetected: true, dominantExpression: 'neutral', confidence: 0.70 }
      : null;

    try {
      const response = await api.orchestrateReflection(userInput, faceData, validationOverride);
      if (response.success) {
        setResult(response);
        if (validationOverride) {
          setSelectedValidation(validationOverride.choice);
          if (validationOverride.userCorrection) {
            setUserCorrectionConfirmed(true);
          }
        }
        dispatchTelemetryIfConsented(
          response, 
          validationOverride?.choice, 
          Boolean(validationOverride?.userCorrection)
        );
      } else {
        setError(response.message || 'Unable to process reflection');
      }
    } catch {
      setError('Connection to reflection server failed. Operating in offline mode.');
    } finally {
      setLoading(false);
    }
  };

  const handleValidationSelect = (choice) => {
    setSelectedValidation(choice);
    if (choice === 'TELL_VEDAI') {
      setShowCorrectionInput(true);
    } else {
      setShowCorrectionInput(false);
      setUserCorrectionConfirmed(false);
      handleOrchestrate({ choice, userCorrection: '' });
    }
  };

  const submitCustomCorrection = (e) => {
    e.preventDefault();
    if (!customCorrection.trim()) return;
    setUserCorrectionConfirmed(true);
    handleOrchestrate({ choice: 'USER_CORRECTED', userCorrection: customCorrection });
  };

  // Inquiry Question Controls: Answer, Skip, Change Question, Stop
  const handleAnswerQuestion = (e) => {
    e.preventDefault();
    if (!questionAnswerInput.trim()) return;
    
    const currentQ = result?.reflectionQuestions?.[activeQuestionIdx] || 'Reflection inquiry';
    setAnsweredQuestions([...answeredQuestions, { question: currentQ, answer: questionAnswerInput.trim() }]);
    setQuestionAnswerInput('');
    
    // Move to next question if available
    if (activeQuestionIdx + 1 < (result?.reflectionQuestions?.length || 0)) {
      setActiveQuestionIdx(activeQuestionIdx + 1);
    } else {
      setInquiryStopped(true);
    }
  };

  const handleSkipQuestion = () => {
    if (activeQuestionIdx + 1 < (result?.reflectionQuestions?.length || 0)) {
      setActiveQuestionIdx(activeQuestionIdx + 1);
    } else {
      setInquiryStopped(true);
    }
  };

  const handleChangeQuestion = () => {
    if (!result?.reflectionQuestions?.length) return;
    setActiveQuestionIdx((activeQuestionIdx + 1) % result.reflectionQuestions.length);
  };

  const handleStopInquiry = () => {
    setInquiryStopped(true);
  };

  const handleSaveToJournal = async () => {
    if (isGuest) {
      onOpenAuth();
      return;
    }

    // Assemble reflection notes including user's inquiry answers
    const answersText = answeredQuestions.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n');
    const combinedNotes = [answersText, userNote.trim()].filter(Boolean).join('\n\nTakeaway: ');

    try {
      const res = await api.saveJournalEntry({
        rawUserInput: userInput,
        languageDetected: result?.language?.primary || 'English',
        aiEstimatedSignal: result?.emotionIntelligence?.fusion?.fusedSignal || 'Self-Directed',
        aiConfidence: result?.emotionIntelligence?.fusion?.confidenceLevel || null,
        multimodalState: result?.emotionIntelligence?.fusion?.fusionState || (cameraActive ? 'MULTIMODAL' : 'TEXT_ONLY'),
        aiExplanation: result?.gitaWisdom?.[0]?.aiAssistance?.whyThisVerse || result?.llmReflection?.understandingSummary || null,
        userValidationChoice: selectedValidation || (reflectionMode === 'FREE' ? 'FREE_REFLECTION' : 'UNVALIDATED'),
        userCorrection: customCorrection,
        finalWorkingContext: result?.humanValidation?.finalValidatedContext || (reflectionMode === 'FREE' ? 'Free Private Reflection' : 'Gita Reflection'),
        linkedVerseId: result?.gitaWisdom?.[0]?.verse?.id || null,
        linkedVerseRef: result?.gitaWisdom?.[0]?.verse?.source || null,
        userReflectionNotes: combinedNotes || 'Personal reflection completed.'
      });

      if (res.success) {
        setSaveSuccess(true);
      }
    } catch (err) {
      console.error('Failed to save journal:', err);
    }
  };

  const activePlaceholder = REFLECTION_SPACES.find(s => s.id === selectedSpace)?.placeholder || 'Share your thoughts...';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Self-Reflection Workspace
        </h1>
        <p className="text-sm text-stone-500 max-w-lg mx-auto">
          AI suggests. Evidence explains. You decide. A private sanctuary to untangle your thoughts.
        </p>
      </div>

      {/* Reflection Modes Bar */}
      <div className="flex justify-center gap-2 p-1.5 bg-[#F5F2EB] rounded-2xl max-w-md mx-auto border border-[#E8E1D5]">
        {[
          { id: 'GUIDED', label: 'Guided Reflection' },
          { id: 'FREE', label: 'Free Reflection' },
          { id: 'GITA', label: 'Gita Contemplation' }
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setReflectionMode(m.id);
              setResult(null);
              setAnsweredQuestions([]);
              setInquiryStopped(false);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition ${
              reflectionMode === m.id
                ? 'bg-amber-800 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Reflection Space Chips */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block text-center">
          Choose a Reflection Theme
        </label>
        <div className="flex flex-wrap justify-center gap-2">
          {REFLECTION_SPACES.map((space) => (
            <button
              key={space.id}
              onClick={() => handleSpaceSelect(space)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                selectedSpace === space.id
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {space.label}
            </button>
          ))}
        </div>
      </div>

      {/* EXPRESS YOUR THOUGHT (STEP 1) */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E1D5] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
            {reflectionMode === 'FREE' ? 'Your Private Thoughts' : 'Step 1 • Express Your Thought'}
          </label>
          
          {/* Camera Toggle (Only for Guided Mode) */}
          {reflectionMode === 'GUIDED' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCameraActive(!cameraActive)}
                aria-pressed={cameraActive}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-700 ${
                  cameraActive
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                {cameraActive ? <Camera size={14} className="text-emerald-700" /> : <CameraOff size={14} className="text-stone-500" />}
                <span>{cameraActive ? 'Camera Analysis: Active' : 'Camera Analysis: Inactive'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${cameraActive ? 'bg-emerald-200 text-emerald-900' : 'bg-stone-200 text-stone-600'}`}>
                  {cameraActive ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Camera Privacy & Operational Reassurance */}
        {reflectionMode === 'GUIDED' && cameraActive && (
          <div className="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1.5 animate-fade-in">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <ShieldCheck size={16} className="text-emerald-700" />
              <span>Zero-Storage Camera Guarantee</span>
            </div>
            <p className="leading-relaxed">
              Client-side facial landmarks are processed in real-time memory and immediately discarded. 
              <strong> Zero raw frames or video streams are saved, stored, or transmitted</strong> to any server.
            </p>
            <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-850">
              <span>Text-only reflection is 100% supported at any time.</span>
              <button 
                type="button"
                onClick={() => setTab('settings')}
                className="underline hover:text-emerald-950 flex items-center gap-1 font-medium"
              >
                <span>Privacy &amp; Data Settings</span>
                <ExternalLink size={10} />
              </button>
            </div>
          </div>
        )}

        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={activePlaceholder}
          rows={5}
          className="w-full p-4 rounded-2xl border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-700 resize-none text-base leading-relaxed bg-[#FAF8F5]/50"
        />

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-stone-400">
            Accepts English, Hindi, Marathi, Hinglish, typos &amp; slang
          </span>

          {reflectionMode === 'FREE' ? (
            <button
              onClick={handleSaveToJournal}
              disabled={!userInput.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white font-medium text-xs hover:bg-black transition disabled:opacity-50"
            >
              <Save size={14} />
              <span>{isGuest ? 'Sign In to Save' : 'Save Directly to Journal'}</span>
            </button>
          ) : (
            <button
              onClick={() => handleOrchestrate()}
              disabled={loading || !userInput.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 text-white font-medium text-sm hover:bg-amber-800 transition disabled:opacity-50 shadow-sm"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              <span>{loading ? 'Reflecting...' : 'Explore Reflection'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SAFETY ALERT (TIER 4) */}
      {result?.safety?.tier === 'IMMEDIATE_RISK' && (
        <div className="p-6 rounded-3xl bg-red-50 border-2 border-red-300 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-red-800 font-bold">
            <ShieldAlert size={22} />
            <h3 className="text-base">Support &amp; Crisis Resources Available Right Now</h3>
          </div>
          <p className="text-sm text-red-900 leading-relaxed">
            {result.safety.message}
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {result.safety.resources.map((res, i) => (
              <div key={i} className="p-3 bg-white rounded-xl border border-red-200 text-xs">
                <div className="font-bold text-stone-900">{res.name}</div>
                <div className="text-red-700 font-mono text-sm mt-0.5">{res.contact}</div>
                <div className="text-stone-500 mt-0.5">{res.availability}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-red-700/80 italic">
            {result.safety.disclaimer}
          </p>
        </div>
      )}

      {/* CLARIFICATION PROMPT FOR INSUFFICIENT / MEANINGLESS INPUT */}
      {result?.pipelineStep === 'INPUT_CLARIFICATION_REQUIRED' && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-stone-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <HelpCircle size={20} />
            <h4>Could you tell me a little more?</h4>
          </div>
          <p className="text-sm text-stone-700">
            {result.message}
          </p>
        </div>
      )}

      {/* STEP 2 & 3: WHAT VEDAI NOTICED + HUMAN VALIDATION */}
      {result?.pipelineStep === 'COMPLETE_ORCHESTRATION' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* WHAT VEDAI NOTICED CARD */}
          <div className="p-6 rounded-3xl bg-[#F5F2EB] border border-[#E8E1D5] space-y-4 shadow-xs">
            
            {/* Header with non-diagnostic badge and Explainability button */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900/80">
                  Step 2 • What VedAI Noticed
                </span>
                <span className="text-[11px] text-stone-600 bg-white/80 px-2.5 py-0.5 rounded-full border border-stone-200 font-medium">
                  AI Suggestion • Observational, Not Diagnostic
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsExplainDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-stone-50 border border-stone-300 rounded-full text-xs font-medium text-amber-900 hover:text-amber-950 transition shadow-2xs focus:ring-2 focus:ring-amber-700"
                aria-label="Why did VedAI say this? Open evidence explanation"
              >
                <HelpCircle size={14} className="text-amber-700" />
                <span>Why did VedAI say this?</span>
              </button>
            </div>

            {/* Modality Cues Indicators */}
            <div className="flex flex-wrap gap-2 pt-1">
              {result.emotionIntelligence?.fusion?.textEvidence && (
                <div className="px-2.5 py-1 bg-white/70 border border-stone-200 rounded-xl text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  <span className="text-stone-500 font-medium">Written Words:</span>
                  <span className="font-semibold text-stone-800 capitalize">
                    {result.emotionIntelligence?.fusion?.textEvidence?.primarySignal?.replace(/_/g, ' ') || 'Reflective'}
                  </span>
                </div>
              )}
              {result.emotionIntelligence?.fusion?.faceEvidence?.available && (
                <div className="px-2.5 py-1 bg-white/70 border border-stone-200 rounded-xl text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span className="text-stone-500 font-medium">Facial Cues:</span>
                  <span className="font-semibold text-stone-800 capitalize">
                    {result.emotionIntelligence?.fusion?.faceEvidence?.dominantExpression || 'Neutral'}
                  </span>
                </div>
              )}
            </div>

            {/* Combined AI Summary */}
            <p className="text-base text-stone-800 font-medium leading-relaxed">
              {result.llmReflection?.understandingSummary || result.emotionIntelligence?.fusion?.displaySummary}
            </p>

            {/* Uncertainty Note */}
            {result.emotionIntelligence?.fusion?.uncertaintyNote && (
              <p className="text-xs text-stone-500 italic">
                {result.emotionIntelligence?.fusion?.uncertaintyNote}
              </p>
            )}

            {/* Immediate Confirmation Banner when User Provided Correction or Selected Validation */}
            {userCorrectionConfirmed && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-950 animate-fade-in">
                <CheckCircle2 size={16} className="text-emerald-700 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold">Authoritative User Input Acknowledged</div>
                  <p className="text-emerald-900 mt-0.5">
                    Thanks. VedAI will use what you told it rather than the earlier estimate.
                  </p>
                </div>
              </div>
            )}

            {/* MULTIMODAL CONFLICT SECTION (When Text and Face Differ) */}
            {result.emotionIntelligence?.fusion?.fusionState === 'MULTIMODAL_CONFLICT' && (
              <div className="p-4 bg-amber-50/80 border-2 border-amber-300 rounded-2xl space-y-3.5 animate-fade-in">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wide">
                  <AlertTriangle size={16} className="text-amber-700" />
                  <span>VedAI Received Mixed Signals</span>
                </div>
                
                <p className="text-xs text-stone-700 leading-relaxed">
                  Your written words and observable facial cues suggested contrasting emotional patterns. 
                  VedAI never assumes one signal is truer than the other—<strong>you decide what captures your experience</strong>:
                </p>

                {/* Dual-Modality Comparison */}
                <div className="grid sm:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                      What Your Words Suggested
                    </span>
                    <div className="text-xs font-semibold text-stone-900 capitalize">
                      {result.emotionIntelligence?.fusion?.textEvidence?.primarySignal?.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-stone-500 italic">
                      Based on verbal keywords and syntax
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      What Your Facial Cues Suggested
                    </span>
                    <div className="text-xs font-semibold text-stone-900 capitalize">
                      {result.emotionIntelligence?.fusion?.faceEvidence?.dominantExpression}
                    </div>
                    <div className="text-[11px] text-stone-500 italic">
                      Based on real-time expression landmarks
                    </div>
                  </div>
                </div>

                {/* 6 Non-Coercive User Options */}
                <div className="space-y-2 pt-2 border-t border-amber-200/80">
                  <label className="text-xs font-bold text-stone-800 block">
                    Which perspective aligns with how you are feeling?
                  </label>

                  <div className="grid sm:grid-cols-2 gap-2">
                    {[
                      { id: 'YES_TEXT', label: 'My words reflect how I feel' },
                      { id: 'YES_FACE', label: 'My facial cues reflect how I feel' },
                      { id: 'PARTLY', label: 'Both capture different parts of what I feel' },
                      { id: 'NOT_REALLY', label: 'Neither captures how I feel' },
                      { id: 'TELL_VEDAI', label: 'Let me tell you what I\'m experiencing' },
                      { id: 'SKIPPED', label: 'Continue without validation' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleValidationSelect(opt.id)}
                        className={`p-2.5 rounded-xl text-xs font-medium text-left transition border ${
                          selectedValidation === opt.id
                            ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STANDARD VALIDATION BUTTONS (When NOT Multimodal Conflict) */}
            {result.emotionIntelligence?.fusion?.fusionState !== 'MULTIMODAL_CONFLICT' && (
              <div className="pt-3 border-t border-stone-200/80 space-y-3">
                <p className="text-xs font-semibold text-stone-700">
                  Does this interpretation feel accurate to you?
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'YES', label: 'Accurate' },
                    { id: 'PARTLY', label: 'Partially accurate' },
                    { id: 'NOT_REALLY', label: 'Not accurate' },
                    { id: 'TELL_VEDAI', label: 'Tell VedAI what you feel' },
                    { id: 'SKIPPED', label: 'Continue without validation' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleValidationSelect(opt.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                        selectedValidation === opt.id
                          ? 'bg-amber-800 text-white shadow-xs'
                          : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Correction Input for TELL_VEDAI */}
            {showCorrectionInput && (
              <form onSubmit={submitCustomCorrection} className="pt-2 flex gap-2 animate-fade-in">
                <input
                  type="text"
                  value={customCorrection}
                  onChange={(e) => setCustomCorrection(e.target.value)}
                  placeholder="e.g. I am feeling more exhausted and overwhelmed than anxious..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-amber-700 bg-white"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!customCorrection.trim()}
                  className="px-4 py-2 bg-amber-700 text-white rounded-xl text-xs font-medium hover:bg-amber-800 disabled:opacity-50"
                >
                  Update Understanding
                </button>
              </form>
            )}

            {/* Research Telemetry Consent Toggle */}
            <div className="pt-3 border-t border-stone-200/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={researchConsent}
                  onChange={(e) => setResearchConsent(e.target.checked)}
                  className="rounded text-amber-700 focus:ring-amber-700"
                />
                <span>Share de-identified research metrics to improve AI explainability</span>
              </label>
              <span className="text-[10px] text-stone-400">Zero text, zero video recorded</span>
            </div>

          </div>

          {/* STEP 4: GITA GROUNDED WISDOM (OPTIONAL) */}
          {result.gitaWisdom && result.gitaWisdom.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-amber-800" />
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Grounded Wisdom • Bhagavad Gita
                </h3>
              </div>

              {result.gitaWisdom.map((item, idx) => (
                <div key={idx} className="bg-white rounded-3xl border border-[#E8E1D5] overflow-hidden shadow-sm">
                  
                  {/* Immutable Scripture Header */}
                  <div className="bg-[#F5F2EB]/80 p-6 border-b border-[#E8E1D5] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-900 uppercase tracking-widest">
                        {item.verse.source}
                      </span>
                      <div className="flex gap-1.5">
                        {item.verse.themes.map((th, i) => (
                          <span key={i} className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-stone-200 text-stone-600">
                            {th}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="sanskrit-text text-lg sm:text-xl font-semibold whitespace-pre-line text-center py-2 text-amber-950 font-serif">
                      {item.verse.sanskrit}
                    </div>

                    <div className="text-xs italic text-stone-600 text-center font-serif">
                      {item.verse.transliteration}
                    </div>

                    <div className="pt-2 text-sm text-stone-800 leading-relaxed font-serif border-t border-stone-200/50">
                      <strong>Translation:</strong> {item.verse.verifiedTranslation}
                    </div>
                  </div>

                  {/* AI Explainability ("Why this verse?") */}
                  <div className="p-5 space-y-3 bg-[#FAF8F5]/40 text-xs">
                    <div>
                      <div className="font-bold text-amber-800 mb-1">
                        Why VedAI Suggested This Verse
                      </div>
                      <p className="text-stone-700 leading-relaxed">
                        {item.aiAssistance.whyThisVerse}
                      </p>
                    </div>

                    <div>
                      <div className="font-bold text-stone-800 mb-1">
                        Core Reflection
                      </div>
                      <p className="text-stone-600 leading-relaxed">
                        {item.aiAssistance.simpleExplanation}
                      </p>
                    </div>

                    <div className="text-[11px] text-stone-400 italic pt-1">
                      {item.aiAssistance.disclaimer}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* STEP 5: INTERACTIVE REFLECTION QUESTIONS */}
          {result.reflectionQuestions && result.reflectionQuestions.length > 0 && !inquiryStopped && (
            <div className="p-6 rounded-3xl bg-white border border-[#E8E1D5] space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-700" />
                  <span>Inquiry Question ({activeQuestionIdx + 1} of {result.reflectionQuestions.length})</span>
                </h4>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleChangeQuestion}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 rounded-lg"
                    title="Change question"
                  >
                    <RotateCw size={12} />
                    <span>Change</span>
                  </button>
                  <button
                    onClick={handleSkipQuestion}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 rounded-lg"
                    title="Skip question"
                  >
                    <SkipForward size={12} />
                    <span>Skip</span>
                  </button>
                  <button
                    onClick={handleStopInquiry}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-stone-500 hover:text-red-700 bg-stone-100 rounded-lg"
                    title="Stop inquiry"
                  >
                    <Square size={12} />
                    <span>Stop</span>
                  </button>
                </div>
              </div>

              {/* Current Question */}
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-stone-200 text-sm font-medium text-stone-900 leading-relaxed">
                "{result.reflectionQuestions[activeQuestionIdx]}"
              </div>

              {/* Answer Input */}
              <form onSubmit={handleAnswerQuestion} className="space-y-3">
                <textarea
                  value={questionAnswerInput}
                  onChange={(e) => setQuestionAnswerInput(e.target.value)}
                  placeholder="Reflect on this question in your own words..."
                  rows={2}
                  className="w-full p-3 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-amber-700 bg-white resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!questionAnswerInput.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 disabled:opacity-50"
                  >
                    Record Answer &amp; Continue
                  </button>
                </div>
              </form>

              {/* Previously Answered */}
              {answeredQuestions.length > 0 && (
                <div className="pt-3 border-t border-stone-100 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Recorded Inquiries:
                  </label>
                  {answeredQuestions.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-stone-50 rounded-xl text-xs space-y-1">
                      <div className="font-semibold text-stone-800">Q: {item.question}</div>
                      <div className="text-stone-600 italic">"{item.answer}"</div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* STEP 6: RECOMMENDED PRACTICE & SAVE TO JOURNAL */}
          <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-200/60 space-y-4">
            <h4 className="font-serif font-bold text-stone-900 flex items-center gap-2">
              <Feather size={16} className="text-emerald-700" />
              <span>Recommended Practice: Box Breathing</span>
            </h4>
            <p className="text-xs text-stone-600">
              Steadies the nervous system and returns your focus to the present moment.
            </p>
            <button
              onClick={() => setTab('practice')}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition"
            >
              Start 3-Minute Breathing Exercise
            </button>

            {/* Personal Notes & Save to Journal */}
            <div className="pt-4 border-t border-amber-200/60 space-y-3">
              <label className="block text-xs font-bold text-stone-700">
                Personal Takeaway (Private to your journal)
              </label>
              <textarea
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="What did this reflection make you realize? (e.g. Focus on today's effort rather than worrying about the outcome)..."
                rows={2}
                className="w-full p-3 rounded-xl border border-stone-300 text-xs text-stone-800 bg-white focus:outline-none focus:border-amber-700 resize-none"
              />

              <div className="flex items-center justify-between">
                <button
                  onClick={handleSaveToJournal}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-black transition shadow-sm"
                >
                  <Save size={14} />
                  <span>{isGuest ? 'Sign In to Save Reflection' : 'Save to Private Journal'}</span>
                </button>

                {saveSuccess && (
                  <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <Check size={14} /> Saved to Your Personal Journal!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPLAINABILITY DRAWER */}
      <ExplainabilityDrawer
        isOpen={isExplainDrawerOpen}
        onClose={() => setIsExplainDrawerOpen(false)}
        fusion={result?.emotionIntelligence?.fusion || result?.multimodalFusion}
        userValidation={{
          choice: selectedValidation,
          customCorrection: customCorrection
        }}
      />

    </div>
  );
};
