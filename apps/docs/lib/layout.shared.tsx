import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Logo } from '../components/logo';

export const GITHUB_URL = 'https://github.com/aoubak/sompaykit';

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: <Logo className="h-6 w-auto text-foreground" />,
  },
  githubUrl: GITHUB_URL,
  links: [{ text: 'Docs', url: '/docs', active: 'nested-url' }],
};
