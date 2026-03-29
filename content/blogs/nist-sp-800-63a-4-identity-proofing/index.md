---
title: 'NIST SP 800-63A-4: How to Prove Someone Is Who They Say They Are'
date: "2025-01-05T00:00:00+09:00"
url: "/blogs/nist-sp-800-63a-4-identity-proofing"
description: "A technical breakdown of NIST SP 800-63A-4's identity proofing model: assurance levels, evidence tiers, biometric requirements, deepfake defenses, and fraud management for engineers building or evaluating KYC systems."
tldr: "SP 800-63A-4 defines a three-step proofing model (resolve, validate, verify) across three assurance levels, with specific rules for evidence quality, biometric thresholds, remote session types, and controls for AI-generated forgeries. Document scanning is not identity verification."
image: "blogs/nist-sp-800-63a-4-identity-proofing/image.svg"
credit: "https://pages.nist.gov/800-63-4/sp800-63a.html"
thumbnail: "blogs/nist-sp-800-63a-4-identity-proofing/thumbnail.svg"
categories:
- Identity
- Security
- NIST
classes:
- feature-mermaid
---

[NIST SP 800-63A-4](https://pages.nist.gov/800-63-4/sp800-63a.html) is the identity proofing volume of the 800-63-4 suite. It defines exactly what "verified identity" means at each assurance level, what evidence qualifies, how to handle the cases that break the happy path, and what your fraud program needs to look like. <!--more--> 

If you have integrated a KYC provider, you've probably been told something like: "the user uploads their ID, we scan it, we do a selfie match, done." That description is not wrong, but it skips over several details that matter when your threat model includes fraud at scale, synthetic media, or users who can't produce a standard government ID.

Ok, let start with part2 dive in.

---

**Series: NIST SP 800-63-4**
- Part 1: [SP 800-63-4 => The Framework, Assurance Levels, and Risk Management](/blogs/nist-sp-800-63-4-overview)
- **Part 2 (this blog):** SP 800-63A-4 => Identity Proofing and Enrollment
- Part 3: [SP 800-63B-4 => Authentication and Authenticator Management](/blogs/nist-sp-800-63b-4-authentication)
- Part 4: [SP 800-63C-4 => Federation and Assertions](/blogs/nist-sp-800-63c-4-federation)

---

# The Problem with "Just Verify the ID"

Document scanning solves one problem: is this document real? It doesn't answer: is this the right person presenting it?

Identity proofing has three distinct failure modes, and they require three distinct controls:

1. **Wrong person:** A real, valid document belonging to someone else. Stolen passport, family member's ID, purchased identity. The document passes every check; the person holding it just isn't the person on it.
2. **Fake document:** Forged or altered document. Passes visual inspection, fails forensic checks against the issuing authority.
3. **Manipulated media:** In remote flows, the video or image feed itself is synthetic. A deepfake face, a virtual camera injecting pre-recorded footage, or a device emulator replaying a known-good session.

800-63A-4's three-step model maps directly onto these failure modes. Resolution and validation address document authenticity. Verification addresses whether the applicant is the person the document belongs to. Deepfake and injection controls address the third failure mode, which is new enough that 800-63-3 didn't cover it.

---

# The Three-Step Proofing Model

```mermaid
flowchart TD
    A([Applicant]) --> B["1. Resolution\nCollect evidence, establish user identity"]
    B --> C["2. Validation\nConfirm evidence is authentic, accurate, and current"]
    C --> D["3. Verification\nLink applicant to the validated identity"]
    D --> E([Subscriber — enrolled, authenticator bound])
```

## Resolution

Collect evidence and attributes to establish a unique user identity. At this step you're asking: based on what the applicant has provided, who do we think this person is?

This means collecting core attributes: full name, date of birth, address, and government identifier (SSN, passport number, etc). The goal is to resolve to a single, unique individual. If your collected attributes match multiple records, you haven't resolved yet.

## Validation

Confirm that the evidence provided is genuine and current. This is where you check against authoritative sources.

An **authoritative source** is an entity that issued or maintains the record: the DMV for a driver's license, the passport authority for a passport, a credit bureau for address history. Validation means the data in the document matches what that authority has on record, not just that the document looks real.

"Credible sources" (not authoritative, but reliable) are also permitted for some attributes. A recent bank statement is a credible source for an address even if no single authority issued it.

## Verification

Establish that the applicant in front of you is the same person the validated identity belongs to. This is where facial comparison, biometrics, or other binding mechanisms come in.

Validation proves the document is real. Verification proves the person holding it has a right to it.

---

# Identity Assurance Levels

## IAL1

No formal identity proofing required. The claimed identity may or may not correspond to a real person. Basic attribute validation is optional.

IAL1 is appropriate when the consequences of fraudulent enrollment are low. A comment based form, a freemium SaaS tool, a public newsletter. The spec supports it explicitly, and a lot of systems are over-built relative to what their actual risk profile requires.

## IAL2

The identity is linked to a real person with reasonable confidence. Requires enhanced evidence, rigorous validation against authoritative sources, and verification that the applicant matches the identity. Includes controls against scaled attacks and evidence falsification.

IAL2 can be done remotely or on-site, attended or unattended. Most commercial KYC products target IAL2.

## IAL3

Maximum confidence. Requires:
- In-person, attended session with a trained proofing agent
- Collection of biometrics (typically facial image)
- The highest tier of evidence (see below)

IAL3 is for high stakes services: government benefits with significant financial value, access to sensitive federal systems, situations where the cost of a fraudulent enrollment is severe.

| | IAL1 | IAL2 | IAL3 |
|---|---|---|---|
| Evidence required | None | SUPERIOR, or STRONG + FAIR | SUPERIOR + STRONG, or two STRONG |
| Verification method | None required | Facial comparison, biometric, or document control check | Biometric + trained agent comparison |
| Delivery model | Any | Remote or on-site, attended or unattended | In-person attended only |
| Biometric collection | Not required | Required for remote unattended | Required |

---

# Evidence Tiers: FAIR, STRONG, SUPERIOR

The spec also classifies identity evidence into three tiers based on how reliably it establishes a real identity.

## FAIR

Formally issued by a recognized authority. Includes the applicant's name and a unique identifier (account number, reference number). Has basic security features, and delivery was confirmed (mailed to an address, for example).

Examples: utility bill, bank statement, government correspondence, library card.

FAIR evidence establishes that someone received mail at an address or held an account. It doesn't strongly establish who they are.

## STRONG

Issued under a regulated process with legal oversight. Requires a facial image or biometric. Has physical or digital security features (holograms, chips, encoded data). Capable of cryptographic validation (even if not always exercised).

Examples: driver's license, national ID card, standard passport.

Most KYC flows are built around STRONG evidence. It's what most people carry, it's what most automated scanners are built to read, and it's sufficient for IAL2 when combined with facial verification.

## SUPERIOR

Highest tier. Attributes are cryptographically protected. Enrollment was attended. The document can be verified via digital signature rather than just visual or database checks.

Examples: chip-enabled passports (where the chip is actually read and the signature verified), some national digital ID schemes.

A standard passport photographed and OCR'd is STRONG. The same passport with the chip read, the data extracted, and the issuing authority's digital signature verified is SUPERIOR. The physical document is the same; what makes it SUPERIOR is the verification method.

## Combining Evidence for IAL2 and IAL3

Meeting IAL2 requires one of:
- One piece of SUPERIOR evidence
- One piece of STRONG evidence plus one piece of FAIR evidence

Meeting IAL3 requires one of:
- One piece of SUPERIOR evidence plus one piece of STRONG evidence
- Two pieces of STRONG evidence (with specific verification method requirements)

The combinations matter. If your IAL2 flow accepts a driver's license (STRONG) and a bank statement (FAIR), you're within spec. If you accept only a driver's license with no second piece of evidence, you need the verification method to compensate.

---

# Proofing Delivery Models

Identity proofing session is conducted and is separated from the assurance level. The spec defines four delivery models:

**Remote unattended:** Fully automated. No CSP agent in the loop. The applicant submits documents and completes facial comparison through an app or web flow. This is what most consumer KYC products deliver. Permitted at IAL2, not IAL3.

**Remote attended:** A video session with a CSP proofing agent or trusted referee. The agent watches the session in real time, can ask questions, and can make judgment calls. Permitted at IAL2 and IAL3.

**On-site unattended:** A controlled public booth or workstation where the applicant interacts with an automated system in person. Permitted at IAL2.

**On-site attended:** A physical location with proofing agent present. The classic DMV or bank branch model. Permitted at all IALs.

One practical consequence: if you're using a third-party KYC provider that operates a fully automated remote flow, you're in remote unattended territory. That model is legitimate for IAL2, but it has a ceiling. IAL3 requires an attended session, which most off-the-shelf KYC APIs don't offer. If you need IAL3, you need a provider that supports supervised video proofing or an in-person channel.

---

# Biometrics: Requirements and Constraints

Biometrics in identity proofing are used for two purposes: 
- **verification** (1:1 match between the applicant and their document)
- **binding** (establishing a biometric that can be used for future recognition). 

The requirements differ slightly, but the baseline performance thresholds apply to both.

**Performance thresholds:**
- False match rate: no more than 1 in 10,000 (1:10,000)
- False non-match rate: no more than 1 in 100 (1:100)
- Demographic performance gap: no more than 25% variance in error rates across demographic groups

The demographic requirement is important. If system performs well for one group but significantly worse for others, it does not meet the specification. This means testing must include representative populations, not just overall averages.

**Independent testing is mandatory.** Biometric performance cannot be self-certified. The testing must be done by an independent party using standards such as [ISO/IEC 19795](https://www.iso.org/standard/41447.html) (biometric performance testing) and [ISO/IEC 30107-3](https://www.iso.org/standard/67381.html) (presentation attack detection).

**Consent and deletion:**
- Applicants must give explicit informed consent before collecting biometrics.
- They must be told how the biometric will be used, how long it will be stored, and when it will be deleted.
- Organizations must Document and enforce biometric deletion policies.
- They must also docuement any regulatory exceptions that require longer retention.

If your KYC provider that handles biometrics for you, their performance reports and independent testing results become part of your compliance evidence. You can request these from them.

---

# Defending Against Deepfakes and Injection Attacks

This section is mostly new in 800-63-4. The previous version didn't address synthetic media because it wasn't a practical threat at scale in 2017. but it is now.

## What "Digital Injection" Means

In a remote proofing flow, the applicant typically opens a camera to capture their face and document. A digital injection attack replaces the real camera feed with synthetic content before it reaches the CSP's proofing system. The three main variants:

- **Virtual camera spoofing:** A software-based virtual camera replaces the physical camera, injecting a pre-recorded or generated video stream.
- **Device emulator injection:** The proofing session runs inside an emulated device environment that can replay known-good session data.
- **Manipulated media:** Real footage that has been altered (a deepfake overlay on a live feed, or a replay of a previous legitimate session).

The attack surface is the gap between the applicant's physical camera and the CSP's receipt of the media. If that gap can be exploited, the rest of your proofing controls are checking a fabricated input (as shown in image below).

```mermaid
flowchart LR
    cam[Physical Camera] -->|legitimate| csp[CSP Proofing System]
    cam -.->|intercepted| atk["Virtual camera / emulator /\ndeepfake injection"]
    atk -.->|synthetic feed| csp
```

## Required Controls

For remote unattended proofing, the following controls are now required, (not recommended):

- **Virtual camera detection:** The system must detect and reject sessions where a virtual camera driver is substituted for a physical camera.
- **Device emulator detection:** The system must detect when the session is running inside an emulated device.
- **Manipulated media analysis:** Submitted images and video must be analyzed for signs of manipulation, including generative AI signatures and splice artifacts.

Passive forgery detection is also required: the system should analyze media without requiring the applicant to perform active liveness tasks (though active liveness checks can be used in addition).

The goal is not about blocking a small number of sophisticated attackers. Deepfake tooling is cheap and widely available. If your remote proofing flow can be bypassed by a freely downloadable virtual camera app and a generated face image, then it is not IAL2.

---

# Exceptions: Trusted Referees, Minors, Edge Cases

No identity proofing system works for everyone. The spec recognizes this and treats equitable access as a requirement, not a nice-to-have.

## Trusted Referees

A trusted referee is a trained and approved person (either a CSP employee or a contracted third party) who helps applicants who cannot complete the normal proofing process. This includes:

- People with disabilities who cannot complete biometric capture
- Unhoused individuals without a fixed address
- Identity theft victims whose records are flagged or disputed
- Elderly users unfamiliar with digital proofing flows
- Non-citizens whose documents are not in the standard evidence list

Trusted referees must be identity-proofed themselves, trained in document validation and facial comparison, and trained to detect social engineering attempts. They are supervised exception path, not a shortcut around identity proofing.

## Applicant References

An applicant reference is a person who vouches for the applicant when standard evidence is not available. Unlike trusted referees, the reference is chosen by the applicant, not the CSP.

One key rule: the reference must be identity-proofed at the same or higher IAL as the enrollment being attempted. An unverified person cannot vouch for someone at IAL2.

## Automated Biometric Rejection Requires Manual Review

If an automated biometric system rejects an applicant, that decision cannot be final without human review. The goal is to confirm the rejection isn’t a false non-match.

In practice, this means your proofing flow must support manual escalation. If a KYC provider’s API returns a rejection, a trained reviewer should be able to examine the case before closing it.

## Minors

CSPs must establish written policies for applicants under 18. For applicants under 13, [COPPA](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa) compliance is required. Applicant references are supported for minor enrollment.

---

# Fraud Management Program Requirements

Individual proofing controls can fail if attackers target them one by one. The spec requires CSPs to run a fraud management program, not just rely on isolated checks.

**Required elements:**

- **Death record checking:** Compare applicant identity against death records to detect stolen or synthetic identities tied to deceased individuals.
- **Device fingerprinting and tenure evaluation:** Evaluate the device used during enrollment. ex: a new device with no history attempting to enroll high-value identity is signal worth investigating.
- **Transaction analytics:** Analyze behavior during the enrollment flow. Signals can include unusual completion times, repeated attempts with small variations, or patterns suggesting automation
- **Insider threat controls:** Proofing agents have access to sensitive data and can influence outcomes. Systems must include controls to detect agent-assisted fraud.
- **Real-time fraud communication to RPs:** If fraud is discovered after enrollment, the CSP must notify relying parties in real time.
- **Red team testing:** Periodic adversarial testing of the proofing system is required to identify weaknesses.

**SIM swap detection** Not mandatory, but strongly recommended because SIM swaps are often used in account takeover attacks after enrollment.

**Knowledge-based verification (KBV) is prohibited for identity verification.** The spec explicitly bans using security questions or knowledge checks ("what was the name of your first car?") as a proofing mechanism. These checks are weak because the answers can often be found through public records, social media, or data breaches.

KBV can still be used as a fraud signal, but it cannot be used to verify identity. If an IAL2 proofing flow relies on KBV as a primary verification step, it needs to be replaced.

---

# Conclusion

Most commercial KYC providers (Jumio, Onfido, Persona, Stripe Identity, etc.) cover a subset of what 800-63A-4 requires. They handle document scanning, OCR, facial comparison, and increasingly liveness detection. But meeting the full specification usually requires more than what these tools provide out of the box:

- Their biometric performance documentation, including demographic parity data
- Evidence that their anti-injection controls meet the normative requirements (virtual camera detection, emulator detection)
- Clear policies for automated rejection and manual review
- Fraud reporting capabilities, such as notifying you in real time if a previously proofed identity is later flagged

The specs applies to CSP, which is usually you, not the vendor. Third-party KYC tools are just components in your proofing pipeline. Using them does not transfer the compliance responsibility.

Ok, now identity proofing is done and you have a subscriber, how do you authenticate them at AAL1, AAL2, and AAL3? 

we will see that in blog3...
