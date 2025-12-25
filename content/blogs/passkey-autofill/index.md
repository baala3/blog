---
title: 'Passkey Autofill for seamless passwordless authentication'
date: "2024-02-02T14:44:43+09:00"
url: "/blogs/passkey-autofill/passkey-autofill"
description: ""
tldr: ""
image: "https://res.cloudinary.com/dbulfrlrz/images/f_auto,q_auto/v1711015576/wp-pme/what-is-a-passkey2x/what-is-a-passkey2x.?_i=AA"
credit: ""
thumbnail: "https://res.cloudinary.com/dbulfrlrz/images/f_auto,q_auto/v1711015576/wp-pme/what-is-a-passkey2x/what-is-a-passkey2x.?_i=AA"
categories:
- passkeys
- autofill
---

In the previous blog, we understood of **what passkeys are** and **how they can be deployed in web application**.

In this post, we’ll move next step and talk about the next major piece: **passkey autofill**.
<!--more--> 
This feature plays a crucial role in making passkeys practical at scale, especially when migrating from passwords without breaking existing user experience.  

# What and Why: Passkey Autofill

Traditional WebAuthn-based sign-in solves one big problem: **passwordless authentication**.

But, from **user’s point of view**, it still introduces some noticeable pain points.

## 1. Authentication prompt feels unintuitive
In a typical WebAuthn sign-in flow, the user:

1. Enters their email
2. Clicks “Sign in”
3. Immediately sees a biometric prompt (Face ID / fingerprint)

This sudden authentication prompt feels *out of context*.
Before WebAuthn, users were never asked for biometrics **before** selecting an account or intent to authenticate.
Because of this, the transition from passwords to passkeys feels abrupt and confusing for many users.

## 2. Prompt appears even when no passkey exists on device

As mentioned in the [WebAuthn specification](https://w3c.github.io/webauthn/#sctn-assertion-privacy), relying party **cannot know in advance** whether a passkey exists on the current device before calling `navigator.credentials.get()`.

That means:
- A user has a passkey registered for their account
- They try to sign in from a device that **does not have that passkey**
- The browser still shows the WebAuthn authentication prompt

This leads to unnecessary friction and confusion, especially when users eventually need to cancel and fallback to password-based login.

Below video shows this clearly:

<iframe width="100%" height="400" src="https://www.youtube.com/embed/Gh2mwrAc8PM?si=5bqvuCyp68n-J2SA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Even if you separate password and passkey flows, this problem still exists and hurts the goal of a **seamless migration to passkeys**.

**This is where passkey autofill helps.**  

Its biggest advantage is enabling a *unified UX* for both password and passkey sign-in without forcing users to understand the difference.

---

# How Passkey Autofill Enables Seamless Transition

To support **seamless passkey authentication** without degrading the existing password flow, browsers introduced what was originally called **WebAuthn Conditional UI**.

Community explainer:  
https://github.com/w3c/webauthn/wiki/Explainer:-WebAuthn-Conditional-UI

In May 2022, Apple, Google, and Microsoft released a [joint statement](https://fidoalliance.org/apple-google-and-microsoft-commit-to-expanded-support-for-fido-standard-to-accelerate-availability-of-passwordless-sign-ins/) committing to expanded support for passkeys. As part of that effort, Apple introduced passkey autofill at [WWDC 2022](https://developer.apple.com/videos/play/wwdc2022/10092) and Google announced similar support for [Android and Chrome](https://android-developers.googleblog.com/2022/10/bringing-passkeys-to-android-and-chrome.html).

Passkey autofill allows browsers to:
- Show **available passkeys automatically**
- Only display passkeys that exist **on the current device**
- Integrate passkeys into the familiar browser autofill UI

Instead of triggering authentication prompts blindly, the browser surfaces passkeys **only when they are actually usable**.

Rather than explaining this in theory, the difference becomes obvious when you see it in action.

<iframe width="100%" height="400" src="https://www.youtube.com/embed/mYwBjLm5-p8?si=_o_T1XcsoMD1jIgf" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

> Note:  
> If you want to sign in using a passkey stored on another device, most password managers provide an option like **“Use a passkey from another device”**, which typically triggers a QR-code based flow.

## Merits of Passkey Autofill
- The sign-in experience closely matches traditional username/password, which users already convenient with.
- It enables gradual transition from passwords to passkeys **without explicitly teaching users** about passkeys.
- Existing password login UX remains untouched.
- Users are only prompted to use passkeys **when passkeys are actually available** on the device.
- When no passkey exists, the flow naturally falls back to password input—no dead-end prompts.

This approach allows teams to adopt passkeys without forcing a “big switch” or disrupting user behavior.

---

# Autofill DeepDive

<!-- TODO -->
coming soon...
