# Feature Log: Advanced Simulation Controls

**Added**: Power User Update  
**Status**: Production

## Description
A collapsible settings panel that allows users to tweak the physical properties of the fluid simulation in real-time.

## How it works
- **Dynamic Config Management**: Uses React state to bridge the UI sliders with the WebGL constant uniforms.
- **Collapsible UI**: Implemented with `framer-motion` for smooth entrance/exit animations.
- **Glassmorphic Design**: The panel uses background blur and semi-transparent borders to maintain the meditative aesthetic without obscuring the simulation.

## Usage Details
- **Viscosity**: Controls how quickly velocity dissipates.
- **Dissipation**: Controls how quickly the dye (color) fades away.
- **Vorticity**: Adjusts the "curl" or turbulence of the fluid.
- **Bloom**: Enhances the color intensity and vibrancy.
- **Force**: Increases the impact of mouse/touch interactions.
- **Simulation/Dye Resolution**: Adjusts the grid density. Higher values provide more detail but require more GPU power. Note: Changing these will clear the current fluid state as buffers are re-initialized.
