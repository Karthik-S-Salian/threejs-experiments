import * as THREE from "three";
import { DRACOLoader, GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";

const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;

if (!canvas) {
    throw new Error("Canvas not found");
}

const w = canvas.clientWidth;
const h = canvas.clientHeight;

const renderer = new THREE.WebGLRenderer({
    canvas,
});

renderer.setSize(w, h);

const camera = new THREE.PerspectiveCamera(50, w / h, 1, 20);
camera.position.set(-2, 2, 6)

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);
scene.fog = new THREE.Fog(0x202020, 5, 20);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

// // Load GLTF model
// const loader = new GLTFLoader();
// const dracoLoader = new DRACOLoader();
// dracoLoader.setDecoderPath( 'three/examples/jsm/libs/draco/' );
// loader.setDRACOLoader( dracoLoader );

// loader.load(
//   'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/dragon/model.gltf',
//   function (gltf) {
//     gltf.scene.position.set(0, -1.03, 0); // Adjust position of loaded model
//     gltf.scene.traverse(function (child) {
//       if (child.isMesh) {
//         child.castShadow = true;
//         child.receiveShadow = true;
//       }
//     });
//     scene.add(gltf.scene);
//   }
// );

// Plane under the model
const planeGeo = new THREE.PlaneGeometry(20, 20, 1, 1);
const planeMat = new THREE.MeshPhongMaterial({
    color: 0xaaaaaa,
    side: THREE.DoubleSide
})
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.position.set(0, -1, 0)
plane.rotation.x = -Math.PI / 2
plane.rotation.z = Math.PI / 2
plane.receiveShadow = true;
scene.add(plane)

const geometry = new THREE.SphereGeometry(1, 32, 16);
const material = new THREE.MeshPhongMaterial({ color: 0xaabbcc });
const sphere = new THREE.Mesh(geometry, material);
sphere.position.set(0, 0, -2)
sphere.castShadow = true
scene.add(sphere)

// Ambient light
const ambientLight = new THREE.AmbientLight(0x101010); // Intensity adjusted to 0.015
scene.add(ambientLight);

//0xffffff, 2, 6, Math.PI * 0.35, 1, 4
// const spotLight = new THREE.SpotLight(0x0c8cbf, 2, 12, 0.35, 1, .25);
// spotLight.position.set(3, 3, 2);
// spotLight.castShadow = true;
// scene.add(spotLight);

// const spotLight2 = new THREE.SpotLight(0xb00c3f, 2, 12, 0.5, 1, .5);
// spotLight2.position.set(1, 3, 0);
// spotLight2.castShadow = true;
// scene.add(spotLight2);

function createFakeVolumeticSpotLight(color:THREE.ColorRepresentation,pos:THREE.Vector3, intensity?:number, distance?:number, angle?:number,pnumbra?:number,decay?:number) {
    const group = new THREE.Group();
    const spotLight = new THREE.SpotLight(color, intensity,distance, angle, pnumbra,decay);
    spotLight.position.copy(pos);
    spotLight.castShadow = true;
    group.add(spotLight);

    const cylindergeo = new THREE.CylinderGeometry(0, spotLight.angle/2.5 * spotLight.distance, 5, 128, 64, true);
    const cylindermaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: spotLight.color },
            height: { value: cylindergeo.parameters.height }
        },

        vertexShader: `
    varying vec3 vUv; 

    void main() {
      vUv = position; 

      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition; 
    }
  `,
        fragmentShader: `
      uniform vec3 color; 
      uniform float height; 
      varying vec3 vUv;

      void main() {
        gl_FragColor = vec4(color,1.0 - vUv.z/height);
      }
  `,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    }
    );
    const cylinder = new THREE.Mesh(cylindergeo, cylindermaterial);
    cylinder.position.copy(spotLight.position)
    group.add(cylinder);
    cylindergeo.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -5 / 2, 0))
    cylindergeo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))

    const vec = new THREE.Vector3();

    return {
        group,
        spotLight,
        update:()=>cylinder.lookAt(spotLight.target.getWorldPosition(vec))
    }
}

const spotLight1 = createFakeVolumeticSpotLight(0x0c8cbf,new THREE.Vector3(3, 3, 2), 2, 12, 0.35, 1, .25);
scene.add(spotLight1.group)
const spotLight2 = createFakeVolumeticSpotLight(0xb00c3f,new THREE.Vector3(1, 3, 0), 2, 12, 0.5, 1, .5);
scene.add(spotLight2.group);

// Mouse movement handling
const mouse = new THREE.Vector2();
canvas.addEventListener('mousemove', (event) => {
    mouse.x = (event.offsetX / canvas.width) * 2 - 1;
    mouse.y = -(event.offsetY / canvas.height) * 2 + 1;
});

const vFOV = THREE.MathUtils.degToRad(camera.fov); // convert vertical fov to radians
const height = 2 * Math.tan(vFOV / 2) * spotLight1.spotLight.position.z // visible height
const width = height * camera.aspect;

// SpotLight target movement
const spotLightTarget = new THREE.Object3D();
scene.add(spotLightTarget);

function animate(t = 0) {
    controls.update();
    renderer.render(scene, camera);

    // Update spot light target position based on mouse movement
    spotLightTarget.position.lerp(new THREE.Vector3(
        (mouse.x * width) / 2,
        (mouse.y * height) / 2,
        0
    ), 0.1);
    spotLight1.spotLight.target = spotLightTarget;
    spotLight2.spotLight.target = spotLightTarget;
    spotLight1.update();
    spotLight2.update();

    requestAnimationFrame(animate);
}

animate();