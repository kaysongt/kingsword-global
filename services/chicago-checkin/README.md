# Chicago check-in

The Chicago site submits name and email to the existing Sunday Service Check-In Breeze form. After Breeze accepts the entry, guests can share an optional First Visit Welcome Card. The service fills the two public forms through Chromium and waits for Breeze’s confirmation page. It does not need an administrative Breeze key.

Deploy this directory as a Docker service with a persistent volume mounted at /data and one replica. The Chicago site uses the production Railway service by default. To override the origin at build time, set NEXT_PUBLIC_CHICAGO_CHECKIN_ENDPOINT (or the CHICAGO_CHECKIN_ENDPOINT GitHub Pages repository variable). Set it to off to use the hosted Breeze form. The Railway pre-deploy command, python verify_forms.py, checks the live forms without submitting entries.

The volume contains a generated signing key and short-lived, keyed delivery identifiers for same-day retries. Contact fields exist in memory during delivery. Repeated submissions for the same name and email on a Chicago calendar day reuse the recorded outcome. If delivery was attempted and Breeze did not confirm it, staff should check that day's form entries before resubmitting.

First-visit invitations use an opaque receipt on the guest’s device. A different device or cleared browser receives the invitation again. No public membership lookup is performed. Staff can review welcome cards in Breeze Forms and associate them with the matching profile. The Sunday form records submissions in Forms, independently of Breeze event attendance.
