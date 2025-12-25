---
title: 'My RubyKaigi 2024 Experience'
date: "2024-05-19T21:38:32+09:00"
url: "/blogs/rubykaigi2024/rubykaigi2024"
description: "My business trip report from RubyKaigi 2024 in Okinawa, covering my favorite technical talks."
tldr: ""
image: "https://i.ibb.co/GQQN5BnW/rubykaigi.jpg"
credit: ""
thumbnail: "https://rubykaigi.org/2024/images/main-visual__front-4ae3fe66.svg"
categories:
- Ruby
- BusinessTrip
---

Hi, I’m Bala 👋

I joined [Money Forward](https://moneyforward.com/) in 2022 and have been working closely with Ruby on the ID team ever since. This year, I got the opportunity to attend [RubyKaigi 2024](https://rubykaigi.org/2024/)  <!--more-->in Okinawa as part of a company business trip. Huge thanks to Money Forward for making this possible!

This was my first RubyKaigi, and I was honestly very excited. Not just because it was my first time attending, but also because I finally got to meet Ruby developers from all over the world, people who actively work on Ruby itself, popular gems, and large scale production systems.

RubyKaigi felt like much more than just a series of talks. It was a deep dive into Ruby’s internals, performance, security, and future direction. I felt like almost every session like I had learned something new that I could take back and apply (or at least think about) in my daily work.

Ok, with that being said, In this post, I want to share:
- My favorite talks and key takeaways from RubyKaigi
- The fun we had at the Money Forward sponsor booth.
- And of course, how it was traveling to Okinawa for the first time ✈️🌴

<img src="https://i.ibb.co/mrQKX3Pz/Whats-App-Image-Aug-19-2025.jpg" />

---

## Day 1: Concurrency, Security Pitfalls, and Ruby’s Playful Side

#### [Ractor Enhancements](https://rubykaigi.org/2024/presentations/ko1.html)

Ractor is Ruby’s way of handling to parallel execution using the Actor model. The Idea is instead of sharing memory between threads (which can easily lead to race conditions), Ractors communicate by sending messages to each other.

The talk explained why Ruby prefers object isolation between Ractors. When an object is passed from one Ractor to another, it is deeply copied, to prevent accidental shared-state bugs and makes execution safer.

**What Intresting here is the trade-off:**

Even though this design improves safety, it can impact performance because copying large or complex objects is expensive right?. I think Ruby prioritizes correctness and safety first, sacrificing some performance cost.


#### [Remembering (ok, not really Sarah) Marshall](https://rubykaigi.org/2024/presentations/segiddins.html)

This session focused on security risks of Ruby’s built-in Marshal library.

As we know `Marshal` is used for serializing and deserializing of Ruby objects, In this talk, the speaker highlighted how untrusted Marshal input can be dangerous. In worst cases, it can lead to deserialization vulnerabilities and even remote code execution too.

The solution is to validate deserialized data against an AST (Abstract Syntax Tree) before restoring objects. You can think like a “sanity check” layer that confirms the data matches expected structures before it becomes executable Ruby objects. This talk also stresses how careful we need to be with serialization formats in such sensitive code cases.


#### [Writing Weird Code](https://rubykaigi.org/2024/presentations/tompng.html)

This was one of the most fun talks of the day, explains the playful but powerful side of Ruby. The speaker used Ruby’s flexibility (dynamic method calls, constant redefinitions, even Unicode tricks) to write code that looked like pictures or behaved in unexpected ways. 

One ex: The ruby looks like goldfish swimming in bowl, and it is valid and executable code. It was fun to watch, and also let's you see the power of ruby metaprogramming and why it should be used carefully.

---

## Day 2: Type Safety, Playing Flappy Bird and cryptography

#### [Community-driven RBS Repository](https://rubykaigi.org/2024/presentations/p_ck_.html)

RBS is Ruby’s type signature language. It allows developers to describe method signatures, parameters, and return types without changing actual runtime behavior.

This talk explained how the community is building and maintaining RBS files for popular gems. With these type definitions, editors and tools can provide better autocomplete, type checking, and documentation.

It reminded me of how TypeScript brought more structure to JavaScript. I can see how RBS can help teams working on large Ruby codebases catch bugs earlier and make the code easier to understand for new developers.

#### [Leveraging Falcon/Rails for Real-Time Interactivity](https://rubykaigi.org/2024/presentations/ioquatix.html)

Falcon is a Ruby app server built on asynchronous I/O. Instead of blocking on network or file operations, it uses fibers to handle many concurrent tasks at once.

The speaker live coded simple version of Flappy Bird game using Rails + Falcon, showing how non-blocking I/O made the smooth real-time interactions. The highlight was when Matz-san (the creator of Ruby) came on stage to play the game. (haha)

It really showed a way how async programming in Ruby feel much more approachable and fun, and that Ruby can handle real-time use cases surprisingly well.

#### [Adding Security to Microcontroller Ruby](https://rubykaigi.org/2024/presentations/sylph01.html)

This was one of the most surprising talks for me.

The speaker showed how Ruby running on a Raspberry Pi Pico W, with networking and TLS encryption. He explained how Ruby bindings to OpenSSL make secure communication, even on very constrained hardware. Seeing Ruby used in embedded systems was inspiring, and seems like speaker has lot of passion for open source and security.

---

## Day 3: Memory Safety, Speeding Up Ruby, and A better Tooling

#### [Finding and Fixing Memory Safety Bugs in C with ASAN](https://rubykaigi.org/2024/presentations/KJTsanaktsidis.html)

Many parts of Ruby and many gems depends on C extensions, which means dealing with manual memory management.

This talk explained AddressSanitizer (ASAN), a tool that can detects memory issues like buffer overflows, use-after-free bugs, and memory leaks. The speaker showed how ASAN integrates into CRuby development and helps catch bugs that normal tests often very hard to find.

Even though I don’t write C extensions myself, this talk gave me a lot of respect for the effort that goes into keeping Ruby stable and safe.

#### [YJIT Makes Rails 1.7x Faster](https://rubykaigi.org/2024/presentations/k0kubun.html)

This was one of the most practical talks for me.

YJIT (Yet Another JIT) is Ruby’s JIT compiler, and in Ruby 3.3 it has been heavily optimized for real world Rails workloads like Rails apps. The speaker explained how YJIT compiles “hot” Ruby methods into native code, avoding repeated interpretation.

Benchmarks showed Rails apps running nearly 2x faster just by enabling YJIT. Since my team already uses YJIT in production, I picked up some tips on tuning it for even better performance.

#### [The State of Ruby Developer Tooling](https://rubykaigi.org/2024/presentations/vinistock.html)

This talk zoomed out a bit and looked at Ruby’s tooling ecosystem as a whole.

The key point was that Ruby’s biggest tooling challenge isn’t dynamic typing, but tool fragmentation—separate linters, formatters, debuggers, and type checkers that don’t always work well together.

Languages like Go and Rust solve this by shipping opinionated, built-in tools. The talk left me thinking that a more unified tooling approach could significantly improve onboarding and day to day development in Ruby.

---

## At Booth: Code Reviews and Conversations

Our booth was one of the liveliest spots there at the conference. 

We hosted a code review challenge, where attendees reviewes printed Ruby code and leave comments using sticky notes. It was interesting and fun to see the variety of feedback like some focused on formatting details, while others looked at design and readability.

<p style="text-align: center">✦✦Also matz-san (ruby founder) visited out booth, and we had a nice picture him✦✦</p>
<img src="https://i.ibb.co/N2vfTY7k/Whats-App-Image-Aug-19-2025-2.jpg" style="display: block; margin: 0 auto;"/>

We also handed out flyers with useful English phrases for code reviews. Interacting with so many passionate Ruby developers, talking about Money Forward, and seeing people genuinely engage with our activities was a great experience.

We ran a short survey asking visitors what they felt inspired to do after RubyKaigi, contribute to open source, try new Ruby features, or improve their own projects. As a small reward, participants received hand fans they could decorate with stickers. I think they need them, because it was hot Okinawa sun, and after some time, those were all around the venue. It was fun, interactive way to connect with attendees and see what motivated them to come for RubyKaigi.

---

## Exploring Okinawa: Kerama Islands and Okinawa World

After the conference ended on Saturday, we took a ferry to the Kerama Islands, about 40 minutes from Naha. Since we only had couple of days left, it was the perfect short trip. By chance, we also met another RubyKaigi attendee on the island and ended up chatting about Ruby and our favorite talks. Snorkeling in the crystal clear water and walking around the island was a refreshing break after intense week of technical sessions.

On Sunday, I explored more of Okinawa, including Okinawa World and Shuri Castle. I even tried Okinawa’s famous habu sake (🐍) at Habu Museum Park. After that, it was time to fly back to Tokyo.

<img src="https://i.ibb.co/j99LqhJq/Whats-App-Image-Aug-19-2025-1.jpg" style="display: block; margin: 0 auto;"/>

Attending RubyKaigi 2024 in Okinawa was truly an unforgettable experience. I came back with new technical knowledge, fresh perspectives, and meaningful connections. I’m excited to bring these learnings back to my work and share them with my teammates.
