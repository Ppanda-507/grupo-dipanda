import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Canvas draws the notification animation; GIF frames share a palette and
// encode only changed rectangles. Identical frames become longer reading holds.
const W = 720, H = 320;
const output = 'public/assets/process';
const { chromium } = await import(pathToFileURL(path.join(os.tmpdir(), 'dipanda-test-tools/core/package/index.mjs')).href);
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:4173');
await page.evaluate(async () => {
  const photo = new Image();
  photo.src = '/assets/process/chatbot-phone-background-v1.png';
  await photo.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 720; canvas.height = 320;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const conversations = [
    ['Olá! Queria saber mais.', 'Olá! Como posso ajudar?'],
    ['Posso agendar uma reunião?', 'Claro! Amanhã, às 10h?'],
    ['Sim, pode confirmar.', 'Reunião agendada!']
  ];
  // Solve the skill's strong ease-out cubic-bezier(.23,1,.32,1).
  const ease = x => {
    x = Math.max(0, Math.min(1, x));
    let lo = 0, hi = 1;
    for (let i = 0; i < 14; i++) {
      const t = (lo + hi) / 2;
      const bx = 3 * (1-t)**2 * t * .23 + 3 * (1-t) * t*t * .32 + t**3;
      if (bx < x) lo = t; else hi = t;
    }
    const t = (lo + hi) / 2;
    return 1 - (1-t)**3;
  };
  const box = (x,y,w,h,r,fill) => {ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
  function message(text, bot, start, time) {
    if (time < start) return;
    const p = ease((time-start)/.3);
    ctx.save();ctx.globalAlpha=p;
    ctx.translate(0, -32*(1-p));
    const x = bot ? 76 : 28, y = bot ? 162 : 62;
    ctx.shadowColor='#00000020';ctx.shadowBlur=12;ctx.shadowOffsetY=5;
    box(x,y,450,bot ? 98 : 86,14,bot ? '#D4FF63' : '#fffffff2');
    ctx.shadowColor='transparent';
    box(x+16,y+15,25,25,7,bot ? '#131313' : '#278858');
    ctx.strokeStyle=bot ? '#D4FF63' : '#ffffff';ctx.lineWidth=1.8;
    if(bot){
      ctx.strokeRect(x+22,y+21,13,11);ctx.beginPath();ctx.moveTo(x+28,y+17);ctx.lineTo(x+28,y+21);ctx.stroke();
      ctx.fillStyle='#D4FF63';ctx.fillRect(x+25,y+25,2,2);ctx.fillRect(x+30,y+25,2,2);
    }else{
      ctx.beginPath();ctx.roundRect(x+21,y+20,15,11,3);ctx.stroke();ctx.beginPath();ctx.moveTo(x+24,y+31);ctx.lineTo(x+24,y+34);ctx.lineTo(x+28,y+31);ctx.stroke();
    }
    ctx.fillStyle='#424242';ctx.font='600 16px Arial';ctx.fillText(bot ? 'CHATBOT' : 'CLIENTE',x+51,y+33);
    ctx.font='14px Arial';ctx.textAlign='right';ctx.fillText('agora',x+432,y+33);ctx.textAlign='left';
    ctx.fillStyle='#131313';ctx.font='500 25px Arial';ctx.fillText(text,x+16,y+67);
    ctx.restore();
  }
  window.renderChatFrame = time => {
    ctx.clearRect(0,0,720,320);ctx.drawImage(photo,0,0,720,320);
    const veil=ctx.createLinearGradient(0,0,720,0);veil.addColorStop(0,'#ffffff80');veil.addColorStop(1,'#ffffff00');ctx.fillStyle=veil;ctx.fillRect(0,0,720,320);
    box(28,16,204,30,15,'#131313');ctx.fillStyle='#D4FF63';ctx.beginPath();ctx.arc(44,31,4,0,Math.PI*2);ctx.fill();ctx.font='600 14px Arial';ctx.fillText('CHATBOT DISPONÍVEL',57,36);
    const stage = Math.min(2,Math.floor(time/4.7));
    const local = time-stage*4.7;
    ctx.save();ctx.globalAlpha=Math.min(1,Math.max(0,(4.7-local)/.3));
    message(conversations[stage][0],false,.3,local);
    message(conversations[stage][1],true,1.5,local);
    // Final confirmation text is part of the response, not a separate moving UI.
    if(stage===2 && local>=1.5){
      const p=ease((local-1.5)/.3);ctx.save();ctx.globalAlpha*=p;ctx.fillStyle='#131313';ctx.font='16px Arial';ctx.fillText('Amanhã · 10h · Confirmação enviada',92,250);ctx.restore();
    }
    ctx.restore();
    return canvas.toDataURL('image/png');
  };
  window.chatPixels = () => {
    const a=ctx.getImageData(0,0,720,320).data;
    let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(s);
  };
});
const raw=[];
for(let i=0;i<141;i++){
  await page.evaluate(t=>window.renderChatFrame(t),i/10);
  raw.push(Buffer.from(await page.evaluate(()=>window.chatPixels()),'base64'));
}
// renderChatFrame returns a PNG data URL, useful as the reduced-motion poster.
const png=await page.evaluate(()=>window.renderChatFrame(12));
fs.writeFileSync(path.join(output,'chatbot-messages-v1.png'),Buffer.from(png.split(',')[1],'base64'));
await browser.close();

const histogram=new Map();
for(const frame of raw)for(let i=0;i<frame.length;i+=16){const key=(frame[i]>>3)<<10|(frame[i+1]>>3)<<5|(frame[i+2]>>3);histogram.set(key,(histogram.get(key)||0)+1);}
const points=[...histogram].map(([k,n])=>({rgb:[(k>>10)*8+4,((k>>5)&31)*8+4,(k&31)*8+4],n}));
const boxes=[points];
const range = b => [0,1,2].map(c=>Math.max(...b.map(p=>p.rgb[c]))-Math.min(...b.map(p=>p.rgb[c])));
while(boxes.length<256){
  let index=-1,score=-1;
  boxes.forEach((b,i)=>{const v=Math.max(...range(b))*b.reduce((n,p)=>n+p.n,0);if(b.length>1&&v>score){score=v;index=i;}});
  if(index<0)break;
  const b=boxes.splice(index,1)[0],r=range(b),channel=r.indexOf(Math.max(...r));b.sort((a,z)=>a.rgb[channel]-z.rgb[channel]);
  const half=b.reduce((n,p)=>n+p.n,0)/2;let n=0,j=0;while(j<b.length-1&&n<half)n+=b[j++].n;
  boxes.push(b.slice(0,j),b.slice(j));
}
const palette=boxes.map(b=>{const n=b.reduce((v,p)=>v+p.n,0);return [0,1,2].map(c=>Math.round(b.reduce((v,p)=>v+p.n*p.rgb[c],0)/n));});
while(palette.length<256)palette.push([0,0,0]);
const lookup=new Uint8Array(32768);
for(let k=0;k<32768;k++){
 const rgb=[(k>>10)*8+4,((k>>5)&31)*8+4,(k&31)*8+4];let best=Infinity;
 palette.forEach((p,i)=>{const d=(p[0]-rgb[0])**2+(p[1]-rgb[1])**2+(p[2]-rgb[2])**2;if(d<best){best=d;lookup[k]=i;}});
}
function indices(rgba){const out=new Uint8Array(W*H);for(let i=0,j=0;i<rgba.length;i+=4,j++)out[j]=lookup[(rgba[i]>>3)<<10|(rgba[i+1]>>3)<<5|(rgba[i+2]>>3)];return out;}
// Nine-bit LZW with early dictionary clears avoids code-width boundary ambiguity.
function lzw(pixels){
 const bytes=[];let bits=0,count=0;const code=v=>{bits|=v<<count;count+=9;while(count>=8){bytes.push(bits&255);bits>>>=8;count-=8;}};
 let dict=new Map(),next=258,prefix=pixels[0];code(256);
 for(let i=1;i<pixels.length;i++){
  const value=pixels[i],key=(prefix<<8)|value,found=dict.get(key);
  if(found!==undefined){prefix=found;continue;}
  code(prefix);dict.set(key,next++);prefix=value;
  if(next>=508){code(256);dict=new Map();next=258;}
 }
 code(prefix);code(257);if(count)bytes.push(bits&255);
 const chunks=[Buffer.from([8])];for(let i=0;i<bytes.length;i+=255){const part=bytes.slice(i,i+255);chunks.push(Buffer.from([part.length]),Buffer.from(part));}chunks.push(Buffer.from([0]));return Buffer.concat(chunks);
}
const u16=v=>[v&255,v>>8];
const encoded=[];let previous=null;
for(const rgba of raw){
 const current=indices(rgba);let minX=W,minY=H,maxX=-1,maxY=-1;
 if(!previous){minX=0;minY=0;maxX=W-1;maxY=H-1;}else for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(current[y*W+x]!==previous[y*W+x]){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 if(maxX<0){encoded.at(-1).delay+=10;continue;}
 const width=maxX-minX+1,height=maxY-minY+1,rect=new Uint8Array(width*height);
 for(let y=0;y<height;y++)rect.set(current.subarray((y+minY)*W+minX,(y+minY)*W+minX+width),y*width);
 encoded.push({delay:10,x:minX,y:minY,width,height,bytes:lzw(rect)});previous=current;
}
const parts=[Buffer.from('GIF89a'),Buffer.from([...u16(W),...u16(H),0xf7,0,0]),Buffer.from(palette.flat()),Buffer.from([0x21,0xff,11]),Buffer.from('NETSCAPE2.0'),Buffer.from([3,1,0,0,0])];
for(const f of encoded)parts.push(Buffer.from([0x21,0xf9,4,4,...u16(f.delay),0,0,0x2c,...u16(f.x),...u16(f.y),...u16(f.width),...u16(f.height),0]),f.bytes);
parts.push(Buffer.from([0x3b]));
const gif=Buffer.concat(parts);fs.writeFileSync(path.join(output,'chatbot-messages-v1.gif'),gif);
console.log(JSON.stringify({width:W,height:H,frames:encoded.length,seconds:14.1,bytes:gif.length}));
