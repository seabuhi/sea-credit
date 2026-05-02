'use client';
import React, { useEffect, useRef } from 'react';

export default function PatternCloud() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: true, alpha: true });
    if (!gl) return;

    // SHADERS
    const vsSource = `
      attribute vec4 aPosition;
      attribute float aSize;
      uniform mat4 uProjectionMatrix;
      uniform mat4 uModelViewMatrix;
      void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
        gl_PointSize = aSize * (300.0 / length(gl_Position.xyz));
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform vec4 uColor;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5, 0.5));
        if (d > 0.5) discard;
        gl_FragColor = uColor * (1.0 - d * 2.0);
      }
    `;

    function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, loadShader(gl, gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, loadShader(gl, gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);

    // Get locations ONLY AFTER linking
    const locations = {
      position: gl.getAttribLocation(program, 'aPosition'),
      size: gl.getAttribLocation(program, 'aSize'),
      uProjectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
      uModelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
      uColor: gl.getUniformLocation(program, 'uColor'),
    };

    // Buffer data
    const count = 150;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      sizes[i] = Math.random() * 2 + 1;
      velocities[i * 3] = (Math.random() - 0.5) * 0.005;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }

    const posBuffer = gl.createBuffer();
    const sizeBuffer = gl.createBuffer();

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl?.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    let isMounted = true;
    let requestRef: number;

    function render(time: number) {
      if (!isMounted || !gl || !canvas || !program) return;
      
      try {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        // Update positions
        for (let i = 0; i < count; i++) {
          positions[i * 3] += velocities[i * 3];
          positions[i * 3 + 1] += velocities[i * 3 + 1];
          positions[i * 3 + 2] += velocities[i * 3 + 2];

          if (Math.abs(positions[i * 3]) > 5) velocities[i * 3] *= -1;
          if (Math.abs(positions[i * 3 + 1]) > 5) velocities[i * 3 + 1] *= -1;
          if (Math.abs(positions[i * 3 + 2]) > 5) velocities[i * 3 + 2] *= -1;
        }

        gl.useProgram(program);

        // Attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(locations.position);
        gl.vertexAttribPointer(locations.position, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(locations.size);
        gl.vertexAttribPointer(locations.size, 1, gl.FLOAT, false, 0, 0);

        // Matrices
        const aspect = canvas.width / canvas.height;
        const projectionMatrix = new Float32Array([
          1 / aspect, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, -1, -1,
          0, 0, -0.2, 0
        ]);
        const modelViewMatrix = new Float32Array([
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, -8, 1
        ]);

        gl.uniformMatrix4fv(locations.uProjectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(locations.uModelViewMatrix, false, modelViewMatrix);
        gl.uniform4fv(locations.uColor, [0.0, 0.4, 1.0, 0.4]);

        gl.drawArrays(gl.POINTS, 0, count);
        requestRef = requestAnimationFrame(render);
      } catch (e) {
        console.error("WebGL Draw Error:", e);
      }
    }
    requestRef = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(requestRef);
      if (gl && program) {
        gl.deleteProgram(program);
        gl.deleteBuffer(posBuffer);
        gl.deleteBuffer(sizeBuffer);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'radial-gradient(circle at center, #0a192f 0%, #020617 100%)'
      }}
    />
  );
}
