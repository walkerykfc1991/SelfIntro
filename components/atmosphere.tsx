"use client";

import { useEffect, useRef } from "react";
import { prefersFinePointer, prefersReducedMotion } from "@/lib/env";

const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
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

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function Atmosphere() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: prefersFinePointer() ? "high-performance" : "low-power",
    });
    if (!gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERT);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vertex || !fragment) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uPointer = gl.getUniformLocation(program, "uPointer");
    const uScroll = gl.getUniformLocation(program, "uScroll");
    const uAmp = gl.getUniformLocation(program, "uAmp");

    const reduced = prefersReducedMotion();
    const saveData = "connection" in navigator && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    const coarse = !prefersFinePointer();
    const rendererInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = rendererInfo ? String(gl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL) || "") : "";
    const software = /swiftshader|llvmpipe|softpipe|software/i.test(renderer);
    const still = reduced || saveData || software;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let running = true;
    let slowFrames = 0;
    let frozen = still;
    let last = performance.now();
    const pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.42 };
    const target = { ...pointer };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.25);
      width = Math.max(1, Math.floor(window.innerWidth * dpr));
      height = Math.max(1, Math.floor(window.innerHeight * dpr));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    };

    const draw = (now: number) => {
      const time = frozen ? 12.5 : now * 0.001;
      gl.uniform2f(uResolution, width, height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uPointer, pointer.x * dpr, pointer.y * dpr);
      gl.uniform1f(uScroll, window.scrollY / Math.max(window.innerHeight, 1));
      gl.uniform1f(uAmp, frozen ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const tick = (now: number) => {
      if (!running) return;
      const elapsed = now - last;
      const minFrame = coarse ? 34 : 16;
      if (elapsed >= minFrame && document.visibilityState !== "hidden") {
        if (!frozen && elapsed > 48) slowFrames += 1;
        else slowFrames = Math.max(0, slowFrames - 1);
        if (slowFrames > 20) frozen = true;
        pointer.x += (target.x - pointer.x) * 0.06;
        pointer.y += (target.y - pointer.y) * 0.06;
        last = now;
        draw(now);
        if (!canvas.classList.contains("is-ready")) canvas.classList.add("is-ready");
        if (frozen) return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    const onPointer = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (frozen) {
        pointer.x = target.x;
        pointer.y = target.y;
        draw(performance.now());
        canvas.classList.add("is-ready");
      }
    };

    const onVisibility = () => {
      if (!frozen && document.visibilityState === "visible") {
        last = performance.now();
        frame = window.requestAnimationFrame(tick);
      }
    };

    resize();
    draw(performance.now());
    canvas.classList.add("is-ready");
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    if (!frozen) frame = window.requestAnimationFrame(tick);

    const onLost = (event: Event) => {
      event.preventDefault();
      running = false;
      window.cancelAnimationFrame(frame);
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return <canvas ref={ref} className="atmosphere" aria-hidden="true" />;
}
