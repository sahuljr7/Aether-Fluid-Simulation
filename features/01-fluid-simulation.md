# Feature Log: Core Fluid Simulation Engine

**Added**: Initial Build  
**Status**: Production

## Description
The core of Aether is a GPU-accelerated 2D fluid simulation based on the "Stable Fluids" method. It utilizes WebGL2 to solve the Navier-Stokes equations for incompressible flow.

## How it works
1. **Advection**: Moves the fluid and its properties along the velocity field.
2. **Diffusion**: Spreads out velocity and dye over time.
3. **External Forces**: Injects splashes (splats) of velocity and color based on user input.
4. **Vorticity Confinement**: Adds tiny curls and eddies to prevent the fluid from looking too "liquid-y" and losing detail.
5. **Pressure Solve**: Uses Jacobi iterations to ensure the velocity field is divergent-free (incompressible).
6. **Gradient Subtraction**: Corrects the velocity field using the calculated pressure.

## Usage Details
The simulation defaults to a high resolution but can be tuned via the `FluidConfig` interface in `src/gl/fluid.ts`. It handles precision via half-float texture detection.
