import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import fragmentShader from "./_fragment.glsl?raw"
import vertexShader from "./_vertex.glsl?raw"
import charsTexture from "@assets/ascii-art-instanced/chars.png"
import videoUrl from "@assets/ascii-art-instanced/video.mp4?url"

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

const frustumSize = 20;
const aspect = w / h;
const camera = new THREE.OrthographicCamera(-frustumSize * aspect / 2, frustumSize * aspect / 2, frustumSize / 2, -frustumSize / 2, 0, 50);
camera.position.set(0, 0, 2)

const scene = new THREE.Scene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;


const video = document.createElement('video');
video.src = videoUrl
video.autoplay = true;
video.loop = true;


const gridSize = new THREE.Vector2(50, 50);
const cellSize = new THREE.Vector2(0.5, 0.5);
const loader = new THREE.TextureLoader();
const geometry = new THREE.PlaneGeometry(cellSize.x, cellSize.y, 1, 1);
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
})
material.uniforms.charsTex = { value: loader.load(charsTexture.src) };
material.uniforms.referenceTex = { value: new THREE.VideoTexture(video) };


video.onloadedmetadata = e => {
    next(video.videoWidth / video.videoHeight);
}

function next(aspect: number) {

    gridSize.setX(Math.floor(gridSize.y * aspect))
    material.uniforms.gridSize = { value: gridSize };

    const videoCanvas = new OffscreenCanvas(gridSize.x, gridSize.y);
    const videoCtx = videoCanvas.getContext('2d', { willReadFrequently: true });

    if (videoCtx == null) {
        throw new Error("Couldnot intialize offscreen canvas");
    }

    geometry.setAttribute("scale", new THREE.InstancedBufferAttribute(new Float32Array(gridSize.x * gridSize.y), 1));
    geometry.setAttribute("show", new THREE.InstancedBufferAttribute(new Float32Array(gridSize.x * gridSize.y), 1));

    const mesh = new THREE.InstancedMesh(geometry, material, gridSize.x * gridSize.y);

    const dummy = new THREE.Object3D();
    let count = 0;

    const centerOffset = gridSize.clone().multiply(cellSize).multiplyScalar(0.5)
    for (let i = 0; i < gridSize.y; i++) {
        for (let j = 0; j < gridSize.x; j++) {
            dummy.position.set(j * cellSize.x - centerOffset.x,gridSize.y*cellSize.y -  i* cellSize.y - centerOffset.y, 0);
            dummy.updateMatrix();
            mesh.setMatrixAt(count++, dummy.matrix);
        }
    }

    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);

    const garyData = geometry.attributes.scale.array;

    function computeScale() {
        videoCtx!.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);
        const image = videoCtx!.getImageData(0, 0, videoCanvas.width, videoCanvas.height);
        const data = image.data;
        for (let i = 0; i < data.length; i += 4) {
            garyData[Math.floor(i / 4)] = Math.floor((data[i] + data[i + 1] + data[i + 2]) / (3 * 255) * 6.0);
        }
        // material.uniforms.referenceTex  = {value: new THREE.Texture(video)};
        // material.uniforms.referenceTex.value.needsUpdate = true;

        for(let i=0;i<gridSize.x*gridSize.y;i++){
            geometry.attributes.show.array[i] = Math.random();
        }
        geometry.attributes.show.needsUpdate = true;
        geometry.attributes.scale.needsUpdate = true;
        video.requestVideoFrameCallback(computeScale)

    }

    video.requestVideoFrameCallback(computeScale)

    function animate(t = 0) {
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    animate();
}