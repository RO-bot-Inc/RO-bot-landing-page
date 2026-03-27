---
title: "What Hundreds of Technician Conversations Taught Us About Building Better Tools"
date: "2026-03-18"
category: "Founder"
tags: ["Product Development", "Technician Feedback", "Founder", "Voice Technology"]
excerpt: "We spent months on shop floors before writing a single line of code. Here are the five things we heard over and over that shaped how we built RO.bot."
---

![Technician leaning over an engine with phone in hand](/blog-assets/7-what-technician-conversations-taught-us/technician-engine-phone.png)

Before we wrote a single line of code for RO.bot, I spent months in service departments. Not watching from the service drive. In the bays. Standing next to lifts, listening to compressors cycle, trying not to trip over drain pans.

I talked to techs between jobs. I sat with service advisors during morning dispatches. I watched warranty admins fight through denial queues at the end of the month. I bought a lot of coffee and asked a lot of questions.

What I heard changed everything about how we built this product. Five themes came up in nearly every conversation, across every brand, in every region we visited. Here is what those conversations taught us.

## 1. Technicians Are Great Communicators. Just Not On a Keyboard.

This was the first and most consistent thing I noticed. A tech would walk me through a brake inspection, explaining pad wear patterns, rotor thickness measurements, and caliper slide pin condition with total clarity. Detailed. Specific. Confident.

Then I would watch that same tech sit down at a terminal and type a three-line story that communicated almost none of what they just told me out loud.

![Tools and a keyboard side by side on a shop floor](/blog-assets/7-what-technician-conversations-taught-us/tools-and-keyboard.png)

It was not a knowledge problem. It was a medium problem. These are professionals who think and communicate verbally. They trained that way, they diagnose that way, and they explain repairs to each other that way. Asking them to switch to a keyboard and a tiny text box strips out everything that makes their communication effective.

That insight became the foundation of RO.bot. [Voice-first, not voice-optional](/product). The tech talks. The AI writes. The story captures what the tech actually knows, not the condensed version they can manage to type between jobs.

## 2. Documentation Quality Varies Wildly, Even in the Same Shop.

I expected documentation quality to vary between dealerships. It does. But I did not expect how much it varies between techs standing ten feet apart in the same shop.

One tech writes detailed, structured stories with measurements and root cause explanations. The tech in the next bay writes "brake pads worn, needs replacement" for every brake job. Same service manager. Same DMS. Same training. Completely different output.

The problem is obvious once you see it: documentation quality depends entirely on each individual tech's willingness and ability to type. There is no standardization layer. No quality floor.

This is why RO.bot grades every story against seven criteria before it goes to the advisor. Not to punish anyone, but to create a consistent baseline. When a C+ story gets flagged, the tech can add the missing detail with a quick voice note instead of rewriting the whole thing. The [report card feature](/product) raises the floor without slowing anyone down.

## 3. Their Software Was Built for Desks, Not Shop Floors.

Every tech I talked to had the same complaint, phrased a dozen different ways: the tools they are asked to use were not designed for people who work with their hands.

Tiny text fields. Multi-step workflows that require a mouse. Screens designed for a 24-inch monitor being used on a greasy shop terminal or a phone in a back pocket. No consideration for gloves, for noise, for the fact that you might be holding a flashlight in one hand and a phone in the other.

The people building these tools had never stood in a bay. You can tell.

We built RO.bot for the shop floor first. Large touch targets. Voice input as the primary interaction. A mobile interface that assumes you have one hand free at best. Every screen was tested by actual technicians in actual bays before we shipped it. You can [read about their feedback](/blog/from-skeptics-to-believers-beta-feedback) from our beta program.

## 4. Warranty Denials Frustrate Everyone, But Nobody Knows How to Fix the Root Cause.

Warranty admins know their denial rates. Service managers know their denial rates. Fixed Ops Directors definitely know their denial rates. And almost everyone I talked to said some version of the same thing: "We know our stories need to be better, but we do not know how to make that happen at scale."

The root cause is not laziness or ignorance. It is a workflow problem. By the time a warranty admin catches a weak story, the tech has moved on to the next job. Rework means pulling the tech off a bay, asking them to remember details from hours or days ago, and rewriting something they already spent time on once. Most shops just submit what they have and hope for the best.

RO.bot addresses this at the point of creation, not after the fact. The AI structures the story to warranty standards while the tech is still at the vehicle. Measurements, root cause, correction steps. All captured from the tech's voice, formatted correctly the first time. The grading system catches gaps before the story leaves the tech's hands, not after it has been denied.

If you want to understand [why techs resist the current documentation process](/blog/why-auto-techs-hate-paperwork), we wrote about that in detail.

## 5. Technicians Will Adopt Tools That Help Them Earn More.

This was the insight that gave me the most confidence we were building the right thing.

Every tech I talked to understood the connection between documentation and pay. Flat-rate techs know that warranty denials mean rework or lost hours. They know that declined customer-pay work means fewer jobs flowing through their bay. They know that incomplete inspections mean missed recommendations that could have been billable work.

They are not resistant to technology. They are resistant to technology that creates more work without a clear payoff. Give a tech a tool that saves them 30 minutes of typing per day and puts more hours on their paycheck, and they will use it. Every single day.

That is why we designed RO.bot around technician outcomes, not just management reporting. Yes, managers get the dashboards and the analytics. But the tech gets the immediate, tangible benefit: less time typing, more wrench time, better documentation that leads to fewer comebacks and more approved work.

## What This Means for How We Build

These five insights are not just backstory. They are active design principles that guide every feature decision we make. When someone on the team proposes a new capability, the first question is always: does this reflect what we heard on the shop floor, or are we guessing from a conference room?

We are still visiting shops. Still having these conversations. The product has changed a lot since those early months, but the listening has not stopped.

If any of this sounds familiar, if you are dealing with inconsistent documentation, high denial rates, or techs who are great at their craft but struggle with the paperwork side, I would love to show you what we built. [Book a demo](/book-demo) and I will walk you through it personally.

You can also learn more about [why we started RO.bot](/about) and the problem we set out to fix.
