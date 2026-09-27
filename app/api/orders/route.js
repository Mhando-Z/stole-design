import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
import { orderSchema } from '@/lib/design';
import { uploadImage } from '@/lib/sanity';
import nodemailer from 'nodemailer';
export const runtime='nodejs';
export async function POST(req){
 try{
  const body=await req.json();const parsed=orderSchema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0].message},{status:400});
  const o=parsed.data;if(o.honeypot)return NextResponse.json({error:'Unable to submit order'},{status:400});
  const image=body.preview;if(typeof image!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(image)||image.length>4000000)return NextResponse.json({error:'Please refresh the preview and try again'},{status:400});
  const bytes=Buffer.from(image.split(',')[1],'base64');if(bytes.length>3000000||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return NextResponse.json({error:'Preview must be a PNG smaller than 3 MB'},{status:400});
  if(o.design.elements.some(el=>el.type==='logo'&&(!el.src||!el.src.startsWith(`https://cdn.sanity.io/images/${process.env.SANITY_PROJECT_ID}/${process.env.SANITY_DATASET}/`))))return NextResponse.json({error:'A logo in this design needs to be uploaded again'},{status:400});
  const db=adminClient();const reference=crypto.randomUUID();
  const asset=await uploadImage(bytes,'image/png',`stole-${reference}.png`);
  const {data,error}=await db.from('orders').insert({reference,design_name:o.designName,customer_name:o.name,email:o.email||null,phone:o.phone||null,quantity:o.quantity,needed_by:o.neededBy||null,notes:o.notes||null,design:o.design,preview_url:asset.url,sanity_asset_id:asset.id,status:'new'}).select('id,reference').single();
  if(error)throw error;
  let notification='not_configured';
  if(process.env.GMAIL_USER&&process.env.GMAIL_APP_PASSWORD&&process.env.ORDER_NOTIFICATION_EMAIL){
   try{const transport=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:process.env.GMAIL_USER,pass:process.env.GMAIL_APP_PASSWORD}});
    await transport.sendMail({from:process.env.GMAIL_USER,to:process.env.ORDER_NOTIFICATION_EMAIL,subject:`New stole request ${reference.slice(0,8).toUpperCase()}`,text:`New order request\n\nReference: ${reference}\nCustomer: ${o.name}\nContact: ${o.email||'-'} / ${o.phone||'-'}\nDesign: ${o.designName}\nQuantity: ${o.quantity}\nNeeded by: ${o.neededBy||'Not specified'}\n\nOpen your admin dashboard to review the order.\nPreview: ${asset.url}`});notification='sent';
   }catch(e){console.error('Order notification failed',e);notification='failed';}
  }
  await db.from('orders').update({notification_status:notification}).eq('id',data.id);
  return NextResponse.json({reference:data.reference},{status:201});
 }catch(e){console.error('Order submission error',e);return NextResponse.json({error:'We could not save your request. Please try again.'},{status:500});}
}
