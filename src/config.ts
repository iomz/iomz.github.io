export const site = {
  title: 'iomz.github.io',
  description: 'Notes on software, systems, hardware, and ongoing work by Iori Mizutani.',
  author: {
    name: 'Iori Mizutani',
    avatar: 'https://avatars.githubusercontent.com/u/26181?v=4',
    bio: '毎日たのしく',
  },
  links: [
    { label: 'GitHub', url: 'https://github.com/iomz' },
    { label: 'X', url: 'https://x.com/iomz' },
    { label: 'Instagram', url: 'https://instagram.com/iomz' },
    { label: 'YouTube', url: 'https://www.youtube.com/@iomz' },
  ],
} as const;

export const navigation = [
  { label: 'Posts', url: '/' },
  { label: 'Categories', url: '/categories/' },
  { label: 'Tags', url: '/tags/' },
  { label: 'About', url: '/about/' },
] as const;
