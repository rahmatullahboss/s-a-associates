export type SiteSettings = {
  // Brand
  companyName: string;
  companyEmail: string;
  companyLogo?: string; // URL
  companyFavicon?: string; // URL
  primaryColor?: string; // Hex code

  // Contact
  companyPhone: string;
  companyAddress?: string;
  whatsappNumber: string;
  facebookUrl: string;

  // Hero
  heroHeadline: string;
  heroSubheadline: string;

  // Profiles (JSON)
  ceoProfile?: {
    name: string;
    photo?: string;
    bio?: string;
    socials?: {
        facebook?: string;
        linkedin?: string;
    }
  };

  // Metrics (JSON)
  metrics?: {
    visaSuccessRate: string; // e.g. "98%"
    universitiesCount: string; // e.g. "500+"
    studentsCount: string; // e.g. "1000+"
  };

  // Content (JSON)
  countries?: Array<{
    code: string; // 'uk', 'usa'
    name: string;
    content: string; // HTML/Markdown
  }>;

  // Booking
  defaultMeetLink?: string;
  slotDuration?: number;       // minutes: 30, 45, 60, 90
  bufferTime?: number;         // minutes between sessions: 0, 15, 30
  maxBookingsPerDay?: number;  // e.g. 8
  advanceBookingDays?: number; // how far ahead students can book, e.g. 14

  // University Logos (JSON)
  universityLogos?: Array<{
    id: string;
    url: string;
    name?: string;
  }>;

  // Tracking & Analytics
  facebookPixelId?: string;       // e.g. "1234567890"
  metaAccessToken?: string;       // CAPI Access Token (server-side)
  metaTestEventCode?: string;     // e.g. "TEST12345" — only for dev/testing
  googleAnalyticsId?: string;     // e.g. "G-XXXXXXXXXX"
  clarityProjectId?: string;      // e.g. "abc123xyz" — Microsoft Clarity
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  companyName: "S&A Associates",
  companyEmail: "contact@s-a-associates.com",
  companyPhone: "+880 1811-975767",
  companyAddress: "72/1 (Anondo Complex), Kochukhet Road, Mirpur-14, Dhaka, Bangladesh",
  companyLogo: "/logo.jpg",
  primaryColor: "#F26522",
  whatsappNumber: "8801811975767",
  facebookUrl: "https://www.facebook.com/share/18BxmokKBC/",
  heroHeadline: "Study Abroad with Absolute Clarity.",
  heroSubheadline:
    "S&A Associates bridges the gap between your ambition and top universities in Malaysia, UK, Australia, New Zealand, and South Korea.",
  defaultMeetLink: '',
};
