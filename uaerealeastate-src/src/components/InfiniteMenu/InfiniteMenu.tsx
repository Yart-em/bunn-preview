/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * InfiniteMenu — WebGL icosphere of photo discs.
 * Ported from the React Bits open-source recipe (JS + CSS variant)
 * and adapted for TypeScript + the BUNN landing page.
 *
 * Key changes vs. upstream:
 * - No external links / action button — replaced by a GlassSurface
 *   overlay that shows a buyer-persona card on hover / snap.
 * - Canvas clears to transparent (alpha: true) so the page
 *   background shows through.
 */

import { useEffect, useRef, useState } from 'react';
import { mat4, quat, vec2, vec3 } from 'gl-matrix';
import GlassSurface from '../GlassSurface/GlassSurface';
import './InfiniteMenu.css';

/* ─── Types ─────────────────────────────────────────────── */

export interface InfiniteMenuItem {
  image: string;
  name: string;
  sub: string;
  body: string;
}

export interface InfiniteMenuProps {
  items: InfiniteMenuItem[];
  scale?: number;
}

/* ─── GLSL sources ──────────────────────────────────────── */

const discVertShaderSource = `#version 300 es

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;
uniform vec4 uRotationAxisVelocity;

in vec3 aModelPosition;
in vec3 aModelNormal;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;

out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;

#define PI 3.141593

void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);
    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);

    if (gl_VertexID > 0) {
        vec3 rotationAxis = uRotationAxisVelocity.xyz;
        float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);
        vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
        vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
        float strength = dot(stretchDir, relativeVertexPos);
        float invAbsStrength = min(0., abs(strength) - 1.);
        strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
        worldPosition.xyz += stretchDir * strength;
    }

    worldPosition.xyz = radius * normalize(worldPosition.xyz);
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

    vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}
`;

const discFragShaderSource = `#version 300 es
precision highp float;

uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;

out vec4 outColor;

in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;

void main() {
    int itemIndex = vInstanceId % uItemCount;
    int cellsPerRow = uAtlasSize;
    int cellX = itemIndex % cellsPerRow;
    int cellY = itemIndex / cellsPerRow;
    vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;

    ivec2 texSize = textureSize(uTex, 0);
    float imageAspect = float(texSize.x) / float(texSize.y);
    float containerAspect = 1.0;
    float scale = max(imageAspect / containerAspect, containerAspect / imageAspect);

    vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
    st = (st - 0.5) * scale + 0.5;
    st = clamp(st, 0.0, 1.0);
    st = st * cellSize + cellOffset;

    outColor = texture(uTex, st);
    outColor.a *= vAlpha;
}
`;

/* ─── Geometry helpers ──────────────────────────────────── */

class Face {
  a: number; b: number; c: number;
  constructor(a: number, b: number, c: number) { this.a = a; this.b = b; this.c = c; }
}

class Vertex {
  position: vec3;
  normal: vec3;
  uv: vec2;
  constructor(x: number, y: number, z: number) {
    this.position = vec3.fromValues(x, y, z);
    this.normal = vec3.create();
    this.uv = vec2.create();
  }
}

class Geometry {
  vertices: Vertex[] = [];
  faces: Face[] = [];

  addVertex(...args: number[]) {
    for (let i = 0; i < args.length; i += 3)
      this.vertices.push(new Vertex(args[i], args[i + 1], args[i + 2]));
    return this;
  }

  addFace(...args: number[]) {
    for (let i = 0; i < args.length; i += 3)
      this.faces.push(new Face(args[i], args[i + 1], args[i + 2]));
    return this;
  }

  get lastVertex() { return this.vertices[this.vertices.length - 1]; }

  subdivide(divisions = 1) {
    const cache: Record<string, number> = {};
    let f = this.faces;
    for (let d = 0; d < divisions; ++d) {
      const nf: Face[] = new Array(f.length * 4);
      f.forEach((face, ndx) => {
        const mAB = this.getMidPoint(face.a, face.b, cache);
        const mBC = this.getMidPoint(face.b, face.c, cache);
        const mCA = this.getMidPoint(face.c, face.a, cache);
        const i = ndx * 4;
        nf[i] = new Face(face.a, mAB, mCA);
        nf[i + 1] = new Face(face.b, mBC, mAB);
        nf[i + 2] = new Face(face.c, mCA, mBC);
        nf[i + 3] = new Face(mAB, mBC, mCA);
      });
      f = nf;
    }
    this.faces = f;
    return this;
  }

  spherize(radius = 1) {
    this.vertices.forEach(v => {
      vec3.normalize(v.normal, v.position);
      vec3.scale(v.position, v.normal, radius);
    });
    return this;
  }

  get vertexData() { return new Float32Array(this.vertices.flatMap(v => Array.from(v.position))); }
  get normalData() { return new Float32Array(this.vertices.flatMap(v => Array.from(v.normal))); }
  get uvData() { return new Float32Array(this.vertices.flatMap(v => Array.from(v.uv))); }
  get indexData() { return new Uint16Array(this.faces.flatMap(f => [f.a, f.b, f.c])); }
  get data() { return { vertices: this.vertexData, indices: this.indexData, normals: this.normalData, uvs: this.uvData }; }

  getMidPoint(a: number, b: number, cache: Record<string, number>) {
    const k = a < b ? `k_${b}_${a}` : `k_${a}_${b}`;
    if (k in cache) return cache[k];
    const pa = this.vertices[a].position, pb = this.vertices[b].position;
    const ndx = this.vertices.length;
    cache[k] = ndx;
    this.addVertex((pa[0] + pb[0]) * .5, (pa[1] + pb[1]) * .5, (pa[2] + pb[2]) * .5);
    return ndx;
  }
}

class IcosahedronGeometry extends Geometry {
  constructor() {
    super();
    const t = Math.sqrt(5) * .5 + .5;
    this.addVertex(-1,t,0, 1,t,0, -1,-t,0, 1,-t,0, 0,-1,t, 0,1,t, 0,-1,-t, 0,1,-t, t,0,-1, t,0,1, -t,0,-1, -t,0,1);
    this.addFace(0,11,5, 0,5,1, 0,1,7, 0,7,10, 0,10,11, 1,5,9, 5,11,4, 11,10,2, 10,7,6, 7,1,8, 3,9,4, 3,4,2, 3,2,6, 3,6,8, 3,8,9, 4,9,5, 2,4,11, 6,2,10, 8,6,7, 9,8,1);
  }
}

class DiscGeometry extends Geometry {
  constructor(steps = 4, radius = 1) {
    super();
    steps = Math.max(4, steps);
    const alpha = (2 * Math.PI) / steps;
    this.addVertex(0, 0, 0);
    this.lastVertex.uv[0] = .5;
    this.lastVertex.uv[1] = .5;
    for (let i = 0; i < steps; ++i) {
      const x = Math.cos(alpha * i), y = Math.sin(alpha * i);
      this.addVertex(radius * x, radius * y, 0);
      this.lastVertex.uv[0] = x * .5 + .5;
      this.lastVertex.uv[1] = y * .5 + .5;
      if (i > 0) this.addFace(0, i, i + 1);
    }
    this.addFace(0, steps, 1);
  }
}

/* ─── WebGL helpers ─────────────────────────────────────── */

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s;
  console.error(gl.getShaderInfoLog(s));
  gl.deleteShader(s);
  return null;
}

function createProgram(gl: WebGL2RenderingContext, sources: string[], _tfv?: null, attribLocs?: Record<string, number>) {
  const p = gl.createProgram()!;
  [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((t, i) => {
    const s = createShader(gl, t, sources[i]);
    if (s) gl.attachShader(p, s);
  });
  if (attribLocs) for (const a in attribLocs) gl.bindAttribLocation(p, attribLocs[a], a);
  gl.linkProgram(p);
  if (gl.getProgramParameter(p, gl.LINK_STATUS)) return p;
  console.error(gl.getProgramInfoLog(p));
  gl.deleteProgram(p);
  return null;
}

function makeBuffer(gl: WebGL2RenderingContext, data: BufferSource, usage: number) {
  const b = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, data, usage);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return b;
}

function makeVertexArray(gl: WebGL2RenderingContext, pairs: [WebGLBuffer, number, number][], indices?: Uint16Array) {
  const va = gl.createVertexArray()!;
  gl.bindVertexArray(va);
  for (const [buf, loc, n] of pairs) {
    if (loc === -1) continue;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 0, 0);
  }
  if (indices) {
    const ib = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  }
  gl.bindVertexArray(null);
  return va;
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  const dpr = Math.min(2, devicePixelRatio);
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
  return false;
}

function createAndSetupTexture(gl: WebGL2RenderingContext) {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return t;
}

/* ─── Arcball control ───────────────────────────────────── */

class ArcballControl {
  isPointerDown = false;
  orientation = quat.create();
  pointerRotation = quat.create();
  rotationVelocity = 0;
  rotationAxis = vec3.fromValues(1, 0, 0);
  snapDirection = vec3.fromValues(0, 0, -1);
  snapTargetDirection: vec3 | null = null;
  private EPSILON = 0.1;
  private IDENTITY_QUAT = quat.create();
  private pointerPos = vec2.create();
  private previousPointerPos = vec2.create();
  private _rotationVelocity = 0;
  private _combinedQuat = quat.create();
  private canvas: HTMLCanvasElement;
  private updateCallback: (dt: number) => void;

  constructor(canvas: HTMLCanvasElement, updateCallback: (dt: number) => void) {
    this.canvas = canvas;
    this.updateCallback = updateCallback;
    canvas.addEventListener('pointerdown', e => { vec2.set(this.pointerPos, e.clientX, e.clientY); vec2.copy(this.previousPointerPos, this.pointerPos); this.isPointerDown = true; });
    canvas.addEventListener('pointerup', () => { this.isPointerDown = false; });
    canvas.addEventListener('pointerleave', () => { this.isPointerDown = false; });
    canvas.addEventListener('pointermove', e => { if (this.isPointerDown) vec2.set(this.pointerPos, e.clientX, e.clientY); });
    canvas.style.touchAction = 'none';
  }

  update(dt: number, tfd = 16) {
    const ts = dt / tfd + 0.00001;
    let af = ts;
    let snapRot = quat.create();

    if (this.isPointerDown) {
      const INT = 0.3 * ts, AMP = 5 / ts;
      const mid = vec2.sub(vec2.create(), this.pointerPos, this.previousPointerPos);
      vec2.scale(mid, mid, INT);
      if (vec2.sqrLen(mid) > this.EPSILON) {
        vec2.add(mid, this.previousPointerPos, mid);
        const p = this.project(mid), q = this.project(this.previousPointerPos);
        const a = vec3.normalize(vec3.create(), p), b = vec3.normalize(vec3.create(), q);
        vec2.copy(this.previousPointerPos, mid);
        af *= AMP;
        this.quatFromVectors(a, b, this.pointerRotation, af);
      } else {
        quat.slerp(this.pointerRotation, this.pointerRotation, this.IDENTITY_QUAT, INT);
      }
    } else {
      quat.slerp(this.pointerRotation, this.pointerRotation, this.IDENTITY_QUAT, 0.1 * ts);
      if (this.snapTargetDirection) {
        const a = this.snapTargetDirection, b = this.snapDirection;
        const sq = vec3.squaredDistance(a, b);
        const df = Math.max(0.1, 1 - sq * 10);
        af *= 0.2 * df;
        this.quatFromVectors(a, b, snapRot, af);
      }
    }

    const cq = quat.multiply(quat.create(), snapRot, this.pointerRotation);
    this.orientation = quat.multiply(quat.create(), cq, this.orientation);
    quat.normalize(this.orientation, this.orientation);

    quat.slerp(this._combinedQuat, this._combinedQuat, cq, 0.8 * ts);
    quat.normalize(this._combinedQuat, this._combinedQuat);

    const rad = Math.acos(this._combinedQuat[3]) * 2;
    const s = Math.sin(rad / 2);
    let rv = 0;
    if (s > 1e-6) {
      rv = rad / (2 * Math.PI);
      this.rotationAxis[0] = this._combinedQuat[0] / s;
      this.rotationAxis[1] = this._combinedQuat[1] / s;
      this.rotationAxis[2] = this._combinedQuat[2] / s;
    }
    this._rotationVelocity += (rv - this._rotationVelocity) * 0.5 * ts;
    this.rotationVelocity = this._rotationVelocity / ts;
    this.updateCallback(dt);
  }

  quatFromVectors(a: vec3, b: vec3, out: quat, af = 1) {
    const axis = vec3.cross(vec3.create(), a, b);
    vec3.normalize(axis, axis);
    const d = Math.max(-1, Math.min(1, vec3.dot(a, b)));
    quat.setAxisAngle(out, axis, Math.acos(d) * af);
  }

  private project(pos: vec2): vec3 {
    const r = 2, w = this.canvas.clientWidth, h = this.canvas.clientHeight, s = Math.max(w, h) - 1;
    const x = (2 * pos[0] - w - 1) / s, y = (2 * pos[1] - h - 1) / s;
    const xySq = x * x + y * y, rSq = r * r;
    const z = xySq <= rSq / 2 ? Math.sqrt(rSq - xySq) : rSq / Math.sqrt(xySq);
    return vec3.fromValues(-x, y, z);
  }
}

/* ─── Main engine class ─────────────────────────────────── */

class InfiniteGridMenu {
  private TFD = 1000 / 60;
  private SPHERE_RADIUS = 2;
  private time = 0;
  private deltaTime = 0;
  private deltaFrames = 0;
  private frames = 0;
  private gl!: WebGL2RenderingContext;
  private control!: ArcballControl;
  private discProgram: any;
  private discLocations: any;
  private discVAO: any;
  private discBuffers: any;
  private discInstances: any;
  private instancePositions: vec3[] = [];
  private DISC_INSTANCE_COUNT = 0;
  private worldMatrix = mat4.create();
  private tex: any;
  private atlasSize = 1;
  private smoothRotationVelocity = 0;
  private scaleFactor: number = 1;
  private movementActive = false;
  private viewportSize = vec2.create();
  private camera = {
    matrix: mat4.create(), near: 0.1, far: 40, fov: Math.PI / 4, aspect: 1,
    position: vec3.fromValues(0, 0, 3), up: vec3.fromValues(0, 1, 0),
    matrices: { view: mat4.create(), projection: mat4.create(), inversProjection: mat4.create() }
  };
  destroyed = false;
  private canvas: HTMLCanvasElement;
  private items: InfiniteMenuItem[];
  private onActiveItemChange: (i: number) => void;
  private onMovementChange: (m: boolean) => void;

  constructor(
    canvas: HTMLCanvasElement,
    items: InfiniteMenuItem[],
    onActiveItemChange: (i: number) => void,
    onMovementChange: (m: boolean) => void,
    onInit: ((s: InfiniteGridMenu) => void) | null,
    scale: number
  ) {
    this.canvas = canvas;
    this.items = items;
    this.onActiveItemChange = onActiveItemChange;
    this.onMovementChange = onMovementChange;
    this.scaleFactor = scale;
    this.camera.position[2] = 3 * scale;
    this.init(onInit);
  }

  resize() {
    this.viewportSize = vec2.set(this.viewportSize, this.canvas.clientWidth, this.canvas.clientHeight);
    const gl = this.gl;
    if (resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement)) gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    this.updateProjectionMatrix();
  }

  run(time = 0) {
    if (this.destroyed) return;
    this.deltaTime = Math.min(32, time - this.time);
    this.time = time;
    this.deltaFrames = this.deltaTime / this.TFD;
    this.frames += this.deltaFrames;
    this.animate();
    this.render();
    requestAnimationFrame(t => this.run(t));
  }

  destroy() { this.destroyed = true; }

  /* ── private ────────────────────────────────────────── */

  private init(onInit: ((s: InfiniteGridMenu) => void) | null) {
    this.gl = this.canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false })!;
    const gl = this.gl;
    if (!gl) throw new Error('No WebGL 2 context');

    this.discProgram = createProgram(gl, [discVertShaderSource, discFragShaderSource], null, {
      aModelPosition: 0, aModelNormal: 1, aModelUvs: 2, aInstanceMatrix: 3
    });
    const p = this.discProgram;
    this.discLocations = {
      aModelPosition: gl.getAttribLocation(p, 'aModelPosition'),
      aModelUvs: gl.getAttribLocation(p, 'aModelUvs'),
      aInstanceMatrix: gl.getAttribLocation(p, 'aInstanceMatrix'),
      uWorldMatrix: gl.getUniformLocation(p, 'uWorldMatrix'),
      uViewMatrix: gl.getUniformLocation(p, 'uViewMatrix'),
      uProjectionMatrix: gl.getUniformLocation(p, 'uProjectionMatrix'),
      uCameraPosition: gl.getUniformLocation(p, 'uCameraPosition'),
      uRotationAxisVelocity: gl.getUniformLocation(p, 'uRotationAxisVelocity'),
      uTex: gl.getUniformLocation(p, 'uTex'),
      uFrames: gl.getUniformLocation(p, 'uFrames'),
      uItemCount: gl.getUniformLocation(p, 'uItemCount'),
      uAtlasSize: gl.getUniformLocation(p, 'uAtlasSize'),
      uScaleFactor: gl.getUniformLocation(p, 'uScaleFactor'),
    };

    const dg = new DiscGeometry(56, 1);
    this.discBuffers = dg.data;
    this.discVAO = makeVertexArray(gl, [
      [makeBuffer(gl, this.discBuffers.vertices, gl.STATIC_DRAW), this.discLocations.aModelPosition, 3],
      [makeBuffer(gl, this.discBuffers.uvs, gl.STATIC_DRAW), this.discLocations.aModelUvs, 2],
    ], this.discBuffers.indices);

    const ico = new IcosahedronGeometry();
    ico.subdivide(1).spherize(this.SPHERE_RADIUS);
    this.instancePositions = ico.vertices.map(v => v.position);
    this.DISC_INSTANCE_COUNT = ico.vertices.length;
    this.initDiscInstances(this.DISC_INSTANCE_COUNT);

    this.initTexture();
    this.control = new ArcballControl(this.canvas, dt => this.onControlUpdate(dt));
    this.updateCameraMatrix();
    this.updateProjectionMatrix();
    this.resize();
    if (onInit) onInit(this);
  }

  private initTexture() {
    const gl = this.gl;
    this.tex = createAndSetupTexture(gl);
    const count = Math.max(1, this.items.length);
    this.atlasSize = Math.ceil(Math.sqrt(count));
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d')!;
    const cell = 512;
    c.width = this.atlasSize * cell;
    c.height = this.atlasSize * cell;

    Promise.all(this.items.map(it => new Promise<HTMLImageElement>(res => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = () => res(img); // degrade gracefully
      img.src = it.image;
    }))).then(imgs => {
      imgs.forEach((img, i) => {
        const x = (i % this.atlasSize) * cell;
        const y = Math.floor(i / this.atlasSize) * cell;
        ctx.drawImage(img, x, y, cell, cell);
      });
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.generateMipmap(gl.TEXTURE_2D);
    });
  }

  private initDiscInstances(count: number) {
    const gl = this.gl;
    const arr = new Float32Array(count * 16);
    const mats: Float32Array[] = [];
    for (let i = 0; i < count; ++i) {
      const m = new Float32Array(arr.buffer, i * 64, 16);
      m.set(mat4.create());
      mats.push(m);
    }
    const buf = gl.createBuffer()!;
    gl.bindVertexArray(this.discVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, arr.byteLength, gl.DYNAMIC_DRAW);
    for (let j = 0; j < 4; ++j) {
      const loc = this.discLocations.aInstanceMatrix + j;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 64, j * 16);
      gl.vertexAttribDivisor(loc, 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    this.discInstances = { matricesArray: arr, matrices: mats, buffer: buf };
  }

  private animate() {
    const gl = this.gl;
    this.control.update(this.deltaTime, this.TFD);
    const scale = 0.25, SI = 0.6;
    this.instancePositions.forEach((p, ndx) => {
      const wp = vec3.transformQuat(vec3.create(), p, this.control.orientation);
      const s = (Math.abs(wp[2]) / this.SPHERE_RADIUS) * SI + (1 - SI);
      const fs = s * scale;
      const m = mat4.create();
      mat4.multiply(m, m, mat4.fromTranslation(mat4.create(), vec3.negate(vec3.create(), wp)));
      mat4.multiply(m, m, mat4.targetTo(mat4.create(), [0, 0, 0], wp as any, [0, 1, 0]));
      mat4.multiply(m, m, mat4.fromScaling(mat4.create(), [fs, fs, fs]));
      mat4.multiply(m, m, mat4.fromTranslation(mat4.create(), [0, 0, -this.SPHERE_RADIUS]));
      mat4.copy(this.discInstances.matrices[ndx], m);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.discInstances.matricesArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.smoothRotationVelocity = this.control.rotationVelocity;
  }

  private render() {
    const gl = this.gl, L = this.discLocations;
    gl.useProgram(this.discProgram);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(L.uWorldMatrix, false, this.worldMatrix);
    gl.uniformMatrix4fv(L.uViewMatrix, false, this.camera.matrices.view);
    gl.uniformMatrix4fv(L.uProjectionMatrix, false, this.camera.matrices.projection);
    gl.uniform3f(L.uCameraPosition, this.camera.position[0], this.camera.position[1], this.camera.position[2]);
    gl.uniform4f(L.uRotationAxisVelocity, this.control.rotationAxis[0], this.control.rotationAxis[1], this.control.rotationAxis[2], this.smoothRotationVelocity * 1.1);
    gl.uniform1i(L.uItemCount, this.items.length);
    gl.uniform1i(L.uAtlasSize, this.atlasSize);
    gl.uniform1f(L.uFrames, this.frames);
    gl.uniform1f(L.uScaleFactor, this.scaleFactor);
    gl.uniform1i(L.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);

    gl.bindVertexArray(this.discVAO);
    gl.drawElementsInstanced(gl.TRIANGLES, this.discBuffers.indices.length, gl.UNSIGNED_SHORT, 0, this.DISC_INSTANCE_COUNT);
  }

  private updateCameraMatrix() {
    mat4.targetTo(this.camera.matrix, this.camera.position as any, [0, 0, 0], this.camera.up as any);
    mat4.invert(this.camera.matrices.view, this.camera.matrix);
  }

  private updateProjectionMatrix() {
    const gl = this.gl;
    this.camera.aspect = gl.canvas.width / gl.canvas.height;
    const h = this.SPHERE_RADIUS * 0.35, d = this.camera.position[2];
    this.camera.fov = this.camera.aspect > 1 ? 2 * Math.atan(h / d) : 2 * Math.atan(h / this.camera.aspect / d);
    mat4.perspective(this.camera.matrices.projection, this.camera.fov, this.camera.aspect, this.camera.near, this.camera.far);
    mat4.invert(this.camera.matrices.inversProjection, this.camera.matrices.projection);
  }

  private onControlUpdate(dt: number) {
    const ts = dt / this.TFD + 0.0001;
    let damping = 5 / ts;
    let ctz = 3 * this.scaleFactor;
    const isMoving = this.control.isPointerDown || Math.abs(this.smoothRotationVelocity) > 0.01;
    if (isMoving !== this.movementActive) { this.movementActive = isMoving; this.onMovementChange(isMoving); }
    if (!this.control.isPointerDown) {
      const nvi = this.findNearestVertexIndex();
      this.onActiveItemChange(nvi % Math.max(1, this.items.length));
      this.control.snapTargetDirection = vec3.normalize(vec3.create(), this.getVertexWorldPos(nvi));
    } else {
      ctz += this.control.rotationVelocity * 80 + 2.5;
      damping = 7 / ts;
    }
    this.camera.position[2] += (ctz - this.camera.position[2]) / damping;
    this.updateCameraMatrix();
  }

  private findNearestVertexIndex() {
    const inv = quat.conjugate(quat.create(), this.control.orientation);
    const nt = vec3.transformQuat(vec3.create(), this.control.snapDirection, inv);
    let maxD = -1, best = 0;
    for (let i = 0; i < this.instancePositions.length; ++i) {
      const d = vec3.dot(nt, this.instancePositions[i]);
      if (d > maxD) { maxD = d; best = i; }
    }
    return best;
  }

  private getVertexWorldPos(i: number) {
    return vec3.transformQuat(vec3.create(), this.instancePositions[i], this.control.orientation);
  }
}

/* ─── React component ───────────────────────────────────── */

export default function InfiniteMenu({ items, scale = 1.0 }: InfiniteMenuProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  /* Overlay text is hidden until the WebGL canvas has rendered its
   * first frame.  Without this gate the split-overlay name/sub
   * flash on screen over a blank canvas during page reload. */
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let sketch: InfiniteGridMenu | null = null;

    const handleActive = (index: number) => setActiveIdx(index);

    sketch = new InfiniteGridMenu(
      canvas,
      items.length ? items : [{ image: '', name: '', sub: '', body: '' }],
      handleActive,
      setIsMoving,
      sk => {
        sk.run();
        /* Mark ready after the sketch starts running.  Use a short
         * setTimeout rather than requestAnimationFrame — RAF is
         * paused in background/hidden tabs, which would leave the
         * overlay permanently hidden if the page loads while the
         * tab isn't focused. */
        setTimeout(() => setCanvasReady(true), 60);
      },
      scale,
    );

    const onResize = () => sketch?.resize();
    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      window.removeEventListener('resize', onResize);
      sketch?.destroy();
    };
  }, [items, scale]);

  const item = canvasReady ? (items[activeIdx] ?? null) : null;
  const showGlass = isHovering && !isMoving;

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <canvas id="infinite-grid-menu-canvas" ref={canvasRef} />

      {item && (
        <>
          {/* Default split layout: name on left, short info on right */}
          <div className={`im-split-overlay ${showGlass ? 'im-split-overlay--hidden' : ''}`}>
            <h3 className="im-split__name">{item.name}</h3>
            <p className="im-split__sub">{item.sub}</p>
          </div>

          {/* Hover glass overlay with detailed info */}
          <div className="im-overlay">
            <GlassSurface
              simple
              width="min(420px, 80%)"
              className={`im-glass-card ${showGlass ? 'im-glass-card--visible' : 'im-glass-card--hidden'}`}
              borderRadius={22}
            >
              <h3 className="im-glass-card__name">{item.name}</h3>
              <p className="im-glass-card__sub">{item.sub}</p>
              <p className="im-glass-card__body">{item.body}</p>
            </GlassSurface>
          </div>
        </>
      )}
    </div>
  );
}
