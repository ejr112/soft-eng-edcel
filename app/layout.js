import '@/app/globals.css';

export const metadata = {
  title: 'ISU Library Portal',
  description: 'Digital Library Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}