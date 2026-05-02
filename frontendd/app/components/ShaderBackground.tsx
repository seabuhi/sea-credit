'use client';
import React, { useEffect, useRef } from 'react';

const ShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const vsSource = `
    attribute vec4 aVertexPosition;
    void main() {
      gl_Position = aVertexPosition;
    }
  `;

  const fsSource = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;

    const float overallSpeed = 0.2;
    const float lineSpeed = 1.0 * overallSpeed;
    const float scale = 5.0;
    const vec4 lineColor = vec4(0.4, 0.2, 0.8, 1.0);
    const float minLineWidth = 0.01;
    const float maxLineWidth = 0.2;
    const float warpFrequency = 0.5;
    const float warpSpeed = 0.5 * overallSpeed;
    const float warpAmplitude = 0.8;
    const float offsetSpeed = 0.1 * overallSpeed;
    const float offsetFrequency = 0.05;
    const float minOffsetSpread = 0.5;
    const float maxOffsetSpread = 2.0;
    const int linesPerGroup = 10;

    #define S(a, b, t) smoothstep(a, b, t)

    float random(float t) {
        return fract(sin(t * 745.523) * 123.456);
    }

    float getPlasmaY(float x, float horizontalFade, float offset) {
        return sin(x * 0.5 + iTime * lineSpeed + offset) * 0.8 * horizontalFade;
    }

    float drawCrispLine(float lineY, float halfWidth, float spaceY) {
        return S(halfWidth, 0.0, abs(lineY - spaceY));
    }

    float drawSmoothLine(float lineY, float halfWidth, float spaceY) {
        return S(halfWidth * 2.0, 0.0, abs(lineY - spaceY));
    }

    float drawCircle(vec2 pos, float radius, vec2 space) {
        return S(radius, 0.0, length(pos - space));
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        vec2 space = (gl_FragCoord.xy - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;

        float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
        float verticalFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

        space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + horizontalFade);
        space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * horizontalFade;

        vec4 lines = vec4(0.0);
        vec4 bgColor1 = vec4(0.05, 0.05, 0.15, 1.0);
        vec4 bgColor2 = vec4(0.1, 0.05, 0.2, 1.0);

        for(int l = 0; l < linesPerGroup; l++) {
            float normalizedLineIndex = float(l) / float(linesPerGroup);
            float offsetTime = iTime * offsetSpeed;
            float offsetPosition = float(l) + space.x * offsetFrequency;
            float rand = random(offsetPosition + offsetTime) * 0.5 + 0.5;
            float halfWidth = mix(minLineWidth, maxLineWidth, rand * horizontalFade) / 2.0;
            float offset = random(offsetPosition + offsetTime * (1.0 + normalizedLineIndex)) * mix(minOffsetSpread, maxOffsetSpread, horizontalFade);
            
            float linePosition = getPlasmaY(space.x, horizontalFade, offset);
            float line = drawSmoothLine(linePosition, halfWidth, space.y) / 2.0 + drawCrispLine(linePosition, halfWidth * 0.15, space.y);
            
            float circleX = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
            vec2 circlePosition = vec2(circleX, getPlasmaY(circleX, horizontalFade, offset));
            float circle = drawCircle(circlePosition, 0.01, space) * 4.0;
            
            line = line + circle;
            lines += line * lineColor * rand;
        }

        vec4 fragColor = mix(bgColor1, bgColor2, uv.x);
        fragColor *= verticalFade;
        fragColor.a = 1.0;
        fragColor += lines;
        gl_FragColor = fragColor;
    }
  `;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    function initShaderProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
      const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vs);
      const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fs);
      const program = gl.createProgram();
      if (!program || !vertexShader || !fragmentShader) return null;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      return program;
    }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    if (!shaderProgram) return;

    const programInfo = {
      program: shaderProgram,
      attribLocations: { vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition') },
      uniformLocations: {
        resolution: gl.getUniformLocation(shaderProgram, 'iResolution'),
        time: gl.getUniformLocation(shaderProgram, 'iTime'),
      },
    };

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();

    let animationId: number;
    const render = (time: number) => {
      gl.useProgram(programInfo.program);
      gl.uniform2f(programInfo.uniformLocations.resolution, canvas.width, canvas.height);
      gl.uniform1f(programInfo.uniformLocations.time, time * 0.001);
      gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    };
    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
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
        backgroundColor: '#050505'
      }}
    />
  );
};

export default ShaderBackground;
