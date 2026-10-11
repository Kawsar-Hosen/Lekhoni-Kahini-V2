export type AuthorProfile = {
  id: string;
  name: string;
  bio: string;
  totalReads: string;
  followers: string;
};

export const authorProfiles: AuthorProfile[] = [
  {
    id: 'sadia',
    name: 'সাদিয়া',
    bio: 'রোমান্টিক গল্প ও জীবনের ছোট ছোট অনুভূতি নিয়ে লিখতে ভালোবাসেন।',
    totalReads: '২.২M',
    followers: '২K',
  },
  {
    id: 'tusharika',
    name: 'তুষারিকা',
    bio: 'সম্পর্ক, রহস্য আর আবেগের গল্পে পাঠকদের নতুন জগতে নিয়ে যান।',
    totalReads: '১.৮M',
    followers: '১.৬K',
  },
  {
    id: 'mahmuda',
    name: 'মাহমুদা',
    bio: 'ভালোবাসা, স্মৃতি ও অপেক্ষার গল্পই তাঁর লেখার প্রধান অনুপ্রেরণা।',
    totalReads: '১.৩M',
    followers: '১.২K',
  },
  {
    id: 'sumanta',
    name: 'সুমন্ত',
    bio: 'মানুষ ও শহরের গল্পকে সহজ ভাষায় তুলে ধরতে পছন্দ করেন।',
    totalReads: '৯৪০K',
    followers: '৯৮০',
  },
  {
    id: 'ruhaiya-rafa',
    name: 'রুহাইয়া রাফা',
    bio: 'আবেগ, সাহস আর নিজের জন্য দাঁড়ানোর গল্প লেখেন।',
    totalReads: '৬৮০K',
    followers: '৭৫০',
  },
  {
    id: 'nabila-noor',
    name: 'নাবিলা নূর',
    bio: 'শহুরে জীবনের আলো-আঁধারিতে হারিয়ে যাওয়া মানুষদের গল্প বলেন।',
    totalReads: '৫২০K',
    followers: '৬১০',
  },
];

export function getAuthorProfileId(name: string) {
  return authorProfiles.find((author) => author.name === name)?.id;
}