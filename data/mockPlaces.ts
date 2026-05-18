export type PlaceCategory =
  | "ธรรมชาติ"
  | "คาเฟ่"
  | "ที่พัก"
  | "แคมปิ้ง"
  | "อาหาร"
  | "วัด / ศาสนสถาน"
  | "ชายหาด"
  | "ตลาด / ช้อปปิ้ง"
  | "กีฬา / ผจญภัย"
  | "พิพิธภัณฑ์ / ประวัติศาสตร์";

export type Place = {
  slug: string;
  title: string;
  titleEn?: string;

  // Location
  province: string;
  district: string;
  address?: string;
  googleMapsUrl?: string;
  lat?: number;
  lng?: number;

  // Legacy (derived)
  location: string;

  // Category & tags
  category: PlaceCategory;
  tags: string[];

  // Media
  image: string;
  gallery: string[];

  // Info
  description: string;
  descriptionShort?: string;
  openHours?: string;
  closedDays?: string;
  entryFee?: string;
  phone?: string;
  website?: string;
  lineId?: string;

  // Business
  owner?: string;
  isVerified?: boolean;

  // Stats
  rating?: number;
  ratingCount?: number;
  bookmarkCount?: number;
};

export const mockPlaces: Place[] = [
  {
    slug: "erawan-waterfall",
    title: "น้ำตกเอราวัณ",
    titleEn: "Erawan Waterfall",

    province: "กาญจนบุรี",
    district: "ศรีสวัสดิ์",
    address: "อุทยานแห่งชาติเอราวัณ ต.ท่ากระดาน อ.ศรีสวัสดิ์ จ.กาญจนบุรี 71170",
    googleMapsUrl: "https://maps.google.com/?q=น้ำตกเอราวัณ",
    lat: 14.3731,
    lng: 99.1439,

    location: "กาญจนบุรี, ประเทศไทย",

    category: "ธรรมชาติ",
    tags: ["น้ำตก", "เล่นน้ำ", "เดินป่า", "ครอบครัว", "วันเดียว"],

    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1600",
    gallery: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200",
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=1200",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200",
    ],

    description:
      "น้ำตกเอราวัณเป็นหนึ่งในน้ำตกที่สวยที่สุดของประเทศไทย ตั้งอยู่ในอุทยานแห่งชาติเอราวัณ จังหวัดกาญจนบุรี มีทั้งหมด 7 ชั้น น้ำสีเขียวมรกตใสจนมองเห็นหิน เหมาะกับการเล่นน้ำและพักผ่อนท่ามกลางธรรมชาติ แนะนำให้ขึ้นไปถึงชั้น 3-4 เป็นอย่างน้อย",
    descriptionShort: "น้ำตก 7 ชั้น น้ำสีมรกต ในอุทยานแห่งชาติเอราวัณ",

    openHours: "08:00 – 16:30",
    closedDays: "เปิดทุกวัน",
    entryFee: "คนไทย 20 ฿ / ต่างชาติ 300 ฿",
    phone: "034-574222",
    website: "https://www.dnp.go.th",

    owner: "กรมอุทยานแห่งชาติ",
    isVerified: true,

    rating: 4.9,
    ratingCount: 2841,
    bookmarkCount: 512,
  },

  {
    slug: "mountain-cafe",
    title: "คาเฟ่ริมเขา",
    titleEn: "Mountain Edge Café",

    province: "เชียงใหม่",
    district: "แม่ริม",
    address: "123 หมู่ 4 ต.แม่แรม อ.แม่ริม จ.เชียงใหม่ 50180",
    googleMapsUrl: "https://maps.google.com/?q=คาเฟ่ริมเขาเชียงใหม่",

    location: "เชียงใหม่, ประเทศไทย",

    category: "คาเฟ่",
    tags: ["กาแฟ", "วิวดอย", "ถ่ายรูป", "คู่รัก", "สายหมอก"],

    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1600",
    gallery: [
      "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200",
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1200",
    ],

    description:
      "คาเฟ่วิวภูเขาสุดชิล บรรยากาศท่ามกลางสายหมอกยามเช้า กาแฟดริปคุณภาพดี นั่งได้ทั้งวัน เหมาะกับการพักผ่อน ถ่ายรูป และชาร์จแบตชีวิต",
    descriptionShort: "คาเฟ่วิวดอย กาแฟดริป สายหมอกยามเช้า",

    openHours: "07:00 – 18:00",
    closedDays: "ไม่มีวันหยุด",
    entryFee: "ฟรี (มีค่าอาหารและเครื่องดื่ม)",
    phone: "0891234567",
    lineId: "@mountaincafe",

    owner: "สมชาย กาแฟดี",
    isVerified: false,

    rating: 4.7,
    ratingCount: 386,
    bookmarkCount: 201,
  },
];
