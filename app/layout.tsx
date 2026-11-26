import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'VendaOS · Seu estúdio de copy',description:'Sua oferta no centro. Crie anúncios, iscas, quizzes, VSLs, mentorias, webinars e planos de lançamento com IA.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
