import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Two pages: the APIsec LE simulator (index.html) and the F5 AI Security simulator (ai-security.html).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 5280 instead of Vite's default 5173, which other local apps often use.
  // strictPort: fail loudly if 5280 is taken instead of silently moving to another port.
  server: { port: 5280, strictPort: true },
  preview: { port: 5281, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        aiSecurity: fileURLToPath(new URL('./ai-security.html', import.meta.url)),
      },
    },
  },
});
