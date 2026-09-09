import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const DEFAULT_CATEGORIES = [
  'Academic Materials',
  'Accessories',
  'Books',
  'Clothing',
  'Electronics',
  'Furniture',
  'Others',
  'Sports',
  'Stationery',
];

const DEMO_USERS = [
  {
    googleId: 'demo-user-1',
    name: 'Tanvir Ahmed',
    email: 'tanvir.cse@baust.edu.bd',
    role: 'student' as const,
    department: 'CSE',
    studentId: '210101045',
    phone: '01711223344',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  },
  {
    googleId: 'demo-user-2',
    name: 'Farhana Nusrat',
    email: 'farhana.eee@baust.edu.bd',
    role: 'student' as const,
    department: 'EEE',
    studentId: '200201012',
    phone: '01811223355',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
  {
    googleId: 'demo-user-3',
    name: 'Rahim Chowdhury',
    email: 'rahim.me@baust.edu.bd',
    role: 'student' as const,
    department: 'ME',
    studentId: '190301089',
    phone: '01911223366',
    image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
  },
  {
    googleId: 'demo-user-4',
    name: 'Dr. Shahriar Hossain',
    email: 'shahriar@baust.edu.bd',
    role: 'teacher' as const,
    department: 'CSE',
    phone: '01511223377',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
];

const DEMO_PRODUCTS = [
  {
    title: 'Dell Latitude 5490 Laptop',
    categoryName: 'Electronics',
    userEmail: 'tanvir.cse@baust.edu.bd',
    price: 28000,
    condition: 'good' as const,
    transactionType: 'sell' as const,
    description: 'Core i5 8th Gen, 8GB DDR4 RAM, 256GB NVMe SSD, 14-inch Full HD IPS display. Perfect for CSE lab programming, MATLAB, and web development. Battery backup around 3 hours.',
    location: 'BAUST Campus Hall 1',
    contactPreference: 'Call / WhatsApp 01711223344',
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800',
  },
  {
    title: 'HP EliteBook 840 G5',
    categoryName: 'Electronics',
    userEmail: 'farhana.eee@baust.edu.bd',
    price: 32000,
    condition: 'like_new' as const,
    transactionType: 'sell_or_exchange' as const,
    exchangeFor: 'MacBook Air or Gaming Tablet',
    description: 'Intel Core i5 8th Gen, 16GB RAM, 512GB SSD, Bang & Olufsen sound. Super sleek aluminum body, backlight keyboard. Used carefully for EEE simulations.',
    location: 'Academic Building 2',
    contactPreference: 'Message on BAUST Exchange',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
  },
  {
    title: 'Arduino Uno R3 Starter Kit',
    categoryName: 'Electronics',
    userEmail: 'farhana.eee@baust.edu.bd',
    price: 900,
    condition: 'good' as const,
    transactionType: 'sell' as const,
    description: 'Original Arduino Uno R3 board with USB cable, breadboard, jumper wires, sensors (DHT11, Ultrasonic), and LED pack. Ideal for EEE/CSE microcontrollers lab.',
    location: 'EEE Department Lab 3',
    contactPreference: 'WhatsApp 01811223355',
    imageUrl: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800',
  },
  {
    title: 'Scientific Calculator Casio fx-991ES Plus',
    categoryName: 'Academic Materials',
    userEmail: 'tanvir.cse@baust.edu.bd',
    price: 1200,
    condition: 'good' as const,
    transactionType: 'sell' as const,
    description: 'Authentic Casio fx-991ES Plus 2nd Edition. 417 functions, matrix/vector calculations, integration/differentiation. Essential for BAUST term exams.',
    location: 'CSE Department 3rd Floor',
    contactPreference: 'Phone 01711223344',
    imageUrl: 'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48a?w=800',
  },
  {
    title: 'C Programming Absolute Beginner Book (Herbert Schildt)',
    categoryName: 'Books',
    userEmail: 'tanvir.cse@baust.edu.bd',
    price: 350,
    condition: 'good' as const,
    transactionType: 'sell' as const,
    description: 'Teach Yourself C by Herbert Schildt. Excellent condition, no pencil marks. Very helpful for 1st Year 1st Semester C programming course.',
    location: 'Central Library Front',
    contactPreference: 'Message on app',
    imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800',
  },
  {
    title: 'Data Structures & Algorithms in C++ (Mark Allen Weiss)',
    categoryName: 'Books',
    userEmail: 'shahriar@baust.edu.bd',
    price: 500,
    condition: 'like_new' as const,
    transactionType: 'exchange' as const,
    exchangeFor: 'Database System Concepts (Silberschatz)',
    description: 'Standard textbook for CSE 2nd year Data Structures course. Clean pages, hardcover edition.',
    location: 'Faculty Building Room 402',
    contactPreference: 'Email shahriar@baust.edu.bd',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800',
  },
  {
    title: 'Wooden Student Study Table',
    categoryName: 'Furniture',
    userEmail: 'rahim.me@baust.edu.bd',
    price: 2500,
    condition: 'used' as const,
    transactionType: 'sell' as const,
    description: 'Solid wooden study desk with drawer and bookshelf tier. Dimensions 3ft x 2ft. Sturdy, ideal for student mess or hostel room.',
    location: 'Near BAUST Gate 2',
    contactPreference: 'Call 01911223366',
    imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800',
  },
  {
    title: 'Waterproof Laptop Backpack',
    categoryName: 'Accessories',
    userEmail: 'tanvir.cse@baust.edu.bd',
    price: 800,
    condition: 'good' as const,
    transactionType: 'sell' as const,
    description: 'Grey waterproof laptop bag with dedicated 15.6-inch laptop sleeve, power bank USB port, and multi-compartment organizers.',
    location: 'BAUST Canteen Area',
    contactPreference: 'WhatsApp 01711223344',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
  },
  {
    title: 'RGB USB Mechanical Keyboard (Blue Switches)',
    categoryName: 'Electronics',
    userEmail: 'tanvir.cse@baust.edu.bd',
    price: 1800,
    condition: 'like_new' as const,
    transactionType: 'sell' as const,
    description: 'Redragon Kumara K552 RGB mechanical gaming keyboard. Tactile clicky blue switches, detachable braided USB cable. Used for 2 months.',
    location: 'BAUST Campus',
    contactPreference: 'Message on BAUST Exchange',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
  },
  {
    title: 'Nike Size 5 Match Football',
    categoryName: 'Sports',
    userEmail: 'rahim.me@baust.edu.bd',
    price: 1000,
    condition: 'good' as const,
    transactionType: 'sell' as const,
    description: 'Standard size 5 synthetic leather match ball. High air retention butyl bladder. Perfect for inter-department football tournaments.',
    location: 'BAUST Playground',
    contactPreference: 'Call 01911223366',
    imageUrl: 'https://images.unsplash.com/photo-1614632537190-23e4146777db?w=800',
  },
  {
    title: 'White Cotton Chemistry & Physics Lab Coat (Medium)',
    categoryName: 'Clothing',
    userEmail: 'farhana.eee@baust.edu.bd',
    price: 600,
    condition: 'good' as const,
    transactionType: 'sell' as const,
    description: 'Official white lab coat, 100% thick cotton. Size M. Clean, washed, and ironed. Suitable for CSE/EEE/ME 1st year chemistry lab classes.',
    location: 'Academic Building 1',
    contactPreference: 'WhatsApp 01811223355',
    imageUrl: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=800',
  },
  {
    title: 'A4 Notebook Bundle (Pack of 5)',
    categoryName: 'Stationery',
    userEmail: 'tanvir.cse@baust.edu.bd',
    price: 250,
    condition: 'new' as const,
    transactionType: 'give_away' as const,
    description: 'Brand new 120-page ruled A4 notebooks. Giving away for free to any junior student in need of class note pads!',
    location: 'CSE Department Lounge',
    contactPreference: 'Message on app',
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800',
  },
  {
    title: 'Digital Multimeter UNI-T UT33D+',
    categoryName: 'Electronics',
    userEmail: 'farhana.eee@baust.edu.bd',
    price: 1500,
    condition: 'good' as const,
    transactionType: 'sell' as const,
    description: 'Compact digital multimeter for measuring AC/DC voltage, DC current, resistance, and continuity testing with LCD backlight.',
    location: 'EEE Lab 2',
    contactPreference: 'Call 01811223355',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800',
  },
  {
    title: 'Engineering Drawing Tool Kit (Compass & T-Scale)',
    categoryName: 'Academic Materials',
    userEmail: 'rahim.me@baust.edu.bd',
    price: 850,
    condition: 'like_new' as const,
    transactionType: 'sell' as const,
    description: 'Complete engineering drawing set: Mini drafter, T-scale ruler, precision compass set, set squares, and drawing tube.',
    location: 'ME Drawing Lab',
    contactPreference: 'Call 01911223366',
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800',
  },
  {
    title: 'Hostel Single Foam Mattress (4-inch)',
    categoryName: 'Furniture',
    userEmail: 'rahim.me@baust.edu.bd',
    price: 1800,
    condition: 'used' as const,
    transactionType: 'sell' as const,
    description: 'High-density 4-inch single bed mattress with removable fabric cover. Clean condition, used for 1 semester in hostel.',
    location: 'BAUST Boys Hostel',
    contactPreference: 'Call 01911223366',
    imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
  },
];

const DEMO_WANTED = [
  {
    userEmail: 'tanvir.cse@baust.edu.bd',
    categoryName: 'Books',
    title: 'Operating System Concepts (Silberschatz 10th Ed)',
    description: 'Looking for physical textbook for CSE 3rd semester OS course.',
    budget: 450,
  },
  {
    userEmail: 'farhana.eee@baust.edu.bd',
    categoryName: 'Electronics',
    title: 'Oscilloscope Probes & Function Generator Module',
    description: 'Need working 100MHz BNC oscilloscope probe pair for EEE project.',
    budget: 1200,
  },
  {
    userEmail: 'rahim.me@baust.edu.bd',
    categoryName: 'Sports',
    title: 'Badminton Racket (Yonex Muscle Power / Carbonex)',
    description: 'Looking for a lightweight graphite badminton racket in good condition.',
    budget: 1500,
  },
];

async function main() {
  console.log('Seeding BAUST Exchange database...');

  // 1. Categories
  const categoryMap = new Map<string, string>();
  for (const name of DEFAULT_CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name) },
    });
    categoryMap.set(name, cat.id);
  }

  // 2. Users
  const userMap = new Map<string, string>();
  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        department: u.department,
        studentId: u.studentId,
        phone: u.phone,
        image: u.image,
      },
      create: u,
    });
    userMap.set(u.email, user.id);
  }

  // 3. Products/Listings
  for (const p of DEMO_PRODUCTS) {
    const categoryId = categoryMap.get(p.categoryName);
    const userId = userMap.get(p.userEmail);

    if (!categoryId || !userId) continue;

    const existing = await prisma.listing.findFirst({
      where: { title: p.title, userId },
    });

    let listingId = existing?.id;
    if (!existing) {
      const created = await prisma.listing.create({
        data: {
          userId,
          categoryId,
          title: p.title,
          description: p.description,
          price: p.price,
          condition: p.condition,
          transactionType: p.transactionType,
          exchangeFor: p.exchangeFor || null,
          location: p.location,
          contactPreference: p.contactPreference,
          status: 'active',
        },
      });
      listingId = created.id;
    }

    if (listingId) {
      const imgCount = await prisma.listingImage.count({ where: { listingId } });
      if (imgCount === 0) {
        await prisma.listingImage.create({
          data: {
            listingId,
            url: p.imageUrl,
            alt: p.title,
            order: 0,
          },
        });
      }
    }
  }

  // 4. Wanted Items
  for (const w of DEMO_WANTED) {
    const categoryId = categoryMap.get(w.categoryName);
    const userId = userMap.get(w.userEmail);
    if (!categoryId || !userId) continue;

    const existing = await prisma.wantedItem.findFirst({
      where: { title: w.title, userId },
    });

    if (!existing) {
      await prisma.wantedItem.create({
        data: {
          userId,
          categoryId,
          title: w.title,
          description: w.description,
          budget: w.budget,
          status: 'active',
        },
      });
    }
  }

  // 5. System Activity Log
  await prisma.activity.create({
    data: {
      action: 'seed_complete',
      description: 'BAUST Exchange database successfully seeded with realistic products and users.',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
