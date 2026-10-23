import './globals.css';

export const metadata = {
  title: 'Zuryo — On-demand fitness',
  description: 'Book trainers in your residential community',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
