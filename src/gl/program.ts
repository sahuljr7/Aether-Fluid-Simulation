/**
 * Shader and Program Management
 */

export function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram | null {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export class GLProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation> = {};

  constructor(private gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
    const p = createProgram(gl, vertexSource, fragmentSource);
    if (!p) throw new Error('Failed to create program');
    this.program = p;
  }

  use() {
    this.gl.useProgram(this.program);
  }

  getUniformLocation(name: string): WebGLUniformLocation {
    if (this.uniforms[name]) return this.uniforms[name];
    const loc = this.gl.getUniformLocation(this.program, name);
    if (!loc) {
      // Don't throw, some uniforms might be optimized away
    }
    this.uniforms[name] = loc!;
    return loc!;
  }
}
