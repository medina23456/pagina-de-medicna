import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Medicalshop Jaén | Uniformes, equipos e insumos médicos',description:'Descubre uniformes médicos, batas, calzado, equipos e insumos en Jaén. Consulta por WhatsApp al 932 122 822.',icons:{icon:'/assets/logo.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
