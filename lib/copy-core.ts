import {z} from 'zod';
export const creatorIdSchema=z.enum(['hermes','aurora','iris','apolo','helio','orion','atena','lira']);
export const copySectionSchema=z.object({key:z.string().max(40),title:z.string().max(180),body:z.string().max(24000)});
export const copyContentSchema=z.object({title:z.string().max(180),summary:z.string().max(2000),sections:z.array(copySectionSchema).min(3).max(10),checks:z.array(z.string().max(1200)).max(10)});
export const copyVersionSchema=z.object({content:copyContentSchema,createdAt:z.string().max(60),sourceOffer:z.string().max(100000),sourceBrief:z.string().max(40000)});
export const copyDocumentSchema=copyVersionSchema.extend({id:z.string().uuid(),module:creatorIdSchema,history:z.array(copyVersionSchema).max(3),model:z.string().max(100).optional()});
export type CopyContent=z.infer<typeof copyContentSchema>;
export type CopyDocument=z.infer<typeof copyDocumentSchema>;
export const briefsSchema=z.record(creatorIdSchema,z.record(z.string().max(50),z.string().max(6000)));
export function copyText(content:CopyContent){return '# '+content.title+'\n\n'+content.summary+'\n\n'+content.sections.map(s=>'## '+s.title+'\n\n'+s.body).join('\n\n')+(content.checks.length?'\n\n## Antes de usar\n\n'+content.checks.map(x=>'- '+x).join('\n'):'')}
