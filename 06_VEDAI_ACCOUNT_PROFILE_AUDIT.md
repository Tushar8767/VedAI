# 06_VEDAI_ACCOUNT_PROFILE_AUDIT: Authentication & Profile UX Audit

**Auditor**: External Technical Invigilator  
**Audit Target**: Account Icon (`#authBtn`), Auth Modal (`#authModal`), and Session State (`frontend/app.js:1052-1080`)  
**Verdict**: **AUTHENTICATION ENGINE HARDENED & SECURE — PROFILE UX HAS SEVERE INTERACTION FLAW**  

---

## 1. Step-by-Step Invigilator Interaction Test

### Test Scenario: Authenticated User Clicks Account Profile Icon

1. **User Action**: The user registers or logs in as `tushar@example.com`. The dock user pill updates to *"Tushar"*. The user clicks the round profile icon (`#authBtn`) in the top right floating dock.
2. **Actual System Response**:
   A native browser modal dialog pops up:
   > *"Currently signed in as tushar@example.com. Do you wish to sign out? [OK] [Cancel]"*
3. **Did a Profile Modal Appear?**: **NO.**
   The interface completely bypasses displaying the user's name, email, account creation date, or profile options, and immediately confronts the user with an eviction decision.
4. **Is Profile Information Displayed?**: **NO.**
   The user cannot view their registered details, role, or preferences from this button.
5. **Logout Behavior**:
   - If user clicks **[OK]**: `localStorage` removes tokens, `updateUserSession()` runs, dock reverts to *"Guest"*, and user data is unloaded.
   - If user clicks **[Cancel]**: The dialog closes and nothing happens.
6. **Session Termination**: **VERIFIED.**
   Tokens are cleared from client storage. Subsequent calls to protected endpoints (`/api/v1/journal`, `/api/v1/dashboard`) reject with `401 Unauthorized`.
7. **Protected Page Access**: **VERIFIED.**
   Unauthenticated users attempting to save journal entries receive prompt alerts requiring login.
8. **Session Persistence**: **VERIFIED.**
   Refreshing the browser restores the session from `localStorage` without requiring re-login.

---

## 2. Invigilator Diagnostic Assessment

### Root Cause in Code (`frontend/app.js:1053-1065`):
```javascript
authBtn.addEventListener('click', () => {
    const user = getStoredUser();
    if (user && getToken()) {
        if (confirm(`Currently signed in as ${user.email}. Do you wish to sign out?`)) {
            localStorage.removeItem(tokenStorageKey);
            localStorage.removeItem(userStorageKey);
            updateUserSession();
            loadDashboardData();
            loadJournalFeed();
        }
    } else {
        authModal.classList.remove('hidden');
    }
});
```

### Why This is an Architecture & UX Flaw:
- **Button Affordance Mismatch**: The button icon is a generic user silhouette (`👤`). In modern web application design, clicking an account profile icon is expected to reveal **Account Settings / Profile Details**. Acting purely as an unstyled `confirm()` logout trigger creates severe UX friction.
- **Backend Capability Exists but is Unused**: The Express gateway already provides `GET /api/v1/auth/me` returning `{ user: { id, name, email, role, preferences } }`. The frontend fails to present this data in an elegant modal.

---

## 3. Recommended Correction (For Post-Audit Implementation)

Create a dedicated **Account Profile Modal** (`#userProfileModal`) in `frontend/index.html`:
```html
<div class="modal-overlay hidden" id="userProfileModal">
    <div class="modal-card glass-panel">
        <div class="modal-header">
            <h3>Account Profile</h3>
            <button class="close-btn" id="closeProfileBtn">&times;</button>
        </div>
        <div class="profile-details-body">
            <div class="profile-avatar-circle">👤</div>
            <h4 id="profileNameDisplay">User Name</h4>
            <p id="profileEmailDisplay">user@example.com</p>
            <div class="profile-meta-badge">Protected Personal Vault Active</div>
        </div>
        <div class="profile-actions-stack">
            <button class="subtle-btn" id="profileSettingsBtn">Privacy & Data Settings</button>
            <button class="action-btn-danger" id="profileLogoutBtn">Sign Out</button>
        </div>
    </div>
</div>
```
And update `app.js` to open this modal when authenticated, rather than calling native `confirm()`.
