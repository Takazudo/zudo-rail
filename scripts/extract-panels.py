import re,json,pathlib,hashlib,argparse
REPO=pathlib.Path(__file__).resolve().parents[1]
cli=argparse.ArgumentParser(description="Extract exact Edge.Cuts polygons from retained KiCad sources")
cli.add_argument("--source-root",type=pathlib.Path,default=REPO/"public/assets/panels")
cli.add_argument("--output",type=pathlib.Path,default=REPO/"src/panel-contours.json")
args=cli.parse_args()
ROOT=args.source_root
files={'frame3u':'zb-side-frame-3u/zd-side-frame-3u.kicad_pcb','frame7u':'zb-side-frame-7u/zd-side-frame-7u.kicad_pcb','pad3u':'zb-side-frame-pad-3u/3u-padder.kicad_pcb','userPad1u':'zb-side-frame-1u/zb-side-frame-1u.kicad_pcb','casePad1u':'zb-side-frame-pad-1u/1u-padder.kicad_pcb'}
def parse(s):
 ts=re.findall(r'"(?:\\.|[^"\\])*"|[()]|[^\s()]+',s);stack=[];root=[];cur=root
 for t in ts:
  if t=='(':new=[];cur.append(new);stack.append(cur);cur=new
  elif t==')':cur=stack.pop()
  else:cur.append(t.strip('"'))
 return root[0]
def child(a,k):return next((x for x in a if isinstance(x,list)and x[0]==k),None)
def area(p):return abs(sum(p[i][0]*p[(i+1)%len(p)][1]-p[(i+1)%len(p)][0]*p[i][1]for i in range(len(p)))/2)
out={}
for k,f in files.items():
 b=(ROOT/f).read_bytes();tree=parse(b.decode()); contours=[]
 for e in tree:
  if not isinstance(e,list)or e[0]not in ['gr_poly','gr_rect']:continue
  if child(e,'layer')!=['layer','Edge.Cuts']:continue
  if e[0]=='gr_poly':p=[[float(v)for v in a[1:]]for a in child(e,'pts')[1:]]
  else:
   x,y=map(float,child(e,'start')[1:]);xx,yy=map(float,child(e,'end')[1:]);p=[[x,y],[xx,y],[xx,yy],[x,yy]]
  contours.append(p)
 contours.sort(key=area,reverse=True)
 out[k]={'path':'panels/'+f,'sha256':hashlib.sha256(b).hexdigest(),'thickness':float(child(child(tree,'general'),'thickness')[1]),'outer':contours[0],'holes':contours[1:]}
args.output.write_text(json.dumps(out,separators=(',',':')))
print([(k,len(v['holes']),len(v['outer']))for k,v in out.items()])
