import { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'

// Catálogo de geometrías
const GEOMETRIES = [
  {
    key: 'box',
    name: 'Cubo',
    description: 'BoxGeometry',
    color: '#44aa88',
    create: () => new THREE.BoxGeometry(1.5, 1.5, 1.5)
  },
  {
    key: 'sphere',
    name: 'Esfera',
    description: 'SphereGeometry',
    color: '#FF6B6B',
    create: () => new THREE.SphereGeometry(1, 32, 16)
  },
  {
    key: 'plane',
    name: 'Plano',
    description: 'PlaneGeometry',
    color: '#FFD93D',
    create: () => new THREE.PlaneGeometry(2, 2)
  },
  {
    key: 'cone',
    name: 'Cono',
    description: 'ConeGeometry',
    color: '#6BCB77',
    create: () => new THREE.ConeGeometry(1, 2, 16)
  },
  {
    key: 'cylinder',
    name: 'Cilindro',
    description: 'CylinderGeometry',
    color: '#4D96FF',
    create: () => new THREE.CylinderGeometry(1, 1, 2, 16)
  },
  {
    key: 'torus',
    name: 'Toro',
    description: 'TorusGeometry',
    color: '#FF6B6B',
    create: () => new THREE.TorusGeometry(1, 0.3, 16, 64)
  },
  {
    key: 'icosahedron',
    name: 'Icosaedro',
    description: 'IcosahedronGeometry',
    color: '#845EC2',
    create: () => new THREE.IcosahedronGeometry(1, 0)
  },
  {
    key: 'dodecahedron',
    name: 'Dodecaedro',
    description: 'DodecahedronGeometry',
    color: '#FFC75F',
    create: () => new THREE.DodecahedronGeometry(1, 0)
  }
]

export default function GeometryExplorer() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const currentMeshRef = useRef<THREE.Mesh | null>(null)
  const animRef = useRef<number | null>(null)

  // Estados persistentes
  const [wireframe, setWireframe] = useState<boolean>(() => {
    return localStorage.getItem("wireframe") === "true"
  })
  const [autoRotate, setAutoRotate] = useState<boolean>(() => {
    return localStorage.getItem("autoRotate") !== "false"
  })
  const [selectedKey, setSelectedKey] = useState<string>(() => {
    return localStorage.getItem("selectedKey") || "box"
  })

  // Refs espejo
  const wireframeRef = useRef(wireframe)
  const autoRotateRef = useRef(autoRotate)

  // Sync React -> Ref + localStorage
  useEffect(() => {
    wireframeRef.current = wireframe
    localStorage.setItem("wireframe", String(wireframe))
  }, [wireframe])

  useEffect(() => {
    autoRotateRef.current = autoRotate
    localStorage.setItem("autoRotate", String(autoRotate))
  }, [autoRotate])

  useEffect(() => {
    localStorage.setItem("selectedKey", selectedKey)
  }, [selectedKey])

  // Geometría dinámica
  const geometry = useMemo(() => {
    const geoObj = GEOMETRIES.find(g => g.key === selectedKey)
    return geoObj ? geoObj.create() : GEOMETRIES[0].create()
  }, [selectedKey])

  // Color dinámico
  const color = useMemo(() => {
    const geoObj = GEOMETRIES.find(g => g.key === selectedKey)
    return geoObj ? geoObj.color : GEOMETRIES[0].color
  }, [selectedKey])

  useEffect(() => {
    if (!mountRef.current) return

    // Escena
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    // Cámara
    const { width, height } = mountRef.current.getBoundingClientRect()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(3, 2, 4)
    cameraRef.current = camera

    // Renderer (evitar duplicados)
    if (rendererRef.current) {
      rendererRef.current.dispose()
      if (mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement)
      }
    }
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Luces
    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(5, 5, 5)
    scene.add(ambient, dir)

    // Helpers
    const axes = new THREE.AxesHelper(2)
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    scene.add(axes, grid)

    // Mesh dinámico
    const material = new THREE.MeshPhongMaterial({ color, wireframe: wireframeRef.current })
    const mesh = new THREE.Mesh(geometry, material)
    currentMeshRef.current = mesh
    scene.add(mesh)

    // Animación
    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      if (autoRotateRef.current && currentMeshRef.current) {
        currentMeshRef.current.rotation.x += 0.01
        currentMeshRef.current.rotation.y += 0.015
      }
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const handleResize = () => {
      if (!mountRef.current) return
      const rect = mountRef.current.getBoundingClientRect()
      const w = rect.width || 800
      const h = rect.height || 600
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      scene.clear()
    }
  }, [geometry, color])

  // Wireframe dinámico
  useEffect(() => {
    const mesh = currentMeshRef.current
    if (!mesh) return
    const mat = mesh.material as THREE.MeshPhongMaterial
    mat.wireframe = wireframe
    mat.needsUpdate = true
  }, [wireframe])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Panel de geometrías */}
      <div style={{
        position: 'absolute', left: 12, top: 12, display: 'grid', gap: 8, background: '#222', padding: 12, borderRadius: 8, zIndex: 2
      }}>
        {GEOMETRIES.map(geo => (
          <button
            key={geo.key}
            style={{
              background: selectedKey === geo.key ? geo.color : '#333',
              color: '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: selectedKey === geo.key ? 'bold' : 'normal'
            }}
            onClick={() => setSelectedKey(geo.key)}
          >
            {geo.name}
          </button>
        ))}
      </div>

      {/* Canvas Three.js */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Controles UI */}
      <div style={{ position: 'absolute', right: 12, top: 12, display: 'grid', gap: 8, zIndex: 2 }}>
        <button onClick={() => setAutoRotate(!autoRotate)}>
          {autoRotate ? '⏸️ Pausar Rotación' : '▶️ Reanudar Rotación'}
        </button>
        <button onClick={() => setWireframe(!wireframe)}>
          {wireframe ? '🔲 Sólido' : '🔳 Wireframe'}
        </button>
      </div>
    </div>
  )
}