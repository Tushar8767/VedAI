# Safety & Ethical Boundaries in VedAI 2.0

VedAI 2.0 adheres strictly to non-negotiable responsible AI and privacy boundaries:

## 1. Strict Non-Diagnostic Policy
* **Never Diagnose:** VedAI is prohibited from asserting medical diagnoses such as *"You are depressed"* or *"You have an anxiety disorder"*.
* **Probabilistic Signals:** All emotional intelligence outputs use respectful, probabilistic phrasing: *"Signals associated with stress or feeling overwhelmed were observed."*
* **Uncertainty by Default:** The system explicitly notes that model estimates are approximations, never objective facts.

## 2. Deterministic 4-Tier Safety Guardrail
Safety evaluation executes **prior to any general AI generation**:
* **Tier 1 (Normal):** Regular life reflection, exam worries, career doubts.
* **Tier 2 (Mild Distress):** Supportive reflection + gentle grounding breathing.
* **Tier 3 (Serious Distress):** Supportive grounding + prompt suggestion to connect with trusted family, friends, or counselors.
* **Tier 4 (Immediate Risk / Crisis / Self-Harm):** The normal AI reflection flow is immediately halted. The system presents crisis helplines (Tele-MANAS, KIRAN, Vandrevala Foundation, 988 Lifeline) and states clearly that VedAI is an AI tool and not an emergency service. Crisis is never answered with scripture alone.

## 3. Human in the Loop (User Primacy)
* Machine estimations have lower authority than the user's lived experience.
* After signal estimation, users can select:
  * `Accurate`
  * `Partially accurate`
  * `Not accurate`
  * `Tell VedAI what you actually feel`
* If a user specifies *"I am not scared. I am frustrated"*, frustration immediately becomes the working context. The system never disputes user feedback.

## 4. Grounded Scripture Integrity
* **No Scriptural Hallucination:** The LLM is never permitted to invent shlokas or scripture.
* **Two-Card Boundary:** Original Sanskrit shlokas, transliterations, and authentic translations are kept immutable in Card A. Modern AI-assisted reflection and the *"Why this verse?"* rationale are kept separately in Card B.

## 5. Camera & Biometric Privacy
* **Zero Raw Video Storage:** Facial analysis is 100% opt-in, requiring explicit user consent.
* **Client-Side Landmark Processing:** Facial features are processed ephemeral in the browser. No raw video feed is uploaded or stored on servers.
* **Instant Toggle:** Users can disable the camera at any moment with a single click.

## 6. Factual Metrics Only (No Fake Gamification)
* The personal dashboard displays only factual effort: *"5 reflections saved, 3 breathing sessions completed"*.
* The system never outputs synthetic scores such as *"Mental health score: 82/100"* or *"Anxiety reduced by 40%"*.
