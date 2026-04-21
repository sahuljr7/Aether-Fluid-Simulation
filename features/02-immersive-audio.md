# Feature Log: Procedural Audio Engine

**Added**: Enhancement Turn  
**Status**: Production

## Description
A custom Web Audio API service that synthesizes sound on-the-fly, avoiding large asset downloads and ensuring perfect synchronicity with visual interactions.

## How it works
The `SoundEngine` class in `src/services/sound.ts` uses:
- **Sine Wave Oscillators**: To produce pure, calming base frequencies.
- **Exponential Gain Envelopes**: To simulate natural plucking or splashing decays.
- **Biquad Filters**: To "soften" the higher frequencies, ensuring the audio fits the meditative aesthetic.

## Usage Details
- **Splat Sound**: Triggered on `pointerdown`. It starts with a deep base frequency that ramps down.
- **Slide Sound**: Triggered on `pointermove`. The pitch and volume are proportional to the velocity of the user's drag.
