const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");

function createBrochurePDF() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  let y = 15;

  // Colors
  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [79, 70, 229]; // Indigo 600
  const emeraldColor = [16, 185, 129]; // Emerald 500
  const textColor = [51, 65, 85]; // Slate 700
  const lightBg = [248, 250, 252]; // Slate 50

  function addHeader(title) {
    doc.setFillColor(...accentColor);
    doc.rect(0, 0, pageWidth, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("ACHIVOX AI — OFFICIAL PLATFORM GUIDE & PROSPECTUS", 10, 8);
    doc.text("www.achivox.online", pageWidth - 45, 8);
  }

  function addFooter(pageNum) {
    doc.setDrawColor(226, 232, 240);
    doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Achivox Academic Copilot © 2026 | All Rights Reserved", 10, pageHeight - 6);
    doc.text(`Page ${pageNum} of 2`, pageWidth - 25, pageHeight - 6);
  }

  // ------------------- PAGE 1 -------------------
  addHeader();

  // Banner Box
  y = 20;
  doc.setFillColor(...primaryColor);
  doc.roundedRect(10, y, pageWidth - 20, 32, 4, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ACHIVOX AI ACADEMIC PLATFORM", 16, y + 12);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(165, 180, 252);
  doc.text("Complete Feature Guide, Student Benefit Blueprint & Subscription Prospectus", 16, y + 20);
  doc.text("Targeted for CBSE, State Boards, ICSE, JEE, NEET & Competitive Exam Aspirants", 16, y + 26);

  y += 40;

  // Section 1: Introduction & Vision
  doc.setFillColor(...accentColor);
  doc.rect(10, y, 4, 12, "F");
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("1. PLATFORM OVERVIEW & VISION", 18, y + 9);

  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...textColor);
  const introText = "Achivox AI is an ultra-fast, next-generation AI Study Copilot engineered specifically for Indian students. Built with deep curriculum-mapped neural engines, Achivox delivers instant Topper-grade Smart Notes, dynamic live test simulations, step-by-step doubt resolution, and gamified study rewards—all designed to eliminate exam anxiety and boost student marks by up to 35%.";
  const introLines = doc.splitTextToSize(introText, pageWidth - 20);
  doc.text(introLines, 10, y);

  y += introLines.length * 5 + 6;

  // Section 2: Key Features & Capabilities
  doc.setFillColor(...accentColor);
  doc.rect(10, y, 4, 12, "F");
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("2. COMPREHENSIVE FEATURE BREAKDOWN", 18, y + 9);

  y += 16;

  const features = [
    { title: "📚 AI Smart Notes Generator", desc: "Instant chapter notes with key concepts, formula summaries, dual-language mnemonics (Hindi/English), and interactive diagrams." },
    { title: "📝 AI Mock Test & Exam Engine", desc: "Real-time timed exam simulator with instant marking, negative marking tracking, detailed solution explanations, and wrong-answer analysis." },
    { title: "⚔️ 1v1 Live Battle Quiz Arena", desc: "Gamified multiplayer quiz arena where students challenge peers across India, build daily streaks, earn XP, and climb the national leaderboard." },
    { title: "👑 Topper's PYQ Vault & Handwritten Notes", desc: "Handcrafted 10-year Previous Year Questions with official marking schemes, toppers' answer representations, and expected board questions." },
    { title: "📐 Formula & Constant Vault", desc: "Instant single-click access to all Physics, Chemistry, and Mathematics formulas, derivations, SI units, and key physical constants." },
    { title: "🤖 24/7 AI Doubt Solver (Voice & Text)", desc: "Instant AI tutor that solves complex numericals, equations, and doubts in simple Hinglish with step-by-step clarity." },
    { title: "📅 AI Dynamic Timetable & Study Pods", desc: "Adaptive daily study planner that creates tailored targets based on student weak areas and upcoming exam dates." },
    { title: "🎁 Real Merchandise Coin Rewards", desc: "Earn Achivox Coins for completing study goals and streaks. Redeem coins for real merchandise (T-Shirts, Hoodies, Books, Water Bottles)." }
  ];

  features.forEach((feat) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(10, y, pageWidth - 20, 14, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...accentColor);
    doc.text(feat.title, 14, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...textColor);
    doc.text(feat.desc, 14, y + 10);

    y += 16;
  });

  addFooter(1);

  // ------------------- PAGE 2 -------------------
  doc.addPage();
  addHeader();

  y = 20;

  // Section 3: How Achivox Helps Students Score 95%+
  doc.setFillColor(...accentColor);
  doc.rect(10, y, 4, 12, "F");
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("3. HOW ACHIVOX HELPS STUDENTS EXCEL IN EXAMS", 18, y + 9);

  y += 16;

  const benefits = [
    { head: "🎯 Zero Blind Studying", body: "Identifies weak sub-topics instantly after tests so students focus only on what actually increases marks." },
    { head: "⚡ 10x Speed Learning", body: "Replaces 200-page bulky textbooks with high-yield 2-minute Smart Bullet Notes & mnemonics." },
    { head: "🛡️ Eliminates Exam Fear", body: "Simulated exam timer and real negative marking build supreme confidence before final board exams." },
    { head: "🏆 Gamified Motivation", body: "Daily streaks, battle ranks, and tangible coin merchandise rewards keep students consistently studying every day." }
  ];

  benefits.forEach((b) => {
    doc.setFillColor(238, 242, 255);
    doc.roundedRect(10, y, pageWidth - 20, 13, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...primaryColor);
    doc.text(b.head + " — ", 14, y + 8);

    const headWidth = doc.getTextWidth(b.head + " — ");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);
    doc.text(b.body, 14 + headWidth, y + 8);

    y += 15;
  });

  y += 5;

  // Section 4: Why Upgrade to Pro? (₹399/Year)
  doc.setFillColor(...emeraldColor);
  doc.rect(10, y, 4, 12, "F");
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("4. WHY STUDENTS MUST TAKE ACHIVOX PRO (₹399/YEAR)", 18, y + 9);

  y += 16;

  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(10, y, pageWidth - 20, 22, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105);
  doc.text("⚡ UNBEATABLE VALUE: ₹399/YEAR = ₹1 PER DAY!", 14, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...textColor);
  doc.text("For less than the price of a single photocopy notebook, Achivox Pro unlocks unlimited AI generation, full Topper Notes access, 0ms fast GPU response, and physical merchandise redemptions for a full year.", 14, y + 14);

  y += 28;

  // Section 5: Comparison Table (Free vs Pro)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text("PLAN COMPARISON TABLE", 10, y);

  y += 4;

  // Table Header
  doc.setFillColor(...primaryColor);
  doc.rect(10, y, pageWidth - 20, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("FEATURE", 14, y + 5.5);
  doc.text("FREE TIER", 105, y + 5.5);
  doc.text("ACHIVOX PRO (₹399/YR)", 150, y + 5.5);

  y += 8;

  const tableData = [
    { feature: "AI Smart Notes Generator", free: "2 Notes / day", pro: "UNLIMITED ⚡" },
    { feature: "AI Mock Test & Quiz Simulator", free: "1 Test / day", pro: "UNLIMITED ⚡" },
    { feature: "Topper Handwritten PYQ Notes", free: "Locked", pro: "FULL ACCESS 🔓" },
    { feature: "AI Doubt Solver (Voice & Text)", free: "Limited", pro: "24/7 UNLIMITED 🤖" },
    { feature: "AI Processing Speed", free: "Standard Queue", pro: "0ms Ultra-Fast GPU 🚀" },
    { feature: "Merchandise Coin Redemption", free: "Disabled", pro: "FULL ACCESS 🎁" },
    { feature: "Official Achivox Certificate", free: "Basic", pro: "PRO BADGE & CERTIFICATE 🏆" }
  ];

  tableData.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
    doc.setFillColor(...bg);
    doc.rect(10, y, pageWidth - 20, 7.5, "F");
    doc.setDrawColor(241, 245, 249);
    doc.line(10, y + 7.5, pageWidth - 10, y + 7.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text(row.feature, 14, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(row.free, 105, y + 5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...accentColor);
    doc.text(row.pro, 150, y + 5);

    y += 7.5;
  });

  y += 10;

  // Call to Action Box
  doc.setFillColor(...primaryColor);
  doc.roundedRect(10, y, pageWidth - 20, 26, 4, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("🚀 READY TO SCORE 95%+ IN YOUR EXAMS?", 16, y + 9);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(226, 232, 240);
  doc.text("Visit https://www.achivox.online/subscription to activate your Pro Launch Pass today!", 16, y + 16);
  doc.text("Support Email: ankeshkumar9368@gmail.com | Official Website: www.achivox.online", 16, y + 21);

  addFooter(2);

  const publicPath = path.join(process.cwd(), "public", "Achivox_Platform_Guide_and_Subscription_Brochure.pdf");
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(publicPath, pdfBuffer);
  console.log("PDF generated successfully at:", publicPath);
}

createBrochurePDF();
