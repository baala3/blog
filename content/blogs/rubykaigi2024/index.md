---
title: 'My RubyKaigi 2024 Experience'
date: "2024-05-19T21:38:32+09:00"
url: "/blogs/rubykaigi2024/rubykaigi2024"
description: ""
tldr: ""
image: "https://i.ibb.co/GQQN5BnW/rubykaigi.jpg"
credit: ""
thumbnail: "https://rubykaigi.org/2024/images/main-visual__front-4ae3fe66.svg"
categories:
- Ruby
- BusinessTrip
---

Hi, I’m Bala 👋
I joined [Money Forward](https://moneyforward.com/) back in 2022 and have been working with Ruby for the past two years on the authentication team. This year, I got the opportunity to attend [RubyKaigi 2024](https://rubykaigi.org/2024/) in Okinawa as part of a company business trip (a huge thanks to MoneyForward for giving this opportunity!).
 <!--more-->
It was my first time joining RubyKaigi and honestly, I was super excited. Not only because it was my first RubyKaigi, but also because I got to meet and learn from a lot of ruby developers around the world.

The conference turned out to be more than just talks, it was a deep dive into Ruby’s internals, performance, security, etc. I felt every session like I had learned something new that I can bring back to my daily work.

In this post, I want to share:
- My favorite talks and takeaways from RubyKaigi
- What Money Forward booth offered (since it is one the sponsers)
- And of course, how it was traveling to Okinawa, first time ✈️🌴

<img src="https://i.ibb.co/mrQKX3Pz/Whats-App-Image-Aug-19-2025.jpg" />

---

## Day 1: Concurrency, Security Pitfalls, and Ruby’s Playful Side

#### [Ractor Enhancements](https://rubykaigi.org/2024/presentations/ko1.html)
Ractor is Ruby’s way of handling parallel execution using the Actor model. Instead of sharing memory between threads (which often causes race conditions), Ractors communicate by passing messages. The talk explained why Ruby enforces object isolation (objects get deep-copied when passed between Ractors) and how this makes execution thread safe. I found it interesting that while this design improves safety, it also comes with performance trade offs since copying objects isn’t a bit expensive operation.


#### [Remembering (ok, not really Sarah) Marshall](https://rubykaigi.org/2024/presentations/segiddins.html)
This session focused on the dangers of Ruby’s in-built `Marshal` library. Marshal lets you serialize and deserialize Ruby objects, but it can be unsafe—malicious input can lead to deserialization attacks and even remote code execution. The speaker proposed a safer reimplementation where deserialized data was validated against an AST (abstract syntax tree) before being restored. It felt like adding a “sanity check” layer on binary data, which made a lot of sense for security-critical code.

#### [Writing Weird Code](https://rubykaigi.org/2024/presentations/tompng.html)
This talk showed the playful but powerful side of Ruby. The speaker used Ruby’s flexibility (dynamic method calls, constant redefinitions, even Unicode tricks) to write code that looked like pictures or behaved in unexpected ways. One example looked like a goldfish swimming in a bowl, yet was still valid Ruby code. While it was fun to watch, it also reminded me the power of metaprogramming. And as ruby developer one has really deep dive into it.

---

## Day 2: Type Safety, Playing Flappy Bird and cryptography

#### [Community-driven RBS Repository](https://rubykaigi.org/2024/presentations/p_ck_.html)
RBS is Ruby’s type signature language. It lets developers describe the shape of their code (methods, parameters, return values) without changing actual runtime behavior. This talk explained how the community has been contributing RBS files for popular gems, so editors and tools can provide smarter autocomplete and type checking. It reminded me of how TypeScript brought more structure to JavaScript, and I could see how gradual typing in Ruby could help teams like ours make large codebases safer and easier to work with.

#### [Leveraging Falcon/Rails for Real-Time Interactivity](https://rubykaigi.org/2024/presentations/ioquatix.html)
Falcon is a Ruby app server built on asynchronous IO. Instead of blocking on network or file operations, Falcon uses fibers to handle many requests at once. The speaker live-coded a version of Flappy Bird in the browser using Rails + Falcon, and the non-blocking IO made the game run smoothly. The coolest part was when he invited Matz (the creator of Ruby) to come on stage and play the game—it really showed how async programming can open up fun, interactive use cases in Ruby.

#### [Adding Security to Microcontroller Ruby](https://rubykaigi.org/2024/presentations/sylph01.html)
This was one of the most surprising talks for me. The speaker showed how Ruby could run on a Raspberry Pi Pico W and still handle networking and TLS encryption. He explained how Ruby bindings to OpenSSL enabled secure communication, even in such a constrained environment. It was inspiring to see Ruby applied in embedded systems, and the speaker’s passion for security and OSS really stood out.

---

## Day 3: Memory Safety, Speeding Up Ruby, and A better Tooling

#### [Finding and Fixing Memory Safety Bugs in C with ASAN](https://rubykaigi.org/2024/presentations/KJTsanaktsidis.html)
A lot of Ruby’s performance-critical pieces and many gems rely on C extensions, which means dealing with manual memory management. The talk introduced AddressSanitizer (ASAN), a tool that can detect memory errors like buffer overflows, use-after-free, or memory leaks. The speaker demoed how ASAN integrates with CRuby development and how it helped uncover subtle bugs in extensions that normal testing wouldn’t catch. Even though I don’t write C extensions myself, it gave me an appreciation for the effort the Ruby core team puts into keeping the language stable and safe.

#### [YJIT Makes Rails 1.7x Faster](https://rubykaigi.org/2024/presentations/k0kubun.html)
This was one of the most practical talks for me. YJIT (Yet Another JIT) is Ruby’s JIT compiler, and in Ruby 3.3 it’s been optimized heavily for real-world workloads like Rails apps. The speaker broke down how YJIT compiles “hot” Ruby methods into native code and avoids repeated interpretation. Benchmarks showed Rails apps running almost 2x faster just by enabling YJIT. Since my team already uses YJIT in production, I picked up some tips on tuning it for even better performance.

#### [The State of Ruby Developer Tooling](https://rubykaigi.org/2024/presentations/vinistock.html)
This session zoomed out to look at Ruby’s tooling ecosystem. The key point was that Ruby’s biggest tooling challenge isn’t dynamic typing (every dynamic language has that issue), but rather the fragmentation of tools—linters, formatters, debuggers, type checkers—all being separate and inconsistent. Languages like Rust and Go solved this by shipping opinionated, built-in tools with the compiler. The talk left me wondering if Ruby should aim for a similar unified approach. A stronger standard toolkit could make onboarding and day-to-day development much smoother for the community.

---

## At Booth: Code Reviews and Conversations
Our booth was one of the liveliest spots there. And we hosted code review challenge where attendees could review printed Ruby code and leave comments on sticky notes. It was fun to see the variety of approaches some were nitpicky about small formatting details, while others focused on design or readability.

<p style="text-align: center">✦✦Also matz-san (ruby founder) visited out booth, and we had a nice picture him✦✦</p>
<img src="https://i.ibb.co/N2vfTY7k/Whats-App-Image-Aug-19-2025-2.jpg" style="display: block; margin: 0 auto;"/>

We also handed out flyers with useful English phrases for code reviews. Overall, it felt really fun to interact with so many enthusiastic, Ruby developers, exchange ideas, sharing about MoneyForward and see people actively engaging with the exercises we set up.

We also ran a quick survey asking visitors what they felt most inspired to do after the conference, whether it was contributing to open source, or trying out new Ruby techniques. As a small reward, participants received hand fans they could decorate with stickers. I think they need them, because it was hot Okinawa sun, and you could spot them all around the venue during the conference. It was a fun, interactive way to connect with attendees and see what motivated them after RubyKaigi.

---

## Exploring Okinawa: Kerama Islands and Okinawa World

On Saturday, after the conference ended, we took a ferry to the beautiful Kerama Islands, about 40 minutes from the main island. Once we arrived, we even bumped into another RubyKaigi attendee and had a great chat about Ruby. Walking around the island and `snorkeling` in the crystal-clear waters was a refreshing break—a perfect way to unwind after a busy week of technical talks.

On Sunday, I explored more sightseeing spots in Okinawa, like Okinawa World and Shuri Castle. I also got to try Okinawa’s famous habu sake (🐍) at Habu Museum Park. After that, I flew back to Tokyo.

<img src="https://i.ibb.co/j99LqhJq/Whats-App-Image-Aug-19-2025-1.jpg" style="display: block; margin: 0 auto;"/>

Attending RubyKaigi in Okinawa was truly an unforgettable experience. I left not only with new knowledge and technical insights but also with inspiration and connections that I’m excited to bring back to my work and share with my colleagues.
