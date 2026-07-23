import { createHash } from 'node:crypto';
import { Marp } from '@marp-team/marp-core';

export default {
  engine: (options) => {
    const marp = new Marp(options);

    marp.use((markdown) => {
      const renderFence = markdown.renderer.rules.fence;
      markdown.renderer.rules.fence = (tokens, index, options_, environment, self) => {
        const token = tokens[index];
        if (token.info.trim() !== 'mermaid') {
          return renderFence(tokens, index, options_, environment, self);
        }

        const hash = createHash('sha256').update(token.content.trim()).digest('hex').slice(0, 12);
        return `<p class="mermaid-container"><img src="assets/generated/mermaid/${hash}.svg" alt="Mermaid diagram" /></p>\n`;
      };
    });

    return marp;
  },
};
