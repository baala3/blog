---
title: 'NIST SP 800-63B-4: What "Strong Authentication" Actually Means'
date: "2025-03-15T00:00:00+09:00"
url: "/blogs/nist-sp-800-63b-4-authentication"
description: "A technical breakdown of NIST SP 800-63B-4's authentication assurance levels, authenticator types, phishing resistance mechanisms, passkey support, and session management requirements for engineers building or auditing authentication systems."
tldr: "SP 800-63B-4 defines three authentication assurance levels with precise requirements for authenticator types, session lifetimes, and phishing resistance. SMS OTP is not phishing-resistant. Passkeys are now explicitly supported at AAL2. Password complexity rules are prohibited."
image: "https://www.cyberark.com/wp-content/uploads/2020/09/NIST-blog-hero-1.jpg"
credit: "https://pages.nist.gov/800-63-4/sp800-63b.html"
thumbnail: "https://www.entrust.com/sites/default/files/2025-03/regulatory-nist-feature-1200x628.jpg"
categories:
- Identity
- Security
- Authentication
- NIST
---

"We have MFA" is not a security posture. It's a starting point. SMS OTP is MFA. A hardware key is MFA. They are not equivalent, and treating them as equivalent is how you end up with a system that passes an audit but falls to a $10 phishing kit. <!--more-->

[NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html) is the authentication volume of the 800-63-4 suite. It defines exactly what authenticator types qualify at each assurance level, what phishing resistance actually requires, and what your session and recovery policies need to look like. It also officially bans password composition rules and explicitly supports passkeys, two things that were murky or missing in the 2017 version.

---

**Series: NIST SP 800-63-4**
- Part 1: [SP 800-63-4 — The Framework, Assurance Levels, and Risk Management](/blogs/nist-sp-800-63-4-overview)
- Part 2: [SP 800-63A-4 — Identity Proofing and Enrollment](/blogs/nist-sp-800-63a-4-identity-proofing)
- **Part 3 (this post):** SP 800-63B-4 — Authentication and Authenticator Management
- Part 4: [SP 800-63C-4 — Federation and Assertions](/blogs/nist-sp-800-63c-4-federation)

---

# The Problem 800-63B Is Solving

Standard MFA was designed for a world where attackers tried to steal passwords. Credential stuffing, brute force, password reuse across breaches: all of that is neutralized when the user also needs a second factor.

That world still exists, but it's not the main threat anymore. The dominant attack patterns now are:

**Phishing with real-time proxies.** Adversary-in-the-middle (AiTM) toolkits (Evilginx, Modlishka, and their commercial successors) sit between the user and the legitimate site. The user types their password and TOTP code into what looks like the real site. The proxy forwards those credentials to the real site in real time, logs in, and harvests the session token. The MFA code was valid, it was used, and the attacker is now authenticated. TOTP doesn't help here.

**Push notification fatigue.** Flood a user with MFA push requests until they approve one to make it stop. No phishing site required.

**SIM swap.** Convince a carrier to transfer the target's phone number to an attacker-controlled SIM. Now SMS OTP goes to the attacker.

The common thread: none of these attacks are blocked by MFA that isn't phishing-resistant. "You have MFA" only matters if the MFA can't be relayed, replayed, or socially engineered away.

800-63B-4 is structured around this distinction. It doesn't just categorize authenticator types by strength. It asks whether authentication is phishing-resistant, and makes that a hard requirement at the higher assurance levels.

---

# Authentication Assurance Levels

**AAL1: Basic confidence.** Single-factor or multi-factor authentication. The verifier confirms the claimant controls an authenticator bound to the subscriber account. Most consumer logins are AAL1. Reauthentication is required every 30 days.

**AAL2: High confidence.** Two distinct authentication factors required. A phishing-resistant authenticator option must be offered (though users can choose other options). Reauthentication every 24 hours, with a 1-hour inactivity timeout.

**AAL3: Very high confidence.** Cryptographic key-based authentication using a hardware-bound, non-exportable private key. Phishing resistance is mandatory, not optional. Reauthentication every 12 hours, with a 15-minute inactivity timeout.

| | AAL1 | AAL2 | AAL3 |
|---|---|---|---|
| Factors required | 1+ | 2 (distinct) | 2 (one must be hardware-bound crypto) |
| Phishing resistance | Not required | Must be offered | Mandatory |
| Session timeout (absolute) | 30 days | 24 hours | 12 hours |
| Inactivity timeout | Not specified | 1 hour | 15 minutes |

The common mistake is deploying SMS OTP as a second factor and declaring AAL2 compliance. SMS OTP is a permitted authenticator at AAL2, but AAL2 also requires that a phishing-resistant option be offered. If SMS is the only option, you're not fully compliant. More on this in the authenticator sections below.

---

# Authenticator Types

The spec defines two categories: single-factor and multi-factor. Within each, there are several types.

## Single-Factor Authenticators

**Memorized secret (password):** Something you know. The most common authenticator. Minimum 15 characters for single-factor use. Discussed in detail in the next section.

**Look-up secrets:** A pre-shared list of one-time codes (think backup codes or printed recovery codes). Valid at AAL1 and AAL2.

**Out-of-band (OOB):** Authentication via a separate channel: SMS, voice call, or mobile push notification. The spec permits these at AAL1 and AAL2 but explicitly acknowledges their risks. Not phishing-resistant.

**Single-factor OTP:** A time-based (TOTP) or counter-based (HOTP) one-time code from a hardware token or authenticator app. Valid at AAL1 and AAL2. Not phishing-resistant.

**Single-factor cryptographic:** A hardware or software cryptographic device that requires proof of key possession. When the key is hardware-bound and non-exportable (a hardware security key used without a PIN), this qualifies at AAL1/AAL2 but not AAL3 on its own (AAL3 requires two factors).

## Multi-Factor Authenticators

**Multi-factor OTP:** An OTP device that requires activation via a second factor before generating codes (PIN or biometric to unlock the token). Valid at AAL2.

**Multi-factor out-of-band:** A push authenticator that requires a PIN or biometric before approving the request. Not phishing-resistant.

**Multi-factor cryptographic:** A hardware or software cryptographic device requiring activation (PIN, biometric). Hardware-bound and non-exportable variants satisfy AAL3 as a single authenticator.

**Biometric paired with physical authenticator:** A biometric that activates a cryptographic device. The biometric is not a separate factor: it's an activation mechanism for the physical authenticator.

## The Biometric Clarification

Biometrics are not an independent authentication factor in this framework. A fingerprint or face scan doesn't prove possession of a key or knowledge of a secret. It unlocks access to a physical authenticator that does.

This matters for AAL claims. "We use Face ID" doesn't mean your system does biometric authentication at the authentication layer. It means the device requires a biometric to access the key stored on that device. The authentication factor is the key, activated by the biometric.

## AAL Compatibility Matrix

| Authenticator Type | AAL1 | AAL2 | AAL3 |
|---|---|---|---|
| Password alone | Yes | No | No |
| Password + OTP | Yes | Yes | No |
| Password + hardware crypto | Yes | Yes | Yes (if hardware-bound) |
| MF cryptographic device (hardware) | Yes | Yes | Yes |
| SMS / voice OTP | Yes | Yes (with phishing-resistant option offered) | No |
| TOTP | Yes | Yes (with phishing-resistant option offered) | No |
| Passkey (syncable) | Yes | Yes | No |
| Hardware security key (non-exportable) | Yes | Yes | Yes (as part of MFA) |

---

# The Password Rules Have Changed

The 2017 guidelines started shifting password policy away from the composition-rule orthodoxy. 800-63B-4 finishes the job.

**Minimum length:**
- 15 characters for single-factor (password-only) use
- 8 characters when used as part of multi-factor authentication

**No composition rules.** Verifiers must not require mixtures of character types (uppercase, lowercase, numbers, symbols). The security argument for composition rules was always weak: they push users toward predictable substitutions (`P@ssw0rd`, `Tr0ub4dor`) without meaningfully expanding the effective keyspace. They make passwords harder to remember without making them harder to crack.

**No mandatory rotation** unless compromise is suspected or confirmed. Periodic rotation without cause also degrades security in practice: users increment a number at the end or cycle through a short list of variations.

**Blocklist requirement.** Verifiers must check new passwords against a list of known-compromised credentials. This means checking against breach databases like [Have I Been Pwned](https://haveibeenpwned.com/) or equivalent. Common passwords, dictionary words, and contextual guesses (username, service name) should also be blocked.

**Accept all printable ASCII and Unicode.** No character restrictions. And critically: verifiers must support paste. Blocking paste is a direct attack on password manager usability, which degrades real-world security.

If your system still enforces `Password must contain at least one uppercase letter, one number, and one special character`, that's now explicitly out of spec. The fix is straightforward: remove the composition check, add a minimum length and a blocklist check.

---

# Phishing Resistance: What It Actually Means

Phishing resistance means the authenticator's output is cryptographically bound to the specific origin it was issued for, so it can't be relayed to a different site.

The spec recognizes two mechanisms:

## Verifier Name Binding

The authenticator's output is cryptographically bound to the verified domain name of the verifier. When a browser-based authenticator (like a passkey) generates a signature, it includes the origin (the `rpId` in [WebAuthn](https://www.w3.org/TR/webauthn-3/) terms). The signature is only valid for that specific origin.

If an attacker sets up `yourbank-secure.com` and proxies the login, the passkey will refuse to sign: the origin doesn't match the registered `rpId`. The proxy gets nothing useful.

This is how passkeys work. The private key is bound to the relying party ID at registration time. Authentication at a different origin produces a signature that the real server will reject, because the assertion was made for a different domain.

## Channel Binding

The authenticator's output is bound to the specific TLS session between the client and the verifier. Even if an attacker proxies the connection, the binding breaks at the TLS layer: the client's session is with the proxy, not the real server, so the bound output won't verify.

Channel binding is stronger than verifier name binding because it operates at the transport layer, not the application layer. But it's also more complex to implement and less widely deployed.

## What Is Not Phishing-Resistant

TOTP codes are not phishing-resistant. They're time-bounded, but they can be proxied in real time. An AiTM proxy receives the TOTP from the victim, forwards it to the real site immediately, and the code is valid.

Push notifications are not phishing-resistant. The approval is tied to the authentication request, not to a specific origin or session.

SMS OTP is not phishing-resistant, and has additional risks (SIM swap, SS7 interception) on top of that.

At AAL2, you must offer a phishing-resistant authenticator option. At AAL3, the phishing-resistant authenticator is the only option.

---

# Syncable Authenticators (Passkeys) Are Now Explicitly Supported

800-63-3 was ambiguous about whether authenticators with exportable private keys could meet its requirements. The concern was: if the key can leave the device, the device-possession guarantee weakens. Some security teams interpreted this as prohibiting passkeys entirely. Others allowed them with caveats. Neither was clearly right.

800-63B-4 resolves this: syncable authenticators are explicitly permitted at AAL2, subject to conditions.

**The conditions:**

- Sync must be to an account or device bound to the subscriber. Apple iCloud Keychain syncing your passkeys to your other Apple devices is fine. Exporting a passkey to an arbitrary third party is not.
- Sync must be end-to-end encrypted. The sync provider must not have access to the private key in plaintext.
- The CSP must assess and accept the risk profile of the sync provider. This is a judgment call, but it means you can't just say "we support any passkey" and ignore where those keys are stored.

**The AAL3 ceiling remains.** Non-exportable keys are still required at AAL3. A passkey synced via iCloud Keychain satisfies AAL2. A YubiKey or other hardware security key with a non-exportable key satisfies AAL3.

In practice: if you're building a consumer-facing application that needs AAL2, passkeys are the right default. They're phishing-resistant, they don't require users to manage a hardware token, and they handle device migration better than most alternatives. For internal tools or high-stakes systems that need AAL3, you need hardware.

If you want more depth on passkeys specifically, the [passkey introduction post](/blogs/passkey-introduction) covers the WebAuthn registration and authentication ceremonies.

---

# Out-of-Band Authenticators and Their Limits

SMS OTP, voice calls, and push notifications are all "out-of-band" authenticators: they use a separate communication channel from the primary login flow. The spec permits them at AAL1 and AAL2, but it's explicit about their weaknesses.

**SMS OTP** is vulnerable to SIM swap attacks (attacker takes over your phone number) and SS7-based interception (theoretical for most threat models, practical for high-value targets). The spec acknowledges these risks and permits SMS anyway at AAL2, with the requirement that a phishing-resistant option is also offered.

The practical guidance: don't build SMS as your only MFA option at AAL2. It can be an option, but users who need higher assurance should have a path to a phishing-resistant authenticator.

**Push notifications** are convenient but not phishing-resistant. They're also vulnerable to approval fatigue attacks. The spec permits them at AAL2 as a second factor, but they don't satisfy the phishing-resistance offer requirement on their own.

**Same-device vs out-of-band.** The "out-of-band" security model assumes the second channel is independent of the first. If the user is logging in on their phone and the push notification goes to the same phone, you've lost the out-of-band property. The spec doesn't prohibit same-device flows, but it's worth understanding that the threat model is different: same-device delivery doesn't protect against malware that controls the device.

---

# Session Management

Authentication produces a session. Sessions need lifecycle management. The spec is specific about timeout requirements at each AAL.

**AAL1:** Reauthentication required at least every 30 days. No inactivity timeout specified (though good practice is to have one).

**AAL2:** Reauthentication required after 24 hours regardless of activity. If the session has been inactive for 1 hour, reauthentication is required before continuing.

**AAL3:** Reauthentication required after 12 hours regardless of activity. If inactive for 15 minutes, reauthentication is required.

The distinction between an **absolute timeout** (session expires after X hours from creation) and an **idle timeout** (session expires after X minutes of no activity) matters here. AAL2 and AAL3 both require both. An active user who has been logged in for 25 hours at AAL2 must reauthenticate, even if they've been actively using the service.

**Step-up authentication** is the right pattern for high-risk actions within a session. Rather than requiring the user to fully reauthenticate for every sensitive operation, you confirm they still control their authenticator at the moment of the sensitive action. Accessing payment settings, changing email address, or approving a large transaction are all candidates for step-up. The step-up challenge should be at the same AAL as the session.

**Session binding** requirements: sessions must be bound to the assertion from the verifier, and the verifier must be the expected one (relevant for federated flows, covered in Post 4).

---

# Account Recovery Without Undermining AAL

Account recovery is where authentication security most often collapses. The effort that went into an AAL2 login flow is wasted if the recovery path bypasses it.

The rule is straightforward: recovery must not allow access at a higher assurance level than what the recovery mechanism itself provides. If you recover an account with an email link (roughly AAL1 equivalent), you shouldn't immediately have full AAL2 access to the account. The session established through recovery should be appropriately constrained until the subscriber re-establishes their full authenticator.

**Knowledge-based verification (security questions) is prohibited.** The same reasoning that prohibits KBV in identity proofing (Post 2) applies here. The answers are often derivable from public records, social media, or previous data breaches. "What was your childhood pet's name?" is not a meaningful security control for account recovery.

**Acceptable recovery at AAL2** looks like: a verified communication channel (email or phone number established during enrollment), combined with requiring the subscriber to register a new authenticator after access is restored. The recovery step proves they control the registered contact, not that they can authenticate at AAL2 immediately.

**Acceptable recovery at AAL3** is harder and more restrictive. Because AAL3 requires a specific hardware-bound key, losing that key is a serious event. Recovery options include: a pre-registered backup hardware key, recovery codes stored at enrollment time, or an in-person identity reverification process. The bar is high by design.

---

# Putting It Together

The practical takeaway from 800-63B-4 is a hierarchy of authenticator strength:

1. **Hardware security key (non-exportable):** AAL3 capable. Phishing-resistant via verifier name binding. Required for the highest assurance use cases.
2. **Passkey (platform authenticator, synced):** AAL2 capable. Phishing-resistant. The right default for consumer-facing systems that need to balance security and usability.
3. **TOTP / authenticator app:** AAL2 capable, but not phishing-resistant. Better than SMS, not as good as a passkey.
4. **SMS OTP / push notification:** AAL1/AAL2 permitted, with acknowledged weaknesses. Acceptable as one option; not acceptable as the only option at AAL2.
5. **Password alone:** AAL1 only, with specific length requirements and mandatory blocklist checking.

If you're auditing an existing system: check whether your AAL2 offering includes a phishing-resistant option, verify your password policy doesn't enforce composition rules, confirm your session timeouts are correct for the AAL you're targeting, and make sure your recovery path doesn't undercut the assurance level you've built.

Post 4 covers what happens after authentication: how that authentication event is conveyed across trust boundaries via federation, what the assertion security requirements look like, and how the new subscriber-controlled wallet model changes the IdP's role.
