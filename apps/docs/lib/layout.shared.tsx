import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const GITHUB_URL = 'https://github.com/aoubak/sompaykit';

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <span className="flex items-center gap-2 font-semibold">
        <span
          aria-hidden="true"
          className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
        >
          S
        </span>
        SomPayKit
      </span>
    ),
  },
  githubUrl: GITHUB_URL,
  links: [{ text: 'Docs', url: '/docs', active: 'nested-url' }],
};
