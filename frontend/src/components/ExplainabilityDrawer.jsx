import React, { useState } from 'react';
import { X, HelpCircle, Eye, ShieldCheck, CheckCircle2, AlertTriangle, Layers, Info, Terminal } from 'lucide-react';

export const ExplainabilityDrawer = ({ isOpen, onClose, fusion, userValidation }) => {
  const [showTechnical, setShowTechnical] = useState(false);

  if (!isOpen || !fusion) return null;

  const textEv = fusion.textEvidence || {};
  const faceEv = fusion.faceEvidence || {};
  const meta = fusion.researchMetadata || {};
  const isConflict = fusion.fusionState === 'MULTIMODAL_CONFLICT';
  const isAgree = fusion.fusionState === 'MULTIMODAL_AGREE';

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="explainability-drawer-title"
    >
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-y-auto border-l border-stone-200">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-lg">
            <HelpCircle size={20} className="text-amber-700" />
            <h2 id="explainability-drawer-title">Why VedAI Noticed This</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition focus:ring-2 focus:ring-amber-700"
            aria-label="Close explainability drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 text-sm text-stone-700">

          {/* Core Principle Notice */}
          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <ShieldCheck size={16} className="text-amber-800" />
              <span>Core Principle: Observational Evidence, Not Diagnostic Truth</span>
            </div>
            <p className="leading-relaxed text-amber-900/90">
              VedAI does not measure your internal mental state. It analyzes verbal cues and facial expressions 
              as conversational starting points. You remain the only true authority on your inner experience.
            </p>
          </div>

          {/* Fusion State & Contributing Modalities */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Layers size={14} />
              <span>Synthesis Overview</span>
            </h3>
            
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">Synthesis State:</span>
                <span className="font-semibold px-2 py-0.5 rounded-full bg-white border border-stone-300 text-stone-800 font-mono">
                  {fusion.fusionState}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">Contributing Modalities:</span>
                <span className="font-medium text-stone-800 capitalize">
                  {fusion.modalitiesUsed?.join(' + ') || 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">Evidence Strength:</span>
                <span className="font-medium text-stone-800">
                  {fusion.evidenceStrength || 'Moderate'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">Human Validation State:</span>
                <span className="font-semibold text-amber-900">
                  {userValidation?.choice || 'Pending User Confirmation'}
                </span>
              </div>
            </div>
          </div>

          {/* Modality Evidence Cards */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Modality Breakdown
            </h3>

            {/* 1. Text Evidence */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  Written Language Evidence
                </span>
                <span className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md font-mono">
                  Quality: {textEv.quality?.tier || 'HIGH_QUALITY'}
                </span>
              </div>
              <p className="text-xs text-stone-600">
                {textEv.label || 'Verbal pattern analysis completed.'}
              </p>
              <div className="text-[11px] text-stone-400 flex justify-between pt-1 border-t border-stone-100">
                <span>Model: {textEv.source === 'distilbert_multilingual_ml' ? 'Multilingual DistilBERT Transformer' : 'Heuristic Fallback'}</span>
                <span>Conf: {Math.round((textEv.confidence || 0) * 100)}%</span>
              </div>
            </div>

            {/* 2. Face Evidence */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Facial Expression Cues
                </span>
                <span className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md font-mono">
                  {faceEv.available ? `Quality: ${faceEv.quality?.tier || 'MODERATE'}` : 'Camera Not Active'}
                </span>
              </div>
              <p className="text-xs text-stone-600">
                {faceEv.available
                  ? (faceEv.label || `Observed ${faceEv.dominantExpression} facial cues.`)
                  : 'Camera was not used for this reflection. Only written words contributed.'}
              </p>
              {faceEv.available && (
                <div className="text-[11px] text-stone-400 flex justify-between pt-1 border-t border-stone-100">
                  <span>Privacy: Ephemeral landmark analysis (zero frames saved)</span>
                  <span>Conf: {Math.round((faceEv.confidence || 0) * 100)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Conflict or Agreement Narrative */}
          {isConflict && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-2">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-700" />
                <span>Why Did VedAI Report "Mixed Signals"?</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Your written words and facial cues showed distinct emotional patterns. Rather than guessing 
                or arbitrarily picking one over the other, VedAI preserved both perspectives so you can choose 
                what feels genuine.
              </p>
            </div>
          )}

          {isAgree && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-700" />
                <span>Modality Agreement</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Both your written words and observable facial cues exhibited signals commonly aligned with {fusion.fusedSignal?.replace('_', ' ')}.
              </p>
            </div>
          )}

          {/* Technical / Research Metadata Toggle */}
          <div className="pt-2 border-t border-stone-200">
            <button
              onClick={() => setShowTechnical(!showTechnical)}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1.5 focus:outline-none"
            >
              <Terminal size={14} />
              <span>{showTechnical ? 'Hide Technical / Research Metadata' : 'Show Technical / Research Details'}</span>
            </button>

            {showTechnical && (
              <div className="mt-3 p-3 bg-stone-900 text-stone-200 rounded-xl text-[11px] font-mono space-y-1.5 overflow-x-auto">
                <div>pipelineVersion: {meta.pipelineVersion || '2.0.0-phase2g'}</div>
                <div>fusionState: {fusion.fusionState}</div>
                <div>conflictScore: {meta.conflictScore !== null ? meta.conflictScore : 'N/A'}</div>
                <div>cosineDistance: {meta.cosineDistance !== null ? meta.cosineDistance : 'N/A'}</div>
                <div>weightText: {meta.wText !== undefined ? meta.wText : 1.0}</div>
                <div>weightFace: {meta.wFace !== undefined ? meta.wFace : 0.0}</div>
                <div>textQualityScore: {meta.textQuality}</div>
                <div>faceQualityScore: {meta.faceQuality}</div>
                <div>timestamp: {meta.timestamp}</div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-[#FAF8F5] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition"
          >
            Close Explanation
          </button>
        </div>

      </div>
    </div>
  );
};
