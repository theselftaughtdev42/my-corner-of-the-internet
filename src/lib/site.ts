export const SITE = {
  name: 'The Self-Taught Dev',
  author: 'Tim MacKay',
  email: 'odd.door45951@fastmail.com',
  description: 'Studying computer science and sharing the journey',
  tagline: 'Build. Learn. Share.',
};

export const SOCIAL = [
  { label: 'GitHub', url: 'https://github.com/theselftaughtdev42' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/theselftaughtdev/' },
  { label: 'Medium', url: 'https://medium.com/@theselftaughtdev' },
  { label: 'Dev.to', url: 'https://dev.to/theselftaughtdev' },
];

/** One part of the ~ path at the top of a page. The last part is the page itself. */
export interface PathPart {
  label: string;
  href?: string;
}
