"""Render a native diagram and animated GIF; requires Pillow (no network calls)."""
from pathlib import Path
import os
from math import sin, pi
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('DIAGRAM_OUTPUT', ROOT / 'public/assets/diagrams'))
OUT.mkdir(parents=True, exist_ok=True)
W, H = 1600, 900
INK, MUTED, LIME, BLUE = '#132635', '#586a78', '#d6fd70', '#1479c9'
FONT = Path('C:/Windows/Fonts/segoeui.ttf')
BOLD = Path('C:/Windows/Fonts/segoeuib.ttf')
def font(size, bold=False):
    return ImageFont.truetype(str(BOLD if bold else FONT), size)
def text(d, xy, value, size=22, fill=INK, bold=False):
    d.text(xy, value, font=font(size, bold), fill=fill)
def box(d, rect, fill='white', outline='#d5e0e7', radius=20):
    d.rounded_rectangle(rect, radius, fill=fill, outline=outline, width=2)
def database(d, x, y, label, small=False):
    r = 22 if small else 29
    d.rounded_rectangle((x-r,y-17,x+r,y+23), 6, fill=BLUE)
    d.ellipse((x-r,y-25,x+r,y-7), fill='#65cbe5', outline='#d2f4fa', width=2)
    d.arc((x-r,y+8,x+r,y+28), 0, 180, fill='#8bd9eb', width=2)
    text(d, (x+42,y-14), label, 20)
def arrow(d, points, fill='#a9bbc9'):
    d.line(points, fill=fill, width=3, joint='curve')
    x,y=points[-1]
    d.polygon([(x,y),(x-10,y-6),(x-10,y+6)], fill=fill)
def at(points, t):
    lengths=[((b[0]-a[0])**2+(b[1]-a[1])**2)**.5 for a,b in zip(points,points[1:])]
    distance=t*sum(lengths)
    for a,b,length in zip(points,points[1:],lengths):
        if distance<=length:
            f=distance/length
            return a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f
        distance-=length
    return points[-1]

paths=[]
base=Image.new('RGB',(W,H),'#f7f9fb')
d=ImageDraw.Draw(base)
text(d,(64,35),'Da origem dos dados à informação para decidir',38,bold=True)
text(d,(66,94),'Recolher · integrar · organizar · disponibilizar',23,MUTED)
box(d,(380,157,1206,718),'#eff5f9','#b8cddd',26)
text(d,(410,178),'PLATAFORMA DE DADOS · AZURE',19,BLUE,True)
for x,n,label in [(64,'01','Fontes de dados'),(414,'02','Integração'),(852,'03','Armazenamento'),(1270,'04','Utilização')]:
    text(d,(x,240),n,17,BLUE,True)
    text(d,(x,269),label,25,bold=True)
sources=['SharePoint','APIs','Formulários web','Fontes web','Portais','Ficheiros / Excel']
for i,label in enumerate(sources):
    y=337+i*53
    box(d,(64,y,314,y+43),radius=11)
    d.rounded_rectangle((77,y+10,102,y+33),5,fill='#e7f1d0')
    text(d,(112,y+6),label,20)
    paths.append([(314,y+22),(350,y+22),(350,416),(414,416)])
box(d,(414,325,754,494))
text(d,(438,346),'Recolha e preparação',23,bold=True)
text(d,(438,390),'Azure Data Factory',23,BLUE,True)
text(d,(438,438),'ETL / ELT · validação',20,MUTED)
box(d,(414,536,754,669))
text(d,(438,554),'Área de preparação',22,bold=True)
text(d,(438,595),'Blob Storage · Data Lake',20,MUTED)
text(d,(438,626),'Ficheiros partilhados',20,MUTED)
arrow(d,[(584,494),(584,536)])
paths.append([(584,494),(584,536)])
box(d,(852,325,1174,669))
text(d,(877,346),'Data warehouse',24,bold=True)
database(d,905,417,'SQL · PostgreSQL')
database(d,905,502,'Modelos por equipa')
database(d,905,587,'Metadados e resumos')
paths.extend([[(754,416),(852,416)],[(754,600),(803,600),(803,502),(852,502)]])
for i,(label,sub) in enumerate([('Power BI','Dashboards e relatórios'),('Power Apps','Aplicações'),('CRM e mapas','Consulta e exploração')]):
    y=325+i*118
    box(d,(1270,y,1536,y+94))
    text(d,(1290,y+14),label,24,bold=True)
    text(d,(1290,y+51),sub,18,MUTED)
    paths.append([(1174,502),(1220,502),(1220,y+47),(1270,y+47)])
box(d,(852,759,1174,835),'#ecf5ff')
text(d,(877,778),'Dados externos',22,bold=True)
text(d,(877,809),'Portais · outros armazéns',18,MUTED)
paths.append([(1174,796),(1238,796),(1238,608),(1270,608)])
for p in paths: arrow(d,p)
text(d,(64,781),'Fluxo ilustrativo',19,bold=True)
text(d,(64,814),'A arquitetura depende das fontes, acessos e necessidades do projeto.',18,MUTED)

base.save(OUT/'fluxo-informacao-static.png', optimize=True)
frames=[]
N=96
for frame in range(N):
    im=base.copy(); draw=ImageDraw.Draw(im)
    phase=frame/N
    # Sequential source -> integration -> warehouse -> presentation; constant speed.
    groups=[list(range(6)),[6,7,8],[9,10,11,12]]
    for stage,indices in enumerate(groups):
        progress=(phase*3-stage)
        if 0<=progress<1:
            for j,index in enumerate(indices):
                x,y=at(paths[index],progress)
                draw.ellipse((x-8,y-8,x+8,y+8),fill=LIME,outline=INK,width=2)
    frames.append(im.quantize(colors=128))
frames[0].save(OUT/'fluxo-informacao.gif',save_all=True,append_images=frames[1:],duration=80,loop=0,optimize=True,disposal=1)
print(OUT/'fluxo-informacao.gif')
print(f'{W}x{H}; {N} frames; {N*.08:.2f}s; {(OUT/"fluxo-informacao.gif").stat().st_size:,} bytes')
