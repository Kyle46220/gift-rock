'use client';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ImprovedNoise} from 'three/addons/math/ImprovedNoise.js';
import {initialRock,type RockConfig} from '@/lib/rock';
import {sculptGestureHandlers,type RockMode} from '@/lib/sculpt-gestures';
const noise=new ImprovedNoise();
export function makeGeometry(c:RockConfig){
 const g=new THREE.SphereGeometry(1,128,96),a=g.attributes.position;const scales=[[1.2,.85,1],[1.08,1,1],[1.3,.49,1.04],[.76,1.3,.78],[1.12,.85,.93],[.88,1.17,.82]][c.template];
 const amplitudes=[.10,.25,.09,.24,.18,.12];
 for(let i=0;i<a.count;i++){let x=a.getX(i),y=a.getY(i),z=a.getZ(i);const seed=c.template*13.7;let n=noise.noise(x*2.1+seed,y*2.1+2,z*2.1)*amplitudes[c.template]+noise.noise(x*5+seed,y*5,z*5)*.06*c.roughness+noise.noise(x*13,y*13+seed,z*13)*.022*c.roughness;
 let v=new THREE.Vector3(x*(1+n)*scales[0]*c.stretch,y*(1+n)*scales[1]*c.flatten,z*(1+n)*scales[2]);
 if(c.template===3){v.x+=.16*y;v.z+=.11*y*y;}
 if(c.template===1||c.template===3){v.y=Math.min(v.y,.85*c.flatten);v.x=Math.max(v.x,-.88*c.stretch);}
 const base=v.clone(),normal=new THREE.Vector3(x,y,z).normalize();let displacement=0;for(const s of c.strokes){const d=base.distanceTo(new THREE.Vector3(s.x,s.y,s.z))/s.radius;if(d<1)displacement+=s.strength*(1-d*d)**2;}v.addScaledVector(normal,Math.max(-.3,Math.min(.3,displacement)));a.setXYZ(i,v.x,v.y,v.z);}
 g.computeVertexNormals();g.computeBoundingSphere();return g;
}
function stoneCanvas(c:RockConfig){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d')!;const pixels=ctx.createImageData(1024,512);const color=new THREE.Color(c.color);const rgb=[parseInt(c.color.slice(1,3),16),parseInt(c.color.slice(3,5),16),parseInt(c.color.slice(5,7),16)];
 for(let y=0;y<512;y++)for(let x=0;x<1024;x++){const u=x/1024*Math.PI*2,v=y/512*Math.PI;const px=Math.sin(v)*Math.cos(u),py=Math.cos(v),pz=Math.sin(v)*Math.sin(u);const cloud=noise.noise(px*4+3,py*4,pz*4);const grain=noise.noise(px*150,py*150,pz*150);const fine=noise.noise(px*390,py*390,pz*390);let f=1+cloud*.22+fine*.12;
 if(c.stone==='granite') f+=grain*.40+(grain>.27?.19:grain<-.25?-.24:0);
 if(c.stone==='basalt')f+=grain*.17-(fine<-.30?.22:0);
 if(c.stone==='sandstone')f+=Math.sin(py*95+cloud*9)*.045+grain*.20;
 if(c.stone==='marble'){const vein=Math.abs(Math.sin(px*6+py*3+noise.noise(px*3,py*3,pz*3)*5));f-=Math.exp(-vein*30)*.42;f+=grain*.04;}
 const i=(y*1024+x)*4;pixels.data[i]=Math.min(255,rgb[0]*f);pixels.data[i+1]=Math.min(255,rgb[1]*f);pixels.data[i+2]=Math.min(255,rgb[2]*f);pixels.data[i+3]=255;}
 ctx.putImageData(pixels,0,0);return canvas;}
export default function RockScene({config,mode='orbit',brush=.32,onStroke,onThumbnails,reset=0}:{config:RockConfig,mode?:RockMode,brush?:number,onStroke?:(s:RockConfig['strokes'][number])=>void,onThumbnails?:(images:string[])=>void,reset?:number}){
 const host=useRef<HTMLDivElement>(null),runtime=useRef<any>(null),latest=useRef({config,mode,brush,onStroke}),[error,setError]=useState('');latest.current={config,mode,brush,onStroke};
 useEffect(()=>{if(!host.current)return;const el=host.current;let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});}catch{setError('3D needs WebGL. Try opening this link in a recent Safari, Chrome or Firefox browser.');return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.4;el.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(37,1,.05,100);camera.position.set(0,.5,5.6);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=2;controls.maxDistance=9;controls.target.set(0,0,0);
 scene.add(new THREE.HemisphereLight(0xf5f7ff,0x625e50,2.5));const key=new THREE.DirectionalLight(0xfff3df,3.4);key.position.set(-3,5,4);scene.add(key);const rim=new THREE.DirectionalLight(0xe2ebff,2);rim.position.set(4,2,-3);scene.add(rim);
 const material=new THREE.MeshStandardMaterial({roughness:.85,metalness:0});const mesh=new THREE.Mesh(makeGeometry(latest.current.config),material);scene.add(mesh);runtime.current={renderer,scene,camera,controls,mesh,material};
 if(onThumbnails){const images=[];renderer.setSize(180,140);camera.aspect=180/140;camera.position.set(0,.5,4.8);camera.updateProjectionMatrix();const tex=new THREE.CanvasTexture(stoneCanvas(initialRock));tex.colorSpace=THREE.SRGBColorSpace;material.map=tex;for(let i=0;i<6;i++){mesh.geometry.dispose();mesh.geometry=makeGeometry({...initialRock,template:i});renderer.render(scene,camera);images.push(renderer.domElement.toDataURL());}onThumbnails(images);tex.dispose();material.map=null;camera.position.set(0,.5,5.6);}
 const resize=()=>{renderer.setSize(el.clientWidth,el.clientHeight);camera.aspect=el.clientWidth/Math.max(1,el.clientHeight);camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
 let frame=0;const loop=()=>{if(latest.current.mode==='orbit')controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(loop);};loop();
 const ray=new THREE.Raycaster();let last=0;const dab=(e:PointerEvent)=>{const current=latest.current;if(current.mode==='orbit'||!current.onStroke||Date.now()-last<35)return;last=Date.now();const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=ray.intersectObject(mesh)[0];if(hit){const p=mesh.worldToLocal(hit.point);current.onStroke({x:p.x,y:p.y,z:p.z,radius:current.brush,strength:current.mode==='push'?-.035:.035});}};
 const gestures=sculptGestureHandlers(renderer.domElement,()=>latest.current.mode,dab);
 const start=(event:PointerEvent)=>{last=0;gestures.start(event);};
 const options={capture:true,passive:false};
 el.addEventListener('pointerdown',start,options);
 el.addEventListener('pointermove',gestures.move,options);
 el.addEventListener('pointerup',gestures.end,options);
 el.addEventListener('pointercancel',gestures.end,options);
 renderer.domElement.addEventListener('lostpointercapture',gestures.end);

 const keydown=(e:KeyboardEvent)=>{const offset=camera.position.clone().sub(controls.target);if(e.key==='ArrowLeft'||e.key==='ArrowRight')offset.applyAxisAngle(new THREE.Vector3(0,1,0),e.key==='ArrowLeft'?.15:-.15);else if(e.key==='ArrowUp'||e.key==='ArrowDown')offset.applyAxisAngle(new THREE.Vector3(1,0,0),e.key==='ArrowUp'?.1:-.1);else if(e.key==='+'||e.key==='=')offset.multiplyScalar(.9);else if(e.key==='-')offset.multiplyScalar(1.1);else return;e.preventDefault();camera.position.copy(controls.target).add(offset);controls.update();};el.addEventListener('keydown',keydown);
 return()=>{cancelAnimationFrame(frame);observer.disconnect();
 el.removeEventListener('pointerdown',start,true);
 el.removeEventListener('pointermove',gestures.move,true);
 el.removeEventListener('pointerup',gestures.end,true);
 el.removeEventListener('pointercancel',gestures.end,true);
 renderer.domElement.removeEventListener('lostpointercapture',gestures.end);
 gestures.release();controls.dispose();mesh.geometry.dispose();material.map?.dispose();material.bumpMap?.dispose();material.dispose();renderer.dispose();el.replaceChildren();el.removeEventListener('keydown',keydown);runtime.current=null;};
 },[]);
 useEffect(()=>{const r=runtime.current;if(!r)return;r.mesh.geometry.dispose();r.mesh.geometry=makeGeometry(config);},[config.template,config.roughness,config.stretch,config.flatten,config.strokes]);
 useEffect(()=>{const r=runtime.current;if(!r)return;let cancelled=false;const base=stoneCanvas(config);const bump=new THREE.CanvasTexture(base);const ctx=base.getContext('2d')!;const apply=()=>{if(cancelled)return;const tex=new THREE.CanvasTexture(base);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=r.renderer.capabilities.getMaxAnisotropy();r.material.map?.dispose();r.material.bumpMap?.dispose();r.material.map=tex;r.material.bumpMap=bump;r.material.bumpScale=config.stone==='marble'?.018:.065;r.material.roughness=config.stone==='marble'?.35:.92;r.material.needsUpdate=true;};
 if(config.image){const img=new Image();img.onload=()=>{if(cancelled)return;const w=config.wrap.size*1024,h=w*img.height/img.width;for(const offset of [-1024,0,1024]){ctx.save();ctx.translate(config.wrap.x*1024+offset,(1-config.wrap.y)*512);ctx.rotate(config.wrap.rotation*Math.PI/180);ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();}apply();};img.onerror=()=>{setError('The image could not load. Please try again.');apply();};img.src=config.image;}else apply();return()=>{cancelled=true;if(r.material.bumpMap!==bump)bump.dispose();};
 },[config.stone,config.color,config.image,config.wrap]);
 useEffect(()=>{if(runtime.current)runtime.current.controls.enabled=mode==='orbit';},[mode]);
 useEffect(()=>{const r=runtime.current;if(r){r.camera.position.set(0,.5,5.6);r.controls.target.set(0,0,0);r.controls.update();}},[reset]);
 return <div ref={host} className={'rock-canvas '+(mode!=='orbit'?'sculpting':'')} tabIndex={0} role="application" aria-label={mode==='orbit'?'3D rock. Drag to rotate, pinch or scroll to zoom. Keyboard: arrow keys rotate, plus and minus zoom.':`3D rock. Drag with one finger to ${mode==='push'?'push in':'pull out'} the surface. Select Orbit to rotate or zoom.`}>{error&&<p className="scene-error" role="alert">{error}</p>}</div>;
}
