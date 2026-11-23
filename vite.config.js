import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Two pages: the APIsec LE simulator (index.html) and the F5 AI Security simulator (ai-security.html).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        aiSecurity: fileURLToPath(new URL('./ai-security.html', import.meta.url)),
      },
    },
  },
});
