import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.172.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.172.0/examples/jsm/loaders/GLTFLoader.js';

const host=document.querySelector('#platform-3d');
const scene=new THREE.Scene();
const camera=new THREE.OrthographicCamera(-3.5,3.5,2.5,-2.5,.1,100);
camera.position.set(7,-10,6); camera.lookAt(0,0,0);
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.setClearColor(0x000000,0);
host.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe8fff0,0x18342f,2.2));
const key=new THREE.DirectionalLight(0xfff1c8,2.4); key.position.set(4,-6,8); scene.add(key);
let model=null;
new GLTFLoader().load('assets/plataforma_tropical_prototipo.glb',gltf=>{
  model=gltf.scene;
  model.rotation.y=Math.PI*.03;
  model.scale.setScalar(.95);
  scene.add(model);
},undefined,()=>{host.style.display='none';});

function resize(){
  const w=Math.max(180,Math.round(host.clientWidth||360)), h=Math.max(90,Math.round(host.clientHeight||150));
  renderer.setSize(w,h,false);
}
function frame(){
  const state=window.__tropicalCamera;
  if(state){
    const s=state.scale, x=(625-state.cameraX)*s, y=425*s;
    host.style.left=`${x}px`; host.style.top=`${y-8*s}px`; host.style.width=`${395*s}px`; host.style.height=`${105*s}px`;
    resize();
  }
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}
frame();
