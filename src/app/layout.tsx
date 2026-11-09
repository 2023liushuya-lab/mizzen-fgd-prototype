import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import '@/styles/globals.css';
export const metadata: Metadata = {
  title: 'Mizzen · FGD 工作台原型',
  description: '主持人、受访者与旁听室的可迭代交互原型',
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
