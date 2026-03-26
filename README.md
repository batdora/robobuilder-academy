# RoboBuilder Academy

Interactive pixel-art educational website for **CMPE 591 — Introduction to Robot Learning** exam preparation at Bogazici University.

## What is this?

A retro-themed, gamified study companion that covers the full course syllabus — from neural network basics to advanced robot learning methods like CNMP and ACNMP. Built as an Astro + React app with NES.css pixel aesthetics.

## Features

- **6 Modules, 50+ Lessons** — covering Foundations, RL, Deep Q-Learning, Policy Optimization, Advanced Architectures (Transformers, GNNs), and Robot Learning
- **Skill Tree** — React Flow dependency graph showing your learning path
- **Quiz Engine** — multiple choice, drag-and-drop ordering, slider tuning, equation fill-in, diagram labeling
- **Boss Battles** — 3-phase exam challenges (Gradient Gatekeeper, Bellman Beast, Overestimation Oracle, Policy Phantom)
- **PixiJS Sandbox** — ECS-based gridworld with RL agent visualization (Q-value heatmaps, policy overlays)
- **Gauntlet Mode** — spaced repetition flip-card review with SM-2 algorithm
- **Practice Final Exam** — 60-question pool, 90-minute timer, per-module scoring
- **Progress Dashboard** — radar charts, study calendar, weak area detection, evolving robot avatar
- **Robot Journal** — retro terminal-style log with typewriter animation
- **8-bit Sound Effects** — Web Audio API generated, with mute toggle
- **XP & Leveling** — earn experience completing lessons and quizzes

## Tech Stack

Astro 6 | React | TypeScript | Tailwind CSS | NES.css | Zustand | PixiJS | bitecs | React Flow | Recharts | KaTeX | MDX

## Getting Started

```bash
npm install
npm run dev
```

Dev server starts at `localhost:4321`.

## Course

CMPE 591 — Introduction to Robot Learning, Prof. Emre Ugur, Bogazici University, Spring 2026.
