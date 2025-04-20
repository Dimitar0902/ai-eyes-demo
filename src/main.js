import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

let mixer, blinkTop, blinkBottom, eyeballL, eyeballR
const scene = new THREE.Scene()
scene.background = new THREE.Color('#CCCCFF')

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.z = 4

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(2, 2, 2)
scene.add(light)

const ambientLight = new THREE.AmbientLight(0x404040)
scene.add(ambientLight)

const loader = new GLTFLoader()
loader.load(
  '/model.glb',
  gltf => {
    const model = gltf.scene
    model.scale.set(0.5, 0.5, 0.5)
    scene.add(model)
    console.log('✅ Model loaded:', gltf)

    // Grab eyeballs by name or by visually inspecting gltf.scene
    eyeballL = model.getObjectByName('Eye_L') || model.children[0]?.children[0]
    eyeballR = model.getObjectByName('Eye_R') || model.children[0]?.children[1]

    if (gltf.animations.length > 1) {
      mixer = new THREE.AnimationMixer(model)

      blinkTop = mixer.clipAction(gltf.animations[0])
      blinkBottom = mixer.clipAction(gltf.animations[1])

      blinkTop.setLoop(THREE.LoopOnce)
      blinkTop.clampWhenFinished = true

      blinkBottom.setLoop(THREE.LoopOnce)
      blinkBottom.clampWhenFinished = true

      setInterval(() => {
        console.log('👁️ Full blink triggered')
        blinkTop.reset().play()
        blinkBottom.reset().play()
      }, 5000)
    }
  },
  undefined,
  error => {
    console.error('❌ Error loading model:', error)
  }
)

// Animate loop
const clock = new THREE.Clock()
function animate () {
  requestAnimationFrame(animate)
  const delta = clock.getDelta()
  if (mixer) mixer.update(delta)
  renderer.render(scene, camera)
}
animate()

// 👁️ Setup motion detection
const video = document.getElementById('video')
const humanDiv = document.getElementById('humanDetected')
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

let lastFrame = null

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      setInterval(() => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height)

        if (lastFrame) {
          const changed = currentFrame.data.some(
            (val, i) => Math.abs(val - lastFrame.data[i]) > 30
          )
          if (changed) {
            console.log('👀 Motion detected!')
            triggerEyeballSpin()
            showHumanDetected()
          }
        }

        lastFrame = currentFrame
      }, 300)
    }
  })
  .catch(err => {
    console.error('🚫 Webcam error:', err)
  })

function triggerEyeballSpin () {
  if (!eyeballL || !eyeballR) {
    console.warn('⚠️ Eyeballs not found')
    return
  }

  // Simple spin animation
  let spin = 0
  const interval = setInterval(() => {
    spin += 0.1
    eyeballL.rotation.y += 0.1
    eyeballR.rotation.y += 0.1
    if (spin > Math.PI * 2) clearInterval(interval)
  }, 16)
}

function showHumanDetected () {
  humanDiv.style.display = 'block'
  setTimeout(() => {
    humanDiv.style.display = 'none'
  }, 1500)
}
