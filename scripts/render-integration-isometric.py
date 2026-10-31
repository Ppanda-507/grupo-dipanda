"""Native isometric animation inspired by the supplied reference. Pillow only."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import os, math

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('DIAGRAM_OUTPUT',ROOT/'public/assets/diagrams'))
OUT.mkdir(parents=True,exist_ok=True)
W,H=1200,900
BLUE='#2468eb'; NAVY='#163c7c'; INK='#203653'; LIGHT='#e7f0ff'
def font(n,bold=False): return ImageFont.truetype('C:/Windows/Fonts/segoeui'+('b' if bold else '')+'.ttf',n)
def centered(d,x,y,label,n=25,fill=INK,bold=False): d.text((x,y),label,font=font(n,bold),fill=fill,anchor='mt')
def diamond(d,x,y,rx,ry,fill,outline=None):
    points=[(x,y-ry),(x+rx,y),(x,y+ry),(x-rx,y)]
    d.polygon(points,fill=fill)
    if outline:d.line(points+[points[0]],fill=outline,width=2)
def pedestal(d,x,y,rx=72,ry=35):
    d.ellipse((x-rx-15,y-ry+20,x+rx+20,y+ry+32),fill='#e2eaf6')
    d.rectangle((x-rx,y-20,x+rx,y+8),fill=BLUE)
    d.ellipse((x-rx,y-ry+8,x+rx,y+ry+8),fill=BLUE)
    d.ellipse((x-rx,y-ry-12,x+rx,y+ry-12),fill='white',outline='#9dbbf4',width=2)
def server(d,x,y,size=1):
    rx,ry,h=52*size,24*size,35*size
    for i in range(3):
        yy=y-i*42*size
        d.polygon([(x-rx,yy),(x,yy+ry),(x,yy+ry-h),(x-rx,yy-h)],fill='#b9d0ff')
        d.polygon([(x,yy+ry),(x+rx,yy),(x+rx,yy-h),(x,yy+ry-h)],fill='#6694ef')
        diamond(d,x,yy-h,rx,ry,'#f7faff','#739ee9')
        d.line((x-rx+10*size,yy-h+14*size,x-12*size,yy-h+30*size),fill=NAVY,width=max(2,int(4*size)))
        for j in range(2):
            xx=x+17*size+j*12*size
            d.ellipse((xx-2*size,yy-7*size,xx+2*size,yy-3*size),fill='#d6fd70')
def panel(d,x,y,label,kind):
    pedestal(d,x,y)
    if kind=='server':server(d,x,y-15,.64)
    else:
        d.rounded_rectangle((x-44,y-104,x+44,y-24),radius=12,fill='white',outline='#8fb3f9',width=2)
        if kind=='table':
            for i in range(3):d.line((x-30,y-78+i*16,x+30,y-78+i*16),fill=BLUE,width=3)
            d.line((x-5,y-91,x-5,y-34),fill='#b7d0fa',width=2)
        elif kind=='bars':
            for i,h in enumerate([20,39,55]):d.rounded_rectangle((x-30+i*22,y-35-h,x-17+i*22,y-35),3,fill=BLUE)
        elif kind=='api': centered(d,x,y-86,'{ }',34,BLUE,True)
        elif kind=='file':
            for i in range(3):d.line((x-26,y-83+i*17,x+26,y-83+i*17),fill=BLUE,width=3)
    centered(d,x,y+55,label,25,bold=True)

base=Image.new('RGB',(W,H),'#f6f9ff');d=ImageDraw.Draw(base)
# Delicate isometric grid stays behind all information.
for k in range(-1000,1600,60):
    d.line((k,0,k+1800,H),fill='#eaf0fa',width=1)
    d.line((k,0,k-1800,H),fill='#eaf0fa',width=1)
nodes=[(210,280,'ERP','server'),(970,280,'CRM','bars'),(180,565,'Excel','table'),(1000,565,'APIs','api'),(390,740,'Ficheiros','file'),(800,740,'Portais','server')]
center=(600,462)
paths=[]
for x,y,label,kind in nodes:
    path=[(x,y),(x+(600-x)*.5,y),(600,462)]
    paths.append(path)
    d.line(path,fill='#c6d8f9',width=12,joint='curve')
    d.line(path,fill='#3779ed',width=4,joint='curve')
diamond(d,600,478,160,80,'#dbe8ff')
pedestal(d,600,446,122,55)
for x,y,label,kind in nodes: panel(d,x,y,label,kind)
server(d,600,417,1.55)
centered(d,600,76,'Dados integrados',32,bold=True)
centered(d,600,122,'Um único lugar',23,fill='#5e7293')
base.save(OUT/'integracao-dados-isometrica-static.png',optimize=True)
def at(points,t):
    lengths=[math.dist(a,b) for a,b in zip(points,points[1:])];distance=t*sum(lengths)
    for a,b,length in zip(points,points[1:],lengths):
        if distance<=length:
            f=distance/length;return a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f
        distance-=length
    return points[-1]
frames=[]
for frame in range(80):
    im=base.copy();draw=ImageDraw.Draw(im)
    for i,path in enumerate(paths):
        t=(frame/80+i/6)%1
        # Packets disappear on entry into the central platform, never over labels.
        x,y=at(path,t*.78)
        draw.ellipse((x-11,y-11,x+11,y+11),fill='#d6fd70',outline=BLUE,width=3)
    frames.append(im.quantize(colors=128))
frames[0].save(OUT/'integracao-dados-isometrica.gif',save_all=True,append_images=frames[1:],loop=0,duration=80,optimize=True,disposal=1)
print('Rendered 1200x900; 80 frames; 6.4 seconds')
