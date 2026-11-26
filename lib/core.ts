import { z } from 'zod';
import {copyDocumentSchema,briefsSchema} from './copy-core';
export const formats=['Ebook','Treinamento gravado','Ferramenta','Mini-SaaS','Info-SaaS','Mentoria individual','Mentoria em grupo','Mentoria híbrida'] as const;
const text=z.string().max(6000);
export const researchSchema=z.object({expertName:text,expertise:text,audience:text,problem:text,desired:text,evidence:text,evidenceSource:text,alternatives:text,capacity:text,format:z.enum([...formats,'Quero ajuda para escolher']),priceIdea:text});
export type Research=z.infer<typeof researchSchema>;
export const emptyResearch:Research={expertName:'',expertise:'',audience:'',problem:'',desired:'',evidence:'',evidenceSource:'Ainda é uma hipótese',alternatives:'',capacity:'',format:'Quero ajuda para escolher',priceIdea:''};
export const analysisSchema=z.object({audience:text,pain:text,evidence:z.array(text).max(8),hypotheses:z.array(text).max(8),questions:z.array(text).max(5),nextTest:text});
export type Analysis=z.infer<typeof analysisSchema>;
export const faqSchema=z.object({question:text,answer:text});
export const offerSchema=z.object({type:z.enum(formats),name:text,promise:text,audience:text,bullets:z.array(text).max(10),deliverables:z.array(text).max(10),bonuses:z.array(text).max(6),expertName:text,expertBio:text,price:text,priceReason:text,faq:z.array(faqSchema).max(8),scope:text,limitations:text});
export type Offer=z.infer<typeof offerSchema>;
export const blankOffer:Offer={type:'Ebook',name:'',promise:'',audience:'',bullets:[''],deliverables:[''],bonuses:[],expertName:'',expertBio:'',price:'',priceReason:'',faq:[{question:'Como funciona o acesso?',answer:''}],scope:'',limitations:''};
export const pageSchema=z.object({headline:text,subheadline:text,problemTitle:text,problemText:text,howTitle:text,howText:text,ctaLabel:text});
export const quizProfileSchema=z.object({id:z.string().min(1).max(40),title:text,description:text,steps:z.array(text).min(2).max(4),offerFit:text,ctaLabel:text});
export const designSchema=z.object({html:z.string().min(100).max(60000),css:z.string().min(100).max(50000),direction:z.string().max(2000)});
export type ExperienceDesign=z.infer<typeof designSchema>;
export const quizSchema=z.object({title:text,intro:text,questions:z.array(z.object({question:text,options:z.array(z.object({label:text,score:z.number().int().min(0).max(2),profile:z.string().max(40).optional()})).min(2).max(4)})).min(3).max(8),profiles:z.array(quizProfileSchema).min(3).max(4).optional(),earlyTitle:text,earlyText:text,readyTitle:text,readyText:text,ctaLabel:text});
export type PageData=z.infer<typeof pageSchema>;
export type QuizData=z.infer<typeof quizSchema>;
export type Artifact={kind:'page'|'quiz',data:PageData|QuizData,offer:Offer,actionUrl:string,createdAt:string,theme?:VisualTheme,design?:ExperienceDesign,model?:string};
export function missingOffer(o:Offer){const missing:string[]=[];for(const [key,label] of [['name','Nome'],['promise','Promessa'],['audience','Público'],['expertName','Nome do especialista'],['expertBio','Sobre o especialista'],['price','Preço'],['scope','Escopo']] as const){if(!o[key].trim())missing.push(label)}if(!o.bullets.some(x=>x.trim()))missing.push('Benefícios');if(!o.deliverables.some(x=>x.trim()))missing.push('Entregáveis');if(!o.faq.length||o.faq.some(x=>!x.question.trim()||!x.answer.trim()))missing.push('Perguntas frequentes');return missing}
const st={type:'string'};const arr=(items:unknown)=>({type:'array',items});const obj=(properties:Record<string,unknown>)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
export const jsonSchemas={
 investigate:obj({audience:st,pain:st,evidence:arr(st),hypotheses:arr(st),questions:arr(st),nextTest:st}),
 offer:obj({type:{type:'string',enum:formats},name:st,promise:st,audience:st,bullets:arr(st),deliverables:arr(st),bonuses:arr(st),expertName:st,expertBio:st,price:st,priceReason:st,faq:arr(obj({question:st,answer:st})),scope:st,limitations:st}),
 page:obj({headline:st,subheadline:st,problemTitle:st,problemText:st,howTitle:st,howText:st,ctaLabel:st}),
 quiz:obj({title:st,intro:st,questions:arr(obj({question:st,options:arr(obj({label:st,score:{type:'integer'}}))})),earlyTitle:st,earlyText:st,readyTitle:st,readyText:st,ctaLabel:st})
};
export const exampleResearch:Research={expertName:'Marina · exemplo fictício',expertise:'Ensino edição de vídeos no celular. Trabalho com pequenos negócios e uso um processo simples: selecionar trechos, cortar, legendar e revisar.',audience:'Profissionais liberais que gravam conteúdo para Instagram, mas editam tudo sozinhos.',problem:'Passam horas editando e acabam deixando vídeos sem publicar.',desired:'Conseguir preparar um vídeo com cortes e legendas sem depender de um editor.',evidence:'Exemplo fictício: “Eu gravo, mas nunca termino a edição.” “Não sei por onde começar a cortar.”',evidenceSource:'Ainda é uma hipótese',alternatives:'Tutoriais gratuitos e cursos completos de edição. Falta um passo a passo curto para o dia a dia.',capacity:'Consigo gravar quatro aulas curtas e criar um checklist. Não oferecerei atendimento individual.',format:'Treinamento gravado',priceIdea:'R$ 97, pagamento único, como hipótese inicial.'};
const hex=z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const themeSchema=z.object({background:hex,surface:hex,text:hex,muted:hex,accent:hex,accentText:hex,font:z.enum(['sans','serif','mono']),layout:z.enum(['centered','editorial','split']),radius:z.enum(['square','soft','round']),description:z.string().max(900)});
export type VisualTheme=z.infer<typeof themeSchema>;
export const referenceSchema=z.object({id:z.string().uuid(),name:z.string().max(180),type:z.enum(['image/png','image/jpeg','image/webp','application/pdf','text/html']),size:z.number().int().max(8388608),theme:themeSchema});
export type VisualReference=z.infer<typeof referenceSchema>;
export const artifactSchema=z.object({kind:z.enum(['page','quiz']),data:z.union([pageSchema,quizSchema]),offer:offerSchema,actionUrl:z.string().max(3000),createdAt:z.string().max(60),theme:themeSchema.optional(),design:designSchema.optional(),model:z.string().max(100).optional()});
export const projectSchema=z.object({id:z.string().min(1).max(100),title:z.string().max(120),step:z.number().int().min(0).max(3),question:z.number().int().min(0).max(4),research:researchSchema,analysis:analysisSchema.nullable(),offer:offerSchema.nullable(),token:z.string().max(64),artifact:artifactSchema.nullable(),previousArtifact:artifactSchema.nullable().optional(),creationBrief:z.string().max(3000).optional(),actionUrl:z.string().max(3000),updatedAt:z.string().max(60),reference:referenceSchema.nullable().optional(),briefs:briefsSchema.optional(),documents:z.array(copyDocumentSchema).max(16).optional()});

export const experienceSchemas={page:obj({data:jsonSchemas.page,design:obj({direction:st,html:st,css:st})}),quiz:obj({data:obj({...jsonSchemas.quiz.properties,questions:arr(obj({question:st,options:arr(obj({label:st,score:{type:'integer',minimum:0,maximum:2},profile:st}))})),profiles:arr(obj({id:st,title:st,description:st,steps:arr(st),offerFit:st,ctaLabel:st}))}),design:obj({direction:st,html:st,css:st})})};
