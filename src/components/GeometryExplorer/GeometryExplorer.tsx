import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

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

  // Refs espejo
  const wireframeRef = useRef(wireframe)
  const autoRotateRef = useRef(autoRotate)

  // Sync React -> Ref + localStorage
  useEffect(() => {
    wireframeRef.current = wireframe
    localStorage.setItem("wireframe", String(wireframe))
    console.log("🎨 Wireframe actualizado:", wireframe)
  }, [wireframe])

  useEffect(() => {
    autoRotateRef.current = autoRotate
    localStorage.setItem("autoRotate", String(autoRotate))
    console.log("🔄 AutoRotate actualizado:", autoRotate)
  }, [autoRotate])

  useEffect(() => {
    if (!mountRef.current) return
    console.log("🎬 Inicializando escena...")

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

    // Luces (agregar DESPUÉS de limpiar escena)
    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(5, 5, 5)
    scene.add(ambient, dir)

    // Cubo
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const material = new THREE.MeshPhongMaterial({ color: '#44aa88', wireframe: wireframeRef.current })
    const cube = new THREE.Mesh(geometry, material)
    currentMeshRef.current = cube
    scene.add(cube)

    // Helpers
    const axes = new THREE.AxesHelper(2)
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    scene.add(axes, grid)

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
      console.log("🧹 Limpiando escena...")
      window.removeEventListener('resize', handleResize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      scene.clear()
    }
  }, [])

  // Wireframe dinámico
  useEffect(() => {
    const cube = currentMeshRef.current
    if (!cube) return
    const mat = cube.material as THREE.MeshPhongMaterial
    mat.wireframe = wireframe
    mat.needsUpdate = true
    console.log("✅ Wireframe aplicado:", wireframe)
  }, [wireframe])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Canvas Three.js */}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Controles UI */}
      <div style={{ position: 'absolute', right: 12, top: 12, display: 'grid', gap: 8 }}>
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