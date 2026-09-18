import tutorialkit from '@tutorialkit/astro';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ul-fri-kcui.github.io',
  base: '/semantic-data/vaje',
  output: 'static',
  devToolbar: {
    enabled: false,
  },
  integrations: [
    tutorialkit({
      defaultRoutes: 'tutorial-only',
      components: {
        HeadTags: './src/components/HeadTags.astro',
        TopBar: './src/components/TopBar.astro',
      },
    }),
  ],
});
