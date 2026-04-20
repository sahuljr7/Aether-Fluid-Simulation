import { initGL } from './context';
import { GLProgram } from './program';
import { DoubleFBO, createFBO, FBO } from './fbo';
import * as shaders from './shaders';

export interface FluidConfig {
  SIM_RES: number;
  DYE_RES: number;
  PRESSURE_ITERATIONS: number;
  PRES_DAMP: number;
  VELOCITY_DISSIPATION: number;
  DENSITY_DISSIPATION: number;
  CURL: number;
  SPLAT_RADIUS: number;
  SPLAT_FORCE: number;
  PAUSED: boolean;
}

export const DEFAULT_CONFIG: FluidConfig = {
  SIM_RES: 128,
  DYE_RES: window.innerWidth < 768 ? 512 : 1024,
  PRESSURE_ITERATIONS: 25,
  PRES_DAMP: 0.8,
  VELOCITY_DISSIPATION: 0.98,
  DENSITY_DISSIPATION: 0.975,
  CURL: 28,
  SPLAT_RADIUS: 0.0022,
  SPLAT_FORCE: 5500,
  PAUSED: false,
};

type FmtObj = { ifmt: number; fmt: number; type: number };

export class FluidSimulation {
  private gl!: WebGL2RenderingContext;
  private programs: Record<string, GLProgram> = {};
  private fbos: {
    velocity: DoubleFBO;
    dye: DoubleFBO;
    pressure: DoubleFBO;
    divergence: FBO;
    curl: FBO;
  } = {} as any;

  private quadVAO!: WebGLVertexArrayObject;
  private quadBuffer!: WebGLBuffer;

  private formats: { RGBA: FmtObj; RG: FmtObj; R: FmtObj } = {} as any;

  constructor(private canvas: HTMLCanvasElement, public config: FluidConfig = DEFAULT_CONFIG) {
    const ctx = initGL(canvas);
    if (!ctx) throw new Error('WebGL2 Init Failed');
    this.gl = ctx.gl as WebGL2RenderingContext;

    this.detectFormats();
    this.initShaders();
    this.initBuffers();
    this.initFBOs();
  }

  private detectFormats() {
    const gl = this.gl;
    gl.getExtension('EXT_color_buffer_float');
    
    const canRender = (ifmt: number, fmt: number, type: number) => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, 4, 4, 0, fmt, type, null);
      const f = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(f);
      gl.deleteTexture(t);
      return ok;
    };

    const pickFmt = (ifmt: number, fmt: number): FmtObj => {
      const T = gl.HALF_FLOAT;
      if (canRender(ifmt, fmt, T)) return { ifmt, fmt, type: T };
      if (canRender(gl.RGBA16F, gl.RGBA, T)) return { ifmt: gl.RGBA16F, fmt: gl.RGBA, type: T };
      return { ifmt: gl.RGBA, fmt: gl.RGBA, type: gl.UNSIGNED_BYTE };
    };

    this.formats.RGBA = pickFmt(gl.RGBA16F, gl.RGBA);
    this.formats.RG = pickFmt(gl.RG16F, gl.RG) || this.formats.RGBA;
    this.formats.R = pickFmt(gl.R16F, gl.RED) || this.formats.RG;
  }

  private initShaders() {
    this.programs.advection = new GLProgram(this.gl, shaders.BASE_VERTEX, shaders.ADVECTION_FRAG);
    this.programs.splat = new GLProgram(this.gl, shaders.BASE_VERTEX, shaders.SPLAT_FRAG);
    this.programs.curl = new GLProgram(this.gl, shaders.BASE_VERTEX, shaders.CURL_FRAG);
    this.programs.vorticity = new GLProgram(this.gl, shaders.BASE_VERTEX, shaders.VORTICITY_FRAG);
    this.programs.divergence = new GLProgram(this.gl, shaders.BASE_VERTEX, shaders.DIVERGENCE_FRAG);
    this.programs.pressure = new GLProgram(this.gl, shaders.BASE_VERTEX, shaders.PRESSURE_FRAG);
    this.programs.gradSubtract = new GLProgram(this.gl, shaders.BASE_VERTEX, shaders.GRADIENT_SUBTRACT_FRAG);
    this.programs.display = new GLProgram(this.gl, shaders.BASE_VERTEX, shaders.DISPLAY_FRAG);
    this.programs.clear = new GLProgram(this.gl, shaders.BASE_VERTEX, shaders.CLEAR_FRAG);
  }

  private initBuffers() {
    const gl = this.gl;
    this.quadVAO = gl.createVertexArray()!;
    gl.bindVertexArray(this.quadVAO);
    this.quadBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  private initFBOs() {
    const gl = this.gl;
    const { SIM_RES, DYE_RES } = this.config;
    const sR = this.getRes(SIM_RES);
    const dR = this.getRes(DYE_RES);
    const filter = gl.getExtension('OES_texture_float_linear') ? gl.LINEAR : gl.NEAREST;

    this.fbos.velocity = new DoubleFBO(gl, sR.w, sR.h, this.formats.RG.ifmt, this.formats.RG.fmt, this.formats.RG.type, filter);
    this.fbos.dye = new DoubleFBO(gl, dR.w, dR.h, this.formats.RGBA.ifmt, this.formats.RGBA.fmt, this.formats.RGBA.type, filter);
    this.fbos.pressure = new DoubleFBO(gl, sR.w, sR.h, this.formats.R.ifmt, this.formats.R.fmt, this.formats.R.type, gl.NEAREST);
    this.fbos.divergence = createFBO(gl, sR.w, sR.h, this.formats.R.ifmt, this.formats.R.fmt, this.formats.R.type, gl.NEAREST);
    this.fbos.curl = createFBO(gl, sR.w, sR.h, this.formats.R.ifmt, this.formats.R.fmt, this.formats.R.type, gl.NEAREST);
  }

  private getRes(r: number) {
    const ar = this.canvas.width / this.canvas.height;
    return ar >= 1 ? { w: Math.round(r * ar), h: r } : { w: r, h: Math.round(r / ar) };
  }

  public resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.initFBOs();
  }

  private drawQuad(target: FBO | null = null) {
    const gl = this.gl;
    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.width, target.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    gl.bindVertexArray(this.quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  public splat(x: number, y: number, dx: number, dy: number, color: [number, number, number]) {
    const gl = this.gl;
    const ar = this.canvas.clientWidth / this.canvas.clientHeight;
    const px = x / this.canvas.clientWidth;
    const py = 1.0 - y / this.canvas.clientHeight;

    const splatProg = this.programs.splat;
    splatProg.use();
    gl.uniform1f(splatProg.getUniformLocation('uAR'), ar);
    gl.uniform2f(splatProg.getUniformLocation('uPt'), px, py);
    gl.uniform3f(splatProg.getUniformLocation('uColor'), dx, -dy, 0.0);
    gl.uniform1f(splatProg.getUniformLocation('uRadius'), this.config.SPLAT_RADIUS);
    gl.uniform2f(splatProg.getUniformLocation('uTexel'), 1/this.fbos.velocity.read.width, 1/this.fbos.velocity.read.height);

    // Vel
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos.velocity.read.texture);
    gl.uniform1i(splatProg.getUniformLocation('uTex'), 0);
    this.drawQuad(this.fbos.velocity.write);
    this.fbos.velocity.swap();

    // Dye
    gl.uniform3f(splatProg.getUniformLocation('uColor'), color[0], color[1], color[2]);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos.dye.read.texture);
    this.drawQuad(this.fbos.dye.write);
    this.fbos.dye.swap();
  }

  public step(dt: number) {
    if (this.config.PAUSED) return;
    const gl = this.gl;
    const sT: [number, number] = [1 / this.fbos.velocity.read.width, 1 / this.fbos.velocity.read.height];
    const dT: [number, number] = [1 / this.fbos.dye.read.width, 1 / this.fbos.dye.read.height];

    // 1. Curl
    const curlProg = this.programs.curl;
    curlProg.use();
    gl.uniform2fv(curlProg.getUniformLocation('uTexel'), sT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos.velocity.read.texture);
    gl.uniform1i(curlProg.getUniformLocation('uVel'), 0);
    this.drawQuad(this.fbos.curl);

    // 2. Vort
    const vortProg = this.programs.vorticity;
    vortProg.use();
    gl.uniform2fv(vortProg.getUniformLocation('uTexel'), sT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos.velocity.read.texture);
    gl.uniform1i(vortProg.getUniformLocation('uVel'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos.curl.texture);
    gl.uniform1i(vortProg.getUniformLocation('uCurl'), 1);
    gl.uniform1f(vortProg.getUniformLocation('uStr'), this.config.CURL);
    gl.uniform1f(vortProg.getUniformLocation('uDt'), dt);
    this.drawQuad(this.fbos.velocity.write);
    this.fbos.velocity.swap();

    // 3. Div
    const divProg = this.programs.divergence;
    divProg.use();
    gl.uniform2fv(divProg.getUniformLocation('uTexel'), sT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos.velocity.read.texture);
    gl.uniform1i(divProg.getUniformLocation('uVel'), 0);
    this.drawQuad(this.fbos.divergence);

    // 4. Damp Pressure
    const clearProg = this.programs.clear;
    clearProg.use();
    gl.uniform2fv(clearProg.getUniformLocation('uTexel'), sT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos.pressure.read.texture);
    gl.uniform1i(clearProg.getUniformLocation('uTex'), 0);
    gl.uniform1f(clearProg.getUniformLocation('uVal'), this.config.PRES_DAMP);
    this.drawQuad(this.fbos.pressure.write);
    this.fbos.pressure.swap();

    // 5. Jacobi
    const pressureProg = this.programs.pressure;
    pressureProg.use();
    gl.uniform2fv(pressureProg.getUniformLocation('uTexel'), sT);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos.divergence.texture);
    gl.uniform1i(pressureProg.getUniformLocation('uDiv'), 1);
    for (let i = 0; i < this.config.PRESSURE_ITERATIONS; i++) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.fbos.pressure.read.texture);
      gl.uniform1i(pressureProg.getUniformLocation('uP'), 0);
      this.drawQuad(this.fbos.pressure.write);
      this.fbos.pressure.swap();
    }

    // 6. Grad
    const gradProg = this.programs.gradSubtract;
    gradProg.use();
    gl.uniform2fv(gradProg.getUniformLocation('uTexel'), sT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos.pressure.read.texture);
    gl.uniform1i(gradProg.getUniformLocation('uP'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos.velocity.read.texture);
    gl.uniform1i(gradProg.getUniformLocation('uVel'), 1);
    this.drawQuad(this.fbos.velocity.write);
    this.fbos.velocity.swap();

    // 7. Advect Vel
    const advectProg = this.programs.advection;
    advectProg.use();
    gl.uniform2fv(advectProg.getUniformLocation('uTexel'), sT); // Required by VS
    gl.uniform2fv(advectProg.getUniformLocation('uVTexel'), sT);
    gl.uniform2fv(advectProg.getUniformLocation('uSTexel'), sT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos.velocity.read.texture);
    gl.uniform1i(advectProg.getUniformLocation('uVel'), 0);
    gl.uniform1i(advectProg.getUniformLocation('uSrc'), 0);
    gl.uniform1f(advectProg.getUniformLocation('uDt'), dt);
    gl.uniform1f(advectProg.getUniformLocation('uDiss'), this.config.VELOCITY_DISSIPATION);
    this.drawQuad(this.fbos.velocity.write);
    this.fbos.velocity.swap();

    // 8. Advect Dye
    gl.uniform2fv(advectProg.getUniformLocation('uVTexel'), sT);
    gl.uniform2fv(advectProg.getUniformLocation('uSTexel'), dT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos.velocity.read.texture);
    gl.uniform1i(advectProg.getUniformLocation('uVel'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos.dye.read.texture);
    gl.uniform1i(advectProg.getUniformLocation('uSrc'), 1);
    gl.uniform1f(advectProg.getUniformLocation('uDt'), dt);
    gl.uniform1f(advectProg.getUniformLocation('uDiss'), this.config.DENSITY_DISSIPATION);
    this.drawQuad(this.fbos.dye.write);
    this.fbos.dye.swap();
  }

  public render() {
    const gl = this.gl;
    const dR: [number, number] = [1 / this.fbos.dye.read.width, 1 / this.fbos.dye.read.height];

    const dispProg = this.programs.display;
    dispProg.use();
    gl.uniform2fv(dispProg.getUniformLocation('uTexel'), dR);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos.dye.read.texture);
    gl.uniform1i(dispProg.getUniformLocation('uTex'), 0);
    
    this.drawQuad(null);
  }
}
