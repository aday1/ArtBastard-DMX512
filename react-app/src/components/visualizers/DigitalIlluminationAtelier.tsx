import React, { useRef, useEffect, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useVisualizationData } from '../../hooks/useVisualizationData'
import styles from './DigitalIlluminationAtelier.module.scss'

const vertexShader = `
  attribute vec4 position; // Vertex position (x, y)
  attribute vec2 texCoord; // Texture coordinate (u, v)
  // particleVelocity was part of the original shader but not fully utilized with current geometry setup.
  // For a true particle system, each vertex would need its own velocity attribute.
  // We'll simulate particle-like effects using texture data for now.

  varying vec2 vTexCoord; // Pass texture coordinate to fragment shader
  varying vec3 vDataDrivenColor; // Pass data-driven color to fragment shader
  varying float vCombinedIntensity; // Pass combined intensity to fragment shader

  uniform float uTime; // Time uniform for animations
  uniform sampler2D uDmxTexture; // DMX data texture
  uniform sampler2D uMidiTexture; // MIDI data texture
  uniform sampler2D uOscTexture; // OSC data texture

  void main() {
    vTexCoord = texCoord;
    float time = uTime * 0.001; // Time in seconds

    // Sample data textures to get intensities.
    // Using texCoord directly might be too uniform.
    // For more variation, we could use position or a derivative.
    vec4 dmxData = texture2D(uDmxTexture, texCoord);
    vec4 midiData = texture2D(uMidiTexture, texCoord);
    vec4 oscData = texture2D(uOscTexture, texCoord);

    // Simple intensity calculation (can be refined)
    float dmxIntensity = dmxData.r; // Assuming DMX data is in red channel
    float midiIntensity = midiData.g; // Assuming MIDI data is in green channel
    float oscIntensity = oscData.b;   // Assuming OSC data is in blue channel
    vCombinedIntensity = (dmxIntensity + midiIntensity + oscIntensity) / 3.0;

    // Swirling motion (kept from original)
    vec4 pos = position;
    pos.x += sin(time + position.y * 2.0 + oscIntensity * 5.0) * (0.1 + midiIntensity * 0.2);
    pos.y += cos(time + position.x * 2.0 + dmxIntensity * 5.0) * (0.1 + oscIntensity * 0.2);
    
    // Data-driven displacement (e.g., make it "pulse" or "extrude")
    // This is a simple example; could be made more complex.
    // pos.z += vCombinedIntensity * 0.5 * sin(time * 10.0 + texCoord.x * 3.14);
    // Since we are drawing a 2D quad, z displacement won't be visible unless perspective changes.
    // Instead, we can modulate point size if we were using gl.POINTS, or affect color.

    // Color influenced by data:
    // DMX: Controls Red channel and a bit of blue
    // MIDI: Controls Green channel and a bit of red
    // OSC: Controls Blue channel and a bit of green
    // Base color that shifts with time
    vec3 baseColorTime = vec3(0.5 + sin(time * 0.5) * 0.2, 
                              0.5 + cos(time * 0.7) * 0.2,
                              0.5 + sin(time * 0.9) * 0.2);

    vDataDrivenColor = baseColorTime + 
                       vec3(dmxIntensity * 0.8, midiIntensity * 0.8, oscIntensity * 0.8) +
                       vec3(midiIntensity * 0.2, oscIntensity * 0.2, dmxIntensity * 0.2);
    vDataDrivenColor = clamp(vDataDrivenColor, 0.0, 1.0); // Ensure colors stay in valid range

    gl_Position = pos;
    // gl_PointSize is only effective if gl.drawArrays mode is gl.POINTS
    // The current setup uses gl.TRIANGLE_STRIP for a quad.
    // To make "particles" on the quad, we'll rely on the fragment shader.
    // gl_PointSize = 4.0 + vCombinedIntensity * 10.0; 
  }
`

const fragmentShader = `
  precision mediump float;

  uniform sampler2D uDmxTexture;  // DMX data texture
  uniform sampler2D uMidiTexture; // MIDI data texture
  uniform sampler2D uOscTexture;  // OSC data texture
  uniform float uTime;            // Time uniform for animations

  varying vec2 vTexCoord;         // Interpolated texture coordinate from vertex shader
  varying vec3 vDataDrivenColor;  // Interpolated data-driven color from vertex shader
  varying float vCombinedIntensity; // Interpolated combined intensity

  // Function to generate a random value (useful for sparkles, noise)
  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Function to create a procedural star/sparkle shape
  float starShape(vec2 uv, float flare) {
    float d = length(uv);
    float m = 0.05 / d; // brightness falloff
    
    float rays = max(0.0, 1.0 - abs(uv.x * uv.y * 1000.0)); // Cross shape
    m += rays * flare * 0.1; // Add ray brightness
    
    // Add some noise to the rays for a twinkling effect
    float angle = atan(uv.y, uv.x);
    float noise = sin(angle * 10.0 + uTime * 2.0) * 0.5 + 0.5; // Twinkle based on angle and time
    m += noise * rays * 0.1;

    return clamp(m, 0.0, 1.0);
  }


  void main() {
    float time = uTime * 0.001; // Time in seconds

    // Sample data textures again (fragment shaders don't share vertex shader's exact samples)
    // This allows for per-pixel effects based on data, not just per-vertex.
    vec4 dmxVal = texture2D(uDmxTexture, vTexCoord);
    vec4 midiVal = texture2D(uMidiTexture, vTexCoord);
    vec4 oscVal = texture2D(uOscTexture, vTexCoord);

    // Specific data intensities for fine-grained control in fragment shader
    float dmxIntensity = dmxVal.r;
    float midiIntensity = midiVal.g; // Often 0 unless a note is active at this "texCoord"
    float oscIntensity = oscVal.b;

    // --- Creative Effects ---

    // 1. Base Color: Comes from vertex shader (vDataDrivenColor), already influenced by data
    vec3 baseColor = vDataDrivenColor;

    // 2. Particle/Sparkle Effect:
    //    Make sparkles more prominent with MIDI activity (e.g., note-on events)
    //    Use vTexCoord and time to create a field of sparkles.
    //    The density or brightness of sparkles can be tied to overall intensity or specific data.
    float sparkleGrid = rand(floor(vTexCoord * 100.0 + time * 0.1)); // Creates a grid of random values
    float sparkleIntensity = 0.0;

    if (sparkleGrid > 0.95 - midiIntensity * 0.1) { // More MIDI -> more sparkles
        sparkleIntensity = (sparkleGrid - (0.95 - midiIntensity * 0.1)) / (0.05 + midiIntensity * 0.1);
        sparkleIntensity = pow(sparkleIntensity, 2.0) * (0.5 + vCombinedIntensity * 0.5); // Make them pop
    }
    
    vec3 sparkleColor = vec3(1.0, 1.0, 0.8) * sparkleIntensity; // Bright yellow sparkles

    // 3. Aura/Glow Effect: Based on DMX and OSC intensity
    //    Create a soft glow around areas of high DMX/OSC activity.
    //    This can be simulated by adding a blurred version of the color or a radial gradient.
    float glowFactor = smoothstep(0.1, 0.8, dmxIntensity + oscIntensity * 0.5);
    vec3 glowColor = baseColor * glowFactor * 0.5; // Soft glow related to base color

    // 4. Color Pulsing/Shifting:
    //    Use OSC for subtle color shifts or pulsing effects across the screen.
    float oscPulse = sin(time * 2.0 + vTexCoord.x * 5.0 + oscIntensity * 10.0) * 0.1 + 0.1;
    vec3 pulseColorShift = vec3(oscPulse, -oscPulse * 0.5, oscPulse * 0.8) * oscIntensity;

    // Combine effects
    vec3 finalColor = baseColor + sparkleColor + glowColor + pulseColorShift;
    finalColor = clamp(finalColor, 0.0, 1.0);

    // Alpha: Use combined intensity, but make it more impactful
    // The original alpha made it fade at edges of points for a firework particle style.
    // Since we are rendering a full quad, we might want full opacity or data-driven transparency.
    float alpha = clamp(vCombinedIntensity * 2.0 + 0.3, 0.3, 1.0); // Ensure it's mostly visible
    
    // If a specific MIDI note triggers a "flash" make it more opaque
    if (midiIntensity > 0.7) { // If a strong MIDI signal
        alpha = max(alpha, 0.9);
        finalColor += vec3(0.2, 0.2, 0.2); // Brighten the color during flash
    }

    // Add "firework-like particles" effect from original shader, but adapt it
    // This works if gl_PointCoord is available (typically with gl.POINTS)
    // For a quad, we can simulate this by creating patterns.
    // For now, let's use a vignette effect that pulses with intensity.
    float vignette = 1.0 - length(vTexCoord - vec2(0.5)) * (0.5 + vCombinedIntensity * 0.5);
    vignette = smoothstep(0.0, 1.0, vignette);


    gl_FragColor = vec4(finalColor * vignette, alpha);
    // For a more "point cloud" look on the quad:
    // float distToCenter = length(gl_PointCoord - vec2(0.5)); // Only if using gl.POINTS
    // float particleAlpha = smoothstep(0.5, 0.0, distToCenter);
    // gl_FragColor = vec4(finalColor, particleAlpha * (vCombinedIntensity + 0.2));
  }
`

export const DigitalIlluminationAtelier: React.FC = () => {
  const { theme } = useTheme()
  const { data } = useVisualizationData()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showDmx, setShowDmx] = useState(true)
  const [showMidi, setShowMidi] = useState(true)
  const [showOsc, setShowOsc] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const texturesRef = useRef<{
    dmx: WebGLTexture | null;
    midi: WebGLTexture | null;
    osc: WebGLTexture | null;
  }>({ dmx: null, midi: null, osc: null })
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(Date.now())

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      const container = document.getElementById('visualizer-container')
      if (container) {
        await container.requestFullscreen()
        setIsFullscreen(true)
      }
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const bindTextures = (gl: WebGLRenderingContext, program: WebGLProgram) => {
    ['dmx', 'midi', 'osc'].forEach((name, idx) => {
      gl.activeTexture(gl.TEXTURE0 + idx)
      gl.bindTexture(gl.TEXTURE_2D, texturesRef.current[name as keyof typeof texturesRef.current])
      const location = gl.getUniformLocation(program, `u${name.charAt(0).toUpperCase()}${name.slice(1)}Texture`)
      gl.uniform1i(location, idx)
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl')
    if (!gl) {
      console.error('WebGL not available')
      return
    }
    glRef.current = gl

    const program = createShaderProgram(gl, vertexShader, fragmentShader)
    if (!program) return
    programRef.current = program

    texturesRef.current = {
      dmx: createDataTexture(gl),
      midi: createDataTexture(gl),
      osc: createDataTexture(gl)
    }

    setupGeometry(gl, program)

    startTimeRef.current = Date.now()
    render()

    return () => {
      cancelAnimationFrame(animationRef.current)
      if (gl) {
        gl.deleteProgram(program)
        Object.values(texturesRef.current).forEach(texture => {
          if (texture) gl.deleteTexture(texture)
        })
      }
    }
  }, [])

  useEffect(() => {
    const gl = glRef.current
    if (!gl || !texturesRef.current.dmx) return

    console.log('Data object from useVisualizationData:', data);

    console.log('DMX values for texture update:', data.dmxValues);
    updateTexture(gl, texturesRef.current.dmx!, data.dmxValues)

    if (texturesRef.current.midi && data.midiActivity.length > 0) {
      const midiData = new Float32Array(512)
      data.midiActivity.forEach(msg => {
        const idx = msg.channel * 16 + (msg.type === 'noteon' ? 0 : 8)
        midiData[idx] = msg.value ? msg.value / 127 : 0
      })
      console.log('MIDI data for texture update:', midiData);
      updateTexture(gl, texturesRef.current.midi, midiData)
    }

    if (texturesRef.current.osc && data.oscMessages.length > 0) {
      const oscData = new Float32Array(512)
      data.oscMessages.forEach((msg, i) => {
        oscData[i % 512] = msg.direction === 'out' ? 0.8 : 0.4
      })
      console.log('OSC data for texture update:', oscData);
      updateTexture(gl, texturesRef.current.osc, oscData)
    }
  }, [data])

  // Add keyboard shortcut handling
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Fullscreen toggle with 'F' key
      if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        toggleFullscreen()
      }
      
      // Toggle visualizations with number keys
      if (!event.ctrlKey && !event.metaKey) {
        switch (event.key) {
          case '1':
            setShowDmx(prev => !prev)
            break
          case '2':
            setShowMidi(prev => !prev)
            break
          case '3':
            setShowOsc(prev => !prev)
            break
          default:
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Update shader uniforms based on toggle states
  useEffect(() => {
    const gl = glRef.current
    const program = programRef.current
    if (!gl || !program) return

    gl.useProgram(program)
    gl.uniform1i(gl.getUniformLocation(program, 'uShowDmx'), showDmx ? 1 : 0)
    gl.uniform1i(gl.getUniformLocation(program, 'uShowMidi'), showMidi ? 1 : 0)
    gl.uniform1i(gl.getUniformLocation(program, 'uShowOsc'), showOsc ? 1 : 0)
  }, [showDmx, showMidi, showOsc])

  const render = () => {
    const gl = glRef.current
    const program = programRef.current
    if (!gl || !program) return

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)
    bindTextures(gl, program)

    const timeLocation = gl.getUniformLocation(program, 'uTime')
    const currentTime = Date.now() - startTimeRef.current;
    gl.uniform1f(timeLocation, currentTime)

    // Log shader uniforms
    console.log('Shader Uniform uTime:', currentTime);
    const uDmxTextureLocation = gl.getUniformLocation(program, 'uDmxTexture');
    console.log('Shader Uniform uDmxTexture Location:', uDmxTextureLocation, 'Value (texture unit):', 0); // Assuming texture unit 0
    const uMidiTextureLocation = gl.getUniformLocation(program, 'uMidiTexture');
    console.log('Shader Uniform uMidiTexture Location:', uMidiTextureLocation, 'Value (texture unit):', 1); // Assuming texture unit 1
    const uOscTextureLocation = gl.getUniformLocation(program, 'uOscTexture');
    console.log('Shader Uniform uOscTexture Location:', uOscTextureLocation, 'Value (texture unit):', 2); // Assuming texture unit 2


    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    animationRef.current = requestAnimationFrame(render)
  }

  return (
    <div 
      id="visualizer-container"
      className={`${styles.digitalIlluminationAtelier} ${isFullscreen ? styles.fullscreen : ''}`}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>
          {theme === 'artsnob' && 'Digital Illumination Atelier: A Symphony of Light'}
          {theme === 'standard' && 'Real-time Visualization'}
          {theme === 'minimal' && 'Visualization'}
        </h2>
        
        <div className={styles.controls}>
          <div className={styles.toggles}>
            <button
              className={`${styles.toggle} ${showDmx ? styles.active : ''}`}
              onClick={() => setShowDmx(!showDmx)}
              title={`${theme === 'artsnob' ? 'Toggle Luminous Matrix' : 'Toggle DMX'} [Press 1]`}
            >
              {theme === 'artsnob' ? 'Luminous Matrix' : 'DMX'}
            </button>
            <button
              className={`${styles.toggle} ${showMidi ? styles.active : ''}`}
              onClick={() => setShowMidi(!showMidi)}
              title={`${theme === 'artsnob' ? 'Toggle Digital Orchestra' : 'Toggle MIDI'} [Press 2]`}
            >
              {theme === 'artsnob' ? 'Digital Orchestra' : 'MIDI'}
            </button>
            <button
              className={`${styles.toggle} ${showOsc ? styles.active : ''}`}
              onClick={() => setShowOsc(!showOsc)}
              title={`${theme === 'artsnob' ? 'Toggle Network Aether' : 'Toggle OSC'} [Press 3]`}
            >
              {theme === 'artsnob' ? 'Network Aether' : 'OSC'}
            </button>
          </div>

          <button
            className={styles.fullscreenButton}
            onClick={toggleFullscreen}
            title={`${isFullscreen ? 'Exit' : 'Enter'} Fullscreen [Press F]`}
          >
            <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`} />
            {theme === 'artsnob' && (
              <span>{isFullscreen ? 'Contain the Cosmos' : 'Unleash the Infinite Canvas'}</span>
            )}
          </button>
        </div>
      </div>

      {theme === 'artsnob' && (
        <div className={styles.description}>
          <p className={styles.artDescription}>
            "Behold as digital signals transmute into pure light and motion. Each DMX value a brushstroke, 
            every MIDI note a shooting star, and OSC messages rippling through the digital aether like waves 
            in the primordial sea of creation. Here, in this sacred digital space, we witness the convergence 
            of technology and artistry in its most sublime form."
          </p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={1024}
        height={512}
      />
    </div>
  )
}

function createShaderProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource)
  if (!vertexShader || !fragmentShader) return null

  const program = gl.createProgram()
  if (!program) return null

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Failed to link shader program:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }

  return program
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Failed to compile shader:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function createDataTexture(gl: WebGLRenderingContext) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    32,
    16,
    0,
    gl.RGBA,
    gl.FLOAT,
    null
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  return texture
}

function updateTexture(gl: WebGLRenderingContext, texture: WebGLTexture, data: Float32Array | number[]) {
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,
    0,
    0,
    32,
    16,
    gl.RGBA,
    gl.FLOAT,
    new Float32Array(data)
  )
}

function setupGeometry(gl: WebGLRenderingContext, program: WebGLProgram) {
  const positions = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    1, 1
  ])
  const texCoords = new Float32Array([
    0, 1,
    1, 1,
    0, 0,
    1, 0
  ])

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
  const positionLoc = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(positionLoc)
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

  const texCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)
  const texCoordLoc = gl.getAttribLocation(program, 'texCoord')
  gl.enableVertexAttribArray(texCoordLoc)
  gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0)
}
