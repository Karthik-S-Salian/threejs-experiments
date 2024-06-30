import * as THREE from "three";
import { DRACOLoader, GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import modelSrc from "@assets/3d_models/naakashAnimated.glb?url";

const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;

if (!canvas) {
    throw new Error("Canvas not found");
}

const w = canvas.clientWidth;
const h = canvas.clientHeight;

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
});

renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
camera.position.set(0, 0, 2);

const scene = new THREE.Scene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

const dacroLoader = new DRACOLoader();
dacroLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
const loader = new GLTFLoader();
loader.setDRACOLoader(dacroLoader);
const gltf = await loader.loadAsync(modelSrc);
const model = gltf.scene;
model.position.set(0, -1, 0);
scene.add(model);
let mixer = new THREE.AnimationMixer(model);
const clips = gltf.animations;
const clip = clips[1];
const action = mixer.clipAction(clip);
action.play();

const clock = new THREE.Clock();
function animate(t = 0) {
    mixer.update(clock.getDelta());
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();