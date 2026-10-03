import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Heart, 
  Feather, 
  Eye, 
  BookOpen, 
  Flame, 
  X, 
  Save, 
  Edit3 
} from 'lucide-react';

const PRACTICES_LIST = [
  {
    id: 'box-breathing',
    title: 'Box Breathing (Sama Vritti)',
    category: 'Breathing',
    duration: 3,
    icon: 'Feather',
    description: 'A 4-part rhythmic breathing cycle (Inhale 4s, Hold 4s, Exhale 4s, Rest 4s) to steady the nervous system.'
  },
  {
    id: 'mindful-stillness',
    title: 'Mindful Stillness (Dhyana)',
    category: 'Meditation',
    duration: 5,
    icon: 'Sparkles',
    description: 'Quiet sitting observing the natural flow of breath without attempting to alter it.'
  },
  {
    id: 'gita-contemplation',
    title: 'Gita Verse Contemplation',
    category: 'Gita Practice',
    duration: 4,
    icon: 'BookOpen',
    description: 'Read a verse slowly three times, reflecting on its practical application in your life.'
  },
  {
    id: 'reflection-inquiry',
    title: 'Daily Inquiry & Clarification (Vichara)',
    category: 'Reflection Practice',
    duration: 5,
    icon: 'Edit3',
    description: 'Differentiating what is within your power from what lies beyond your control.'
  },
  {
    id: 'single-point-focus',
    title: 'Breath Counting & Focus (Dharana)',
    category: 'Focus Practice',
    duration: 3,
    icon: 'Eye',
    description: 'Sharpen concentration by counting 10 mindful breaths without losing track.'
  },
  {
    id: 'gratitude-reflection',
    title: 'Three Quiet Blessings (Santosh)',
    category: 'Gratitude',
    duration: 3,
    icon: 'Heart',
    description: 'Identify three quiet blessings in your life that are easy to overlook.'
  },
  {
    id: 'mindful-discipline',
    title: 'Mindful Resolve & Action (Tapasya)',
    category: 'Self-discipline',
    duration: 4,
    icon: 'Flame',
    description: 'Consciously commit to one intentional, virtuous action today regardless of hesitation.'
  }
];

export const PracticePage = ({ onOpenAuth }) => {
  const { isGuest } = useAuth();
  const [selectedPracticeId, setSelectedPracticeId] = useState('box-breathing');

  // Exercise Timer & State
  const [timerStatus, setTimerStatus] = useState('IDLE'); // 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Box Breathing Specific
  const [breathPhase, setBreathPhase] = useState('Inhale'); // Inhale, Hold, Exhale, Rest
  const [phaseSeconds, setPhaseSeconds] = useState(4);

  // Post-practice State: "What did you notice?"
  const [userObservation, setUserObservation] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const currentPractice = PRACTICES_LIST.find(p => p.id === selectedPracticeId) || PRACTICES_LIST[0];

  useEffect(() => {
    let interval = null;
    if (timerStatus === 'RUNNING') {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);

        if (selectedPracticeId === 'box-breathing') {
          setPhaseSeconds(prevPhase => {
            if (prevPhase <= 1) {
              setBreathPhase(curr => {
                if (curr === 'Inhale') return 'Hold (Full)';
                if (curr === 'Hold (Full)') return 'Exhale';
                if (curr === 'Exhale') return 'Rest (Empty)';
                return 'Inhale';
              });
              return 4;
            }
            return prevPhase - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerStatus, selectedPracticeId]);

  // Controls: Start, Pause, Continue, Finish, Exit
  const handleStart = () => {
    setTimerStatus('RUNNING');
    setSavedSuccess(false);
    setDismissed(false);
  };

  const handlePause = () => {
    setTimerStatus('PAUSED');
  };

  const handleContinue = () => {
    setTimerStatus('RUNNING');
  };

  const handleFinish = () => {
    setTimerStatus('COMPLETED');
  };

  const handleExit = () => {
    setTimerStatus('IDLE');
    setSecondsElapsed(0);
    setBreathPhase('Inhale');
    setPhaseSeconds(4);
    setUserObservation('');
    setSavedSuccess(false);
    setDismissed(false);
  };

  const handleSaveObservation = async () => {
    if (isGuest) {
      onOpenAuth();
      return;
    }

    const minutes = Math.max(1, Math.round(secondsElapsed / 60));
    try {
      const res = await api.logPracticeCompletion(
        currentPractice.id,
        minutes,
        userObservation.trim() || 'Mindful practice session'
      );
      if (res.success) {
        setSavedSuccess(true);
      }
    } catch (err) {
      console.error('Failed to log practice:', err);
    }
  };

  const handleDontSave = () => {
    setDismissed(true);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          Daily Mindful Practice
        </h1>
        <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 max-w-lg mx-auto">
          Seven grounded mindfulness exercises to cultivate steady presence. Factual effort without scores or rankings.
        </p>
      </div>

      {/* 7 Practice Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {PRACTICES_LIST.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setSelectedPracticeId(item.id);
              handleExit();
            }}
            className={`p-3 rounded-2xl text-left border flex flex-col justify-between transition ${
              selectedPracticeId === item.id
                ? 'border-amber-700 bg-amber-50/80 shadow-xs'
                : 'border-stone-200 bg-white hover:bg-stone-50'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900/80 truncate">
              {item.category}
            </div>
            <div className="text-xs font-semibold text-stone-900 mt-2 line-clamp-2">
              {item.title}
            </div>
            <div className="text-[10px] text-stone-400 mt-2 font-mono">
              {item.duration}m target
            </div>
          </button>
        ))}
      </div>

      {/* Active Practice Card */}
      <div className="bg-white rounded-3xl p-8 border border-[#E8E1D5] shadow-sm space-y-6">
        
        {/* Practice Title & Target */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/60 px-2.5 py-0.5 rounded-full">
                {currentPractice.category}
              </span>
              <span className="text-xs text-stone-400 font-mono">
                Duration: {currentPractice.duration} minutes
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mt-1">
              {currentPractice.title}
            </h2>
          </div>

          {/* Time Counter */}
          <div className="font-mono text-2xl font-bold text-stone-800 bg-stone-50 px-4 py-1.5 rounded-xl border border-stone-200 w-fit">
            {formatTime(secondsElapsed)}
          </div>
        </div>

        {/* Practice Content Area */}
        {selectedPracticeId === 'box-breathing' && (
          <div className="py-6 text-center space-y-6">
            {/* Animated Pacer */}
            <div className="relative w-52 h-52 mx-auto flex items-center justify-center">
              <div
                className={`w-44 h-44 rounded-full flex items-center justify-center transition-all duration-1000 ${
                  timerStatus !== 'RUNNING'
                    ? 'scale-100 bg-stone-100 border-2 border-stone-300 text-stone-600'
                    : breathPhase === 'Inhale'
                    ? 'scale-110 bg-amber-100/90 border-4 border-amber-500 text-amber-950 shadow-md'
                    : breathPhase.includes('Hold')
                    ? 'scale-105 bg-emerald-100/90 border-4 border-emerald-500 text-emerald-950'
                    : breathPhase === 'Exhale'
                    ? 'scale-90 bg-sky-100/90 border-4 border-sky-500 text-sky-950'
                    : 'scale-95 bg-stone-100 border-2 border-stone-300 text-stone-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs uppercase font-mono font-bold tracking-widest">
                    {timerStatus === 'RUNNING' ? breathPhase : 'Ready'}
                  </div>
                  <div className="font-serif text-4xl font-bold">
                    {timerStatus === 'RUNNING' ? phaseSeconds : '4'}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-stone-500">
              Inhale 4s &bull; Hold 4s &bull; Exhale 4s &bull; Rest 4s
            </p>
          </div>
        )}

        {selectedPracticeId === 'mindful-stillness' && (
          <div className="py-6 space-y-4 max-w-xl mx-auto text-center">
            <p className="text-sm text-stone-700 leading-relaxed font-serif">
              “When meditation is mastered, the mind is unwavering like the flame of a lamp in a windless place.” (Gita 6.19)
            </p>
            <p className="text-xs text-stone-500 leading-relaxed">
              Sit in upright comfort. Close your eyes gently. Observe the natural flow of breath. When thoughts arise, recognize them gently without friction and return attention to the breath.
            </p>
          </div>
        )}

        {selectedPracticeId === 'gita-contemplation' && (
          <div className="py-6 space-y-4 max-w-xl mx-auto">
            <div className="p-5 rounded-2xl bg-[#F5F2EB] border border-[#E8E1D5] space-y-2 text-center">
              <div className="text-xs font-mono font-bold text-amber-900">BG 2.47</div>
              <div className="font-serif text-lg font-bold text-stone-900">
                कर्मण्येवाधिकारस्ते मा फलेषु कदाचन
              </div>
              <p className="text-xs text-stone-700 italic font-serif">
                "You have a right to your prescribed duty, but you are not entitled to the fruits of action."
              </p>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed text-center">
              Reflect: What is one outcome today you are gripping too tightly? How does releasing the fruit bring peace to your work?
            </p>
          </div>
        )}

        {selectedPracticeId === 'reflection-inquiry' && (
          <div className="py-6 space-y-3 max-w-xl mx-auto text-xs text-stone-700 leading-relaxed">
            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-stone-200">
              <strong>1. Focus of Attention:</strong> What is occupying your mental space right now?
            </div>
            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-stone-200">
              <strong>2. Circle of Control:</strong> What portion of this situation can you directly influence today?
            </div>
            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-stone-200">
              <strong>3. Surrender:</strong> Can you let go of demanding that external events unfold precisely as you planned?
            </div>
          </div>
        )}

        {selectedPracticeId === 'single-point-focus' && (
          <div className="py-6 space-y-4 max-w-xl mx-auto text-center">
            <p className="text-xs text-stone-600 leading-relaxed">
              Fix your attention at the nostril tip. Silently count 10 full breaths (Inhale 1, Exhale 1 ... up to 10). If your mind drifts away, gently begin again at 1.
            </p>
            <div className="text-2xl font-serif text-amber-900">
              Counting Breaths 1 to 10
            </div>
          </div>
        )}

        {selectedPracticeId === 'gratitude-reflection' && (
          <div className="py-6 space-y-3 max-w-xl mx-auto text-xs text-stone-700">
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200">
              <strong>1. A Person:</strong> Someone whose presence, kindness, or teachings brought light into your life.
            </div>
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200">
              <strong>2. A Simple Comfort:</strong> A warm cup of tea, clean air, silence, or safety.
            </div>
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200">
              <strong>3. Inner Resilience:</strong> A difficulty in your past that you survived and grew through.
            </div>
          </div>
        )}

        {selectedPracticeId === 'mindful-discipline' && (
          <div className="py-6 space-y-4 max-w-xl mx-auto text-center">
            <p className="text-sm text-stone-800 font-serif leading-relaxed">
              Tapasya is the calm willingness to take the right action even when discomfort or lethargy protests.
            </p>
            <p className="text-xs text-stone-500">
              Name one task you have delayed. Dedicate 5 focused minutes of quiet action toward it right after this session.
            </p>
          </div>
        )}

        {/* Controls: Start, Pause, Continue, Finish, Exit */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-stone-100">
          {timerStatus === 'IDLE' && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-700 text-white font-medium text-xs hover:bg-amber-800 transition shadow-sm"
            >
              <Play size={14} />
              <span>Start Practice</span>
            </button>
          )}

          {timerStatus === 'RUNNING' && (
            <>
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-700 text-white font-medium text-xs hover:bg-stone-800 transition"
              >
                <Pause size={14} />
                <span>Pause</span>
              </button>
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 text-white font-medium text-xs hover:bg-emerald-800 transition shadow-sm"
              >
                <Check size={14} />
                <span>Finish</span>
              </button>
            </>
          )}

          {timerStatus === 'PAUSED' && (
            <>
              <button
                onClick={handleContinue}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-700 text-white font-medium text-xs hover:bg-amber-800 transition shadow-sm"
              >
                <Play size={14} />
                <span>Continue</span>
              </button>
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 text-white font-medium text-xs hover:bg-emerald-800 transition"
              >
                <Check size={14} />
                <span>Finish</span>
              </button>
            </>
          )}

          {(timerStatus === 'RUNNING' || timerStatus === 'PAUSED' || timerStatus === 'COMPLETED') && (
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-stone-300 text-stone-600 hover:text-stone-900 text-xs font-medium"
            >
              <X size={14} />
              <span>Exit</span>
            </button>
          )}
        </div>

        {/* POST-PRACTICE COMPLETION: "What did you notice?" */}
        {timerStatus === 'COMPLETED' && !dismissed && (
          <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-800" />
                <span>What did you notice?</span>
              </h3>
              <span className="text-xs text-stone-500 font-mono">
                {Math.max(1, Math.round(secondsElapsed / 60))} minute(s) completed
              </span>
            </div>

            <p className="text-xs text-stone-600">
              Take a quiet moment to record any shifts in your breath, body sensations, or state of mind.
            </p>

            <textarea
              value={userObservation}
              onChange={(e) => setUserObservation(e.target.value)}
              placeholder="e.g. My breathing slowed down, chest felt less constricted, mind felt quieter..."
              rows={3}
              className="w-full p-3 rounded-2xl border border-stone-300 text-xs text-stone-800 bg-white focus:outline-none focus:border-amber-700 resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex gap-2">
                <button
                  onClick={handleSaveObservation}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-800 text-white text-xs font-semibold hover:bg-amber-900 transition shadow-sm"
                >
                  <Save size={14} />
                  <span>{isGuest ? 'Sign In to Save' : 'Save to My Journey'}</span>
                </button>

                <button
                  onClick={handleDontSave}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-600 text-xs font-medium hover:bg-white transition"
                >
                  Don't Save
                </button>
              </div>

              {savedSuccess && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <Check size={14} /> Saved to Your Personal Journey!
                </span>
              )}
            </div>

            <p className="text-[11px] text-stone-400 italic pt-1">
              VedAI records factual practice duration and notes. We never assign synthetic mental health scores or percentages.
            </p>
          </div>
        )}

      </div>

    </div>
  );
};
