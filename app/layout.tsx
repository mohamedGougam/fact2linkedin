import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KAWN Content Creator Agent',
  description:
    'Turn a topic into researched facts and KAWN-ready post drafts — research, review, generate, export.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
