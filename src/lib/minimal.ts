import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

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
camera.position.z = 2;

const scene = new THREE.Scene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;


function animate(t = 0) {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();