/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { FluidCanvas } from './components/FluidCanvas';
import { Controls } from './components/Controls';
import { DEFAULT_CONFIG, FluidConfig } from './gl/fluid';

export default function App() {
  const [config, setConfig] = useState<FluidConfig>(DEFAULT_CONFIG);
  const [interacted, setInteracted] = useState(false);

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden bg-[#000] select-none flex">
      {/* Immersive GL Canvas */}
      <FluidCanvas 
        config={config} 
        onInteraction={() => setInteracted(true)}
      />

      {/* Atmospheric Experience UI */}
      <Controls 
        config={config} 
        setConfig={setConfig} 
        interacted={interacted}
      />
    </main>
  );
}
