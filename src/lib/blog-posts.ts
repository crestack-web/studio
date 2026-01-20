export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  author: string;
  date: string;
  imageUrl: string;
  imageHint: string;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: '5-ways-to-increase-sales',
    title: '5 Simple Ways to Increase Sales in Your Small Business',
    description: 'Discover practical and easy-to-implement strategies to boost your revenue and grow your customer base.',
    author: 'Tunde Oladipo',
    date: 'August 15, 2024',
    imageUrl: 'https://picsum.photos/seed/blog-sales/800/400',
    imageHint: 'market stall',
    content: '1. Understand Your Customers: Talk to them and get feedback.\n\n2. Improve Your Customer Service: A happy customer is a repeat customer.\n\n3. Use Social Media: Show off your products online where people are looking.\n\n4. Offer Promotions: A small discount can lead to a big sale.\n\n5. Ask for Reviews: Good reviews build trust with new customers.'
  },
  {
    slug: 'managing-inventory-effectively',
    title: "A Beginner's Guide to Managing Inventory Effectively",
    description: 'Learn the basics of inventory management to reduce waste, save money, and ensure you never run out of your best-selling products.',
    author: 'Aisha Bello',
    date: 'August 10, 2024',
    imageUrl: 'https://picsum.photos/seed/blog-inventory/800/400',
    imageHint: 'warehouse shelves',
    content: "Keeping track of your stock is key. Use a system like First-In, First-Out (FIFO) to sell older stock first. Regularly count your inventory to know what you have. Use tools like Busmo to see what's selling fast and what's not."
  },
  {
    slug: 'understanding-your-business-numbers',
    title: 'Why Understanding Your Business Numbers is Crucial for Growth',
    description: "Profit, revenue, cost of goods sold... These aren't just numbers. They tell the story of your business. Learn how to read them.",
    author: 'Busmo Team',
    date: 'August 1, 2024',
    imageUrl: 'https://picsum.photos/seed/blog-numbers/800/400',
    imageHint: 'calculator notebook',
    content: "Your total sales is your REVENUE. The money you spent to get your products is your COST OF GOODS SOLD. Revenue minus cost of goods gives you your PROFIT. Knowing your profit is the most important number in your business."
  }
];

export const getPostBySlug = (slug: string) => {
  return blogPosts.find(post => post.slug === slug);
};
