import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js'

const shardNames = ['Shard 01', 'Shard 02', 'Shard 03', 'Shard 04', 'Shard 05']
const shardPalettes = {
  light: {
    node: '#356b73',
    selected: '#b84419',
    link: '#718f91',
    activeLink: '#b84419',
    emissive: '#24474d',
    selectedEmissive: '#713a29',
    halo: '#648584',
    gossip: '#6d9891',
    ping: '#b84419',
    ambient: '#fff8ef',
    key: '#e4a17a',
    clear: '#f1f2eb',
  },
  dark: {
    node: '#c3d5cc',
    selected: '#ff713a',
    link: '#719391',
    activeLink: '#ff6a1a',
    emissive: '#345858',
    selectedEmissive: '#75402b',
    halo: '#80a8a3',
    gossip: '#add0c6',
    ping: '#ff6a1a',
    ambient: '#d5e7df',
    key: '#fff2dc',
    clear: '#06191d',
  },
}

function getShardPalette() {
  return document.documentElement.dataset.theme === 'dark'
    ? shardPalettes.dark
    : shardPalettes.light
}

export function AsciiAnimation() {
  const stageRef = useRef(null)
  const clickHandlerRef = useRef(() => {})
  const [activeShard, setActiveShard] = useState(null)
  const [trafficStatus, setTrafficStatus] = useState('GOSSIP HEARTBEAT · 5 SHARDS')

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined

    let renderer
    let effect
    let frameId = 0
    let lastFrameAt = 0
    let visible = true
    let disposed = false
    let themeObserver
    let operationId = 0
    let operation = null
    let palette = getShardPalette()
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reducedMotion = motionPreference.matches
    const activeShardRef = { current: null }
    const signals = []
    const pulseUntil = [0, 0, 0, 0, 0]
    const shardPositions = [
      new THREE.Vector3(-1.48, 0.18, 0.18),
      new THREE.Vector3(-0.72, 1.08, -0.36),
      new THREE.Vector3(0.92, 0.88, 0.42),
      new THREE.Vector3(1.48, -0.42, -0.32),
      new THREE.Vector3(-0.48, -1.04, 0.46),
    ]

    const scene = new THREE.Scene()
    scene.background = null

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0, 3.5)
    const system = new THREE.Group()
    scene.add(system)

    const connectionCurves = new Map()
    const connectionMeshes = []
    const shardMeshes = []
    const haloMeshes = []
    const baseNodeColor = new THREE.Color(palette.node)
    const selectedNodeColor = new THREE.Color(palette.selected)

    // A complete mesh: each shard has a direct route to every other shard.
    for (let from = 0; from < shardPositions.length; from += 1) {
      for (let to = from + 1; to < shardPositions.length; to += 1) {
        const start = shardPositions[from]
        const end = shardPositions[to]
        const midpoint = start.clone().add(end).multiplyScalar(0.5)
        midpoint.z += (from + to) % 2 === 0 ? 0.38 : -0.38
        midpoint.y += (to - from) % 2 === 0 ? 0.06 : -0.06
        const curve = new THREE.QuadraticBezierCurve3(start, midpoint, end)
        const material = new THREE.MeshBasicMaterial({
          color: palette.link,
          transparent: true,
          opacity: 0.42,
        })
        const connection = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 24, 0.009, 5, false),
          material,
        )
        system.add(connection)
        connectionCurves.set(`${from}:${to}`, curve)
        connectionMeshes.push({ mesh: connection, from, to })
      }
    }

    const shardGeometry = new THREE.IcosahedronGeometry(0.17, 2)
    const haloGeometry = new THREE.TorusGeometry(0.26, 0.009, 5, 40)
    for (let index = 0; index < shardPositions.length; index += 1) {
      const shardMaterial = new THREE.MeshStandardMaterial({
        color: baseNodeColor,
        emissive: palette.emissive,
        roughness: 0.36,
        metalness: 0.12,
      })
      const shard = new THREE.Mesh(shardGeometry, shardMaterial)
      shard.position.copy(shardPositions[index])
      system.add(shard)
      shardMeshes.push(shard)

      const haloMaterial = new THREE.MeshBasicMaterial({
        color: palette.halo,
        transparent: true,
        opacity: 0.7,
      })
      const halo = new THREE.Mesh(haloGeometry, haloMaterial)
      halo.position.copy(shardPositions[index])
      halo.rotation.x = 0.68 + index * 0.2
      halo.rotation.y = index * 0.28
      system.add(halo)
      haloMeshes.push(halo)
    }

    const packetGeometry = new THREE.SphereGeometry(0.045, 10, 8)
    const gossipMaterial = new THREE.MeshBasicMaterial({ color: palette.gossip })
    const pingMaterial = new THREE.MeshBasicMaterial({ color: palette.ping })
    const ringRoute = [0, 1, 2, 3, 4, 0]
    const gossipPackets = ringRoute.slice(0, -1).map(() => {
      const packet = new THREE.Mesh(packetGeometry, gossipMaterial)
      packet.scale.setScalar(0.66)
      system.add(packet)
      return packet
    })

    const getCurve = (from, to) =>
      from < to ? connectionCurves.get(`${from}:${to}`) : connectionCurves.get(`${to}:${from}`)
    const placeOnConnection = (mesh, from, to, progress) => {
      const curve = getCurve(from, to)
      mesh.position.copy(curve.getPointAt(from < to ? progress : 1 - progress))
    }
    const updateGossip = (time) => {
      gossipPackets.forEach((packet, index) => {
        const progress = ((time * 0.00008 + index / gossipPackets.length) % 1) * 5
        const segment = Math.floor(progress)
        placeOnConnection(packet, ringRoute[segment], ringRoute[segment + 1], progress - segment)
      })
    }

    const clearSignals = () => {
      signals.forEach(({ mesh }) => system.remove(mesh))
      signals.length = 0
    }
    const pingShard = (source) => {
      activeShardRef.current = source
      setActiveShard(source)
      clearSignals()
      operation = { id: ++operationId, source, acknowledged: 0 }
      setTrafficStatus(`PING S0${source + 1} → ALL PEERS`)
      shardMeshes.forEach((shard, index) => {
        const selected = index === source
        shard.material.color.copy(selected ? selectedNodeColor : baseNodeColor)
        shard.material.emissive.set(selected ? palette.selectedEmissive : palette.emissive)
        haloMeshes[index].material.color.copy(selected ? selectedNodeColor : baseNodeColor)
      })
      connectionMeshes.forEach(({ mesh, from, to }) => {
        const highlighted = from === source || to === source
        mesh.material.opacity = highlighted ? 0.78 : 0.42
        mesh.material.color.set(highlighted ? palette.activeLink : palette.link)
      })
      const startedAt = performance.now()
      pulseUntil[source] = startedAt + 500

      if (reducedMotion) {
        shardPositions.forEach((_, target) => {
          if (target !== source) pulseUntil[target] = startedAt + 500
        })
        setTrafficStatus('QUORUM ACK · 4/4 PEERS')
        renderFrame()
        return
      }

      shardPositions.forEach((_, target) => {
        if (target === source) return
        const mesh = new THREE.Mesh(packetGeometry, pingMaterial)
        mesh.scale.setScalar(1.15)
        system.add(mesh)
        signals.push({
          mesh,
          source,
          target,
          phase: 'request',
          startedAt: startedAt + Math.abs(target - source) * 85,
          duration: 620,
          operation: operation.id,
        })
      })
      startAnimation()
    }
    clickHandlerRef.current = pingShard

    const updateSignals = (time) => {
      for (let index = signals.length - 1; index >= 0; index -= 1) {
        const signal = signals[index]
        if (time < signal.startedAt) {
          signal.mesh.visible = false
          continue
        }
        signal.mesh.visible = true
        const progress = Math.min((time - signal.startedAt) / signal.duration, 1)
        const from = signal.phase === 'request' ? signal.source : signal.target
        const to = signal.phase === 'request' ? signal.target : signal.source
        placeOnConnection(signal.mesh, from, to, progress)
        if (progress < 1) continue

        pulseUntil[to] = time + 420
        if (signal.phase === 'request') {
          signal.phase = 'response'
          signal.startedAt = time + 100
        } else {
          system.remove(signal.mesh)
          signals.splice(index, 1)
          if (operation?.id === signal.operation) {
            operation.acknowledged += 1
            const acknowledgements = operation.acknowledged
            setTrafficStatus(
              acknowledgements === 4
                ? 'QUORUM ACK · 4/4 PEERS'
                : `ACKNOWLEDGED · ${acknowledgements}/4 PEERS`,
            )
          }
        }
      }
    }

    const ambientLight = new THREE.AmbientLight(palette.ambient, 1.15)
    scene.add(ambientLight)
    const keyLight = new THREE.PointLight(palette.key, 12)
    keyLight.position.set(-2.5, 3.2, 4.5)
    scene.add(keyLight)

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      renderer.setClearColor(palette.clear, 0)
      renderer.domElement.style.color = 'var(--muted)'

      effect = new AsciiEffect(renderer, ' .,:;+=*#%@', {
        alpha: true,
        color: true,
        invert: true,
        resolution: 0.12,
        scale: 1,
      })
      effect.domElement.className = 'ascii-render-output'
      effect.domElement.setAttribute('aria-hidden', 'true')
      stage.appendChild(effect.domElement)
    } catch {
      stage.textContent = '3D ASCII needs WebGL support.'
      stage.classList.add('ascii-render-fallback')
      clickHandlerRef.current = () => setTrafficStatus('WEBGL SUPPORT REQUIRED')
      return undefined
    }

    const renderFrame = () => {
      if (disposed || !effect) return
      effect.render(scene, camera)
    }

    const applyTheme = () => {
      palette = getShardPalette()
      baseNodeColor.set(palette.node)
      selectedNodeColor.set(palette.selected)
      gossipMaterial.color.set(palette.gossip)
      pingMaterial.color.set(palette.ping)
      ambientLight.color.set(palette.ambient)
      keyLight.color.set(palette.key)
      renderer.setClearColor(palette.clear, 0)

      shardMeshes.forEach((shard, index) => {
        const selected = activeShardRef.current === index
        shard.material.color.copy(selected ? selectedNodeColor : baseNodeColor)
        shard.material.emissive.set(selected ? palette.selectedEmissive : palette.emissive)
        haloMeshes[index].material.color.set(selected ? palette.selected : palette.halo)
      })
      connectionMeshes.forEach(({ mesh, from, to }) => {
        const highlighted = activeShardRef.current === from || activeShardRef.current === to
        mesh.material.color.set(highlighted ? palette.activeLink : palette.link)
      })
      renderFrame()
    }

    themeObserver = new MutationObserver(applyTheme)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    const resize = () => {
      if (!effect) return
      const { width, height } = stage.getBoundingClientRect()
      if (width < 1 || height < 1) return
      camera.aspect = width / height
      camera.position.z = Math.max(
        3.5,
        (4.2 / (2 * camera.aspect * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * 1.05,
      )
      camera.updateProjectionMatrix()
      effect.setSize(width, height)
      renderer.domElement.style.backgroundColor = 'transparent'
      renderFrame()
    }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const pickShard = (event) => {
      const rect = stage.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const [hit] = raycaster.intersectObjects(shardMeshes, false)
      if (hit) pingShard(shardMeshes.indexOf(hit.object))
      stage.style.cursor = hit ? 'pointer' : 'default'
    }
    const onPointerMove = (event) => {
      const rect = stage.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      stage.style.cursor = raycaster.intersectObjects(shardMeshes, false).length
        ? 'pointer'
        : 'default'
    }
    const onPointerLeave = () => {
      stage.style.cursor = 'default'
    }

    const animate = (time) => {
      frameId = 0
      if (disposed || !visible || reducedMotion) return
      if (time - lastFrameAt >= 55) {
        const delta = lastFrameAt ? Math.min(time - lastFrameAt, 80) : 55
        lastFrameAt = time
        system.rotation.y += delta * 0.00008
        system.rotation.x = Math.sin(time * 0.00015) * 0.055
        updateGossip(time)
        updateSignals(time)
        shardMeshes.forEach((shard, index) => {
          const selected = activeShardRef.current === index
          const pulsing = time < pulseUntil[index]
          shard.scale.setScalar((selected ? 1.15 : 1) * (pulsing ? 1.12 : 1))
          haloMeshes[index].rotation.z += delta * (index % 2 === 0 ? 0.00032 : -0.00028)
          haloMeshes[index].material.color.copy(
            selected || pulsing ? selectedNodeColor : baseNodeColor,
          )
        })
        connectionMeshes.forEach(({ mesh, from, to }) => {
          const highlighted = activeShardRef.current === from || activeShardRef.current === to
          mesh.material.opacity = highlighted ? 0.78 : 0.42
          mesh.material.color.set(highlighted ? palette.activeLink : palette.link)
        })
        renderFrame()
      }
      frameId = window.requestAnimationFrame(animate)
    }

    const startAnimation = () => {
      if (!frameId && !disposed && visible && !reducedMotion) {
        frameId = window.requestAnimationFrame(animate)
      }
    }
    const onMotionPreferenceChange = (event) => {
      reducedMotion = event.matches
      if (reducedMotion && frameId) {
        window.cancelAnimationFrame(frameId)
        frameId = 0
      } else {
        startAnimation()
      }
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(stage)
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (!visible && frameId) {
        window.cancelAnimationFrame(frameId)
        frameId = 0
      } else {
        startAnimation()
      }
    })
    visibilityObserver.observe(stage)
    motionPreference.addEventListener('change', onMotionPreferenceChange)
    stage.addEventListener('click', pickShard)
    stage.addEventListener('pointermove', onPointerMove)
    stage.addEventListener('pointerleave', onPointerLeave)
    updateGossip(0)
    resize()
    startAnimation()

    return () => {
      disposed = true
      clickHandlerRef.current = () => {}
      if (frameId) window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      themeObserver.disconnect()
      motionPreference.removeEventListener('change', onMotionPreferenceChange)
      stage.removeEventListener('click', pickShard)
      stage.removeEventListener('pointermove', onPointerMove)
      stage.removeEventListener('pointerleave', onPointerLeave)
      clearSignals()
      effect?.domElement.remove()
      renderer?.dispose()
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
    }
  }, [])

  return (
    <div
      className="ascii-showcase shard-showcase"
      role="group"
      aria-label="Interactive five-shard database visualization"
    >
      <div className="ascii-showcase-head">
        <span>SHARDED DATABASE / REPLICATION</span>
        <span>5 PEERS · 3/5 QUORUM</span>
      </div>
      <div
        className="ascii-render-stage shard-render-stage"
        ref={stageRef}
        role="img"
        aria-label="Three-dimensional ASCII map of five connected database shards. Click a shard to ping the other four."
      />
      <div className="shard-control-row">
        <span className="shard-control-label">PING A SHARD</span>
        {shardNames.map((name, index) => (
          <button
            key={name}
            type="button"
            className={`shard-control${activeShard === index ? ' active' : ''}`}
            aria-label={`Ping ${name} and wait for peer acknowledgements`}
            aria-pressed={activeShard === index}
            onClick={() => clickHandlerRef.current(index)}
          >
            S0{index + 1}
          </button>
        ))}
      </div>
      <div className="ascii-showcase-foot shard-showcase-foot">
        <span className="traffic-status" aria-live="polite" aria-atomic="true">
          {trafficStatus}
        </span>
        <span>GOSSIP · ACK · QUORUM</span>
      </div>
    </div>
  )
}
