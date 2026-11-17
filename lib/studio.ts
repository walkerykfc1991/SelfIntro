import { prefersFinePointer, prefersReducedMotion } from "@/lib/env";
import {
  mat4Identity,
  mat4LensShift,
  mat4LookAt,
  mat4Mul,
  mat4Perspective,
  mat4RotateX,
  mat4RotateY,
  mat4Scale,
  mat4TransformPoint,
  mat4Translate,
  type Mat4,
  type Vec3,
} from "@/lib/mat4";
import { createSculpture, type Mesh, type SculptureMeshes } from "@/lib/plate-mesh";
import { ringMatrix, rodMatrix, shellMatrix, writeFins, writeMatrix } from "@/lib/sculpture";
import {
  BLIT_FRAG,
  FIELD_FRAG,
  FULLSCREEN_VERT,
  LEGACY_FRAG,
  LEGACY_VERT,
  MESH_FRAG,
  MESH_VERT,
  SHADOW_FRAG,
  SHADOW_VERT,
} from "@/lib/studio-shaders";

type Spring = { x: number; v: number };
type Material = { color: Vec3; rough: number; metal: number; polish: number };

type GlMesh = {
  vao: WebGLVertexArrayObject;
  instanceBuffer: WebGLBuffer;
  instanceData: Float32Array;
  indexCount: number;
  indexType: number;
  instances: number;
  buffers: WebGLBuffer[];
};

type Targets = {
  samples: number;
  renderFbo: WebGLFramebuffer;
  resolveFbo: WebGLFramebuffer;
  color: WebGLTexture;
  extras: Array<WebGLRenderbuffer | WebGLFramebuffer | WebGLTexture>;
};

const TRI = new Float32Array([-1, -1, 3, -1, -1, 3]);

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / Math.max(edge1 - edge0, 1e-5)));
  return t * t * (3 - 2 * t);
}

function norm3(x: number, y: number, z: number): Vec3 {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function orbit(eye: Vec3, target: Vec3, yaw: number, pitch: number): Vec3 {
  const x = eye[0] - target[0];
  const y = eye[1] - target[1];
  const z = eye[2] - target[2];
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = cy * x + sy * z;
  const z1 = -sy * x + cy * z;
  const cx = Math.cos(pitch);
  const sx = Math.sin(pitch);
  return [target[0] + x1, target[1] + cx * y - sx * z1, target[2] + sx * y + cx * z1];
}

function stepSpring(spring: Spring, target: number, dt: number, frozen: boolean) {
  if (frozen) {
    spring.x = target;
    spring.v = 0;
    return;
  }
  const stiffness = 54;
  const damping = 12.5;
  spring.v += (target - spring.x) * stiffness * dt;
  spring.v *= Math.exp(-damping * dt);
  spring.x += spring.v * dt;
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: WebGLRenderingContext, vertSrc: string, fragSrc: string): WebGLProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertSrc);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function isSoftware(gl: WebGLRenderingContext): boolean {
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || "") : "";
  return /swiftshader|llvmpipe|softpipe|software/i.test(renderer);
}

function saveDataOn(): boolean {
  return "connection" in navigator && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
}

function mountLegacyField(canvas: HTMLCanvasElement): () => void {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: prefersFinePointer() ? "high-performance" : "low-power",
  });
  if (!gl) return () => {};
  const program = link(gl, LEGACY_VERT, LEGACY_FRAG);
  if (!program) return () => {};
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, TRI, gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);
  const uResolution = gl.getUniformLocation(program, "uResolution");
  const uTime = gl.getUniformLocation(program, "uTime");
  const uPointer = gl.getUniformLocation(program, "uPointer");
  const uScroll = gl.getUniformLocation(program, "uScroll");
  const uAmp = gl.getUniformLocation(program, "uAmp");
  return runLoop(canvas, {
    still: prefersReducedMotion() || saveDataOn() || isSoftware(gl),
    coarse: !prefersFinePointer(),
    resize: (width, height) => gl.viewport(0, 0, width, height),
    draw: (state) => {
      gl.uniform2f(uResolution, state.width, state.height);
      gl.uniform1f(uTime, state.time);
      gl.uniform2f(uPointer, state.pointerX * state.dpr, state.pointerY * state.dpr);
      gl.uniform1f(uScroll, state.scroll);
      gl.uniform1f(uAmp, state.frozen ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose: () => {
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    },
  });
}

type LoopState = {
  width: number;
  height: number;
  dpr: number;
  time: number;
  pointerX: number;
  pointerY: number;
  scroll: number;
  frozen: boolean;
  px: number;
  py: number;
  dt: number;
};

function runLoop(
  canvas: HTMLCanvasElement,
  hooks: {
    still: boolean;
    coarse: boolean;
    resize: (width: number, height: number, dpr: number) => void;
    draw: (state: LoopState) => void;
    dispose: () => void;
  },
): () => void {
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;
  let redraw = 0;
  let running = true;
  let slowFrames = 0;
  let seenFrames = 0;
  let frozen = hooks.still;
  let last = performance.now();
  const pointer = { x: window.innerWidth * 0.62, y: window.innerHeight * 0.42 };
  const target = { ...pointer };
  const springX: Spring = { x: 0.24, v: 0 };
  const springY: Spring = { x: -0.08, v: 0 };

  const draw = (now: number, dt: number) => {
    const nx = (target.x / Math.max(window.innerWidth, 1) - 0.5) * 2;
    const ny = (target.y / Math.max(window.innerHeight, 1) - 0.5) * 2;
    stepSpring(springX, Math.max(-1, Math.min(1, nx)), dt, frozen);
    stepSpring(springY, Math.max(-1, Math.min(1, ny)), dt, frozen);
    pointer.x += (target.x - pointer.x) * (frozen ? 1 : 0.18);
    pointer.y += (target.y - pointer.y) * (frozen ? 1 : 0.18);
    hooks.draw({
      width,
      height,
      dpr,
      time: frozen ? 12.5 : now * 0.001,
      pointerX: pointer.x,
      pointerY: pointer.y,
      scroll: window.scrollY / Math.max(window.innerHeight, 1),
      frozen,
      px: springX.x,
      py: springY.x,
      dt,
    });
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, hooks.coarse ? 1 : 1.5);
    width = Math.max(1, Math.floor(window.innerWidth * dpr));
    height = Math.max(1, Math.floor(window.innerHeight * dpr));
    canvas.width = width;
    canvas.height = height;
    hooks.resize(width, height, dpr);
    if (!running) return;
    draw(performance.now(), 0.016);
    canvas.classList.add("is-ready");
  };

  const tick = (now: number) => {
    if (!running) return;
    if (document.visibilityState === "hidden") {
      last = now;
      frame = window.requestAnimationFrame(tick);
      return;
    }
    const elapsed = now - last;
    const minFrame = hooks.coarse ? 34 : 16;
    if (elapsed >= minFrame) {
      seenFrames += 1;
      if (!frozen && seenFrames > 8 && elapsed > 48) slowFrames += 1;
      else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames > 20) frozen = true;
      last = now;
      draw(now, Math.min(0.05, elapsed / 1000));
      canvas.classList.add("is-ready");
      if (frozen) return;
    }
    frame = window.requestAnimationFrame(tick);
  };

  const requestStill = () => {
    if (!frozen || !running || redraw) return;
    redraw = window.requestAnimationFrame((now) => {
      redraw = 0;
      if (!running) return;
      draw(now, 0.016);
      canvas.classList.add("is-ready");
    });
  };

  const onPointer = (event: PointerEvent) => {
    target.x = event.clientX;
    target.y = event.clientY;
    if (frozen) requestStill();
  };
  const onScroll = () => {
    if (frozen) requestStill();
  };
  const onVisibility = () => {
    if (!frozen && document.visibilityState === "visible" && running) {
      last = performance.now();
      frame = window.requestAnimationFrame(tick);
    }
  };

  resize();
  draw(performance.now(), 0.016);
  canvas.classList.add("is-ready");
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", onVisibility);
  if (!frozen) frame = window.requestAnimationFrame(tick);

  const onLost = (event: Event) => {
    event.preventDefault();
    running = false;
    window.cancelAnimationFrame(frame);
    window.cancelAnimationFrame(redraw);
  };
  canvas.addEventListener("webglcontextlost", onLost);

  return () => {
    running = false;
    window.cancelAnimationFrame(frame);
    window.cancelAnimationFrame(redraw);
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onLost);
    hooks.dispose();
  };
}

function uploadMesh(gl: WebGL2RenderingContext, mesh: Mesh, instances: number): GlMesh | null {
  const vao = gl.createVertexArray();
  const position = gl.createBuffer();
  const normal = gl.createBuffer();
  const ao = gl.createBuffer();
  const index = gl.createBuffer();
  const instance = gl.createBuffer();
  if (!vao || !position || !normal || !ao || !index || !instance) return null;
  const instanceData = new Float32Array(instances * 16);
  for (let i = 0; i < instances; i += 1) instanceData.set(mat4Identity(), i * 16);

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, normal);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, ao);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.ao, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, instance);
  gl.bufferData(gl.ARRAY_BUFFER, instanceData, gl.DYNAMIC_DRAW);
  for (let column = 0; column < 4; column += 1) {
    const loc = 3 + column;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 64, column * 16);
    gl.vertexAttribDivisor(loc, 1);
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  return {
    vao,
    instanceBuffer: instance,
    instanceData,
    indexCount: mesh.indices.length,
    indexType: mesh.indexType === "u32" ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
    instances,
    buffers: [position, normal, ao, index, instance],
  };
}

function syncInstances(gl: WebGL2RenderingContext, mesh: GlMesh) {
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.instanceBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.instanceData);
}

function createColorTarget(gl: WebGL2RenderingContext, width: number, height: number) {
  const color = gl.createTexture();
  const resolveFbo = gl.createFramebuffer();
  if (!color || !resolveFbo) return null;
  gl.bindTexture(gl.TEXTURE_2D, color);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, resolveFbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
  return { color, resolveFbo };
}

function createTargets(gl: WebGL2RenderingContext, width: number, height: number, samples: number): Targets | null {
  if (samples > 1) {
    const renderFbo = gl.createFramebuffer();
    const colorMs = gl.createRenderbuffer();
    const depthMs = gl.createRenderbuffer();
    const colorTarget = createColorTarget(gl, width, height);
    if (!renderFbo || !colorMs || !depthMs || !colorTarget) return null;
    gl.bindRenderbuffer(gl.RENDERBUFFER, colorMs);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, width, height);
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthMs);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, renderFbo);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colorMs);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthMs);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteFramebuffer(renderFbo);
      gl.deleteRenderbuffer(colorMs);
      gl.deleteRenderbuffer(depthMs);
      gl.deleteFramebuffer(colorTarget.resolveFbo);
      gl.deleteTexture(colorTarget.color);
      return createTargets(gl, width, height, 1);
    }
    return {
      samples,
      renderFbo,
      resolveFbo: colorTarget.resolveFbo,
      color: colorTarget.color,
      extras: [colorMs, depthMs],
    };
  }

  const colorTarget = createColorTarget(gl, width, height);
  const depth = gl.createRenderbuffer();
  if (!colorTarget || !depth) return null;
  gl.bindFramebuffer(gl.FRAMEBUFFER, colorTarget.resolveFbo);
  gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return null;
  return {
    samples: 1,
    renderFbo: colorTarget.resolveFbo,
    resolveFbo: colorTarget.resolveFbo,
    color: colorTarget.color,
    extras: [depth],
  };
}

function destroyTargets(gl: WebGL2RenderingContext, targets: Targets | null) {
  if (!targets) return;
  gl.deleteFramebuffer(targets.renderFbo);
  if (targets.resolveFbo !== targets.renderFbo) gl.deleteFramebuffer(targets.resolveFbo);
  gl.deleteTexture(targets.color);
  for (const extra of targets.extras) {
    if (gl.isRenderbuffer(extra)) gl.deleteRenderbuffer(extra);
  }
}

type Piece = { mesh: GlMesh; material: Material };

export function mountStudio(canvas: HTMLCanvasElement): () => void {
  const coarse = !prefersFinePointer();
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: coarse ? "low-power" : "high-performance",
  });
  if (!gl) return mountLegacyField(canvas);

  const field = link(gl, FULLSCREEN_VERT, FIELD_FRAG);
  if (!field) return () => {};
  const meshProgram = link(gl, MESH_VERT, MESH_FRAG);
  const shadowProgram = link(gl, SHADOW_VERT, SHADOW_FRAG);
  const blitProgram = link(gl, FULLSCREEN_VERT, BLIT_FRAG);

  const fullscreenVao = gl.createVertexArray();
  const fullscreenBuffer = gl.createBuffer();
  if (fullscreenVao && fullscreenBuffer) {
    gl.bindVertexArray(fullscreenVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, TRI, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  const software = isSoftware(gl);
  const quality = coarse || software ? "low" : "high";
  let sculpture: SculptureMeshes | null = null;
  let shell: GlMesh | null = null;
  let fins: GlMesh | null = null;
  let rod: GlMesh | null = null;
  let ring: GlMesh | null = null;
  let shadow: GlMesh | null = null;
  const solidReady = Boolean(meshProgram && shadowProgram && blitProgram && fullscreenVao);
  if (solidReady) {
    try {
      sculpture = createSculpture(quality);
      shell = uploadMesh(gl, sculpture.shell, 1);
      fins = uploadMesh(gl, sculpture.fin, 3);
      rod = uploadMesh(gl, sculpture.rod, 1);
      ring = uploadMesh(gl, sculpture.ring, 1);
      shadow = uploadMesh(gl, sculpture.shadow, 1);
      if (shell && rod && shadow && sculpture) {
        writeMatrix(shell.instanceData, shellMatrix());
        writeMatrix(rod.instanceData, rodMatrix(sculpture.hingeX));
        writeMatrix(shadow.instanceData, mat4Identity());
        syncInstances(gl, shell);
        syncInstances(gl, rod);
        syncInstances(gl, shadow);
      }
    } catch (error) {
      console.warn(error);
      sculpture = null;
    }
  }
  const pieces: Piece[] = [];
  if (shell && fins && rod && ring && shadow && sculpture) {
    pieces.push(
      { mesh: shell, material: { color: [0.46, 0.42, 0.35], rough: 0.28, metal: 0.92, polish: 0.22 } },
      { mesh: fins, material: { color: [0.68, 0.62, 0.5], rough: 0.16, metal: 1, polish: 0.5 } },
      { mesh: rod, material: { color: [0.22, 0.2, 0.17], rough: 0.3, metal: 1, polish: 0.2 } },
      { mesh: ring, material: { color: [0.9, 0.84, 0.68], rough: 0.14, metal: 1, polish: 0.7 } },
    );
  } else {
    sculpture = null;
  }

  const maxSamples = gl.getParameter(gl.MAX_SAMPLES) as number;
  const wantedSamples = software ? 1 : Math.min(maxSamples, coarse ? 2 : 4);
  let targets: Targets | null = null;

  const fieldLoc = {
    resolution: gl.getUniformLocation(field, "uResolution"),
    time: gl.getUniformLocation(field, "uTime"),
    pointer: gl.getUniformLocation(field, "uPointer"),
    scroll: gl.getUniformLocation(field, "uScroll"),
    amp: gl.getUniformLocation(field, "uAmp"),
    focus: gl.getUniformLocation(field, "uFocus"),
    focusAmt: gl.getUniformLocation(field, "uFocusAmt"),
  };
  const meshLoc = meshProgram
    ? {
        viewProj: gl.getUniformLocation(meshProgram, "uViewProj"),
        model: gl.getUniformLocation(meshProgram, "uModel"),
        mirror: gl.getUniformLocation(meshProgram, "uMirror"),
        groundY: gl.getUniformLocation(meshProgram, "uGroundY"),
        camera: gl.getUniformLocation(meshProgram, "uCamera"),
        color: gl.getUniformLocation(meshProgram, "uColor"),
        rough: gl.getUniformLocation(meshProgram, "uRough"),
        metal: gl.getUniformLocation(meshProgram, "uMetal"),
        polish: gl.getUniformLocation(meshProgram, "uPolish"),
        exposure: gl.getUniformLocation(meshProgram, "uExposure"),
        keyDir: gl.getUniformLocation(meshProgram, "uKeyDir"),
        keyColor: gl.getUniformLocation(meshProgram, "uKeyColor"),
        fillDir: gl.getUniformLocation(meshProgram, "uFillDir"),
        fillColor: gl.getUniformLocation(meshProgram, "uFillColor"),
        rimDir: gl.getUniformLocation(meshProgram, "uRimDir"),
        rimColor: gl.getUniformLocation(meshProgram, "uRimColor"),
      }
    : null;
  const shadowLoc = shadowProgram
    ? {
        viewProj: gl.getUniformLocation(shadowProgram, "uViewProj"),
        model: gl.getUniformLocation(shadowProgram, "uModel"),
        opacity: gl.getUniformLocation(shadowProgram, "uOpacity"),
      }
    : null;
  const blitScene = blitProgram ? gl.getUniformLocation(blitProgram, "uScene") : null;

  const resizeTargets = (width: number, height: number) => {
    destroyTargets(gl, targets);
    targets = sculpture ? createTargets(gl, width, height, wantedSamples) : null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  const drawPiece = (piece: Piece, mirror: boolean) => {
    if (!meshProgram || !meshLoc) return;
    gl.uniform1f(meshLoc.mirror, mirror ? 1 : 0);
    gl.uniform3f(meshLoc.color, piece.material.color[0], piece.material.color[1], piece.material.color[2]);
    gl.uniform1f(meshLoc.rough, piece.material.rough);
    gl.uniform1f(meshLoc.metal, piece.material.metal);
    gl.uniform1f(meshLoc.polish, piece.material.polish);
    gl.bindVertexArray(piece.mesh.vao);
    gl.drawElementsInstanced(gl.TRIANGLES, piece.mesh.indexCount, piece.mesh.indexType, 0, piece.mesh.instances);
  };

  return runLoop(canvas, {
    still: prefersReducedMotion() || saveDataOn() || software,
    coarse,
    resize: resizeTargets,
    dispose: () => {
      destroyTargets(gl, targets);
      for (const piece of pieces) {
        gl.deleteVertexArray(piece.mesh.vao);
        for (const buffer of piece.mesh.buffers) gl.deleteBuffer(buffer);
      }
      if (shadow) {
        gl.deleteVertexArray(shadow.vao);
        for (const buffer of shadow.buffers) gl.deleteBuffer(buffer);
      }
      gl.deleteVertexArray(fullscreenVao);
      gl.deleteBuffer(fullscreenBuffer);
      gl.deleteProgram(field);
      if (meshProgram) gl.deleteProgram(meshProgram);
      if (shadowProgram) gl.deleteProgram(shadowProgram);
      if (blitProgram) gl.deleteProgram(blitProgram);
    },
    draw: (state) => {
      const aspect = state.width / Math.max(state.height, 1);
      const wide = window.innerWidth >= 980 && aspect > 1.05;
      const roomy = window.innerWidth >= 1400;
      const scroll = state.scroll;
      const shiftX = wide ? (roomy ? 0.3 : 0.4) + smoothstep(0.25, 1.15, scroll) * 0.08 : -0.42;
      const shiftY = wide ? 0.0 : 0.78;
      const fadeEnd = wide ? 1.85 : 0.72;
      const exposure = 1 - smoothstep(wide ? 0.22 : 0.04, fadeEnd, scroll);
      const scale = (wide ? (roomy ? 0.84 : 0.74) : 0.2) * (1 - smoothstep(0.35, 1.55, scroll) * (wide ? 0.3 : 0));
      const idle = state.frozen ? 0 : Math.sin(state.time * 0.33) * 0.045;

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, state.width, state.height);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      gl.useProgram(field);
      gl.uniform2f(fieldLoc.resolution, state.width, state.height);
      gl.uniform1f(fieldLoc.time, state.time);
      gl.uniform2f(fieldLoc.pointer, state.pointerX * state.dpr, state.pointerY * state.dpr);
      gl.uniform1f(fieldLoc.scroll, scroll);
      gl.uniform1f(fieldLoc.amp, state.frozen ? 0 : 1);
      gl.uniform2f(fieldLoc.focus, shiftX * 0.5 + 0.5, shiftY * 0.5 + 0.5);
      gl.uniform1f(fieldLoc.focusAmt, sculpture ? exposure : 0);
      gl.bindVertexArray(fullscreenVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!sculpture || !targets || !meshProgram || !meshLoc || !shadowProgram || !shadowLoc || !blitProgram || !shadow || !fins || !ring || exposure <= 0.004) {
        return;
      }

      const spread =
        Math.max(0.04, 0.2 + state.px * 0.18) * (1 - smoothstep(0.18, 1.3, scroll)) + 0.045 * smoothstep(0.18, 1.3, scroll);
      writeFins(fins.instanceData, sculpture.hingeX, sculpture.finHalfWidth, spread);
      syncInstances(gl, fins);
      const roll = 0.15 + state.px * 1.2 + Math.min(scroll, 1.6) * 0.55 + (state.frozen ? 0 : Math.sin(state.time * 0.45) * 0.08);
      writeMatrix(ring.instanceData, ringMatrix(roll));
      syncInstances(gl, ring);

      const model: Mat4 = mat4Mul(
        mat4Translate(0.02, -Math.min(scroll, 1.3) * 0.06, -smoothstep(0.3, 1.8, scroll) * 0.75),
        mat4Mul(
          mat4RotateY(-0.38 + state.px * 0.34 + idle + Math.min(scroll, 1.6) * 0.34),
          mat4Mul(mat4RotateX(0.06 - state.py * 0.08), mat4Scale(scale, scale, scale)),
        ),
      );
      const look: Vec3 = [wide ? 0.1 : 0.05, wide ? -0.06 : 0.08, 0];
      const eye = orbit([-0.55, 0.48, 6.05], look, state.px * 0.46 + idle * 0.5, -state.py * 0.16 - Math.min(scroll, 1.2) * 0.05);
      const viewProj = mat4Mul(
        mat4LensShift(shiftX, shiftY),
        mat4Mul(mat4Perspective((26 * Math.PI) / 180, aspect, 0.08, 48), mat4LookAt(eye, look, [0, 1, 0])),
      );
      const ground = mat4TransformPoint(model, 0, sculpture.groundY, 0);
      const key = norm3(-0.72 + state.px * 1.35, 1.05 - state.py * 0.55, 0.95);
      const rim = norm3(0.62 + state.px * 0.2, 0.22, -0.7);
      const fill = norm3(eye[0] - look[0] * 0.2, eye[1] - look[1] + 0.35, eye[2]);

      gl.bindFramebuffer(gl.FRAMEBUFFER, targets.renderFbo);
      gl.viewport(0, 0, state.width, state.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.frontFace(gl.CCW);

      gl.useProgram(shadowProgram);
      gl.uniformMatrix4fv(shadowLoc.viewProj, false, viewProj);
      gl.uniformMatrix4fv(shadowLoc.model, false, model);
      gl.uniform1f(shadowLoc.opacity, wide ? 0.78 * exposure : 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      if (wide) {
        gl.bindVertexArray(shadow.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, shadow.indexCount, shadow.indexType, 0, shadow.instances);
      }

      gl.useProgram(meshProgram);
      gl.uniformMatrix4fv(meshLoc.viewProj, false, viewProj);
      gl.uniformMatrix4fv(meshLoc.model, false, model);
      gl.uniform1f(meshLoc.groundY, ground[1]);
      gl.uniform3f(meshLoc.camera, eye[0], eye[1], eye[2]);
      gl.uniform1f(meshLoc.exposure, exposure);
      gl.uniform3f(meshLoc.keyDir, key[0], key[1], key[2]);
      gl.uniform3f(meshLoc.keyColor, 3.1, 2.9, 2.45);
      gl.uniform3f(meshLoc.fillDir, fill[0], fill[1], fill[2]);
      gl.uniform3f(meshLoc.fillColor, 0.95, 0.9, 0.74);
      gl.uniform3f(meshLoc.rimDir, rim[0], rim[1], rim[2]);
      gl.uniform3f(meshLoc.rimColor, 1.55, 1.5, 1.05);

      gl.frontFace(gl.CW);
      if (wide) {
        for (const piece of pieces) drawPiece(piece, true);
      }

      gl.frontFace(gl.CCW);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      for (const piece of pieces) drawPiece(piece, false);

      if (targets.samples > 1) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, targets.renderFbo);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, targets.resolveFbo);
        gl.blitFramebuffer(0, 0, state.width, state.height, 0, 0, state.width, state.height, gl.COLOR_BUFFER_BIT, gl.LINEAR);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, state.width, state.height);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(blitProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, targets.color);
      gl.uniform1i(blitScene, 0);
      gl.bindVertexArray(fullscreenVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disable(gl.BLEND);
    },
  });
}
