import { NextResponse } from 'next/server';
import { uploadImage } from '@/lib/sanity';
export const runtime='nodejs';
export async function POST(req){try{
 const data=await req.formData(),file=data.get('file');if(!(file instanceof File))return NextResponse.json({error:'Choose a PNG or JPEG image'},{status:400});
 if(!['image/png','image/jpeg'].includes(file.type)||file.size>2000000||file.size<100)return NextResponse.json({error:'Use a PNG or JPEG smaller than 2 MB'},{status:400});
 const bytes=Buffer.from(await file.arrayBuffer());const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if((file.type==='image/png'&&!png)||(file.type==='image/jpeg'&&!jpg))return NextResponse.json({error:'The file does not match its image format'},{status:400});
 const asset=await uploadImage(bytes,file.type,`customer-logo-${crypto.randomUUID()}.${png?'png':'jpg'}`);return NextResponse.json(asset);
 }catch(e){console.error('Asset upload error',e);return NextResponse.json({error:'Upload failed. Please try again.'},{status:500});}}
