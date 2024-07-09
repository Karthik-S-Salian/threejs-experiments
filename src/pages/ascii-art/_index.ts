import * as THREE from "three";
import { AsciiEffect, Font, TTFLoader, TextGeometry } from "three/examples/jsm/Addons.js";
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import fontUrl from "@assets/ascii-art/font.ttf?url"

const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;

if (!canvas) {
    throw new Error("Canvas not found");
}

const w = canvas.clientWidth;
const h = canvas.clientHeight;

const renderer = new THREE.WebGLRenderer();

renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(75, w / h, 1, 500);
camera.position.z = 2;

const scene = new THREE.Scene();

scene.background = new THREE.Color(0, 0, 0);

const pointLight1 = new THREE.PointLight(0xffffff, 3, 0, 0);
pointLight1.position.set(-2, -2, -2);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xffffff, 1, 0, 0);
pointLight2.position.set(- 1, - 1, - 1);
scene.add(pointLight2);

console.log(w, h)
const effect = new AsciiEffect(renderer, ' .:-+*=%@#', { invert: true });
effect.setSize(w, h);
effect.domElement.style.color = 'white';
effect.domElement.style.backgroundColor = 'black';

canvas.replaceWith(effect.domElement)

const controls = new TrackballControls(camera, effect.domElement);

function animate(t = 0) {
    controls.update();
    effect.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.width, canvas.height);
    effect.setSize(canvas.width, canvas.height);

}

const loader = new TTFLoader();
const font = new Font(await loader.loadAsync(fontUrl));

const size = 80;
const text = "FiniteLoop"
const textGeo = new TextGeometry(text, {
    font: font,
    size: size,
    depth: 10,
    curveSegments: 6,
    bevelThickness: 4,
    bevelSize: 2,
    bevelEnabled: true,

});

textGeo.computeBoundingBox();
textGeo.computeVertexNormals();

const textMesh = new THREE.Mesh(textGeo, new THREE.MeshBasicMaterial( { color: 0xffffff } ));
textMesh.position.z = -100
textMesh.position.x -= size*text.length/2
scene.add(textMesh);