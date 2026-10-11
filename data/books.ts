import type { ImageSourcePropType } from 'react-native';

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  readers: string;
  progress?: number;
  status: 'চলমান' | 'সমাপ্ত' | 'নতুন';
  cover: ImageSourcePropType;
  excerpt: string;
  description: string;
  verified?: boolean;
};

export const books: Book[] = [
  {
    id: 'kismot-ka-sobor',
    title: 'কিসমত কা সফর',
    author: 'সাদিয়া',
    genre: 'রোমান্টিক',
    readers: '58',
    status: 'চলমান',
    cover: require('@/assets/images/cover-romance.jpg'),
    excerpt: 'কিছু গল্পের শুরু হয় একদম অচেনা কোনো বিকেলে...',
    description: 'দুই ভিন্ন শহরের দুই মানুষের দেখা, আর এক অসম্ভব সুন্দর যাত্রার গল্প।',
    verified: true,
  },
  {
    id: 'mohamaya-season-1',
    title: 'মহামায়া সিজন ১',
    author: 'তুষারিকা',
    genre: 'রোমান্টিক',
    readers: '33',
    status: 'চলমান',
    cover: require('@/assets/images/cover-mystery.jpg'),
    excerpt: 'রাত যত গভীর হয়, শহর তত বেশি নিজের কথা বলতে শুরু করে...',
    description: 'একটি শহর, কিছু না বলা কথা এবং সম্পর্কের ভেতর লুকিয়ে থাকা রহস্য।',
  },
  {
    id: 'amar-ojanodin',
    title: 'আমার অজানাদিন',
    author: 'মাহমুদা',
    genre: 'রোমান্টিক',
    readers: '378.7K',
    status: 'সমাপ্ত',
    cover: require('@/assets/images/cover-drama.jpg'),
    excerpt: 'যে দিনটির কথা মনে রাখার কথা ছিল না, সেই দিনই থেকে গেল...',
    description: 'স্মৃতি, অপেক্ষা আর ভালোবাসার ভেতর দিয়ে এগিয়ে যাওয়া এক নরম গল্প।',
    verified: true,
  },
  {
    id: 'megher-pichone-ami',
    title: 'মেঘের পিছনে আমায়',
    author: 'সুমন্ত',
    genre: 'রোমান্টিক',
    readers: '362.7K',
    status: 'সমাপ্ত',
    cover: require('@/assets/images/cover-romance.jpg'),
    excerpt: 'কখনো কখনো মানুষকে খুঁজে পেতে আকাশের দিকে তাকাতে হয়...',
    description: 'দূরত্ব পেরিয়ে আবার কাছে আসার এক মায়াবী কাহিনি।',
  },
  {
    id: 'tar-ashiq',
    title: 'তার আশিক',
    author: 'রুহাইয়া রাফা',
    genre: 'উপন্যাস',
    readers: '116.8K',
    status: 'নতুন',
    cover: require('@/assets/images/cover-mystery.jpg'),
    excerpt: 'ভালোবাসা কখন যে অভ্যাস হয়ে যায়, বোঝা যায় না...',
    description: 'আবেগ, সাহস আর নিজের জন্য দাঁড়ানোর একটি আধুনিক উপন্যাস।',
  },
  {
    id: 'shohorer-shesh-train',
    title: 'শহরের শেষ ট্রেন',
    author: 'নাবিলা নূর',
    genre: 'সাহিত্য',
    readers: '24.2K',
    status: 'চলমান',
    cover: require('@/assets/images/cover-drama.jpg'),
    excerpt: 'শেষ ট্রেনটি চলে গেলে শহরটা আর আগের মতো থাকে না...',
    description: 'শহরের আলো-আঁধারিতে হারিয়ে যাওয়া মানুষগুলোর গল্প।',
  },
];

export const categories = ['সব', 'রোমান্টিক', 'উপন্যাস', 'থ্রিলার', 'সাহিত্য', 'ইতিহাস'];

export const featuredBook = books[4];