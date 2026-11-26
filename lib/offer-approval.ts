import {createHmac,timingSafeEqual} from 'node:crypto';
export function signOffer(offer:unknown,userId:string){return createHmac('sha256',process.env.OPENAI_API_KEY||'').update(userId+'|'+JSON.stringify(offer)).digest('hex')}
export function approvedOffer(offer:unknown,userId:string,token:unknown){if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return false;return timingSafeEqual(Buffer.from(token),Buffer.from(signOffer(offer,userId)))}
