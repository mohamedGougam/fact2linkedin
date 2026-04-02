import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fact2LinkedIn',
  description: 'Turn a topic into facts and sample LinkedIn posts.'
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
