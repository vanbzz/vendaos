import {z} from 'zod';
import {getChatGPTUser} from '../../chatgpt-auth';
import {offerSchema,researchSchema,missingOffer} from '../../../lib/core';
import {creatorIdSchema,copyContentSchema} from '../../../lib/copy-core';
import {getCreator} from '../../../lib/creators';
import {copyPolicy,moduleInstructions} from '../../../lib/copy-prompts';
import {approvedOffer} from '../../../lib/offer-approval';
export const dynamic='force-dynamic';
const requestSchema=z.object({module:creatorIdSchema,offer:offerSchema,token:z.string().max(64),research:researchSchema,brief:z.record(z.string().max(50),z.string().max(6000)),adjustment:z.string().max(3000).optional(),previous:copyContentSchema.optional()});
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const windows=new Map<string,{at:number,count:number}>();
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Entre na sua conta para criar.'},401);
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json({error:'Origem inválida.'},403);
 if(!req.headers.get('content-type')?.includes('application/json'))return json({error:'Envie o briefing do criador.'},415);
 let body:z.infer<typeof requestSchema>;
 try{const raw=await req.text();if(raw.length>400000)return json({error:'O briefing ficou muito extenso. Resuma antes de continuar.'},413);body=requestSchema.parse(JSON.parse(raw))}catch{return json({error:'Confira o briefing e tente novamente.'},400)}
 const creator=getCreator(body.module)!;
 const missing=creator.fields.filter(f=>f.required&&!body.brief[f.key]?.trim());
 if(missing.length)return json({error:'Preencha: '+missing.map(f=>f.label).join('; ')},400);
 for(const f of creator.fields){if(f.options&&!f.options.includes(body.brief[f.key]))return json({error:'Escolha uma opção válida para '+f.label},400)}
 if(missingOffer(body.offer).length)return json({error:'Complete sua oferta antes de criar.'},400);
 if(!process.env.OPENAI_API_KEY)return json({error:'A conexão com a IA precisa ser configurada pelo responsável.'},503);
 if(!approvedOffer(body.offer,user.userId,body.token))return json({error:'A oferta mudou. Revise e aprove novamente em Gênesis.'},409);
 let calendar:Record<string,string>|undefined;
 if(body.module==='helio'){
 const date=body.brief.date;if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)return json({error:'Escolha uma data válida para a aula.'},400);
 calendar=Object.fromEntries([-14,-10,-7,-5,-3,-1,0,1,2,3,7].map(n=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return ['D'+(n>0?'+':'')+n,d.toISOString().slice(0,10)]}));}
 const now=Date.now(),win=windows.get(user.userId);if(win&&now-win.at<600000&&win.count>=12)return json({error:'Você chegou ao limite de criações deste intervalo. Aguarde alguns minutos.'},429);windows.set(user.userId,{at:win&&now-win.at<600000?win.at:now,count:win&&now-win.at<600000?win.count+1:1});
 const st={type:'string'},obj=(p:Record<string,unknown>)=>({type:'object',properties:p,required:Object.keys(p),additionalProperties:false});
 const schema=obj({title:st,summary:st,blocks:obj(Object.fromEntries(creator.sections.map(s=>[s.key,st]))),checks:{type:'array',items:st}});
 const encoder=new TextEncoder(),abort=new AbortController();let closed=false;
 const stream=new ReadableStream({start(controller){const emit=(v:unknown)=>{if(!closed)controller.enqueue(encoder.encode(JSON.stringify(v)+'\n'))};const heartbeat=setInterval(()=>emit({type:'heartbeat'}),12000);
 (async()=>{try{
 emit({type:'progress',message:'Lendo sua oferta e o briefing…'});
 const model=process.env.OPENAI_COPY_MODEL||process.env.OPENAI_CREATOR_MODEL||'gpt-6-astra';
 const res=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},signal:AbortSignal.any([AbortSignal.timeout(480000),abort.signal]),body:JSON.stringify({model,store:false,stream:true,reasoning:{effort:'medium'},max_output_tokens:18000,instructions:copyPolicy+'\n'+moduleInstructions[body.module]+'\nContrato de seções: '+JSON.stringify(creator.sections),input:JSON.stringify({dataAtual:new Date().toISOString().slice(0,10),ofertaAprovada:body.offer,investigacao:body.research,briefing:body.brief,calendario:calendar,versaoAnterior:body.previous,pedidoDeAjuste:body.adjustment}),text:{format:{type:'json_schema',name:'copy_'+body.module,strict:true,schema}}})});
 if(!res.ok){const e:any=await res.json().catch(()=>({}));throw Error(e.error?.code==='insufficient_quota'?'A conta de IA está sem créditos. Seus textos continuam salvos.':res.status===429?'A IA atingiu um limite temporário. Aguarde e tente novamente.':res.status===404?'O modelo de criação não está disponível nesta conta. O responsável precisa revisar a configuração.':'Não foi possível concluir com a IA. Seus textos continuam salvos.')}
 let buffer='',result:any=null,writing=false;const reader=res.body!.getReader(),decoder=new TextDecoder();
 function consume(line:string){if(!line.startsWith('data: '))return;const data=line.slice(6);if(data==='[DONE]')return;const e=JSON.parse(data);if(e.type==='response.output_text.delta'&&!writing){writing=true;emit({type:'progress',message:'Escrevendo os blocos da sua criação…'})}if(e.type==='response.completed'||e.type==='response.incomplete')result=e.response;if(e.type==='response.failed'||e.type==='error')throw Error('A IA interrompeu a criação. Tente novamente; sua versão anterior foi mantida.')}
 while(true){const {value,done}=await reader.read();buffer+=decoder.decode(value,{stream:!done});const lines=buffer.split('\n');buffer=lines.pop()||'';lines.forEach(l=>consume(l.trimEnd()));if(done){consume(buffer);break}}
 if(!result||result.status!=='completed')throw Error('A resposta ficou incompleta. Tente um briefing mais específico. A versão anterior foi mantida.');
 const output=result.output?.flatMap((x:any)=>x.content||[])||[];if(output.some((x:any)=>x.type==='refusal'))throw Error('A IA não conseguiu atender a esse conteúdo. Revise o pedido.');
 const parsed=JSON.parse(output.filter((x:any)=>x.type==='output_text').map((x:any)=>x.text).join(''));
 const content=copyContentSchema.parse({title:parsed.title,summary:parsed.summary,sections:creator.sections.map(s=>({...s,body:parsed.blocks[s.key]})),checks:parsed.checks});
 if(!content.title.trim()||content.sections.some(s=>s.body.trim().length<30))throw Error('Um bloco ficou incompleto. Tente novamente.');
 emit({type:'result',content,model:result.model||model});
 }catch(e:any){emit({type:'error',error:e?.name==='TimeoutError'?'A criação levou mais tempo que o esperado. Sua versão anterior continua salva.':e?.name==='ZodError'||e instanceof SyntaxError?'A resposta não veio completa no formato esperado. Tente novamente.':e?.message||'A conexão foi interrompida. Sua versão anterior continua salva.'})}finally{clearInterval(heartbeat);if(!closed){closed=true;controller.close()}}})();},cancel(){closed=true;abort.abort()}});
 return new Response(stream,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store','X-Accel-Buffering':'no'}});
}
