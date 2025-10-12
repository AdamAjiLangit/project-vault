import "./globals.css";

export const metadata = {
  title: "Project Gallery",
  description: "Project Gallery",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
