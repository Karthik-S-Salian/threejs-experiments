varying vec2 vUv;
flat varying float textureIndex;
flat varying float grayscale;
flat varying float showTexture;
attribute float scale; 
attribute float show; 

void main(){
    textureIndex = float(gl_InstanceID);
    grayscale = scale;
    vUv = uv;
    showTexture = show;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position,1.0);
}