'use client';
import {useState,useEffect,useRef,useCallback} from 'react';
type Basic={id:string,title:string,updatedAt:string};
type Meta=Record<string,{revision:number,signature:string}>;
export function useProjectStorage<T extends Basic>(userId:string,validate:(v:any)=>T,make:()=>T){
 const key='implementation-projects-v1-'+userId;
 const [projects,setProjects]=useState<T[]>([]),[active,setActive]=useState(''),[ready,setReady]=useState(false),[autoSave,setAutoSave]=useState(true),[saveState,setSaveState]=useState('loading'),[storageMessage,setStorageMessage]=useState(''),[saveError,setSaveError]=useState(false);
 const latest=useRef<T[]>([]),meta=useRef<Meta>({}),running=useRef(false),enabled=useRef(true),alive=useRef(true);
 latest.current=projects;enabled.current=autoSave;
 const persist=useCallback(()=>{try{localStorage.setItem(key,JSON.stringify(latest.current));localStorage.setItem(key+'-sync',JSON.stringify(meta.current));setSaveError(false)}catch{setSaveError(true)}},[key]);
 const dirty=()=>latest.current.filter(p=>meta.current[p.id]?.signature!==JSON.stringify(p));
 const saveAll=useCallback(async()=>{
 if(running.current||!alive.current)return;running.current=true;setSaveState('saving');
 try{for(let count=0;count<100;count++){const pending=dirty()[0];if(!pending)break;const signature=JSON.stringify(pending);const res=await fetch('/api/projects',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:pending,revision:meta.current[pending.id]?.revision||0})});const data:any=await res.json();
 if(res.status===409&&data.remote){const remote=validate(data.remote.project);const current=latest.current.find(x=>x.id===pending.id)||pending;const recovered={...current,id:crypto.randomUUID(),title:(current.title+' · cópia recuperada').slice(0,120),updatedAt:new Date().toISOString()};meta.current[remote.id]={revision:data.remote.revision,signature:JSON.stringify(remote)};const next=[recovered,...latest.current.map(x=>x.id===pending.id?remote:x)];latest.current=next;setProjects(next);setActive(id=>id===pending.id?recovered.id:id);setStorageMessage('Encontramos uma edição em outro lugar. Preservamos as duas versões; você está na cópia recuperada.');persist();continue}
 if(!res.ok)throw Error(data.error||'Não foi possível salvar na conta.');meta.current[pending.id]={revision:data.revision,signature};persist();}
 if(alive.current){setSaveState(dirty().length?'pending':'saved')}
 }catch(e){if(alive.current){setSaveState('error');setStorageMessage((e instanceof Error?e.message:'Sem conexão com a conta.')+' Seus dados continuam neste navegador.')}}finally{running.current=false}
 },[key,persist]);
 useEffect(()=>{alive.current=true;let cancelled=false;(async()=>{
 let local:T[]=[];let localMeta:Meta={};try{const raw=localStorage.getItem(key);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed)){for(const v of parsed){try{local.push(validate(v))}catch{localStorage.setItem(key+'-recovery-'+Date.now(),raw);setStorageMessage('Um rascunho antigo precisa de revisão. A cópia original foi preservada neste navegador.')}}}}localMeta=JSON.parse(localStorage.getItem(key+'-sync')||'{}');const preference=localStorage.getItem(key+'-autosave');setAutoSave(preference!=='false')}catch{setStorageMessage('Não foi possível abrir uma cópia local. Vamos buscar seus projetos na conta.')}
 meta.current=localMeta;let merged=local;
 try{const res=await fetch('/api/projects');if(!res.ok)throw Error();const data:any=await res.json();const cloud=data.projects.map((x:any)=>({project:validate(x.project),revision:x.revision}));merged=[];for(const row of cloud){const remote=row.project;const l=local.find(x=>x.id===remote.id);const m=localMeta[remote.id];const changed=l&&m?.signature!==JSON.stringify(l);if(changed&&m?.revision!==row.revision){merged.push({...l,id:crypto.randomUUID(),title:(l.title+' · cópia recuperada').slice(0,120),updatedAt:new Date().toISOString()});merged.push(remote);meta.current[remote.id]={revision:row.revision,signature:JSON.stringify(remote)};setStorageMessage('Preservamos uma alteração local em uma cópia recuperada.')}else{merged.push(changed?l:remote);meta.current[remote.id]={revision:row.revision,signature:changed?(m?.signature||''):JSON.stringify(remote)}}}for(const l of local)if(!cloud.some((r:any)=>r.project.id===l.id))merged.push(l);
 }catch{setStorageMessage('Não conseguimos consultar a conta agora. A cópia local foi mantida; tente salvar novamente.');setSaveState('error')}
 if(!merged.length)merged=[make()];if(cancelled)return;latest.current=merged;setProjects(merged);let last='';try{last=localStorage.getItem(key+'-active')||''}catch{}setActive(merged.some(x=>x.id===last)?last:merged[0].id);setReady(true);
 })();return()=>{cancelled=true;alive.current=false}},[key]);
 useEffect(()=>{if(!ready)return;persist();if(dirty().length){setSaveState('pending');if(autoSave){const t=setTimeout(saveAll,700);return()=>clearTimeout(t)}}else setSaveState('saved')},[projects,ready,autoSave,persist,saveAll]);
 useEffect(()=>{if(ready){try{localStorage.setItem(key+'-active',active);localStorage.setItem(key+'-autosave',String(autoSave))}catch{}}},[active,autoSave,ready,key]);
 useEffect(()=>{const online=()=>{if(enabled.current)void saveAll()};const pagehide=()=>persist();window.addEventListener('online',online);window.addEventListener('pagehide',pagehide);const timer=setInterval(()=>{if(enabled.current&&dirty().length)void saveAll()},15000);return()=>{window.removeEventListener('online',online);window.removeEventListener('pagehide',pagehide);clearInterval(timer)}},[persist,saveAll]);
 return {projects,setProjects,active,setActive,ready,autoSave,setAutoSave,saveState,storageMessage,setStorageMessage,saveError,saveAll};
}
