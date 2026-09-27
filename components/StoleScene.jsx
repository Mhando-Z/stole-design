'use client';
import dynamic from 'next/dynamic';
const Scene=dynamic(()=>import('./Stole3D'),{ssr:false,loading:()=> <div className="three-loading"><span className="three-spinner"/>Preparing your stole…</div>});
export default function StoleScene(props){return <Scene {...props}/>}
