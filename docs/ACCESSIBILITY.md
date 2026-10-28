# Accessibility

The Virtual Mirror exposes a labelled modal, named shade buttons, status/error announcements, visible focus, reduced-motion behavior, Escape close, initial focus, focus restoration and a keyboard focus loop. Product layers expose pressed state and named removal controls.

Lighthouse accessibility scored 100 on the 2026-10-28 production build after correcting the mobile menu name, main landmark and audited contrast failures. The JSON result is in `docs/evidence/lighthouse-accessibility-2026-10-28.json`.

Remaining verification: VoiceOver/TalkBack/NVDA passes, zoom/reflow at 200–400%, forced-colors mode and physical mobile touch-target review. Lighthouse identifies focus trap, managed focus, logical tab order and custom-control semantics as manual checks; Edge keyboard focus wrapping passed in the validation run.

