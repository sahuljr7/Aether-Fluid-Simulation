/**
 * Shaders ported from fluid.html
 */

export const BASE_VERTEX = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPos;
out vec2 vUv, vL, vR, vT, vB;
uniform vec2 uTexel;
void main(){
  vUv = aPos * .5 + .5;
  vL  = vUv - vec2(uTexel.x, 0.);
  vR  = vUv + vec2(uTexel.x, 0.);
  vT  = vUv + vec2(0., uTexel.y);
  vB  = vUv - vec2(0., uTexel.y);
  gl_Position = vec4(aPos, 0., 1.);
}`;

export const CLEAR_FRAG = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform sampler2D uTex; uniform float uVal;
out vec4 o;
void main(){ o = uVal * texture(uTex, vUv); }`;

export const SPLAT_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform float uAR, uRadius;
uniform vec2  uPt;
uniform vec3  uColor;
out vec4 o;
void main(){
  vec2 p  = vUv - uPt;
  p.x    *= uAR;
  vec3 s  = exp(-dot(p,p)/uRadius) * uColor;
  o = vec4(texture(uTex,vUv).xyz + s, 1.);
}`;

export const ADVECTION_FRAG = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uVel, uSrc;
uniform vec2  uVTexel, uSTexel;
uniform float uDt, uDiss;
out vec4 o;

vec4 bilerp(sampler2D s, vec2 uv, vec2 ts){
  vec2 st = uv / ts - .5;
  vec2 f  = fract(st);
  vec2 iv = floor(st);
  vec4 a  = texture(s, (iv+vec2(.5,.5))*ts);
  vec4 b  = texture(s, (iv+vec2(1.5,.5))*ts);
  vec4 c  = texture(s, (iv+vec2(.5,1.5))*ts);
  vec4 d  = texture(s, (iv+vec2(1.5,1.5))*ts);
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}

void main(){
  vec2 vel   = bilerp(uVel, vUv, uVTexel).xy;
  vec2 coord = vUv - uDt * vel * uVTexel;
  o   = uDiss * bilerp(uSrc, coord, uSTexel);
  o.a = 1.;
}`;

export const CURL_FRAG = `#version 300 es
precision mediump float;
in vec2 vL, vR, vT, vB;
uniform sampler2D uVel;
out vec4 o;
void main(){
  float L = texture(uVel,vL).y;
  float R = texture(uVel,vR).y;
  float T = texture(uVel,vT).x;
  float B = texture(uVel,vB).x;
  o = vec4(.5*(R-L-T+B), 0., 0., 1.);
}`;

export const VORTICITY_FRAG = `#version 300 es
precision highp float;
in vec2 vUv, vL, vR, vT, vB;
uniform sampler2D uVel, uCurl;
uniform float uStr, uDt;
out vec4 o;
void main(){
  float L = texture(uCurl,vL).x;
  float R = texture(uCurl,vR).x;
  float T = texture(uCurl,vT).x;
  float B = texture(uCurl,vB).x;
  float C = texture(uCurl,vUv).x;
  vec2 f  = .5 * vec2(abs(T)-abs(B), abs(R)-abs(L));
  f /= length(f) + 1e-5;
  f *= uStr * C;
  f.y *= -1.;
  vec2 v  = texture(uVel,vUv).xy;
  o = vec4(v + f*uDt, 0., 1.);
}`;

export const DIVERGENCE_FRAG = `#version 300 es
precision mediump float;
in vec2 vL, vR, vT, vB;
uniform sampler2D uVel;
out vec4 o;
void main(){
  float L = texture(uVel,vL).x;
  float R = texture(uVel,vR).x;
  float T = texture(uVel,vT).y;
  float B = texture(uVel,vB).y;
  o = vec4(.5*(R-L+T-B), 0., 0., 1.);
}`;

export const PRESSURE_FRAG = `#version 300 es
precision mediump float;
in vec2 vUv, vL, vR, vT, vB;
uniform sampler2D uP, uDiv;
out vec4 o;
void main(){
  float L = texture(uP,vL).x;
  float R = texture(uP,vR).x;
  float T = texture(uP,vT).x;
  float B = texture(uP,vB).x;
  float d = texture(uDiv,vUv).x;
  o = vec4((L+R+T+B - d)*.25, 0., 0., 1.);
}`;

export const GRADIENT_SUBTRACT_FRAG = `#version 300 es
precision mediump float;
in vec2 vUv, vL, vR, vT, vB;
uniform sampler2D uP, uVel;
out vec4 o;
void main(){
  float L = texture(uP,vL).x;
  float R = texture(uP,vR).x;
  float T = texture(uP,vT).x;
  float B = texture(uP,vB).x;
  vec2 v  = texture(uVel,vUv).xy - vec2(R-L, T-B);
  o = vec4(v, 0., 1.);
}`;

export const DISPLAY_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
out vec4 fragColor;
void main(){
  vec3 c = texture(uTex, vUv).rgb;

  c *= 2.2;
  c  = c / (c + 1.0);

  c  = mix(c * c * (3.0 - 2.0*c), c, 0.38);

  c  = pow(max(c, vec3(0.)), vec3(0.4545));

  vec2 uv = vUv * 2.0 - 1.0;
  c *= 1.0 - dot(uv,uv) * 0.12;

  fragColor = vec4(c, 1.);
}`;
