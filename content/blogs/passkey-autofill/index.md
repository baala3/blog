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

Below is a simplified sequence diagram showing how passkey autofill works end to end.

<img src="./autofill_flow.png" style="display: block; margin: 0px auto;"/>

Here is the sample frontend code should be executed when the page loads (for example, using useEffect in React).

```js
const sendAuthenticatorResponseIfWebauthnAvailable = async () => {
  try {
    // if browser is webauthn-compatible, fetch options from server
    if (!(navigator.credentials &&
      navigator.credentials.create &&
      navigator.credentials.get &&
      window.PublicKeyCredential &&
      await PublicKeyCredential.isConditionalMediationAvailable())) {
      return false;
    }

    const optionsJSON = await backend.fetchWebauthnAssertionOptions();
    if (optionsJSON != null) {
      options = webauthn.parseRequestOptionsFromJSON(optionsJSON);
    } else {
      return null;
    }

    options['mediation'] = 'conditional';

    const response = await navigator.credentials.get(options);
    return await backend.postWebauthnAssertion(response.toJSON()); // send the authenticator response to the backend
  } catch (e) {
    console.log(e);
    return null;
  }
};
```

## TL;DR:
- Check if WebAuthn and conditional mediation are supported
- Fetch assertion options from the backend
- Call `credentials.get()` with mediation: "conditional"
- Enable browser autofill for passkeys

## Step 1: Check availability of WebAuthn and conditional mediation

First, we need to ensure that:
1. browser supports WebAuthn
2. browser supports conditional mediation (passkey autofill)

Conditional mediation availability can be checked using async API:
https://w3c.github.io/webauthn/#dom-publickeycredential-isconditionalmediationavailable

```js
if (!(navigator.credentials &&
  navigator.credentials.create &&
  navigator.credentials.get &&
  window.PublicKeyCredential &&
  await PublicKeyCredential.isConditionalMediationAvailable())) {
  return false;
}
```

If this check fails, application should fall back to normal password flow.

## Step 2: Fetch assertion options from backend

Next, frontend needs PublicKeyCredentialRequestOptions object.
Since the challenge must be generated server side, frontend requests it from the backend.

```js
const optionsJSON = await backend.fetchWebauthnAssertionOptions();
if (optionsJSON != null) {
  options = webauthn.parseRequestOptionsFromJSON(optionsJSON);
} else {
  return null;
}
```
backend call:
```js
const fetchWebauthnAssertionOptions = async () => {
  const response = await fetch(options_webauthn_assertion_path(), {
    method: 'POST',
    body: {},
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  switch (response.status) {
    case 200:
      return response.json();
    default:
      return null;
  }
};
```
backend returns an options object similar to following:

```js
{
  "publicKey": {
    "challenge": "DZ5BwnKQoeJK9RPrB0FEyjD7qnFLXUsEZ8lPKnK_jzU",
    "timeout": 120000,
    "extensions": {},
    "allowCredentials": [],
    "userVerification": "required"
  }
}

```

**Why is allowCredentials empty?**: For passkey autofill, we want browser to show all passkeys available on the device, not just those prefiltered by server.

By setting allowCredentials to an empty array, browser can surface any matching passkey and users can sign in to any account associated with the device’s passkeys

This is main difference from traditional WebAuthn flows.

## Step 3: Call `credentials.get()` with conditional mediation
If we call `credentials.get()` using the options above as-is, the browser will immediately show a biometric prompt exactly what we want to avoid.

To enable autofill behavior, we must explicitly set:

```js
options['mediation'] = 'conditional';
const response = await navigator.credentials.get(options);
```

The final `options` object looks like:

```js
{
  "publicKey": {
    "challenge": "DZ5BwnKQoeJK9RPrB0FEyjD7qnFLXUsEZ8lPKnK_jzU",
    "timeout": 120000,
    "extensions": {},
    "allowCredentials": [],
    "userVerification": "required"
  },
  "mediation": "conditional"
}
```
with `mediation: "conditional"`:
- No authentication prompt is shown on page load
- The Promise returned by `credentials.get()` remains pending
- It resolves only when user selects passkey and completes authentication

## Step 4: Enable passkey suggestions via autocomplete
Calling `credentials.get()` alone is not enough.
To actually display passkey suggestions, we must update input field.

Browsers display passkey autofill suggestions only when input element includes webauthn in its autocomplete attribute.

```js
<input
    required
    type="email"
    name="email"
    autoComplete="username webauthn"
/>
```
Once this is set, available passkeys appear automatically when page loads.

## Step 5: User selects a passkey (user involvment starts from here)
When user clicks passkey suggestion and completes local authentication:
- The previously pending `credentials.get()` Promise resolves
- and authenticator response is returned to the frontend

At this point, we forward the response to the backend for verification.

```js
const response = await navigator.credentials.get(options); // Promise will be resolved when local authentication succeeds
return await backend.postWebauthnAssertion(response.toJSON()); // send the authenticator response to the backend
// redirect, sign in user, etc...
```
If verification succeeds, user is signs in.

## Step 6: No passkey is available (or user ignores autofill)
If:
- No passkeys exist on the device, or
- The user ignores the passkey suggestions and submits the form manually

Then the flow behaves like normal login form submission. In our case, user is redirected to a password entry page.

---

# Conclusion

Passkey autofill is important step in making passkeys usable in real-world applications.
While it doesn’t solve every problem in the passkey ecosystem, it removes the biggest UX challenges that previously slowed adoption.

It enables <u>seamless transition</u> from passwords to passkeys by automatically checking best available sign in option, <u>avoids unnecessary authentication prompts</u>, and <u>unifies passkeys with the familiar browser autofill experience</u>, and when no passkey is available, the <u>flow gracefully falls back to passwords</u>.

Overall, passkey autofill allows teams to adopt passkeys incrementally without breaking existing login flows or adding friction. But... there are some

## Problems that still exist in passkey world

- **Autofill depends on email/username input fields, so autofill does not work if**  
  - There is no email/username input field
  - The email is prefilled programmatically
  - The email is displayed as plain text instead of an input element

- **Password managers may override autofill behavior**  
  Some password managers inject their own UI or autocomplete values, interfering with native passkey autofill.

- **Limited developer control over browser behavior**  
  Much of the autofill UX is browser and password manager control, leaving RPs with limited ability to customize or debug edge cases.

- **Passkey deletion from server doesn't sync with password managers**  
  Deleting a passkey from service does not delete from authenticators/password managers leaving  orphaned credentials or sometimes confuses the user.

- **No standardized recovery story**  
  Account recovery after device loss is still inconsistent and often falls back to passwords, email links, or manual support workflows.

---

I hope, the community moves fast on these gaps, so one day we can 100% use passkeys and completely forget the password method and “forgot password” tensions 😄.
