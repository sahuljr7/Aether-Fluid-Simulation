# Feature Log: Customization & Immersive Profiles

**Added**: Personalization Update  
**Status**: Production

## Description
This updates introduces user-definable palettes, persistent trails, and auditory profiles to deepen the immersive experience.

## How it works
- **Color Palettes**: A floating UI on the canvas allows users to switch between themed palettes (Azure, Magma, Forest, Cyber) or the default "Cycle" mode.
- **Particle Trails**: A dedicated feedback loop in the WebGL engine accumulates fluid data over time. When enabled, interactions leave persistent streaks that flow with the physics.
- **Sound Profiles**: The audio engine now supports three distinct synthesis profiles:
  - **Calm**: Deep, slow-decaying resonant tones.
  - **Vibrant**: Energetic, high-frequency feedback.
  - **Minimal**: Subtle, short percussive transients.
- **Force Feedback**: The UI now reacts to parameter changes. Adjusting the "Force" slider triggers a central pulse in the simulation, providing immediate visual feedback of the new value.

## Usage Details
- **Palette Switcher**: Located on the right edge of the simulation.
- **Trails Toggle**: Found in the Advanced Settings panel.
- **Profile Selector**: Segmented control at the top of the Settings panel.
