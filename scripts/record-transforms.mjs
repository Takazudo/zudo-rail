import {writeFileSync} from 'node:fs';
import {selections,assembly,bom,productId} from '../src/assembly.ts';
const variants=Object.fromEntries(selections.map(s=>[productId(s),{selection:s,bom:bom(s),status:'preview-unverified-fit',parts:assembly(s)}]));
writeFileSync(new URL('../docs/assembly-transforms.json',import.meta.url),JSON.stringify({units:'mm',matrixStorage:'column-major; local source -> X width / Y rows / Z front; rigid transform; rendered PCB thickness 1.6',variants},null,2)+'\n');
