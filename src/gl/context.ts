/**
 * WebGL2 Context and Extensions Helper
 */

export interface GLContext {
  gl: WebGL2RenderingContext;
  ext: {
    colorBufferHalfFloat: any;
    halfFloatTexture: any;
  };
}

export function initGL(canvas: HTMLCanvasElement): GLContext | null {
  const params = {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: false,
  };

  const gl = canvas.getContext('webgl2', params) as WebGL2RenderingContext | null;
  if (!gl) {
    console.error('WebGL2 not supported');
    return null;
  }

  // Extensions
  const colorBufferHalfFloat = gl.getExtension('EXT_color_buffer_half_float');
  const halfFloatTexture = gl.getExtension('OES_texture_half_float');
  gl.getExtension('OES_texture_half_float_linear');

  return {
    gl,
    ext: {
      colorBufferHalfFloat,
      halfFloatTexture,
    },
  };
}
