import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
// import { ThemeProvider } from "next-themes"; // Removido ThemeProvider

createRoot(document.getElementById("root")!).render(
  // <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme"> // Removido ThemeProvider
    <App />
  // </ThemeProvider>
);