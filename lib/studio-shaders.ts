/** Original shaders for the page field and the hero still life. */

export const FULLSCREEN_VERT = `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const FIELD_FRAG = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform float uScroll;
uniform float uAmp;
uniform vec2 uFocus;
uniform float uFocusAmt;
in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = m * p * 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 uv = frag / uResolution.y;
  vec2 pointer = vec2(uPointer.x, uResolution.y - uPointer.y) / uResolution.y;
  float t = uTime * 0.045 * uAmp;
  vec2 p = uv + vec2(uScroll * 0.12, -uScroll * 0.04);
  vec2 delta = p - pointer;
  float influence = exp(-dot(delta, delta) * 3.2) * 0.28 * uAmp;
  p += normalize(delta + 0.0001) * influence;

  vec2 q = vec2(
    fbm(p + vec2(t, -t * 0.6)),
    fbm(p + vec2(5.2, 1.3) - t)
  );
  float f = fbm(p + 1.8 * q);
  float bands = abs(fract(f * 7.0 + q.x * 0.35) - 0.5);
  float line = smoothstep(0.085, 0.012, bands);
  float ridge = smoothstep(0.45, 0.95, f);

  vec2 fragUv = frag / uResolution;
  float focus = length((fragUv - uFocus) * vec2(aspect, 1.0));
  float clear = mix(1.0, smoothstep(0.06, 0.5, focus), uFocusAmt);

  vec3 bone = vec3(0.91, 0.89, 0.82);
  vec3 signal = vec3(0.90, 1.0, 0.36);
  vec3 base = vec3(0.035, 0.039, 0.031);
  vec3 col = base;
  col += bone * line * 0.20 * mix(0.58, 1.0, clear);
  col += signal * line * ridge * 0.16 * mix(0.45, 1.0, clear);

  vec2 vignetteUv = fragUv - 0.5;
  vignetteUv.x *= aspect;
  float vignette = smoothstep(1.15, 0.2, length(vignetteUv));
  col *= mix(0.42, 1.0, vignette);
  col += (hash(frag + fract(uTime) * 17.0) - 0.5) * 0.028;
  fragColor = vec4(col, 1.0);
}
`;

export const MESH_VERT = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in float aAo;
layout(location = 3) in vec4 aIns0;
layout(location = 4) in vec4 aIns1;
layout(location = 5) in vec4 aIns2;
layout(location = 6) in vec4 aIns3;

uniform mat4 uViewProj;
uniform mat4 uModel;
uniform float uMirror;
uniform float uGroundY;

out vec3 vWorld;
out vec3 vNormal;
out float vAo;

void main() {
  mat4 inst = mat4(aIns0, aIns1, aIns2, aIns3);
  vec4 world = uModel * inst * vec4(aPos, 1.0);
  mat3 nmat = mat3(uModel) * mat3(inst);
  vec3 n = normalize(nmat * aNormal);
  if (uMirror > 0.5) {
    world.y = 2.0 * uGroundY - world.y;
    n.y = -n.y;
  }
  vWorld = world.xyz;
  vNormal = normalize(n);
  vAo = aAo;
  gl_Position = uViewProj * world;
}
`;

export const MESH_FRAG = `#version 300 es
precision highp float;

in vec3 vWorld;
in vec3 vNormal;
in float vAo;

uniform vec3 uCamera;
uniform vec3 uColor;
uniform float uRough;
uniform float uMetal;
uniform float uPolish;
uniform float uExposure;
uniform float uMirror;
uniform float uGroundY;
uniform vec3 uKeyDir;
uniform vec3 uKeyColor;
uniform vec3 uFillDir;
uniform vec3 uFillColor;
uniform vec3 uRimDir;
uniform vec3 uRimColor;

out vec4 fragColor;

const float PI = 3.14159265;

float D_GGX(float NoH, float a) {
  float a2 = a * a;
  float d = NoH * NoH * (a2 - 1.0) + 1.0;
  return min(a2 / max(PI * d * d, 1e-5), 180.0);
}

float G_Smith(float NoV, float NoL, float a) {
  float k = (a + 1.0);
  k = (k * k) / 8.0;
  float gv = NoV / max(NoV * (1.0 - k) + k, 1e-5);
  float gl = NoL / max(NoL * (1.0 - k) + k, 1e-5);
  return gv * gl;
}

vec3 F_Schlick(float cosTheta, vec3 F0) {
  float f = pow(1.0 - cosTheta, 5.0);
  return F0 + (1.0 - F0) * f;
}

vec3 room(vec3 r) {
  float lift = smoothstep(-0.35, 0.8, r.y);
  vec3 col = mix(vec3(0.02, 0.021, 0.018), vec3(0.28, 0.27, 0.22), lift);
  vec3 soft = normalize(vec3(-0.28, 0.72, 0.62));
  float box = pow(max(dot(r, soft), 0.0), 1.8);
  col += vec3(1.25, 1.16, 1.02) * box * 2.15;
  vec3 side = normalize(vec3(0.55, 0.12, 0.78));
  float card = pow(max(dot(r, side), 0.0), 2.2);
  col += vec3(0.46, 0.44, 0.36) * card * 0.85;
  vec3 slit = normalize(vec3(0.62, 0.22, 0.48));
  float glint = pow(max(dot(r, slit), 0.0), 64.0);
  col += vec3(0.78, 0.92, 0.32) * glint * 1.7;
  return col;
}

vec3 tonemap(vec3 x) {
  float peak = max(x.r, max(x.g, x.b));
  return x / (1.0 + peak * 0.32);
}

vec3 specLight(vec3 N, vec3 V, vec3 L, vec3 radiance, vec3 F0, float rough, float metal, vec3 albedo) {
  float NoL = max(dot(N, L), 0.0);
  if (NoL <= 0.0) return vec3(0.0);
  vec3 H = normalize(V + L);
  float NoV = max(dot(N, V), 0.001);
  float NoH = max(dot(N, H), 0.0);
  float VoH = max(dot(V, H), 0.0);
  float a = rough * rough;
  vec3 F = F_Schlick(VoH, F0);
  float D = D_GGX(NoH, a);
  float G = G_Smith(NoV, NoL, a);
  vec3 spec = (D * G * F) / max(4.0 * NoV * NoL, 1e-4);
  vec3 kD = (vec3(1.0) - F) * (1.0 - metal);
  return (kD * albedo / PI + spec) * radiance * NoL;
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCamera - vWorld);
  float NoV = max(dot(N, V), 0.001);
  float rough = clamp(uRough + sin(vWorld.y * 46.0 + vWorld.x * 3.0) * 0.012, 0.045, 0.92);
  vec3 albedo = uColor;
  vec3 F0 = mix(vec3(0.04), albedo, uMetal);

  vec3 color = vec3(0.0);
  color += specLight(N, V, normalize(uKeyDir), uKeyColor, F0, rough, uMetal, albedo);
  color += specLight(N, V, normalize(uFillDir), uFillColor, F0, rough, uMetal, albedo);
  color += specLight(N, V, normalize(uRimDir), uRimColor, F0, min(rough + 0.04, 0.95), uMetal, albedo);

  vec3 R = reflect(-V, N);
  vec3 refl = normalize(mix(R, N, rough * rough * 0.9));
  vec3 F = F_Schlick(NoV, F0);
  vec3 kD = (vec3(1.0) - F) * (1.0 - uMetal);
  color += (kD * albedo * room(N) * 0.42 + room(refl) * F) * vAo;

  if (uPolish > 0.001) {
    float polishRough = 0.07;
    color += specLight(N, V, normalize(uKeyDir), uKeyColor * uPolish, F0, polishRough, 1.0, albedo) * 0.55;
  }

  vec3 edge = pow(1.0 - NoV, 2.4) * vec3(0.42, 0.4, 0.32);
  color += edge * (0.22 + uPolish * 0.35) * vAo;
  color *= uExposure;
  color = tonemap(max(color, 0.0));

  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  color += (dither - 0.5) / 255.0;

  if (uMirror > 0.5) {
    float depth = max(uGroundY - vWorld.y, 0.0);
    float alpha = exp(-depth * 1.65) * 0.34;
    fragColor = vec4(color * alpha, alpha);
    return;
  }
  fragColor = vec4(color, 1.0);
}
`;

export const SHADOW_VERT = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 3) in vec4 aIns0;
layout(location = 4) in vec4 aIns1;
layout(location = 5) in vec4 aIns2;
layout(location = 6) in vec4 aIns3;

uniform mat4 uViewProj;
uniform mat4 uModel;
out vec2 vLocal;

void main() {
  mat4 inst = mat4(aIns0, aIns1, aIns2, aIns3);
  vec4 local = inst * vec4(aPos, 1.0);
  vLocal = local.xz;
  gl_Position = uViewProj * uModel * local;
}
`;

export const SHADOW_FRAG = `#version 300 es
precision highp float;
in vec2 vLocal;
uniform float uOpacity;
out vec4 fragColor;

void main() {
  vec2 q = (vLocal - vec2(0.24, 0.02)) / vec2(1.12, 0.68);
  float a = exp(-dot(q, q) * 2.05) * uOpacity;
  vec3 ink = vec3(0.01, 0.011, 0.009);
  fragColor = vec4(ink * a, a);
}
`;

export const BLIT_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uScene;
out vec4 fragColor;

void main() {
  fragColor = texture(uScene, vUv);
}
`;

export const LEGACY_VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const LEGACY_FRAG = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform float uScroll;
uniform float uAmp;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = m * p * 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 uv = frag / uResolution.y;
  vec2 pointer = vec2(uPointer.x, uResolution.y - uPointer.y) / uResolution.y;
  float t = uTime * 0.045 * uAmp;
  vec2 p = uv + vec2(uScroll * 0.12, -uScroll * 0.04);
  vec2 delta = p - pointer;
  float influence = exp(-dot(delta, delta) * 3.2) * 0.42 * uAmp;
  p += normalize(delta + 0.0001) * influence;

  vec2 q = vec2(
    fbm(p + vec2(t, -t * 0.6)),
    fbm(p + vec2(5.2, 1.3) - t)
  );
  float f = fbm(p + 1.8 * q);
  float bands = abs(fract(f * 7.0 + q.x * 0.35) - 0.5);
  float line = smoothstep(0.085, 0.012, bands);
  float ridge = smoothstep(0.45, 0.95, f);

  vec3 bone = vec3(0.91, 0.89, 0.82);
  vec3 signal = vec3(0.90, 1.0, 0.36);
  vec3 base = vec3(0.035, 0.039, 0.031);
  vec3 col = base;
  col += bone * line * 0.20;
  col += signal * line * ridge * 0.16;

  vec2 vignetteUv = frag / uResolution - 0.5;
  vignetteUv.x *= aspect;
  float vignette = smoothstep(1.15, 0.2, length(vignetteUv));
  col *= mix(0.42, 1.0, vignette);
  col += (hash(frag + fract(uTime) * 17.0) - 0.5) * 0.028;
  gl_FragColor = vec4(col, 1.0);
}
`;
