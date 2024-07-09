uniform sampler2D charsTex;
uniform sampler2D referenceTex;
uniform vec2 gridSize;
flat varying float textureIndex;
flat varying float grayscale;
flat varying float showTexture;

varying vec2 vUv;

void main() {
  vec2 textureSize = 1.0 / gridSize;
  float col = gridSize.y -  floor(textureIndex/ gridSize.x);
  float row = mod(textureIndex, gridSize.x);

  if(row>gridSize.x/2.0){
    vec2 offset = vec2(row,col) * textureSize;
    vec4 finalTex = texture2D(referenceTex, vUv*textureSize + offset);
    gl_FragColor = finalTex;
  }
  else{
    vec4 asciiTex = texture2D(charsTex, vUv/vec2(7.0,1.0) + vec2((6.0-grayscale)/7.0,0.0));
    gl_FragColor = asciiTex;
  }
}