import * as THREE from "three";
import spline from "./_spline";
import { RenderPass } from "three/examples/jsm/Addons.js";
import { EffectComposer } from "three/examples/jsm/Addons.js";
import { UnrealBloomPass } from "three/examples/jsm/Addons.js";

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
scene.fog = new THREE.FogExp2(0x000000, 0.3);

const renderScene = new RenderPass(scene,camera);
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 3.5, 0.4,  0.002);
composer.addPass(bloomPass)

const tubeGeo = new THREE.TubeGeometry(spline, 222, 0.65, 16, true);

// create edges geometry from the spline
const edges = new THREE.EdgesGeometry(tubeGeo, 0.2);
const lineMat = new THREE.LineBasicMaterial({ color: 0xffaa11 });
const tubeLines = new THREE.LineSegments(edges, lineMat);
scene.add(tubeLines);


const numBoxes = 50;
const size = 0.75;
const boxGeo = new THREE.BoxGeometry(size, size, size);
const boxMat = new THREE.MeshBasicMaterial({
    wireframe: true
});

const boxMesh = new THREE.InstancedMesh(boxGeo, boxMat, numBoxes);
scene.add(boxMesh);

const dummy = new THREE.Object3D();

for (let i = 0; i < numBoxes; i += 1) {
    const p = (i / numBoxes + Math.random() * 0.1) % 1;

    const pos = tubeGeo.parameters.path.getPointAt(p);
    pos.x += Math.random() * tubeGeo.parameters.radius*.5;
    pos.z +=Math.random() * tubeGeo.parameters.radius*.5;
    dummy.position.copy(pos)
    dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    )
    dummy.scale.setScalar(Math.random() * tubeGeo.parameters.radius * .4);

    dummy.updateMatrix()
    boxMesh.setColorAt(i,new THREE.Color(Math.random()*0xffffff));
    boxMesh.setMatrixAt(i, dummy.matrix);
}

boxMesh.instanceMatrix.needsUpdate = true;

function updateCamera(t: number) {
    const time = t * 0.1;
    const looptime = 10 * 1000;
    const p = (time % looptime) / looptime;
    const pos = tubeGeo.parameters.path.getPointAt(p);
    const lookAt = tubeGeo.parameters.path.getPointAt((p + 0.03) % 1);
    camera.position.copy(pos);
    camera.lookAt(lookAt);
}


const matrix = new THREE.Matrix4();

function animate(t = 0) {

    for (let i = 0; i < numBoxes; i += 1){
        boxMesh.getMatrixAt(i,matrix);
        matrix.decompose(dummy.position,dummy.quaternion,dummy.scale);

        dummy.rotation.x = 0.001*t;
        dummy.updateMatrix();
        boxMesh.setMatrixAt(i,dummy.matrix);
    }
    boxMesh.instanceMatrix.needsUpdate = true;

    updateCamera(t)
    composer.render();
    requestAnimationFrame(animate);
}

animate();

function handleWindowResize() {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}
window.addEventListener('resize', handleWindowResize);