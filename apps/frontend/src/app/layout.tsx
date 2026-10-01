import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Avícola ERP - Granja Llano Grande",
  description: "Sistema de control de producción e inventarios avícolas",
  themeColor: "#0B2A20",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Avícola ERP",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0B2A20" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Avícola ERP" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <PwaScript />
        </ThemeProvider>
      </body>
    </html>
  );
}

function PwaScript() {
  if (typeof window === "undefined") return null;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                  console.log('SW registered:', registration.scope);
                  registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available
                        if (confirm('Nueva versión disponible. ¿Recargar?')) {
                          window.location.reload();
                        }
                      }
                    });
                  });
                })
                .catch(err => console.log('SW registration failed:', err));
            });
          }

          // Detectar cuando la app está instalada como PWA
          let deferredPrompt;
          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            // Mostrar botón de instalar si quieres
          });

          // Detectar modo standalone
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
          if (isStandalone) {
            document.body.classList.add('pwa-standalone');
          }
        `,
      }}
    />
  );
}