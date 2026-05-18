export type TimelineStop = {
  date: string;
  time: string;
  place: string;
  province: string;
  district: string;
  description: string;
  transport?: string;
  duration?: string;
  cost?: string;
  images: string[];
};

export type TripComment = {
  id: string;
  author: string;
  authorInitials: string;
  authorColor: "blue" | "green" | "amber" | "pink" | "teal";
  rating: number;
  text: string;
  timeAgo: string;
  likes: number;
  replies: TripReply[];
};

export type TripReply = {
  id: string;
  author: string;
  authorInitials: string;
  text: string;
  timeAgo: string;
};

export type Trip = {
  slug: string;
  title: string;
  subtitle: string;
  location: string;
  image: string;
  description: string;
  mood: string;
  budget: number;
  readTime: number;
  rating: number;
  ratingCount: number;
  ratingBreakdown: number[];
  tags: string[];
  author: {
    name: string;
    initials: string;
    stories: number;
    likes: number;
    followers: number;
  };
  gallery: string[];
  timeline: TimelineStop[];
  comments: TripComment[];
};

export const mockTrips: Trip[] = [
  {
    slug: "erawan-waterfall",
    title: "หนีร้อนหาน้ำตก 7 ชั้น เอราวัณ ใจดีกว่าที่คิด",
    subtitle: "ทริปวันเดียว (ค้างคืน) กาญจนบุรี ฉบับงบน้อยแต่คุ้ม",
    location: "กาญจนบุรี, ประเทศไทย",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600",
    description:
      "ใครบอกว่าหน้าร้อนต้องอยู่บ้าน วันหยุดยาวครั้งนี้พวกเราตัดสินใจออกเดินทางตีตั๋วไปกาญจนบุรีกันสักที สิ่งแรกที่อยู่ในใจมาตลอดคือน้ำตกเอราวัณที่เคยได้ยินชื่อมาตั้งนานแต่ยังไม่เคยไป จากกรุงเทพฯ นั่งรถทัวร์ประมาณ 3 ชั่วโมงครึ่งก็ถึงตัวเมืองกาญจนบุรี น้ำตกมีทั้งหมด 7 ชั้น แต่ละชั้นมีน้ำสีเขียวมรกตใสจนมองเห็นหิน แนะนำให้ขึ้นไปถึงชั้น 3-4 อย่างน้อย เพราะวิวสวยมากและคนไม่แน่นเท่าชั้นล่าง",
    mood: "สายลุย Adventurous",
    budget: 1800,
    readTime: 5,
    rating: 4.9,
    ratingCount: 128,
    ratingBreakdown: [105, 18, 5, 0, 0],
    tags: ["🌿 ธรรมชาติ", "🏊 เล่นน้ำ", "🚌 เดินทางง่าย", "กาญจนบุรี", "ทริปวันเดียว"],
    author: {
      name: "สมชาย สายเที่ยว",
      initials: "สม",
      stories: 42,
      likes: 1200,
      followers: 318,
    },
    gallery: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200",
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=1200",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200",
    ],
    timeline: [
      {
        date: "10 พ.ค. 2568",
        time: "07:30",
        place: "สถานีหมอชิต",
        province: "กรุงเทพมหานคร",
        district: "พระโขนง",
        description:
          "ออกเดินทางจากกรุงเทพฯ นั่งรถทัวร์สายกาญจนบุรี ราคา 130 บาท ใช้เวลาประมาณ 3.5 ชั่วโมง แนะนำจองตั๋วล่วงหน้าช่วงวันหยุดยาว",
        transport: "รถทัวร์",
        duration: "~3.5 ชม.",
        cost: "130 ฿/คน",
        images: [
          "https://images.unsplash.com/photo-1601556941879-2e98c0c58e6c?q=80&w=900",
          "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=900",
        ],
      },
      {
        date: "10 พ.ค. 2568",
        time: "11:00",
        place: "สะพานข้ามแม่น้ำแคว",
        province: "กาญจนบุรี",
        district: "เมืองกาญจนบุรี",
        description:
          "แวะถ่ายรูปก่อนนะ! สะพานที่โด่งดังระดับโลก บรรยากาศดีมากช่วงเช้า ก่อนแดดจัด แนะนำถ่ายในช่วง 9-11 โมง แสงสวยที่สุด",
        transport: "เดินเที่ยว",
        duration: "~1 ชม.",
        cost: "ฟรี",
        images: [
          "https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=900",
          "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=900",
          "https://images.unsplash.com/photo-1542897644-e34092304050?q=80&w=900",
        ],
      },
      {
        date: "10 พ.ค. 2568",
        time: "13:30",
        place: "ร้านข้าวต้มหมูกาญจนบุรี",
        province: "กาญจนบุรี",
        district: "ท่าม่วง",
        description:
          "ร้านดังริมแม่น้ำ อาหารอร่อย ราคาไม่แพง ข้าวต้มหมูเด็ดมาก! สั่งปลาทับทิมนึ่งมะนาวเพิ่มอีกจานก็คุ้ม ไม่ต้องจอง แต่ต้องรอคิวช่วงเที่ยง",
        transport: "อาหาร",
        duration: "~1 ชม.",
        cost: "~200 ฿/คน",
        images: [
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=900",
          "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=900",
        ],
      },
      {
        date: "11 พ.ค. 2568",
        time: "08:00",
        place: "น้ำตกเอราวัณ ชั้น 1–7",
        province: "กาญจนบุรี",
        district: "ศรีสวัสดิ์",
        description:
          "จุดไฮไลต์ของทริป! น้ำใสสีมรกต เดินขึ้นชั้น 3 สวยที่สุด น้ำเย็นมาก เล่นน้ำได้ ระวังปลากัด 😂 ค่าเข้า 20 ฿ (คนไทย) ควรมาก่อน 9 โมงก่อนคนเยอะ",
        transport: "เดิน/ปีน",
        duration: "~3 ชม.",
        cost: "20 ฿ (ไทย)",
        images: [
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=900",
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900",
          "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=900",
          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=900",
        ],
      },
      {
        date: "11 พ.ค. 2568",
        time: "16:00",
        place: "กลับกรุงเทพฯ",
        province: "กาญจนบุรี",
        district: "เมืองกาญจนบุรี",
        description:
          "นั่งรถสองแถวกลับตัวเมืองกาญจน์ แล้วต่อทัวร์กลับ BKK รอบ 16:30 เผื่อเวลานิดหน่อย เหนื่อยแต่คุ้มมากครับ ถ้าไปครั้งหน้าจะพักค้างอีกคืนแน่นอน",
        transport: "รถทัวร์",
        cost: "130 ฿/คน",
        images: [],
      },
    ],
    comments: [
      {
        id: "c1",
        author: "นภัสสร จันทร์แก้ว",
        authorInitials: "น",
        authorColor: "green",
        rating: 5,
        text: "ไปมาแล้วเมื่ออาทิตย์ก่อน น้ำใสมากจริงๆ ชั้น 3 สวยที่สุดในใจเลย แนะนำไปช่วงเช้าๆ นะคะ คนยังไม่เยอะ",
        timeAgo: "3 ชั่วโมงที่แล้ว",
        likes: 12,
        replies: [
          {
            id: "r1",
            author: "พรชนก",
            authorInitials: "พร",
            text: "ขอบคุณครับ แล้วที่จอดรถมีเยอะไหมครับ?",
            timeAgo: "1 ชั่วโมงที่แล้ว",
          },
          {
            id: "r2",
            author: "นภัสสร จันทร์แก้ว",
            authorInitials: "น",
            text: "มีเยอะค่ะ แต่ถ้าไปช้าคนจะเต็มนะ ลองมาก่อน 9 โมงนะคะ 😊",
            timeAgo: "45 นาทีที่แล้ว",
          },
        ],
      },
      {
        id: "c2",
        author: "กฤษณ์ บุญมา",
        authorInitials: "ก",
        authorColor: "amber",
        rating: 4,
        text: "สวยมากครับ แต่ช่วงวันหยุดคนเยอะมาก ทางเดินแคบ ต้องรอคิวลงน้ำ ถ้าไปวันธรรมดาจะดีกว่า",
        timeAgo: "1 วันที่แล้ว",
        likes: 8,
        replies: [],
      },
      {
        id: "c3",
        author: "มินตรา วงษ์ทอง",
        authorInitials: "ม",
        authorColor: "pink",
        rating: 5,
        text: "พาลูกสาวไปด้วย เดินชั้น 1-3 สนุกมาก เด็กชอบมาก น้ำใสสะอาด เจ้าหน้าที่ดูแลดีนะคะ มีห้องน้ำสะอาด",
        timeAgo: "3 วันที่แล้ว",
        likes: 24,
        replies: [],
      },
    ],
  },

  {
    slug: "mountain-cafe",
    title: "คาเฟ่ริมเขา เชียงใหม่ สายหมอกยามเช้า",
    subtitle: "Weekend trip บรรยากาศชิลล์ กาแฟดีและวิวดีที่สุดในชีวิต",
    location: "เชียงใหม่, ประเทศไทย",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1600",
    description:
      "ไม่ได้วางแผนมาก่อน แค่อยากหนีจากกรุงเทพฯ สักวันสองวัน เพื่อนแนะนำคาเฟ่บนดอยแม่ริม วิวดีมาก กาแฟอร่อย อากาศเย็นสบาย ไม่ผิดหวังเลยสักนิด",
    mood: "Cafe Hopping",
    budget: 3500,
    readTime: 4,
    rating: 4.7,
    ratingCount: 86,
    ratingBreakdown: [70, 12, 4, 0, 0],
    tags: ["☕ คาเฟ่", "🏔️ วิวดอย", "📸 ถ่ายรูป", "เชียงใหม่", "Weekend Trip"],
    author: {
      name: "สมชาย สายเที่ยว",
      initials: "สม",
      stories: 42,
      likes: 1200,
      followers: 318,
    },
    gallery: [
      "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200",
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1200",
    ],
    timeline: [
      {
        date: "17 พ.ค. 2568",
        time: "06:00",
        place: "สนามบินสุวรรณภูมิ",
        province: "กรุงเทพมหานคร",
        district: "ลาดกระบัง",
        description: "บินไปเชียงใหม่ เที่ยวบินเช้าตรู่ ราคาถูกที่สุด จองล่วงหน้า 2 อาทิตย์ได้ตั๋ว 990 บาท",
        transport: "เครื่องบิน",
        duration: "1.15 ชม.",
        cost: "990 ฿",
        images: [
          "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=900",
        ],
      },
      {
        date: "17 พ.ค. 2568",
        time: "09:30",
        place: "คาเฟ่ดอยแม่ริม",
        province: "เชียงใหม่",
        district: "แม่ริม",
        description:
          "คาเฟ่วิวภูเขา หมอกเช้ายังอยู่ ถ่ายรูปสวยมาก กาแฟดริปถ้วยละ 80 บาท นั่งได้ทั้งวัน เจ้าของใจดีมาก",
        transport: "รถเช่า",
        duration: "~3 ชม.",
        cost: "80-150 ฿/แก้ว",
        images: [
          "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=900",
          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=900",
          "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=900",
        ],
      },
      {
        date: "17 พ.ค. 2568",
        time: "14:00",
        place: "ถนนคนเดินเชียงใหม่",
        province: "เชียงใหม่",
        district: "เมืองเชียงใหม่",
        description: "กินข้าวซอยอร่อย เดินเที่ยวถนนคนเดิน ซื้อของฝาก ราคาถูกมาก",
        transport: "เดิน",
        duration: "~2 ชม.",
        cost: "~300 ฿",
        images: [
          "https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=900",
        ],
      },
    ],
    comments: [
      {
        id: "c1",
        author: "วิชญา ดอกไม้",
        authorInitials: "วิ",
        authorColor: "teal",
        rating: 5,
        text: "คาเฟ่นี้วิวดีมากเลยค่ะ ไปมาสองครั้งแล้ว ครั้งหน้าจะพาแม่ไปด้วย",
        timeAgo: "2 วันที่แล้ว",
        likes: 15,
        replies: [],
      },
    ],
  },
];
