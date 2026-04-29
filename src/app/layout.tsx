import type { Metadata } from 'next';
import { Space_Grotesk, Fraunces } from 'next/font/google';
import './globals.css';

const bodyFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body'
});

const headingFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading'
});

export const metadata: Metadata = {
  title: 'Dynamic App Generator',
  description: 'A config-driven app generator for the internship assignment.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>{children}</body>
    </html>
  );
}