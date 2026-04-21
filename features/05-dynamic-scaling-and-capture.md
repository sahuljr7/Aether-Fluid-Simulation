# Feature Log: Dynamic Scaling & Media Capture

**Added**: Visual Fidelity Update  
**Status**: Production

## Description
This feature introduces dynamic color scaling based on fluid physics and a native utility for capturing simulation states.

## How it works
- **Velocity-Based Intensity**: The display shader now samples the velocity FBO. Areas of high velocity are rendered with boosted intensity, making the motion feel more powerful and life-like.
- **Active Point Tracking**: The HUD displays an estimate of active "cells" (simulation grid points) to provide a sense of the simulation's complexity.
- **Native Screenshot**: The simulation class implements a `screenshot()` method using `canvas.toDataURL`. It triggers a browser download of a high-resolution PNG of the current frame.

## Usage Details
- **Capture Button**: Located in the bottom HUD (camera icon).
- **Auto-Intensity**: Automatically scales with interaction speed.
