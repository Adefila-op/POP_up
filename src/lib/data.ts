export type ContentType = "pdf" | "art" | "tool";

export interface ContentItem {
  id: string;
  title: string;
  creator: string;
  creatorAvatar: string;
  type: ContentType;
  price: number;
  cover: string;
  description: string;
  rating: number;
  sales: number;
  category: string;
  // type-specific
  pages?: number; // pdf
  fileSize?: string; // tool
  platform?: string; // tool
  artStyle?: string; // art
}

const cover = (seed: string, hue: number) =>
  `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=800&q=70&hue=${hue}`;

export const CONTENT: ContentItem[] = [
  {
    id: "c1",
    title: "The Indie Maker's Playbook",
    creator: "Lina Park",
    creatorAvatar: "LP",
    type: "pdf",
    price: 19,
    cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=70",
    description: "A 120-page field guide on shipping profitable side projects, with templates and case studies.",
    rating: 4.8,
    sales: 2412,
    category: "Business",
    pages: 120,
  },
  {
    id: "c2",
    title: "Neon Dreams — Vol. 02",
    creator: "Kai Reyes",
    creatorAvatar: "KR",
    type: "art",
    price: 12,
    cover: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=900&q=70",
    description: "A curated set of 24 cyberpunk inspired digital paintings, ready to print or use in your projects.",
    rating: 4.9,
    sales: 980,
    category: "Illustration",
    artStyle: "Cyberpunk",
  },
  {
    id: "c3",
    title: "PromptForge Pro",
    creator: "Mira Osei",
    creatorAvatar: "MO",
    type: "tool",
    price: 29,
    cover: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=70",
    description: "Desktop app to manage, version, and share AI prompts. Includes 500+ starter prompts.",
    rating: 4.7,
    sales: 5210,
    category: "Productivity",
    fileSize: "84 MB",
    platform: "macOS · Windows",
  },
  {
    id: "c4",
    title: "Sunday Brunch Recipes",
    creator: "Otto Vega",
    creatorAvatar: "OV",
    type: "pdf",
    price: 9,
    cover: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=70",
    description: "60 hand-photographed recipes for relaxed weekend cooking. With shopping lists.",
    rating: 4.6,
    sales: 740,
    category: "Lifestyle",
    pages: 84,
  },
  {
    id: "c5",
    title: "Pastel Wildlife Pack",
    creator: "Eden Cho",
    creatorAvatar: "EC",
    type: "art",
    price: 16,
    cover: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=70",
    description: "32 soft-pastel animal portraits in PNG and SVG. Commercial license included.",
    rating: 5.0,
    sales: 412,
    category: "Illustration",
    artStyle: "Pastel",
  },
  {
    id: "c6",
    title: "ColorPick CLI",
    creator: "Devon Lin",
    creatorAvatar: "DL",
    type: "tool",
    price: 0,
    cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=70",
    description: "Command-line palette generator with export to Tailwind, CSS variables, and Figma tokens.",
    rating: 4.5,
    sales: 8800,
    category: "Developer",
    fileSize: "12 MB",
    platform: "macOS · Linux · Windows",
  },
];

export const getContent = (id: string) => CONTENT.find((c) => c.id === id);

// IP / Marketplace
export interface IpAsset {
  id: string;
  title: string;
  creator: string;
  cover: string;
  category: string;
  shares: number; // total shares
  pricePerShare: number;
  monthlyRevenue: number;
  change24h: number; // percentage
  description: string;
}

export const IP_ASSETS: IpAsset[] = [
  {
    id: "ip1",
    title: "Lo-fi Beats Catalog",
    creator: "Nova Sound",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=70",
    category: "Music",
    shares: 10000,
    pricePerShare: 4.2,
    monthlyRevenue: 3200,
    change24h: 5.2,
    description: "240-track lo-fi catalog earning monthly streaming royalties across DSPs.",
  },
  {
    id: "ip2",
    title: "Pixel Heroes Collection",
    creator: "8bit Studio",
    cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=70",
    category: "Game Art",
    shares: 5000,
    pricePerShare: 8.9,
    monthlyRevenue: 1850,
    change24h: -2.1,
    description: "A licensable sprite library used in 40+ indie games, monetized via Unity Asset Store.",
  },
  {
    id: "ip3",
    title: "The Founder Letters",
    creator: "Lina Park",
    cover: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=70",
    category: "Newsletter",
    shares: 2500,
    pricePerShare: 22.5,
    monthlyRevenue: 7400,
    change24h: 12.4,
    description: "Premium newsletter IP with 14k paying subscribers and recurring sponsorship slots.",
  },
  {
    id: "ip4",
    title: "Botanica Print Series",
    creator: "Eden Cho",
    cover: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=70",
    category: "Illustration",
    shares: 3200,
    pricePerShare: 11.0,
    monthlyRevenue: 2100,
    change24h: 1.8,
    description: "Print-on-demand botanical artwork licensed across home goods and stationery brands.",
  },
];

export const getIp = (id: string) => IP_ASSETS.find((i) => i.id === id);

// ---------- Creators ----------
export interface Creator {
  slug: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  website?: string;
  followers: number;
  following: number;
  cover: string;
  joined: string;
  verified?: boolean;
}

export const CREATORS: Creator[] = [
  {
    slug: "lina-park",
    name: "Lina Park",
    avatar: "LP",
    bio: "Indie maker. I write playbooks for shipping profitable side projects. ✍️",
    location: "Seoul, KR",
    website: "linapark.co",
    followers: 18420,
    following: 312,
    cover: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=1200&q=70",
    joined: "Mar 2023",
    verified: true,
  },
  {
    slug: "kai-reyes",
    name: "Kai Reyes",
    avatar: "KR",
    bio: "Cyberpunk illustrator. Neon, rain, chrome. 🌃",
    location: "Manila, PH",
    followers: 9800,
    following: 184,
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1200&q=70",
    joined: "Aug 2023",
  },
  {
    slug: "mira-osei",
    name: "Mira Osei",
    avatar: "MO",
    bio: "Building tools for creators who refuse to repeat themselves.",
    location: "Accra, GH",
    website: "promptforge.app",
    followers: 24310,
    following: 96,
    cover: "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?auto=format&fit=crop&w=1200&q=70",
    joined: "Feb 2023",
    verified: true,
  },
  {
    slug: "otto-vega",
    name: "Otto Vega",
    avatar: "OV",
    bio: "Sunday cooking, photographed slow. 🍞",
    location: "Lisbon, PT",
    followers: 4200,
    following: 540,
    cover: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=70",
    joined: "Jun 2024",
  },
  {
    slug: "eden-cho",
    name: "Eden Cho",
    avatar: "EC",
    bio: "Botanical & wildlife in soft pastels. Commercial use welcomed.",
    location: "Toronto, CA",
    website: "edencho.art",
    followers: 11900,
    following: 230,
    cover: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=70",
    joined: "Nov 2023",
    verified: true,
  },
  {
    slug: "devon-lin",
    name: "Devon Lin",
    avatar: "DL",
    bio: "Open-source dev tools. Make the terminal beautiful again.",
    location: "Berlin, DE",
    followers: 6730,
    following: 412,
    cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=70",
    joined: "Jan 2024",
  },
  {
    slug: "nova-sound",
    name: "Nova Sound",
    avatar: "NS",
    bio: "Lo-fi label · 240+ tracks across DSPs. Streams pay the rent.",
    location: "Tokyo, JP",
    followers: 32100,
    following: 41,
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=70",
    joined: "Sep 2022",
    verified: true,
  },
  {
    slug: "8bit-studio",
    name: "8bit Studio",
    avatar: "8B",
    bio: "Sprite library used in 40+ indie games. Pixel pushers since 2018.",
    location: "Stockholm, SE",
    followers: 14820,
    following: 88,
    cover: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=70",
    joined: "Apr 2023",
  },
];

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const getCreator = (slug: string) =>
  CREATORS.find((c) => c.slug === slug);

export const getCreatorByName = (name: string) => {
  const wanted = slugify(name);
  return CREATORS.find((c) => c.slug === wanted);
};

export const creatorSlug = (name: string) =>
  getCreatorByName(name)?.slug ?? slugify(name);

export const getCreatorContent = (name: string) =>
  CONTENT.filter((c) => c.creator === name);

export const getCreatorIp = (name: string) =>
  IP_ASSETS.filter((i) => i.creator === name);
