# Milestone 1 — context

Shipped: vertical slice (auth, public report, bandeja save-first, promote, map, rules, seed).

**No Cloud Functions / Blaze.** Join + public report = client SDK + Firestore rules.
- First signed-in user claims `cases/{id}/locks/owner` → owner
- Later family → coordinator
- Empty project: first sign-in bootstraps `cases` + `publicCases`

Next when asked: Milestone 2 (signs + zones) only.

Decision pending human: real public phone/WhatsApp; Storage “Get Started” in console if photos needed.
