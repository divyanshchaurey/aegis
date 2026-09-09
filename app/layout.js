import "./globals.css";

export const metadata = {
  title: "AEGIS // DID-IAM | Tactical Web3 Decentralized Identity & RBAC Gateway",
  description: "Enterprise-grade Blockchain RBAC, Decentralized Identity (DID), and ERC-721 Asset Management Portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@300;400;600;700;800;900&family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased text-white bg-mono-950 min-h-screen flex flex-col font-mono selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
