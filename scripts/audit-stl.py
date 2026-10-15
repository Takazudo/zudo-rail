import struct,pathlib,collections,hashlib,json,argparse
REPO=pathlib.Path(__file__).resolve().parents[1]
cli=argparse.ArgumentParser(description="Audit preserved binary STL geometry; no external Python packages")
cli.add_argument("--source-root",type=pathlib.Path,default=REPO/"working")
cli.add_argument("--output",type=pathlib.Path)
args=cli.parse_args()
out={}
for p in sorted(args.source_root.glob('*.stl')):
 b=p.read_bytes();n=struct.unpack_from('<I',b,80)[0]
 tris=[tuple(tuple(round(v,6)for v in struct.unpack_from('<3f',b,84+i*50+12+j*12))for j in range(3))for i in range(n)]
 pts=set(v for t in tris for v in t);edges=collections.Counter(tuple(sorted((t[j],t[(j+1)%3])))for t in tris for j in range(3));direct=collections.Counter((t[j],t[(j+1)%3])for t in tris for j in range(3))
 out[p.name]={'sha256':hashlib.sha256(b).hexdigest(),'triangles':n,'bbox':[[min(v[k]for v in pts)for k in range(3)],[max(v[k]for v in pts)for k in range(3)]],'edgeIncidence':dict(collections.Counter(edges.values())),'duplicateTriangles':n-len(set(tuple(sorted(t))for t in tris)),'inconsistentDirectedEdgeCount':sum(direct[(a,z)]!=direct[(z,a)]for a,z in edges)}
if args.output: args.output.write_text(json.dumps(out,indent=2)+"\n")
else: print(json.dumps(out,indent=2))
