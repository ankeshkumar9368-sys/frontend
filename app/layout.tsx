import './globals.css'
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '../components/theme-provider'
import AuthProvider from '../components/AuthProvider'
import CapacitorHandler from '../components/CapacitorHandler'
import PushNotificationManager from '../components/PushNotificationManager'
import GlobalAntiCheat from '../components/GlobalAntiCheat'
import Script from 'next/script'

export const viewport: Viewport = {
  themeColor: '#7A5AF8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

const siteUrl = 'https://achivox.online';
const siteTitle = "Achivox AI - India's #1 Study Partner for Class 9-12 | Topper Notes & AI Doubt Solver";
const siteDescription = "Padho Kam, Score Zyada! Achivox AI is India's leading education platform for Class 9, 10, 11, 12 (CBSE, Bihar Board BSEB, ICSE & State Boards). Get Toppers Handwritten Notes, Instant AI Doubt Solver 24/7, Chapter PYQs, NCERT Solutions & AI Mock Tests 100% Free.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Achivox AI Study Partner"
  },
  description: siteDescription,
  applicationName: "Achivox AI",
  authors: [{ name: "Achivox Education Team", url: siteUrl }],
  generator: "Next.js",
  keywords: [
    // Brand & Taglines
    "Achivox", "Achivox AI", "Achivox Online", "Padho Kam Score Zyada", "Achivox Study App",
    
    // Education & General Study
    "education app", "study app", "online study", "free study material", "online coaching app", 
    "school study app", "college study app", "best study app for Indian students", "AI study partner",
    "education website India", "study notes PDF", "free topper notes",
    
    // Class-specific
    "Class 9 study notes", "Class 10 topper notes", "Class 11 study material", "Class 12 board notes",
    "Class 10 CBSE notes", "Class 12 Bihar Board notes", "Class 10 BSEB topper notes", "Class 12 ICSE study app",
    
    // Subjects & NCERT
    "Physics topper notes", "Chemistry smart notes", "Biology handwritten notes", "Maths formula cheat sheet",
    "Science Class 10 notes PDF", "Social Science Class 10 revision", "NCERT Solutions Class 9 to 12",
    
    // Board Exams & State Boards
    "CBSE Board Exam 2026", "Bihar Board Matric Exam 2026", "BSEB Inter Result Topper Notes",
    "UP Board Exam Class 10 12", "ICSE Board Revision Notes", "All State Boards Study App",
    
    // Features & AI Tools
    "AI Doubt Solver India", "Instant Doubt Solving App", "AI Mock Test Online", "Previous Year Questions PYQ",
    "Chapterwise MCQ Test", "Study Planner App", "Exam Revision Notes PDF", "Topper Handwritten Notes Download"
  ],
  category: "education",
  classification: "Educational Technology / AI Study App",
  creator: "Achivox AI Technologies",
  publisher: "Achivox AI Technologies",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    siteName: "Achivox AI",
    images: [
      {
        url: `${siteUrl}/achivox-logo.png`,
        width: 1200,
        height: 630,
        alt: "Achivox AI - India's #1 Study Partner for Class 9-12",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [`${siteUrl}/achivox-logo.png`],
    creator: "@AchivoxAI",
  },
  appleWebApp: {
    capable: true,
    title: "Achivox AI",
    statusBarStyle: "black-translucent",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/achivox-logo.png' },
      { url: '/achivox-logo.png', sizes: '192x192', type: 'image/png' }
    ],
    apple: [
      { url: '/achivox-logo.png' }
    ],
  },
  other: {
    'google-site-verification': 'google-site-verification-achivox-seo',
    'rating': 'General',
    'distribution': 'Global',
    'revisit-after': '1 days'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Structured Data (JSON-LD) for Google Rich Snippets & Sitelinks
  const jsonLdData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${siteUrl}/#organization`,
        "name": "Achivox AI",
        "url": siteUrl,
        "logo": `${siteUrl}/achivox-logo.png`,
        "sameAs": [
          "https://www.youtube.com/@achivox",
          "https://t.me/achivox"
        ],
        "description": "India's premier AI-powered educational platform providing Class 9-12 students with Toppers Handwritten Notes, AI Doubt Solving, PYQs and Mock Tests."
      },
      {
        "@type": "EducationalApplication",
        "@id": `${siteUrl}/#app`,
        "name": "Achivox AI - Study Partner",
        "operatingSystem": "Web, Android",
        "applicationCategory": "EducationalApplication",
        "educationalUse": "Study Notes, Board Exam Preparation, AI Doubt Solving, Mock Tests",
        "audience": {
          "@type": "EducationalAudience",
          "educationalRole": "student"
        },
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR",
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": "Achivox AI",
        "description": siteDescription,
        "publisher": {
          "@id": `${siteUrl}/#organization`
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${siteUrl}/explore?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is Achivox AI?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Achivox AI is India's leading AI-powered educational app for Class 9th to 12th students preparing for CBSE, Bihar Board (BSEB), ICSE, and State Board exams."
            }
          },
          {
            "@type": "Question",
            "name": "Is Achivox AI free for students?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Achivox AI offers 100% Free Starter access including AI Smart Notes, AI Doubt Solving, Chapter Revision, and Mock Tests."
            }
          },
          {
            "@type": "Question",
            "name": "Which board exams are supported on Achivox AI?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Achivox AI provides specialized syllabus content for CBSE Class 9-12, Bihar Board (BSEB Matric & Inter), ICSE, UP Board, and all Indian State Boards."
            }
          },
          {
            "@type": "Question",
            "name": "How does the AI Doubt Solver work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Students can type or upload any conceptual doubt from Physics, Chemistry, Biology, Mathematics, or History to receive instant, step-by-step explanations powered by Gemini 2.5 Flash AI."
            }
          }
        ]
      }
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script 
          src="https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js" 
          strategy="beforeInteractive"
        />
        {/* Google Rich Snippets JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="bg-slate-200 h-[100dvh] overflow-hidden flex items-center justify-center select-none">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalAntiCheat />
          <CapacitorHandler />
          <PushNotificationManager />
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
