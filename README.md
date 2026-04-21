# Aether // Fluid Simulation

A high-performance, aesthetically-driven 2D fluid simulation built with WebGL2 and React. Inspired by the Stable Fluids method, Aether combines real-time physics with cinematic rendering and procedural audio to create a meditative interactive experience.

## ✨ Features

- **High-Fidelity Physics**: Real-time Navier-Stokes solver using WebGL2 fragment shaders.
- **Cinematic Rendering**: ACES Filmic tonemapping, gamma correction, and vibrant color processing.
- **Procedural Audio**: Real-time sound synthesis that reacts to interaction velocity and touch.
- **Responsive HUD**: Minimalist, mobile-first design with dynamic safe-area support.
- **Interaction Alchemy**: Harmonic color generation using golden-ratio hue stepping.

## 🚀 Interaction

- **Touch / Mouse**: Drag or tap to inject velocity and color into the fluid.
- **Responsive Layout**: The simulation automatically adjusts to screen orientation and size.
- **Visual Hints**: Built-in instructions fade away once you start interacting, keeping the interface clean.

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Graphics**: WebGL2 (GLSL)
- **Animation**: Framer Motion
- **Audio**: Web Audio API (Procedural Synthesis)

---

## 📜 Feature Log

We maintain a running log of all major architectural additions and features in the `/features` directory.

- [Core Simulation Engine](./features/01-fluid-simulation.md)
- [Procedural Audio Engine](./features/02-immersive-audio.md)
- [Minimalist Responsive HUD](./features/03-responsive-hud.md)
- [Advanced Simulation Controls](./features/04-advanced-controls.md)
- [Dynamic Scaling & Media Capture](./features/05-dynamic-scaling-and-capture.md)
- [Customization & Immersive Profiles](./features/06-customization-and-profiles.md)
