import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import textureAtlas from "@assets/instanced/atlas.png";

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

const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
camera.position.set(0, 3, -4);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(8, 0, 8);
controls.enableDamping = true;
controls.dampingFactor = 0.03;
controls.update()

const geo = new THREE.BoxGeometry();
const mat = new THREE.MeshLambertMaterial(
    { map: loader.load(textureAtlas.src) }
);

const count = 5;
const mesh = new THREE.InstancedMesh(geo, mat, count * count);
const atlasSize = new THREE.Vector2(16, 16);

const data = [];
for (let i = 0; i < count * count; i++) {
    data.push(Math.floor(Math.random() * 16 * 16));
}
geo.setAttribute("textureId", new THREE.InstancedBufferAttribute(new Float32Array(data), 1));
mesh.count = 0;

mat.onBeforeCompile = (shader) => {
    shader.uniforms.atlasSize = { value: atlasSize };
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `
        flat varying float textureIndex;
        attribute float textureId; 
        #include <common>
    `)

    shader.vertexShader = shader.vertexShader.replace("}", `
        textureIndex = textureId;
    }
    `)

    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `
       flat varying float textureIndex;
       uniform vec2 atlasSize;
        #include <common>
    `)

    shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
        #ifdef USE_MAP
            // size of each individual texture in the atlas
            vec2 textureSize = 1.0 / atlasSize;

            //  row and column of the textureIndex in the atlas
            float row = floor(textureIndex / atlasSize.x);
            float col = mod(textureIndex, atlasSize.x);

            //  UV offset within the selected texture
            vec2 offset = vec2(col, row) * textureSize;

            // Final texture coordinate within the atlas
            vec2 textureCoord = vMapUv * textureSize + offset;

            // Sample from the texture atlas using the calculated texture coordinate
            vec4 sampledDiffuseColor = texture2D(map, vec2(textureCoord.x,1.0-textureCoord.y));

            #ifdef DECODE_VIDEO_TEXTURE

                // use inline sRGB decode until browsers properly support SRGB8_ALPHA8 with video textures (#26516)

                sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
            
            #endif

            diffuseColor *= sampledDiffuseColor;

        #endif
     `)
}


const matrix = new THREE.Matrix4();
for (let x = 0; x < count; x++) {
    for (let y = 0; y < count; y++) {
        matrix.setPosition(x + 0.5, y + .5, y + .5);
        mesh.setMatrixAt(mesh.count, matrix);
        mesh.count++;
    }
}

scene.add(mesh)

const ambient = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambient)


function animate(t = 0) {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
})