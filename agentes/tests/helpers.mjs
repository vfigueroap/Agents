import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { ROOT,inside,safePath,walk } from '../lib/paths.mjs';

export function workspace(t, {copyProject=false,generated=false}={}) {
  const parent=safePath(ROOT,generated?'generated':'.test-tmp',{mustExist:false});
  fs.mkdirSync(parent,{recursive:true});
  const directory=fs.mkdtempSync(path.join(parent,'test-'));
  t.after(()=>{
    // Verificación explícita del destino absoluto antes de borrado recursivo.
    const absolute=path.resolve(directory);
    assert(inside(ROOT,absolute)&&inside(parent,absolute)&&absolute!==parent);
    assert(path.basename(absolute).startsWith('test-'));
    assert(!fs.lstatSync(absolute).isSymbolicLink());
    fs.rmSync(absolute,{recursive:true,force:true});
  });
  if(copyProject)for(const relative of walk(ROOT)){
    const target=path.join(directory,...relative.split('/'));
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.copyFileSync(safePath(ROOT,relative),target);
  }
  return {directory,relative:directory.slice(ROOT.length+1).split(path.sep).join('/'),
    set(file,value){const target=safePath(directory,file,{mustExist:false});fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,`${JSON.stringify(value,null,2)}\n`);},
    unique:crypto.randomUUID()};
}

export function testLink(t,target,link) {
  try { fs.symlinkSync(target,link,process.platform==='win32'?'junction':'dir');return link; }
  catch(error) {
    if(!['EPERM','EACCES','ENOTSUP'].includes(error.code))throw error;
    t.diagnostic('El host no permite crear enlaces; se comprueba la guarda mediante lstat simulado.');
    const original=fs.lstatSync;
    t.mock.method(fs,'lstatSync',function(file,...args){
      if(path.resolve(file)===path.resolve(target))return {isSymbolicLink:()=>true};
      return original.call(fs,file,...args);
    });
    return target;
  }
}
