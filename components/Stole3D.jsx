'use client';
import { useEffect,useMemo,useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows,OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function makeGeometry(side){
 const segments=36,across=6,vertices=[],uvs=[],indices=[];
 for(let row=0;row<=segments;row++){
  const t=row/segments,center=(side==='left'?-0.63:0.63)+(side==='left'?-0.13:0.13)*t;
  const width=.42+.075*t;const tip=t>.88?(1-(t-.88)*.38):1;
  for(let col=0;col<=across;col++){
   const u=col/across,x=center+(u-.5)*width*tip;
   const y=1.34-3.16*t+(t>.9?Math.abs(u-.5)*.24*(t-.9)/.1:0);
   const z=.08+Math.sin(Math.PI*t)*.17+Math.sin(t*10.2+u*2.3)*.018+(u-.5)*.035;
   vertices.push(x,y,z);uvs.push(u,1-t);
  }
 }
 for(let row=0;row<segments;row++)for(let col=0;col<across;col++){
  const a=row*(across+1)+col,b=a+across+1;indices.push(a,b,a+1,a+1,b,b+1);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

function createFabric(design,side){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=1536;
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 const base=design.baseColor||'#eee1c9',trim=design.trimColor||'#c3a36d';
 ctx.fillStyle=base;ctx.fillRect(0,0,w,h);
 const sheen=ctx.createLinearGradient(0,0,w,0);sheen.addColorStop(0,'rgba(0,0,0,.15)');sheen.addColorStop(.22,'rgba(255,255,255,.12)');sheen.addColorStop(.51,'rgba(255,255,255,.28)');sheen.addColorStop(.78,'rgba(0,0,0,.07)');sheen.addColorStop(1,'rgba(0,0,0,.21)');ctx.fillStyle=sheen;ctx.fillRect(0,0,w,h);
 ctx.strokeStyle=trim;ctx.lineWidth=27;ctx.strokeRect(20,15,w-40,h-30);
 ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=4;ctx.strokeRect(43,38,w-86,h-76);
 if(design.style==='royal'){ctx.strokeStyle=trim;ctx.lineWidth=18;ctx.strokeRect(66,67,w-132,h-134)}
 if(design.style==='heritage'){
  ctx.globalAlpha=.18;ctx.strokeStyle=trim;ctx.lineWidth=14;
  for(let y=90;y<h;y+=145){ctx.beginPath();ctx.moveTo(65,y);ctx.lineTo(w/2,y+48);ctx.lineTo(w-65,y);ctx.stroke()}
  ctx.globalAlpha=1;
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
 const logos=[];
 for(const el of design.elements||[]){if(el.side!==side)continue;
  const x=Math.max(0,Math.min(100,Number(el.x)))/100*w,y=Math.max(0,Math.min(100,Number(el.y)))/100*h;
  const size=Math.max(10,Number(el.size)||20);
  if(el.type==='logo'&&el.src){logos.push({el,x,y,size});continue}
  ctx.save();ctx.translate(x,y);ctx.rotate((Number(el.rotation)||0)*Math.PI/180);ctx.fillStyle=el.color||'#35291e';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=`${el.font==='script'?'italic ':''}600 ${size*6}px ${el.font==='sans'?'Arial, sans-serif':el.font==='script'?'Georgia, serif':'Georgia, serif'}`;
  ctx.fillText(String(el.text||'').slice(0,70),0,0,w*.82);ctx.restore();
 }
 for(const {el,x,y,size} of logos){const image=new Image();image.crossOrigin='anonymous';image.onload=()=>{ctx.save();ctx.translate(x,y);ctx.rotate((Number(el.rotation)||0)*Math.PI/180);const dimension=size*9;ctx.drawImage(image,-dimension/2,-dimension/2,dimension,dimension);ctx.restore();texture.needsUpdate=true};image.src=el.src}
 texture.needsUpdate=true;return texture;
}

function FabricPanel({design,side}){
 const geometry=useMemo(()=>makeGeometry(side),[side]);
 const texture=useMemo(()=>createFabric(design,side),[design,side]);
 useEffect(()=>()=>texture.dispose(),[texture]);useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry} castShadow receiveShadow><meshPhysicalMaterial map={texture} side={THREE.DoubleSide} roughness={.63} metalness={.03} clearcoat={.17} clearcoatRoughness={.7}/></mesh>;
}

function Stole({design}){
 const collar=useMemo(()=>new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.63,1.34,.12),new THREE.Vector3(0,2.09,-.11),new THREE.Vector3(.63,1.34,.12)),48,.145,10,false),[]);
 useEffect(()=>()=>collar.dispose(),[collar]);
 return <group rotation={[0,-.1,0]}><mesh geometry={collar} scale={[1,1,.53]} castShadow><meshPhysicalMaterial color={design.baseColor||'#eee1c9'} roughness={.6} side={THREE.DoubleSide}/></mesh><FabricPanel design={design} side="left"/><FabricPanel design={design} side="right"/></group>;
}

export default function Stole3D({design,hero=false}){
 const controls=useRef(null);
 return <div className={'three-scene '+(hero?'three-scene-hero':'')}>
  <Canvas shadows dpr={[1,1.75]} camera={{position:[0,.15,6.5],fov:34,near:.1,far:30}} gl={{alpha:true,antialias:true}} fallback={<div className="three-fallback">3D unavailable on this device. Use the flat preview.</div>}>
   <ambientLight intensity={1.9}/><directionalLight castShadow position={[-3,5,5]} intensity={2.5} shadow-mapSize={[1024,1024]}/><directionalLight position={[4,2,-3]} intensity={1.1} color="#f9daae"/>
   <Stole design={design}/><ContactShadows position={[0,-2.06,0]} opacity={.26} scale={5} blur={2.6} far={2.7}/>
   <OrbitControls ref={controls} enablePan={false} enableZoom={!hero} minDistance={4.8} maxDistance={8} minPolarAngle={.95} maxPolarAngle={2.05} minAzimuthAngle={-1} maxAzimuthAngle={1} target={[0,.1,0]} enableDamping dampingFactor={.09}/>
  </Canvas>
  {hero?<span className="three-hint">DRAG TO EXPLORE <span>↗</span></span>:<button type="button" className="three-reset" onClick={()=>controls.current?.reset()}>RESET VIEW ↺</button>}
 </div>;
}
