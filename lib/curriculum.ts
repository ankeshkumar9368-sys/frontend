// ============================================================
// 🇮🇳 FULL INDIAN SCHOOL CURRICULUM DATABASE
// All Major Boards | Class 9-12 | Real Syllabus
// ============================================================

export const INDIAN_BOARDS = [
  "CBSE",
  "ICSE",
  "NIOS",
  "BSEB (Bihar Board)",
  "UP Board",
  "HBSE (Haryana Board)",
  "PSEB (Punjab Board)",
  "RBSE (Rajasthan Board)",
  "JKBOSE (J&K Board)",
  "HPBOSE (HP Board)",
  "UBSE (Uttarakhand Board)",
  "WBBSE (West Bengal Board)",
  "CHSE Odisha",
  "SEBA (Assam Board)",
  "MSBSHSE (Maharashtra Board)",
  "GSEB (Gujarat Board)",
  "GBSHSE (Goa Board)",
  "KSEAB (Karnataka Board)",
  "Tamil Nadu Board",
  "BSEAP (Andhra Pradesh Board)",
  "TSBIE (Telangana Board)",
  "Kerala Board (SCERT)"
];

export const CLASSES = ["Class 9", "Class 10", "Class 11", "Class 12"];

// ─── SUBJECTS BY CLASS (Fallback) ────────────────────────────
export const SUBJECTS_BY_CLASS: Record<string, string[]> = {
  "Class 9":  ["Mathematics", "Science", "Social Science", "English", "Hindi", "Sanskrit"],
  "Class 10": ["Mathematics", "Science", "Social Science", "English", "Hindi", "Sanskrit", "Information Technology"],
  "Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Computer Science", "Economics", "History", "Geography", "Political Science", "Physical Education", "Accountancy", "Business Studies"],
  "Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Computer Science", "Economics", "History", "Geography", "Political Science", "Physical Education", "Accountancy", "Business Studies"]
};

// ─── SUBJECTS BY BOARD + CLASS (Board-specific) ──────────────
export const SUBJECTS_BY_BOARD_CLASS: Record<string, string[]> = {
  // CBSE
  "CBSE_Class 9":  ["Mathematics", "Science", "Social Science", "English", "Hindi A", "Hindi B", "Sanskrit", "Information Technology", "Artificial Intelligence"],
  "CBSE_Class 10": ["Mathematics (Standard)", "Mathematics (Basic)", "Science", "Social Science", "English", "Hindi A", "Hindi B", "Sanskrit", "Information Technology", "Artificial Intelligence"],
  "CBSE_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "English Core", "Computer Science", "Informatics Practices", "Economics", "History", "Geography", "Political Science", "Physical Education", "Accountancy", "Business Studies", "Psychology", "Sociology"],
  "CBSE_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "English Core", "Computer Science", "Informatics Practices", "Economics", "History", "Geography", "Political Science", "Physical Education", "Accountancy", "Business Studies", "Psychology", "Sociology"],
  // ICSE
  "ICSE_Class 9":  ["English", "Hindi", "Mathematics", "Physics", "Chemistry", "Biology", "History & Civics", "Geography", "Computer Applications", "Economic Applications"],
  "ICSE_Class 10": ["English", "Hindi", "Mathematics", "Physics", "Chemistry", "Biology", "History & Civics", "Geography", "Computer Applications", "Economic Applications", "Environmental Science"],
  "ICSE_Class 11": ["English", "Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "Economics", "Commerce", "Accounts", "History", "Geography", "Sociology", "Psychology"],
  "ICSE_Class 12": ["English", "Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "Economics", "Commerce", "Accounts", "History", "Geography", "Sociology", "Psychology"],
  // NIOS
  "NIOS_Class 10": ["Mathematics", "Science & Technology", "Social Science", "English", "Hindi", "Economics", "Business Studies", "Data Entry Operations"],
  "NIOS_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Hindi", "Economics", "Accountancy", "Business Studies", "Computer Science", "Home Science", "Psychology"],
  // UP Board
  "UP Board_Class 9":  ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit", "Home Science", "Drawing"],
  "UP Board_Class 10": ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit", "Home Science", "Computer"],
  "UP Board_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "Hindi", "English", "Economics", "History", "Geography", "Civics", "Sociology", "Accountancy", "Business Organisation", "Sanskrit"],
  "UP Board_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Hindi", "English", "Economics", "History", "Geography", "Civics", "Sociology", "Accountancy", "Business Organisation", "Sanskrit"],
  // BSEB
  "BSEB (Bihar Board)_Class 9":  ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit", "Urdu", "Maithili", "Home Science", "Music"],
  "BSEB (Bihar Board)_Class 10": ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit", "Urdu", "Maithili", "Home Science", "Music", "Non-Hindi (Ahnidi)"],
  "BSEB (Bihar Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Hindi", "Urdu", "Sanskrit", "History", "Political Science", "Geography", "Economics", "Psychology", "Sociology", "Home Science", "Philosophy", "Accountancy", "Business Studies", "Entrepreneurship"],
  "BSEB (Bihar Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Hindi", "Urdu", "Sanskrit", "History", "Political Science", "Geography", "Economics", "Psychology", "Sociology", "Home Science", "Philosophy", "Accountancy", "Business Studies", "Entrepreneurship"],
  // HBSE
  "HBSE (Haryana Board)_Class 9":  ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit", "Computer Science", "Home Science"],
  "HBSE (Haryana Board)_Class 10": ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit", "Computer Science", "Home Science"],
  "HBSE (Haryana Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "Hindi", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Computer Science", "Physical Education"],
  "HBSE (Haryana Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Hindi", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Computer Science", "Physical Education"],
  // PSEB
  "PSEB (Punjab Board)_Class 9":  ["Mathematics", "Science", "Social Science", "Punjabi", "Hindi", "English", "Computer Science"],
  "PSEB (Punjab Board)_Class 10": ["Mathematics", "Science", "Social Science", "Punjabi", "Hindi", "English", "Computer Science", "Home Science"],
  "PSEB (Punjab Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "Punjabi", "English", "Economics", "History", "Geography", "Accountancy", "Business Studies", "Computer Science", "Physical Education"],
  "PSEB (Punjab Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Punjabi", "English", "Economics", "History", "Geography", "Accountancy", "Business Studies", "Computer Science", "Physical Education"],
  // RBSE
  "RBSE (Rajasthan Board)_Class 9":  ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit"],
  "RBSE (Rajasthan Board)_Class 10": ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit", "Computer Science"],
  "RBSE (Rajasthan Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "Hindi", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Sanskrit", "Physical Education"],
  "RBSE (Rajasthan Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Hindi", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Sanskrit", "Physical Education"],
  // JKBOSE
  "JKBOSE (J&K Board)_Class 9":  ["Mathematics", "Science", "Social Science", "English", "Urdu", "Hindi"],
  "JKBOSE (J&K Board)_Class 10": ["Mathematics", "Science", "Social Science", "English", "Urdu", "Hindi", "Computer Science"],
  "JKBOSE (J&K Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Urdu", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Computer Science"],
  "JKBOSE (J&K Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Urdu", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Computer Science"],
  // HPBOSE
  "HPBOSE (HP Board)_Class 9":  ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit"],
  "HPBOSE (HP Board)_Class 10": ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit", "Computer Science"],
  "HPBOSE (HP Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "Hindi", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Computer Science"],
  "HPBOSE (HP Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Hindi", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Computer Science"],
  // UBSE
  "UBSE (Uttarakhand Board)_Class 9":  ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit"],
  "UBSE (Uttarakhand Board)_Class 10": ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit", "Computer Science"],
  "UBSE (Uttarakhand Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "Hindi", "English", "Economics", "History", "Geography", "Accountancy", "Business Studies"],
  "UBSE (Uttarakhand Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Hindi", "English", "Economics", "History", "Geography", "Accountancy", "Business Studies"],
  // WBBSE
  "WBBSE (West Bengal Board)_Class 9":  ["Mathematics", "Life Science", "Physical Science", "History", "Geography", "Bengali", "English", "Computer Application"],
  "WBBSE (West Bengal Board)_Class 10": ["Mathematics", "Life Science", "Physical Science", "History", "Geography", "Bengali", "English", "Computer Application"],
  "WBBSE (West Bengal Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Biological Science", "Bengali", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Computer Science", "Nutrition"],
  "WBBSE (West Bengal Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Biological Science", "Bengali", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Computer Science", "Nutrition"],
  // CHSE Odisha
  "CHSE Odisha_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "Odia", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Computer Science", "Sanskrit"],
  "CHSE Odisha_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Odia", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Computer Science", "Sanskrit"],
  // SEBA
  "SEBA (Assam Board)_Class 9":  ["Mathematics", "General Science", "Social Science", "Assamese", "English", "Hindi", "Alternative English"],
  "SEBA (Assam Board)_Class 10": ["Mathematics", "General Science", "Social Science", "Assamese", "English", "Hindi", "Alternative English", "Computer Science"],
  "SEBA (Assam Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "Assamese", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Computer Science"],
  "SEBA (Assam Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Assamese", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Computer Science"],
  // MSBSHSE
  "MSBSHSE (Maharashtra Board)_Class 9":  ["Mathematics Part 1", "Mathematics Part 2", "Science & Technology", "Social Science", "Marathi", "English", "Hindi", "Sanskrit"],
  "MSBSHSE (Maharashtra Board)_Class 10": ["Mathematics Part 1", "Mathematics Part 2", "Science & Technology Part 1", "Science & Technology Part 2", "History", "Geography", "Political Science", "Marathi", "English", "Hindi"],
  "MSBSHSE (Maharashtra Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "Marathi", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Organisation of Commerce", "Computer Science", "Secretarial Practice"],
  "MSBSHSE (Maharashtra Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Marathi", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Organisation of Commerce", "Computer Science", "Secretarial Practice"],
  // GSEB
  "GSEB (Gujarat Board)_Class 9":  ["Mathematics", "Science & Technology", "Social Science", "Gujarati", "English", "Hindi", "Sanskrit", "Computer Education"],
  "GSEB (Gujarat Board)_Class 10": ["Mathematics", "Science & Technology", "Social Science", "Gujarati", "English", "Hindi", "Sanskrit", "Computer Education"],
  "GSEB (Gujarat Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "Gujarati", "English", "Economics", "History", "Geography", "Accountancy", "Business Administration", "Statistics", "Computer Science"],
  "GSEB (Gujarat Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Gujarati", "English", "Economics", "History", "Geography", "Accountancy", "Business Administration", "Statistics", "Computer Science"],
  // GBSHSE
  "GBSHSE (Goa Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Economics", "History", "Geography", "Accountancy", "Business Studies", "Computer Science", "Psychology"],
  "GBSHSE (Goa Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Economics", "History", "Geography", "Accountancy", "Business Studies", "Computer Science", "Psychology"],
  // KSEAB
  "KSEAB (Karnataka Board)_Class 9":  ["Mathematics", "Science", "Social Science", "Kannada", "English", "Hindi", "Sanskrit"],
  "KSEAB (Karnataka Board)_Class 10": ["Mathematics", "Science", "Social Science", "Kannada", "English", "Hindi", "Sanskrit", "Computer Science"],
  "KSEAB (Karnataka Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "Kannada", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Computer Science", "Statistics"],
  "KSEAB (Karnataka Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Kannada", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Computer Science", "Statistics"],
  // Tamil Nadu Board
  "Tamil Nadu Board_Class 9":  ["Mathematics", "Science", "Social Science", "Tamil", "English", "French", "Computer Science"],
  "Tamil Nadu Board_Class 10": ["Mathematics", "Science", "Social Science", "Tamil", "English", "French", "Computer Applications"],
  "Tamil Nadu Board_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "Tamil", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Commerce", "Computer Science", "Statistics", "Nutrition"],
  "Tamil Nadu Board_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Tamil", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Commerce", "Computer Science", "Statistics", "Nutrition"],
  // BSEAP
  "BSEAP (Andhra Pradesh Board)_Class 9":  ["Mathematics", "Science", "Social Studies", "Telugu", "English", "Hindi", "Sanskrit"],
  "BSEAP (Andhra Pradesh Board)_Class 10": ["Mathematics", "Science", "Social Studies", "Telugu", "English", "Hindi", "Sanskrit", "Computer Applications"],
  "BSEAP (Andhra Pradesh Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Botany", "Zoology", "Telugu", "English", "Economics", "History", "Geography", "Civics", "Commerce", "Computer Science"],
  "BSEAP (Andhra Pradesh Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Botany", "Zoology", "Telugu", "English", "Economics", "History", "Geography", "Civics", "Commerce", "Computer Science"],
  // TSBIE
  "TSBIE (Telangana Board)_Class 11": ["Physics", "Chemistry", "Mathematics", "Botany", "Zoology", "Telugu", "English", "Economics", "History", "Commerce", "Civics", "Computer Science", "Statistics"],
  "TSBIE (Telangana Board)_Class 12": ["Physics", "Chemistry", "Mathematics", "Botany", "Zoology", "Telugu", "English", "Economics", "History", "Commerce", "Civics", "Computer Science", "Statistics"],
  // Kerala Board
  "Kerala Board (SCERT)_Class 9":  ["Mathematics", "Science", "Social Science", "Malayalam", "English", "Hindi", "Sanskrit", "IT"],
  "Kerala Board (SCERT)_Class 10": ["Mathematics", "Science", "Social Science", "Malayalam", "English", "Hindi", "Sanskrit", "IT"],
  "Kerala Board (SCERT)_Class 11": ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "Malayalam", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Statistics", "Sociology"],
  "Kerala Board (SCERT)_Class 12": ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "Malayalam", "English", "Economics", "History", "Geography", "Political Science", "Accountancy", "Business Studies", "Statistics", "Sociology"],
};

// ─── CHAPTERS BY SUBJECT + CLASS ────────────────────────────
export const CHAPTERS: Record<string, string[]> = {

  // ═══ CLASS 9 ════════════════════════════════════════
  "Mathematics_Class 9": [
    "Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations in Two Variables",
    "Introduction to Euclid's Geometry", "Lines and Angles", "Triangles", "Quadrilaterals",
    "Circles", "Heron's Formula", "Surface Areas and Volumes", "Statistics", "Probability"
  ],
  "Science_Class 9": [
    "Matter in Our Surroundings", "Is Matter Around Us Pure", "Atoms and Molecules",
    "Structure of the Atom", "The Fundamental Unit of Life", "Tissues", "Motion",
    "Force and Laws of Motion", "Gravitation", "Work and Energy", "Sound",
    "Why Do We Fall Ill", "Natural Resources", "Improvement in Food Resources"
  ],
  "Social Science_Class 9": [
    "The French Revolution", "Socialism in Europe and the Russian Revolution", "Nazism and the Rise of Hitler",
    "Forest Society and Colonialism", "Pastoralists in the Modern World",
    "India - Size and Location", "Physical Features of India", "Drainage", "Climate",
    "Natural Vegetation and Wildlife", "What is Democracy", "Electoral Politics",
    "Poverty as a Challenge", "Food Security in India"
  ],

  // ═══ CLASS 10 ════════════════════════════════════════
  "Mathematics_Class 10": [
    "Real Numbers", "Polynomials", "Pair of Linear Equations", "Quadratic Equations",
    "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Introduction to Trigonometry",
    "Applications of Trigonometry", "Circles", "Areas Related to Circles",
    "Surface Areas and Volumes", "Statistics", "Probability"
  ],
  "Science_Class 10": [
    "Chemical Reactions and Equations", "Acids Bases and Salts", "Metals and Non-metals",
    "Carbon and its Compounds", "Life Processes", "Control and Coordination",
    "How do Organisms Reproduce", "Heredity and Evolution",
    "Light - Reflection and Refraction", "Human Eye and Colourful World",
    "Electricity", "Magnetic Effects of Electric Current",
    "Our Environment", "Management of Natural Resources"
  ],
  "Social Science_Class 10": [
    "The Rise of Nationalism in Europe", "Nationalism in India", "The Making of a Global World",
    "The Age of Industrialisation", "Print Culture and the Modern World",
    "Resources and Development", "Water Resources", "Agriculture",
    "Minerals and Energy Resources", "Manufacturing Industries", "Lifelines of National Economy",
    "Power Sharing", "Federalism", "Gender Religion and Caste",
    "Political Parties", "Outcomes of Democracy",
    "Development", "Sectors of Indian Economy", "Money and Credit",
    "Globalisation and the Indian Economy", "Consumer Rights"
  ],

  // ═══ CLASS 11 ════════════════════════════════════════
  "Physics_Class 11": [
    "Physical World", "Units and Measurements", "Motion in a Straight Line",
    "Motion in a Plane", "Laws of Motion", "Work Energy and Power",
    "System of Particles and Rotational Motion", "Gravitation",
    "Mechanical Properties of Solids", "Mechanical Properties of Fluids",
    "Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory",
    "Oscillations", "Waves"
  ],
  "Chemistry_Class 11": [
    "Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements",
    "Chemical Bonding and Molecular Structure", "States of Matter",
    "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen",
    "The s-Block Elements", "The p-Block Elements", "Organic Chemistry - Basic Principles",
    "Hydrocarbons", "Environmental Chemistry"
  ],
  "Mathematics_Class 11": [
    "Sets", "Relations and Functions", "Trigonometric Functions", "Complex Numbers",
    "Linear Inequalities", "Permutations and Combinations", "Binomial Theorem",
    "Sequences and Series", "Straight Lines", "Conic Sections",
    "Introduction to 3D Geometry", "Limits and Derivatives", "Statistics", "Probability"
  ],
  "Biology_Class 11": [
    "The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom",
    "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Structural Organisation in Animals",
    "Cell - Unit of Life", "Biomolecules", "Cell Cycle and Division",
    "Transport in Plants", "Mineral Nutrition", "Photosynthesis",
    "Respiration in Plants", "Plant Growth and Development",
    "Digestion and Absorption", "Breathing and Exchange of Gases",
    "Body Fluids and Circulation", "Excretory Products and Elimination",
    "Locomotion and Movement", "Neural Control and Coordination", "Chemical Coordination"
  ],

  // ═══ CLASS 12 ════════════════════════════════════════
  "Physics_Class 12": [
    "Electric Charges and Fields", "Electrostatic Potential and Capacitance",
    "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter",
    "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves",
    "Ray Optics and Optical Instruments", "Wave Optics",
    "Dual Nature of Radiation and Matter", "Atoms", "Nuclei", "Semiconductor Electronics"
  ],
  "Chemistry_Class 12": [
    "Solutions", "Electrochemistry", "Chemical Kinetics", "The d and f Block Elements",
    "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols Phenols and Ethers",
    "Aldehydes Ketones and Carboxylic Acids", "Amines", "Biomolecules", "Polymers",
    "Chemistry in Everyday Life"
  ],
  "Mathematics_Class 12": [
    "Relations and Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants",
    "Continuity and Differentiability", "Application of Derivatives", "Integrals",
    "Application of Integrals", "Differential Equations", "Vector Algebra",
    "Three Dimensional Geometry", "Linear Programming", "Probability"
  ],
  "Biology_Class 12": [
    "Sexual Reproduction in Flowering Plants", "Human Reproduction",
    "Reproductive Health", "Principles of Inheritance and Variation",
    "Molecular Basis of Inheritance", "Evolution", "Human Health and Disease",
    "Microbes in Human Welfare", "Biotechnology Principles and Processes",
    "Biotechnology and its Applications", "Organisms and Populations",
    "Ecosystem", "Biodiversity and Conservation", "Environmental Issues"
  ],
  "Computer Science_Class 12": [
    "Python Revision Tour", "Functions", "File Handling", "Data Structures - Stack",
    "Data Structures - Queue", "Database Concepts", "SQL", "Computer Networks",
    "Society Law and Ethics"
  ],
  "Economics_Class 12": [
    "Introduction to Macroeconomics", "National Income Accounting", "Money and Banking",
    "Determination of Income and Employment", "Government Budget and Economy",
    "Balance of Payments", "Introduction to Microeconomics",
    "Consumer's Equilibrium", "Theory of Production", "Theory of Cost",
    "Revenue and Forms of Market", "Price Determination"
  ],
  "Accountancy_Class 12": [
    "Accounting for Not-for-Profit Organisations", "Accounting for Partnership Firms",
    "Reconstitution of Partnership - Admission", "Reconstitution of Partnership - Retirement",
    "Dissolution of Partnership", "Accounting for Share Capital",
    "Issue and Redemption of Debentures", "Financial Statements of Companies",
    "Analysis of Financial Statements", "Cash Flow Statement"
  ],
  "Business Studies_Class 12": [
    "Nature and Significance of Management", "Principles of Management",
    "Business Environment", "Planning", "Organising", "Staffing",
    "Directing", "Controlling", "Financial Management",
    "Financial Markets", "Marketing Management", "Consumer Protection"
  ],
  "History_Class 12": [
    "Bricks Beads and Bones (Harappan Civilisation)", "Kings Farmers and Towns",
    "Kinship Caste and Class", "Thinkers Beliefs and Buildings",
    "Through the Eyes of Travellers", "Bhakti Sufi Traditions",
    "An Imperial Capital Vijayanagara", "Peasants Zamindars and the State",
    "Kings and Chronicles", "Colonialism and the Countryside",
    "Rebels and the Raj 1857", "Colonial Cities", "Mahatma Gandhi and the Nationalist Movement",
    "Understanding Partition", "Framing the Constitution"
  ],
  "Geography_Class 12": [
    "Human Geography Nature and Scope", "The World Population Distribution",
    "Human Development", "Primary Activities", "Secondary Activities",
    "Tertiary and Quaternary Activities", "Transport and Communication",
    "International Trade", "Population Distribution in India",
    "Migration in India", "Human Development in India",
    "Land Resources and Agriculture", "Water Resources", "Mineral and Energy Resources",
    "Manufacturing Industries", "Planning and Sustainable Development",
    "Transport and Communication in India", "International Trade of India",
    "Geographical Perspective on Selected Issues"
  ],

  // ═══ CLASS 11 (MISSING COMMERCE/HUMANITIES) ══════════════
  "Economics_Class 11": [
    "Statistics for Economics - Introduction", "Collection Organisation and Presentation of Data",
    "Statistical Tools and Interpretation", "Indian Economy on the Eve of Independence",
    "Indian Economy 1950-1990", "Liberalisation Privatisation and Globalisation",
    "Current Challenges facing Indian Economy", "Development Experience of India - A Comparison"
  ],
  "Business Studies_Class 11": [
    "Evolution and Fundamentals of Business", "Forms of Business Organisations",
    "Public Private and Global Enterprises", "Business Services", "Emerging Modes of Business",
    "Social Responsibility and Business Ethics", "Sources of Business Finance",
    "Small Business and Enterprises", "Internal Trade", "International Business"
  ],
  "Accountancy_Class 11": [
    "Introduction to Accounting", "Theory Base of Accounting", "Recording of Business Transactions",
    "Bank Reconciliation Statement", "Depreciation Provisions and Reserves",
    "Trial Balance and Rectification of Errors", "Financial Statements of Sole Proprietorship",
    "Accounting for Bill of Exchange", "Accounts from Incomplete Records"
  ],
  "History_Class 11": [
    "From the Beginning of Time", "Writing and City Life", "An Empire Across Three Continents",
    "The Central Islamic Lands", "Nomadic Empires", "The Three Orders",
    "Changing Cultural Traditions", "Confrontation of Cultures", "The Industrial Revolution",
    "Paths to Modernisation"
  ],
  "Geography_Class 11": [
    "Geography as a Discipline", "The Origin and Evolution of the Earth", "Interior of the Earth",
    "Distribution of Oceans and Continents", "Geomorphic Processes", "Landforms and their Evolution",
    "Composition and Structure of Atmosphere", "Solar Radiation Heat Balance and Temperature",
    "Atmospheric Circulation and Weather Systems", "World Climate and Climate Change",
    "Water - Oceans", "Movements of Ocean Water", "Life on the Earth",
    "India - Location", "Structure and Physiography", "Drainage System", "Climate",
    "Natural Vegetation", "Soils", "Natural Hazards and Disasters"
  ],

  "Political Science_Class 12": [
    "The End of Bipolarity", "New Centres of Power", "Contemporary South Asia",
    "United Nations and its Organisations", "Security in Contemporary World",
    "Environment and Natural Resources", "Globalisation", "Challenges of Nation Building",
    "Era of One-party Dominance", "Politics of Planned Development",
    "India's External Relations", "Parties and the Party Systems in India",
    "Democratic Resurgence", "Regional Aspirations", "Recent Developments in Indian Politics"
  ],

  "Political Science_Class 11": [
    "Constitution: Why and How?", "Rights in the Indian Constitution", "Election and Representation",
    "Executive", "Legislature", "Judiciary", "Federalism", "Local Governments",
    "Political Theory: An Introduction", "Freedom", "Equality", "Social Justice",
    "Rights", "Citizenship", "Nationalism", "Secularism"
  ],
  "Informatics Practices_Class 11": [
    "Introduction to Computer System", "Introduction to Python", "Data Handling using NumPy",
    "Database concepts and the Structured Query Language", "Introduction to the Emerging Trends"
  ],
  "Psychology_Class 11": [
    "What is Psychology?", "Methods of Enquiry in Psychology", "The Bases of Human Behaviour",
    "Human Development", "Sensory Attentional and Perceptual Processes",
    "Learning", "Human Memory", "Thinking", "Motivation and Emotion"
  ],
  "Sociology_Class 11": [
    "Sociology and Society", "Terms Concepts and their use in Sociology", "Understanding Social Institutions",
    "Culture and Socialisation", "Doing Sociology: Research Methods", "Social Structure Stratification and Processes in Society",
    "Social Change and Social Order in Rural and Urban Society", "Environment and Society",
    "Introducing Western Sociologists", "Indian Sociologists"
  ],
  "Informatics Practices_Class 12": [
    "Data Handling using Pandas - I", "Data Visualization using Matplotlib",
    "Database Query using SQL", "Introduction to Computer Networks", "Societal Impacts"
  ],

  "Physical Education_Class 12": [
    "Management of Sporting Events", "Children & Women in Sports", "Yoga as Preventive measure for Lifestyle Disease",
    "Physical Education & Sports for CWSN", "Sports & Nutrition", "Test & Measurement in Sports",
    "Physiology & Injuries in Sports", "Biomechanics & Sports", "Psychology & Sports", "Training in Sports"
  ],
  "Psychology_Class 12": [
    "Variations in Psychological Attributes", "Self and Personality", "Meeting Life Challenges",
    "Psychological Disorders", "Therapeutic Approaches", "Attitude and Social Cognition",
    "Social Influence and Group Processes"
  ],
  "Sociology_Class 12": [
    "Demographic Structure of Indian Society", "Social Institutions Continuity and Change",
    "The Market as a Social Institution", "Patterns of Social Inequality and Exclusion",
    "The Challenges of Cultural Diversity", "Structural Change", "Cultural Change",
    "The Story of Indian Democracy", "Change and Development in Rural Society",
    "Change and Development in Industrial Society", "Globalization and Social Change",
    "Mass Media and Communications", "Social Movements"
  ],
  "Physical Education_Class 11": [
    "Changing Trends & Career in Physical Education", "Olympic Value Education", "Physical Fitness, Wellness & Lifestyle",
    "Physical Education & Sports for CWSN", "Yoga", "Physical Activity & Leadership Training",
    "Test, Measurement & Evaluation", "Fundamentals of Anatomy, Physiology & Kinesiology in Sports",
    "Psychology & Sports", "Training and Doping in Sports"
  ]
};

// ─── TOPICS BY CHAPTER ──────────────────────────────────────
export const TOPICS: Record<string, string[]> = {
  "Semiconductor Electronics_Physics_Class 12": [
    "Semiconductors", "p-n Junction Diode", "Rectifiers", "Transistors", "Logic Gates", "Integrated Circuits"
  ],

  // PHYSICS CLASS 11
  "Units and Measurements_Physics_Class 11": ["Physical Quantities", "SI Units", "Dimensional Analysis", "Errors in Measurement"],
  "Motion in a Straight Line_Physics_Class 11": ["Distance and Displacement", "Speed and Velocity", "Acceleration", "Kinematic Equations"],
  "Laws of Motion_Physics_Class 11": ["Newton's Laws", "Inertia", "Friction", "Circular Motion"],
  "Gravitation_Physics_Class 11": ["Universal Law", "Acceleration due to Gravity", "Gravitational Potential", "Escape Velocity", "Kepler's Laws"],

  // CHEMISTRY CLASS 12
  "Solutions_Chemistry_Class 12": [
    "Types of Solutions", "Concentration Expressions", "Vapour Pressure",
    "Colligative Properties", "Osmosis", "Abnormal Molar Masses"
  ],
  "Electrochemistry_Chemistry_Class 12": [
    "Electrochemical Cells", "EMF of Cell", "Nernst Equation", "Conductance",
    "Kohlrausch Law", "Faraday's Laws of Electrolysis", "Batteries and Fuel Cells"
  ],
  "Chemical Kinetics_Chemistry_Class 12": [
    "Rate of Reaction", "Rate Law", "Order and Molecularity", "Integrated Rate Equations",
    "Half Life", "Activation Energy", "Arrhenius Equation"
  ],
  "Coordination Compounds_Chemistry_Class 12": [
    "Werner's Theory", "Nomenclature", "Isomerism in Coordination", "Crystal Field Theory",
    "Stability of Complexes", "Organometallic Compounds"
  ],
  "Alcohols Phenols and Ethers_Chemistry_Class 12": ["Classification", "Nomenclature", "Preparation of Alcohols", "Reactions of Phenols", "Ethers"],

  // CHEMISTRY CLASS 11
  "Some Basic Concepts of Chemistry_Chemistry_Class 11": ["Laws of Chemical Combination", "Dalton's Atomic Theory", "Mole Concept", "Stoichiometry"],
  "Structure of Atom_Chemistry_Class 11": ["Subatomic Particles", "Bohr's Model", "Quantum Mechanical Model", "Electronic Configuration"],
  "Chemical Bonding and Molecular Structure_Chemistry_Class 11": ["Valence Bond Theory", "VSEPR Theory", "Hybridisation", "Molecular Orbital Theory"],
  "Thermodynamics_Chemistry_Class 11": ["Internal Energy", "Enthalpy", "Entropy", "Gibbs Free Energy"],

  // MATHEMATICS CLASS 12
  "Relations and Functions_Mathematics_Class 12": [
    "Types of Relations", "Types of Functions", "Composition of Functions",
    "Invertible Functions", "Binary Operations"
  ],
  "Matrices_Mathematics_Class 12": ["Order of Matrix", "Types of Matrices", "Operations on Matrices", "Transpose of Matrix", "Invertible Matrices"],
  "Determinants_Mathematics_Class 12": ["Properties of Determinants", "Adjoint and Inverse of Matrix", "System of Linear Equations", "Area of Triangle"],
  "Continuity and Differentiability_Mathematics_Class 12": [
    "Continuity", "Differentiability", "Chain Rule", "Derivatives of Implicit Functions",
    "Logarithmic Differentiation", "Parametric Differentiation", "Second Order Derivatives", "Rolle's and Mean Value Theorem"
  ],
  "Application of Derivatives_Mathematics_Class 12": [
    "Rate of Change", "Increasing and Decreasing Functions", "Tangents and Normals",
    "Approximations", "Maxima and Minima"
  ],
  "Integrals_Mathematics_Class 12": [
    "Integration by Substitution", "Integration by Parts", "Partial Fractions",
    "Integration of Special Functions", "Definite Integrals", "Properties of Definite Integrals"
  ],
  "Vector Algebra_Mathematics_Class 12": [
    "Vectors and Scalars", "Addition of Vectors", "Dot Product", "Cross Product",
    "Scalar Triple Product"
  ],
  "Three Dimensional Geometry_Mathematics_Class 12": [
    "Direction Cosines", "Equation of Line in Space", "Angle Between Lines",
    "Equation of Plane", "Distance of Point from Plane", "Angle Between Line and Plane"
  ],
  "Probability_Mathematics_Class 12": [
    "Conditional Probability", "Multiplication Theorem", "Independent Events",
    "Bayes' Theorem", "Random Variables", "Binomial Distribution"
  ],

  // MATHEMATICS CLASS 11
  "Sets_Mathematics_Class 11": ["Types of Sets", "Venn Diagrams", "Set Operations", "Universal Set"],
  "Trigonometric Functions_Mathematics_Class 11": ["Angles and Radians", "Trigonometric Ratios", "Sum and Difference Formulas", "Trigonometric Equations"],
  "Permutations and Combinations_Mathematics_Class 11": ["Fundamental Principle", "Factorial", "Permutations Formula", "Combinations Formula"],
  "Limits and Derivatives_Mathematics_Class 11": ["Concept of Limits", "Limit of Trigonometric Functions", "Derivatives from First Principle", "Rules of Differentiation"],

  // BIOLOGY CLASS 12
  "Sexual Reproduction in Flowering Plants_Biology_Class 12": ["Flower Structure", "Pollination", "Double Fertilisation", "Seed and Fruit Development"],
  "Human Reproduction_Biology_Class 12": ["Male System", "Female System", "Gametogenesis", "Menstrual Cycle", "Implantation"],
  "Principles of Inheritance and Variation_Biology_Class 12": [
    "Mendel's Laws", "Monohybrid Cross", "Dihybrid Cross", "Linkage and Recombination",
    "Sex Determination", "Mutation", "Genetic Disorders"
  ],
  "Molecular Basis of Inheritance_Biology_Class 12": [
    "DNA Structure", "DNA Replication", "Transcription", "Translation",
    "Lac Operon", "Human Genome Project", "DNA Fingerprinting"
  ],
  "Human Health and Disease_Biology_Class 12": [
    "Innate and Acquired Immunity", "Active and Passive Immunity", "Vaccination",
    "Common Diseases", "AIDS", "Cancer", "Drugs and Alcohol Abuse"
  ],

  // BIOLOGY CLASS 11
  "Cell - Unit of Life_Biology_Class 11": ["Cell Theory", "Prokaryotic Cell", "Eukaryotic Cell", "Cell Organelles"],
  "Biomolecules_Biology_Class 11": ["Carbohydrates", "Proteins", "Lipids", "Nucleic Acids", "Enzymes"],
  "Photosynthesis_Biology_Class 11": ["Light Reaction", "Dark Reaction (Calvin Cycle)", "Factors affecting Photosynthesis"],

  // SCIENCE CLASS 10
  "Chemical Reactions and Equations_Science_Class 10": [
    "Types of Chemical Reactions", "Combination Reaction", "Decomposition Reaction",
    "Displacement Reactions", "Oxidation and Reduction", "Balancing Equations"
  ],
  "Acids Bases and Salts_Science_Class 10": ["Indicators", "pH Scale", "Salts Properties", "Washing Soda", "Baking Soda", "Plaster of Paris"],
  "Metals and Non-metals_Science_Class 10": ["Physical Properties", "Chemical Properties", "Reactivity Series", "Extraction of Metals", "Corrosion"],
  "Life Processes_Science_Class 10": [
    "Nutrition in Plants", "Nutrition in Animals", "Respiration", "Transportation in Plants",
    "Transportation in Humans", "Excretion"
  ],
  "Light - Reflection and Refraction_Science_Class 10": [
    "Laws of Reflection", "Spherical Mirrors", "Mirror Formula", "Refraction of Light",
    "Refractive Index", "Lens Formula", "Power of Lens"
  ],
  "Electricity_Science_Class 10": [
    "Electric Current", "Ohm's Law", "Resistance", "Series and Parallel Circuits",
    "Heating Effect", "Electric Power"
  ],
  "Magnetic Effects of Electric Current_Science_Class 10": ["Magnetic Field Lines", "Right Hand Rule", "Electric Motor", "Electromagnetic Induction", "Generator"],

  // MATHEMATICS CLASS 10
  "Real Numbers_Mathematics_Class 10": [
    "Fundamental Theorem of Arithmetic", "Irrational Numbers", "Decimal Expansions"
  ],
  "Polynomials_Mathematics_Class 10": ["Zeroes of Polynomial", "Relationship between Zeroes and Coefficients", "Division Algorithm"],
  "Pair of Linear Equations_Mathematics_Class 10": ["Graphical Method", "Substitution Method", "Elimination Method", "Word Problems"],
  "Quadratic Equations_Mathematics_Class 10": [
    "Standard Form", "Factorisation Method", "Quadratic Formula",
    "Nature of Roots", "Word Problems"
  ],
  "Arithmetic Progressions_Mathematics_Class 10": ["General Term (an)", "Sum of n Terms (Sn)", "Finding AP from conditions", "Word Problems"],

  "Triangles_Mathematics_Class 10": [
    "Similar Triangles", "Basic Proportionality Theorem", "Criteria for Similarity",
    "Areas of Similar Triangles", "Pythagoras Theorem"
  ],
  "Introduction to Trigonometry_Mathematics_Class 10": [
    "Trigonometric Ratios", "Trigonometric Identities", "Ratios of Standard Angles",
    "Complementary Angles"
  ],
  "Applications of Trigonometry_Mathematics_Class 10": ["Angle of Elevation", "Angle of Depression", "Heights and Distances"],
  "Statistics_Mathematics_Class 10": ["Mean", "Median", "Mode", "Cumulative Frequency"],
  "Probability_Mathematics_Class 10": ["Classical Probability", "Sample Space", "Complementary Events"],

  // SCIENCE CLASS 9
  "Matter in Our Surroundings_Science_Class 9": ["States of Matter", "Evaporation", "Latent Heat", "Sublimation"],
  "Motion_Science_Class 9": [
    "Distance and Displacement", "Speed Velocity and Acceleration",
    "Equations of Motion", "Uniform and Non-uniform Motion", "Graphical Representation"
  ],
  "Force and Laws of Motion_Science_Class 9": [
    "Newton's First Law", "Inertia", "Newton's Second Law", "Newton's Third Law",
    "Law of Conservation of Momentum"
  ],
  "Gravitation_Science_Class 9": ["Universal Law", "Free Fall", "Weight vs Mass", "Pressure and Buoyancy"],
  "Atoms and Molecules_Science_Class 9": [
    "Laws of Chemical Combination", "Dalton's Atomic Theory", "Atomic Mass",
    "Molecules and Moles", "Molar Mass"
  ],

  // MATHEMATICS CLASS 9
  "Number Systems_Mathematics_Class 9": ["Rational and Irrational Numbers", "Real Numbers on Number Line", "Laws of Exponents"],
  "Polynomials_Mathematics_Class 9": ["Zeroes of Polynomial", "Remainder Theorem", "Factor Theorem", "Algebraic Identities"],
  "Lines and Angles_Mathematics_Class 9": ["Parallel Lines and Transversal", "Angle Sum Property", "Exterior Angle Theorem"],
  "Quadrilaterals_Mathematics_Class 9": ["Properties of Parallelogram", "Mid-point Theorem", "Types of Quadrilaterals"],

  // SOCIAL SCIENCE CLASS 10
  "The Rise of Nationalism in Europe_Social Science_Class 10": ["French Revolution", "The Age of Revolutions", "Unification of Italy and Germany", "Nationalism and Imperialism"],
  "Nationalism in India_Social Science_Class 10": ["First World War", "Non-Cooperation Movement", "Civil Disobedience", "The Sense of Collective Belonging"],
  "Resources and Development_Social Science_Class 10": ["Types of Resources", "Development of Resources", "Land Resources", "Soil as a Resource"],
  "Power Sharing_Social Science_Class 10": ["Belgium and Sri Lanka", "Forms of Power Sharing", "Why Power Sharing is Desirable"],

  // SOCIAL SCIENCE CLASS 9
  "The French Revolution_Social Science_Class 9": ["Society in Late 18th Century", "The Outbreak of Revolution", "France Becomes a Republic", "The Reign of Terror"],
  "India - Size and Location_Social Science_Class 9": ["Location and Size", "India and the World", "India's Neighbours"],
  "What is Democracy_Social Science_Class 9": ["Definition of Democracy", "Features of Democracy", "Why Democracy", "Broader Meaning"],

  // ECONOMICS CLASS 12
  "National Income Accounting_Economics_Class 12": ["Circular Flow of Income", "Methods of Calculating GDP", "Real vs Nominal GDP"],
  "Money and Banking_Economics_Class 12": ["Functions of Money", "Control of Money Supply", "Commercial vs Central Bank"],
  "Government Budget and Economy_Economics_Class 12": ["Objectives of Budget", "Classification of Receipts", "Classification of Expenditure", "Types of Deficit"],

  // BUSINESS STUDIES CLASS 12
  "Nature and Significance of Management_Business Studies_Class 12": ["Characteristics", "Objectives", "Levels of Management", "Coordination"],
  "Principles of Management_Business Studies_Class 12": ["Fayol's Principles", "Taylor's Scientific Management", "Nature of Principles"],
  "Marketing Management_Business Studies_Class 12": ["Marketing Mix", "Product Price Place Promotion", "Sales Promotion"],

  // ACCOUNTANCY CLASS 12
  "Accounting for Partnership Firms_Accountancy_Class 12": ["Partnership Deed", "P&L Appropriation Account", "Interest on Capital", "Goodwill Valuation"],
  "Financial Statements of Companies_Accountancy_Class 12": ["Balance Sheet", "Statement of P&L", "Cash Flow Analysis"],

  // HISTORY CLASS 12
  "Bricks Beads and Bones (Harappan Civilisation)_History_Class 12": ["Town Planning", "Agriculture and Trade", "Art and Script", "End of Civilisation", "Harappan Script", "Burials", "Ancient Authority"],
  "Mahatma Gandhi and the Nationalist Movement_History_Class 12": ["Salt March", "Quit India Movement", "Non-Cooperation", "Gandhi's Role", "Gandhi in South Africa"],

  // GEOGRAPHY CLASS 12
  "Human Geography Nature and Scope_Geography_Class 12": ["Determinism vs Possibilism", "Fields of Human Geography", "Welfare Perspective", "Environmental Determinism", "Neodeterminism"],
  "The World Population Distribution_Geography_Class 12": ["Density and Growth", "Demographic Transition", "Factors affecting Population"],
  "Land Resources and Agriculture_Geography_Class 12": ["Land Use Pattern", "Cropping Seasons", "Major Crops in India", "Food Security"],

  // COMPUTER SCIENCE CLASS 12
  "Functions_Computer Science_Class 12": ["User Defined Functions", "Scope of Variables", "Passing Parameters", "Return Statement", "Default Parameters", "Recursion Concepts"],
  "File Handling_Computer Science_Class 12": ["Text Files", "Binary Files", "CSV Files", "Read and Write Operations", "Exception Handling"],
  "SQL_Computer Science_Class 12": ["DDL and DML Commands", "Aggregate Functions", "Joins", "Group By and Having"],






  "Coordinate Geometry_Mathematics_Class 10": ["Distance Formula", "Section Formula", "Midpoint Formula", "Area of Triangle"],
  "Circles_Mathematics_Class 10": ["Tangent to Circle", "Number of Tangents", "Length of Tangent", "Theorems on Tangents"],




  // ── CHEMISTRY CLASS 12 ──
  "The d and f Block Elements_Chemistry_Class 12": ["Transition Elements", "Electronic Configuration", "Oxidation States", "Lanthanides", "Actinides", "Comparison of Properties"],
  "Haloalkanes and Haloarenes_Chemistry_Class 12": ["Classification", "Nomenclature", "Preparation Methods", "Chemical Reactions", "Nucleophilic Substitution"],
  "Aldehydes Ketones and Carboxylic Acids_Chemistry_Class 12": ["Preparation of Aldehydes", "Nucleophilic Addition", "Aldol Condensation", "Carboxylic Acid Reactions"],
  "Amines_Chemistry_Class 12": ["Classification", "Basicity of Amines", "Preparation", "Diazonium Salts", "Reactions"],
  "Biomolecules_Chemistry_Class 12": ["Carbohydrates", "Proteins", "Enzymes", "Vitamins", "Nucleic Acids"],


  // ── BIOLOGY CLASS 12 ──
  "Evolution_Biology_Class 12": ["Origin of Life", "Darwin's Theory", "Natural Selection", "Hardy-Weinberg Principle", "Evidences of Evolution"],
  "Biotechnology Principles and Processes_Biology_Class 12": ["Recombinant DNA Technology", "Restriction Enzymes", "Cloning Vectors", "PCR", "Gel Electrophoresis"],
  "Ecosystem_Biology_Class 12": ["Components of Ecosystem", "Food Chain and Web", "Energy Flow", "Ecological Pyramids", "Nutrient Cycling"],


  // ── SCIENCE CLASS 10 (REMAINING) ──
  "Carbon and its Compounds_Science_Class 10": ["Bonding in Carbon", "Hydrocarbons", "Functional Groups", "Nomenclature", "Chemical Reactions", "Soaps and Detergents"],
  "Control and Coordination_Science_Class 10": ["Nervous System", "Neuron Structure", "Reflex Action", "Human Brain", "Hormones in Animals", "Plant Hormones"],
  "Heredity and Evolution_Science_Class 10": ["Mendel's Experiments", "Heredity", "Sex Determination", "Evolution", "Speciation", "Human Evolution"],


  // ── SCIENCE CLASS 9 (REMAINING) ──
  "Structure of the Atom_Science_Class 9": ["Thomson Model", "Rutherford Model", "Bohr Model", "Shells and Sub-shells", "Valence Electrons"],
  "Work and Energy_Science_Class 9": ["Work Done", "Kinetic Energy", "Potential Energy", "Conservation of Energy", "Power"],
  "Sound_Science_Class 9": ["Production of Sound", "Propagation", "Characteristics", "Reflection of Sound", "Echo", "SONAR", "Human Ear"],


  // ── PHYSICS CLASS 11 ──
  "Motion in a Plane_Physics_Class 11": ["Vectors", "Projectile Motion", "Circular Motion", "Relative Velocity"],
  "Thermodynamics_Physics_Class 11": ["Zeroth Law", "First Law", "Second Law", "Heat Engines", "Carnot Engine", "Entropy"],
  "Waves_Physics_Class 11": ["Types of Waves", "Speed of Wave", "Superposition", "Standing Waves", "Beats", "Doppler Effect"],


  // ── CHEMISTRY CLASS 11 ──
  "Equilibrium_Chemistry_Class 11": ["Law of Mass Action", "Kc and Kp", "Le Chatelier's Principle", "Ionic Equilibrium", "pH and Buffer"],


  // ── MATHEMATICS CLASS 11 ──
  "Binomial Theorem_Mathematics_Class 11": ["Binomial Expansion", "General Term", "Middle Term", "Coefficient of Terms"],
  "Sequences and Series_Mathematics_Class 11": ["AP", "GP", "HP", "AM GM Relation", "Sum of Special Series"],
  "Conic Sections_Mathematics_Class 11": ["Circle", "Parabola", "Ellipse", "Hyperbola", "Standard Equations"],


  // ── ECONOMICS CLASS 12 ──
  "Determination of Income and Employment_Economics_Class 12": ["Aggregate Demand", "Aggregate Supply", "Consumption Function", "Investment Multiplier", "Equilibrium"],

  "Consumer's Equilibrium_Economics_Class 12": ["Utility", "Marginal Utility", "Law of Diminishing MU", "Budget Line", "Indifference Curve"],
  "Theory of Production_Economics_Class 12": ["Production Function", "Total Average Marginal Product", "Returns to Factor", "Returns to Scale"],
  "Theory of Cost_Economics_Class 12": ["Fixed and Variable Cost", "Total Average Marginal Cost", "Short Run Costs", "Long Run Costs"],

  // ── BIOLOGY CLASS 11 (EXTENDED) ──
  "The Living World_Biology_Class 11": ["What is Living", "Taxonomy & Systematics", "Taxonomic Categories", "Taxonomical Aids"],
  "Biological Classification_Biology_Class 11": ["Five Kingdom Classification", "Kingdom Monera", "Kingdom Protista", "Kingdom Fungi", "Viruses Viroids & Lichens"],
  "Plant Kingdom_Biology_Class 11": ["Algae", "Bryophytes", "Pteridophytes", "Gymnosperms", "Angiosperms", "Plant Life Cycles"],
  "Animal Kingdom_Biology_Class 11": ["Basis of Classification", "Phylum Porifera to Echinodermata", "Phylum Chordata", "Class Mammalia"],
  "Digestion and Absorption_Biology_Class 11": ["Digestive System", "Digestion of Food", "Absorption of Digested Products", "Disorders of Digestive System"],
  "Breathing and Exchange of Gases_Biology_Class 11": ["Respiratory Organs", "Mechanism of Breathing", "Exchange of Gases", "Transport of Gases", "Regulation of Respiration"],
  "Body Fluids and Circulation_Biology_Class 11": ["Blood", "Lymph", "Circulatory Pathways", "Double Circulation", "Regulation of Cardiac Activity"],
  "Excretory Products and Elimination_Biology_Class 11": ["Human Excretory System", "Urine Formation", "Function of Tubules", "Counter Current Mechanism", "Dialysis"],
  "Locomotion and Movement_Biology_Class 11": ["Types of Movement", "Muscle Structure", "Mechanism of Muscle Contraction", "Skeletal System", "Joints"],
  "Neural Control and Coordination_Biology_Class 11": ["Neuron", "Central Nervous System", "Reflex Action", "Sensory Reception (Eye & Ear)"],
  "Chemical Coordination_Biology_Class 11": ["Endocrine Glands", "Hormones of Heart Kidney & GI Tract", "Mechanism of Hormone Action"],

  "Accounting for Share Capital_Accountancy_Class 12": ["Issue of Shares", "Forfeiture of Shares", "Re-issue of Shares", "Balance Sheet Presentation", "Preference vs Equity"],
  "Cash Flow Statement_Accountancy_Class 12": ["Operating Activities", "Investing Activities", "Financing Activities", "Cash & Cash Equivalents"],


  // ── BUSINESS STUDIES CLASS 12 (EXTENDED) ──
  "Planning_Business Studies_Class 12": ["Process of Planning", "Types of Plans", "Importance & Limitations"],
  "Organising_Business Studies_Class 12": ["Organisational Structure", "Delegation", "Decentralisation", "Formal & Informal Organisation"],
  "Staffing_Business Studies_Class 12": ["Recruitment Process", "Selection Process", "Training & Development"],
  "Directing_Business Studies_Class 12": ["Motivation Theories", "Leadership Styles", "Communication Process", "Supervision"],
  "Financial Management_Business Studies_Class 12": ["Investment Decisions", "Financing Decisions", "Dividend Decisions", "Working Capital"],

  // ── SOCIAL SCIENCE CLASS 10 (HISTORY) ──
  "The Age of Industrialisation_Social Science_Class 10": ["Before the Industrial Revolution", "Hand Labour and Steam Power", "Industrialisation in the Colonies", "Factories Come Up"],
  "Print Culture and the Modern World_Social Science_Class 10": ["The First Printed Books", "Print Comes to Europe", "The Print Revolution", "India and the World of Print"],

  // ── SOCIAL SCIENCE CLASS 9 (GEOGRAPHY) ──
  "Physical Features of India_Social Science_Class 9": ["The Himalayan Mountains", "The Northern Plains", "The Peninsular Plateau", "The Indian Desert", "The Coastal Plains", "The Islands"],
  "Climate_Social Science_Class 9": ["Concept of Climate", "Climatic Controls", "Factors affecting India's Climate", "The Indian Monsoon", "Distribution of Rainfall"],

  // ── PHYSICS CLASS 12 (ADDITIONAL) ──
  "Magnetism and Matter_Physics_Class 12": ["Bar Magnet", "Gauss's Law in Magnetism", "Earth's Magnetic Field", "Paramagnetic & Diamagnetic"],
  "Electromagnetic Waves_Physics_Class 12": ["Displacement Current", "EM Spectrum", "Properties of EM Waves"],
  "Wave Optics_Physics_Class 12": ["Huygens Principle", "Interference", "Young's Double Slit Experiment", "Diffraction", "Polarisation"],

  // ── CHEMISTRY CLASS 12 (ADDITIONAL) ──
  "Polymers_Chemistry_Class 12": ["Classification", "Addition Polymerisation", "Condensation Polymerisation", "Natural & Synthetic Rubber", "Biodegradable Polymers"],
  "Chemistry in Everyday Life_Chemistry_Class 12": ["Drugs & Classification", "Therapeutic Action", "Chemicals in Food", "Cleansing Agents"],

  // ── SOCIAL SCIENCE CLASS 10 (CIVICS & ECONOMICS) ──
  "Federalism_Social Science_Class 10": ["What is Federalism", "What Makes India a Federal Country", "Decentralisation in India"],
  "Sectors of Indian Economy_Social Science_Class 10": ["Primary Secondary & Tertiary", "Comparing Sectors", "Division of Sectors", "Public & Private Sector"],


  "Data Handling using Pandas - I_Informatics Practices_Class 12": ["Series Operations", "DataFrame Creation", "Slicing & Selection", "Pivot Tables"],
  "Database Query using SQL_Informatics Practices_Class 12": ["Aggregate Functions", "Grouping Data", "Joins", "Ordering & Filtering"],

  // ── ECONOMICS (CLASS 11 & 12) ──
  "Statistics for Economics - Introduction_Economics_Class 11": ["Meaning of Economics", "Nature of Statistics", "Scope of Statistics", "Importance in Economics", "Data Collection Basics"],
  "Indian Economy on the Eve of Independence_Economics_Class 11": ["Colonial Rule", "Agricultural Sector", "Industrial Sector", "Foreign Trade", "Demographic Condition"],
  "Introduction to Macroeconomics_Economics_Class 12": ["Meaning of Macroeconomics", "Circular Flow of Income", "Basic Concepts of Income", "GDP vs GNP"],

  // ── BUSINESS STUDIES & ACCOUNTANCY (CLASS 11 & 12) ──
  "Forms of Business Organisations_Business Studies_Class 11": ["Sole Proprietorship", "Joint Hindu Family", "Partnership", "Cooperative Societies", "Joint Stock Company"],
  "Introduction to Accounting_Accountancy_Class 11": ["Objectives of Accounting", "Basic Accounting Terms", "Users of Accounting Info", "Qualitative Characteristics", "GAAP & Standards"],



  "The End of Bipolarity_Political Science_Class 12": ["Soviet System", "Gorbachev & Disintegration", "Shock Therapy", "Consequences"],
  "Variations in Psychological Attributes_Psychology_Class 12": ["Intelligence Theories", "Aptitude vs Interest", "Creativity", "Emotional Intelligence"],
  "Demographic Structure of Indian Society_Sociology_Class 12": ["Theories of Population", "Malthusian Theory", "Demographic Transition", "Common Concepts"],
  "Management of Sporting Events_Physical Education_Class 12": ["Tournaments (Knockout/League)", "Committees & Responsibilities", "Fixtures", "Intramural & Extramural"],

  // ── INFORMATICS PRACTICES, PSYCHOLOGY & SOCIOLOGY (ADDITIONAL) ──
  "Data Visualization using Matplotlib_Informatics Practices_Class 12": ["Line Plot", "Bar Chart", "Histogram", "Customizing Plots"],
  "Psychological Disorders_Psychology_Class 12": ["Anxiety Disorders", "Somatic Symptom Disorders", "Dissociative Disorders", "Depression & Bipolar"],
  "Patterns of Social Inequality and Exclusion_Sociology_Class 12": ["Caste System", "Tribal Communities", "Gender Inequality", "Disability & Exclusion"],

  // ── FOUNDATIONAL HUMANITIES (CLASS 11) ──
  "Writing and City Life_History_Class 11": ["Mesopotamia and its Geography", "The Significance of Urbanism", "Movement of Goods into Cities", "The Development of Writing"],
  "Constitution: Why and How?_Political Science_Class 11": ["The Functions of a Constitution", "The Authority of a Constitution", "How was the Indian Constitution Made?", "Provisions Borrowed from Other Constitutions"],
  "Interior of the Earth_Geography_Class 11": ["Sources of Information", "Earthquake Waves", "Structure of the Earth", "Volcanoes and Volcanic Landforms"],
  "What is Psychology?_Psychology_Class 11": ["Psychology as a Discipline", "Psychology as a Natural Science", "Psychology as a Social Science", "Evolution of Psychology"],

  // ── COMMERCE CLASS 11 (EXTENDED) ──
  "Evolution and Fundamentals of Business_Business Studies_Class 11": ["History of Trade", "Nature and Purpose of Business", "Business Risks"],

};

// ─── SUBTOPICS BY TOPIC ─────────────────────────────────────
export const SUBTOPICS: Record<string, string[]> = {

  // PHYSICS 12
  "Electric Charge_Electric Charges and Fields": ["Types of charge (positive/negative)", "Properties of electric charge", "Conservation of charge", "Quantization of charge (q = ne)"],
  "Coulomb's Law_Electric Charges and Fields": ["Force between two point charges", "Vector form of Coulomb's law", "Superposition principle", "Permittivity of medium"],
  "Electric Field_Electric Charges and Fields": ["Definition of electric field", "Electric field due to point charge", "Electric field lines and properties", "Uniform electric field"],
  "Electric Flux_Electric Charges and Fields": ["Concept of electric flux", "Flux through a closed surface", "Area vector"],
  "Gauss's Law_Electric Charges and Fields": ["Statement of Gauss's theorem", "Electric field due to infinite line charge", "Electric field due to infinite plane sheet", "Electric field due to spherical shell"],
  "Electric Dipole_Electric Charges and Fields": ["Electric dipole moment", "Torque on dipole in uniform field", "Electric field on axial and equatorial points"],

  "Faraday's Laws_Electromagnetic Induction": ["Faraday's first law", "Faraday's second law", "Induced EMF formula"],
  "Lenz's Law_Electromagnetic Induction": ["Statement of Lenz's law", "Direction of induced current", "Conservation of energy"],
  "Self Induction_Electromagnetic Induction": ["Self-inductance coefficient L", "EMF due to self-induction", "Inductance of solenoid"],

  "Photoelectric Effect_Dual Nature of Radiation and Matter": ["Hertz and Lenard's observations", "Laws of photoelectric effect", "Einstein's photoelectric equation", "Work function and threshold frequency"],
  "De Broglie Hypothesis_Dual Nature of Radiation and Matter": ["de Broglie wavelength formula", "Wavelength of electrons", "Wave-particle duality"],

  "Bohr's Model_Atoms": ["Bohr's postulates", "Radius of Bohr orbit", "Energy of electron in orbit", "Limitations of Bohr model"],
  "Hydrogen Spectrum_Atoms": ["Lyman series", "Balmer series", "Paschen series", "Wavelength formula (Rydberg)"],

  "Radioactivity_Nuclei": ["Alpha decay", "Beta decay", "Gamma decay", "Radioactive decay law", "Half-life formula", "Mean life"],

  "p-n Junction Diode_Semiconductor Electronics": ["Formation of p-n junction", "Depletion layer", "Forward bias", "Reverse bias", "I-V characteristics"],
  "Transistors_Semiconductor Electronics": ["n-p-n and p-n-p transistors", "Transistor as a switch", "Transistor as an amplifier", "Common emitter configuration"],
  "Logic Gates_Semiconductor Electronics": ["AND gate", "OR gate", "NOT gate", "NAND gate", "NOR gate", "Truth tables"],

  // CHEMISTRY 12
  "Colligative Properties_Solutions": ["Lowering of vapour pressure", "Elevation in boiling point", "Depression in freezing point", "Osmotic pressure"],
  "Concentration Expressions_Solutions": ["Mole fraction", "Molarity", "Molality", "Parts per million"],

  "Nernst Equation_Electrochemistry": ["Derivation of Nernst equation", "EMF at non-standard conditions", "Equilibrium constant and EMF"],
  "Faraday's Laws of Electrolysis_Electrochemistry": ["First law of electrolysis", "Second law of electrolysis", "Faraday's constant"],

  "Rate Law_Chemical Kinetics": ["Rate expression", "Order of reaction", "Molecularity vs order", "Units of rate constant"],
  "Arrhenius Equation_Chemical Kinetics": ["Pre-exponential factor", "Activation energy", "Effect of temperature on rate"],

  // MATHEMATICS 12
  "Types of Functions_Relations and Functions": ["One-one (injective) function", "Onto (surjective) function", "Bijective function", "Many-one and into functions"],
  "Continuity_Continuity and Differentiability": ["Continuity at a point", "Left and right hand limits", "Continuity on an interval", "Discontinuity types"],
  "Maxima and Minima_Application of Derivatives": ["Local maxima and minima", "Global maxima and minima", "First derivative test", "Second derivative test"],
  "Integration by Parts_Integrals": ["ILATE rule", "Formula for integration by parts", "Repeated integration by parts"],
  "Bayes' Theorem_Probability": ["Prior probability", "Posterior probability", "Bayes' formula", "Applications"],

  // BIOLOGY 12
  "Mendel's Laws_Principles of Inheritance and Variation": ["Law of Dominance", "Law of Segregation", "Law of Independent Assortment", "Phenotype vs Genotype"],
  "DNA Replication_Molecular Basis of Inheritance": ["Semi-conservative replication", "Role of DNA polymerase", "Okazaki fragments", "Replication fork"],

  // MATHEMATICS 10
  "Euclid's Division Lemma_Real Numbers": ["HCF using Euclid's algorithm", "Proof of lemma", "Applications"],
  "Quadratic Formula_Quadratic Equations": ["Derivation using completing square", "Discriminant (D = b²-4ac)", "Nature of roots using discriminant"],
  "Basic Proportionality Theorem_Triangles": ["Statement and proof", "Converse of BPT", "Mid-point theorem"],
  "Trigonometric Identities_Introduction to Trigonometry": ["sin²θ + cos²θ = 1", "1 + tan²θ = sec²θ", "1 + cot²θ = cosec²θ", "Proof and applications"],

  // SCIENCE 10
  "Types of Chemical Reactions_Chemical Reactions and Equations": ["Combination reaction", "Decomposition reaction", "Displacement reaction", "Double displacement", "Oxidation-Reduction"],
  "Spherical Mirrors_Light - Reflection and Refraction": ["Concave and convex mirrors", "Mirror formula (1/v + 1/u = 1/f)", "Magnification formula", "Ray diagrams"],
  "Ohm's Law_Electricity": ["Statement of Ohm's law", "V-I graph", "Resistance and its factors", "Resistivity"],

  // SCIENCE 9
  "Equations of Motion_Motion": ["v = u + at", "s = ut + ½at²", "v² = u² + 2as", "Derivation using graphs"],
  "Newton's Second Law_Force and Laws of Motion": ["F = ma derivation", "Unit of force (Newton)", "Impulse and momentum", "Real-life applications"],
  "Moles_Atoms and Molecules": ["Avogadro's number", "Molar mass", "Mole concept", "Molar volume"],

  // ADDITIONAL COMMON MAPPINGS
  "Number Systems_Real Numbers": ["Rational numbers", "Irrational numbers", "Decimal representation", "Number line"],
  "Fundamental Theorem of Arithmetic_Real Numbers": ["Prime factorisation", "HCF and LCM", "Composite numbers"],
  "Zeroes of Polynomial_Polynomials": ["Geometric meaning of zeroes", "Coefficient relationship", "Degrees of polynomial"],
  "Arithmetic Progression_Arithmetic Progressions": ["Common difference", "General term formula", "Sum of n terms"],
  "Ohm's Law_Current Electricity": ["V = IR", "Resistivity factors", "Graph of V-I"],
  "Kinetic Theory_Thermodynamics": ["Gas laws", "RMS speed", "Internal energy", "Specific heat"],
  "Cell Theory_Cell - Unit of Life": ["Schleiden and Schwann", "Omnis cellula e cellula", "Cell functions"],
  "Pollination_Sexual Reproduction in Flowering Plants": ["Autogamy", "Geitonogamy", "Xenogamy", "Agents of pollination"],
  "SQL_Database Management": ["SELECT command", "WHERE clause", "ORDER BY", "JOINS overview"],

  // BIOLOGY 11/12
  "Digestive System_Digestion and Absorption": ["Alimentary Canal", "Digestive Glands", "Role of Enzymes", "Peristalsis"],
  "Mechanism of Breathing_Breathing and Exchange of Gases": ["Inspiration", "Expiration", "Respiratory Volumes", "Partial Pressure"],
  "Blood_Body Fluids and Circulation": ["Plasma", "Formed Elements", "Blood Groups (ABO & Rh)", "Coagulation of Blood"],
  "Kidney Function_Excretory Products and Elimination": ["Glomerular Filtration", "Reabsorption", "Secretion", "RAAS Mechanism"],
  "Muscle Contraction_Locomotion and Movement": ["Sliding Filament Theory", "Actin and Myosin", "Sarcoplasmic Reticulum"],
  "Hormones_Chemical Coordination": ["Pituitary Gland", "Thyroid Gland", "Adrenal Gland", "Pancreas", "Feedback Mechanism"],

  // COMMERCE
  "Issue of Shares_Accounting for Share Capital": ["Calls in Arrear", "Calls in Advance", "Over-subscription", "Pro-rata Allotment"],
  "Recruitment_Staffing": ["Internal Sources", "External Sources", "Advantages of External Recruitment"],
  "Monetary Policy_Money and Banking": ["Repo Rate", "Reverse Repo Rate", "CRR", "SLR", "Open Market Operations"],

  "Decentralisation_Federalism": ["Panchayati Raj", "Municipalities", "73rd & 74th Amendments"],

  // HUMANITIES & PE
  "Soviet System_The End of Bipolarity": ["Bureaucratic and Authoritarian", "Lack of Democracy", "Standard of Living", "Arms Race"],
  "Town Planning_Bricks Beads and Bones (Harappan Civilisation)": ["Citadel", "Lower Town", "Drainage System", "Domestic Architecture"],
  "Tournaments (Knockout/League)_Management of Sporting Events": ["Single Knockout", "League/Round Robin", "Combination Tournaments", "Byes and Seeding"],
  "Intelligence Theories_Variations in Psychological Attributes": ["Unitary Theory", "Two-factor Theory", "Multiple Intelligences", "Triarchic Theory"],

  // ── ELECTIVES SUBTOPICS (CLASS 11) ──
  "Basics of Python_Introduction to Python": ["Interpreted Language", "Interactive vs Script Mode", "Indentation in Python"],
  "Computer Organisation_Introduction to Computer System": ["CPU (ALU, CU)", "Bus Architecture", "Clock Speed"],
  "Partnership_Forms of Business Organisations": ["Features of Partnership", "Partnership Deed", "Types of Partners"],
  "Meaning of Statistics_Statistics for Economics - Introduction": ["Statistics in Plural Sense", "Statistics in Singular Sense", "Economic Data"],
};

// ─── BOARD-SPECIFIC CHAPTER MAPS ────────────────────────────
// For subjects that differ across boards (regional languages, ICSE structure, etc.)
export const CHAPTERS_BOARD: Record<string, string[]> = {

  // ══ ICSE-specific chapters ════════════════════════════════
  "History & Civics_Class 9_ICSE": ["The Harappan Civilisation", "The Vedic Period", "Jainism and Buddhism", "The Mauryan Empire", "The Gupta Empire", "The Constitution", "Elections", "Fundamental Rights and Duties"],
  "History & Civics_Class 10_ICSE": ["The First World War", "Rise of Nationalism", "The Second World War", "The United Nations", "Parliament", "Judiciary in India", "Local Self Government"],
  "Economic Applications_Class 10_ICSE": ["Basic Economic Problems", "Demand", "Supply", "Price Determination", "Types of Markets", "Banking", "Public Finance"],

  "Physical Science_Class 10_WBBSE": ["Thermal Phenomena", "Light", "Current Electricity", "Chemical Reactions", "Periodic Table", "Metallurgy", "Carbon Compounds"],

  "Biological Science_Class 11_WBBSE": ["Taxonomy", "Cell Biology", "Genetics", "Biotechnology", "Plant Physiology", "Animal Physiology"],
  "Biological Science_Class 12_WBBSE": ["Genetics and Evolution", "Reproduction", "Biotechnology", "Ecology", "Human Welfare"],

  // ══ Maharashtra Board (MSBSHSE) ═══════════════════════════
  "Mathematics Part 1_Class 9_MSBSHSE": ["Sets", "Real Numbers", "Polynomials", "Ratio and Proportion", "Linear Equations in Two Variables", "Financial Planning", "Statistics"],
  "Mathematics Part 2_Class 9_MSBSHSE": ["Coordinate Geometry", "Triangles", "Circle", "Geometric Constructions", "Trigonometry", "Mensuration"],
  "Mathematics Part 1_Class 10_MSBSHSE": ["Linear Equations", "Quadratic Equations", "Arithmetic Progression", "Financial Planning", "Probability", "Statistics"],
  "Mathematics Part 2_Class 10_MSBSHSE": ["Similarity", "Pythagoras Theorem", "Circle", "Geometric Constructions", "Coordinate Geometry", "Trigonometry", "Mensuration"],
  "Science & Technology_Class 9_MSBSHSE": ["Laws of Motion", "Work and Energy", "Current Electricity", "Measurement of Matter", "Acids Salts Bases", "Classification of Plants", "Energy Flow in Ecosystem"],
  "Science & Technology Part 1_Class 10_MSBSHSE": ["Gravitation", "Periodic Classification", "Chemical Reactions", "Effects of Electric Current", "Heat", "Refraction of Light", "Lenses"],
  "Science & Technology Part 2_Class 10_MSBSHSE": ["Life Processes", "Control and Coordination", "Reproduction", "Heredity and Evolution", "Environment", "Animal Classification", "Cell and Cell Division"],

  // ══ AP Board (BSEAP) & Telangana (TSBIE) — Botany/Zoology ═
  "Botany_Class 11_BSEAP": ["Diversity in Living World", "Plant Kingdom", "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Cell Structure", "Biomolecules", "Photosynthesis", "Respiration in Plants", "Plant Growth and Development"],
  "Zoology_Class 11_BSEAP": ["Animal Kingdom", "Structural Organisation in Animals", "Cell Cycle and Division", "Digestion and Absorption", "Breathing and Exchange of Gases", "Body Fluids and Circulation", "Excretory Products", "Locomotion and Movement", "Neural Control", "Chemical Coordination"],
  "Botany_Class 12_BSEAP": ["Sexual Reproduction in Flowering Plants", "Principles of Inheritance", "Molecular Basis of Inheritance", "Strategies for Enhancement in Food Production", "Microbes in Human Welfare", "Biotechnology Principles", "Biotechnology and Its Applications", "Organisms and Populations", "Ecosystem", "Biodiversity", "Environmental Issues"],
  "Zoology_Class 12_BSEAP": ["Human Reproduction", "Reproductive Health", "Evolution", "Human Health and Disease", "Biotechnology in Medicine", "Organisms and Populations"],
  "Botany_Class 11_TSBIE": ["Diversity in Living World", "Plant Kingdom", "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Cell Structure and Functions", "Biomolecules", "Photosynthesis", "Respiration", "Plant Growth and Development"],
  "Zoology_Class 11_TSBIE": ["Animal Kingdom", "Structural Organisation in Animals", "Cell Cycle and Division", "Digestion", "Breathing", "Circulation", "Excretion", "Locomotion", "Neural Control", "Chemical Coordination"],
  "Botany_Class 12_TSBIE": ["Sexual Reproduction", "Genetics", "Molecular Biology", "Biotechnology", "Ecology"],
  "Zoology_Class 12_TSBIE": ["Human Reproduction", "Reproductive Health", "Evolution", "Human Health and Disease"],

  // ══ LANGUAGE SUBJECTS (Common across boards) ══════════════
  "Hindi A_Class 9_CBSE":  ["Kritika", "Kshitij Part 1 (Prose)", "Kshitij Part 1 (Poetry)", "Sparsh", "Sanchayan"],
  "Hindi A_Class 10_CBSE": ["Kritika Part 2", "Kshitij Part 2 (Prose)", "Kshitij Part 2 (Poetry)", "Sparsh Part 2", "Sanchayan Part 2"],
  "Hindi B_Class 9_CBSE":  ["Sanchayan", "Sparsh (Prose)", "Sparsh (Poetry)", "Grammar - Rasa", "Grammar - Alaṅkār", "Grammar - Writing Skills"],
  "Hindi B_Class 10_CBSE": ["Sanchayan Part 2", "Sparsh Part 2 (Prose)", "Sparsh Part 2 (Poetry)", "Grammar", "Writing Skills - Letter", "Writing Skills - Essay"],
  "Hindi_Class 9_UP Board":  ["Gadya Khand", "Padya Khand", "Sahityik Hindi", "Vyakaran", "Nibandh Lekhan"],
  "Hindi_Class 10_UP Board": ["Gadya Khand", "Padya Khand", "Sanskrit Khand", "Lekhan Kaushal", "Vyakaran"],
  "Hindi_Class 11_UP Board": ["Aaroh Part 1 (Prose)", "Aaroh Part 1 (Poetry)", "Vitaan Part 1", "Antral Part 1", "Grammar"],
  "Hindi_Class 12_UP Board": ["Aaroh Part 2 (Prose)", "Aaroh Part 2 (Poetry)", "Vitaan Part 2", "Antral Part 2", "Grammar", "Writing Skills"],

  "English_Class 9_CBSE":  ["Beehive (Prose)", "Beehive (Poetry)", "Moments", "Grammar", "Writing Skills"],
  "English_Class 10_CBSE": ["First Flight (Prose)", "First Flight (Poetry)", "Footprints Without Feet", "Grammar", "Writing Skills"],
  "English Core_Class 11_CBSE": ["Hornbill (Prose)", "Hornbill (Poetry)", "Snapshots", "Writing Skills", "Grammar"],
  "English Core_Class 12_CBSE": ["Flamingo (Prose)", "Flamingo (Poetry)", "Vistas", "Writing Skills", "Grammar"],

  "Sanskrit_Class 9_CBSE":  ["Shemushi Part 1", "Abhyaswaan Bhav Part 1", "Grammar - Sandhi", "Grammar - Samas", "Grammar - Karaka"],
  "Sanskrit_Class 10_CBSE": ["Shemushi Part 2", "Abhyaswaan Bhav Part 2", "Vyakaranavithi", "Grammar", "Translation"],
  "Sanskrit_Class 11_CBSE": ["Bhaswati Part 1", "Shaswati Part 1", "Grammar - Shabdarupa", "Grammar - Dhaturupa"],
  "Sanskrit_Class 12_CBSE": ["Bhaswati Part 2", "Shaswati Part 2", "Grammar", "Translation", "Unseen Passage"],

  "Tamil_Class 9_Tamil Nadu Board":  ["Tamil Prose", "Tamil Poetry (Padal)", "Short Stories", "Grammar - Eluthu", "Grammar - Sol"],
  "Tamil_Class 10_Tamil Nadu Board": ["Tamil Prose", "Tamil Poetry", "Drama", "Grammar", "Writing - Essay", "Writing - Letter"],
  "Tamil_Class 11_Tamil Nadu Board": ["Tamil Literature - Prose", "Tamil Literature - Poetry", "Classical Tamil", "Grammar", "Writing Skills"],
  "Tamil_Class 12_Tamil Nadu Board": ["Tamil Literature - Prose", "Tamil Literature - Poetry", "Classical Tamil", "Grammar", "Composition"],

  "Telugu_Class 9_BSEAP":  ["Telugu Prose", "Telugu Poetry (Padyalu)", "Short Stories", "Grammar", "Writing Skills"],
  "Telugu_Class 10_BSEAP": ["Telugu Prose", "Telugu Poetry", "Drama", "Grammar", "Composition"],
  "Telugu_Class 11_BSEAP": ["Telugu Literature - Prose", "Telugu Literature - Poetry", "Grammar", "Writing Skills"],
  "Telugu_Class 12_BSEAP": ["Telugu Literature - Prose", "Poetry", "Grammar", "Composition", "Essay Writing"],

  "Kannada_Class 9_KSEAB":  ["Kannada Prose", "Kannada Poetry", "Short Stories", "Grammar - Sandhi", "Writing Skills"],
  "Kannada_Class 10_KSEAB": ["Kannada Prose", "Kannada Poetry", "Drama", "Grammar", "Essay Writing", "Letter Writing"],
  "Kannada_Class 11_KSEAB": ["Kannada Literature Prose", "Kannada Literature Poetry", "Grammar", "Writing Skills"],
  "Kannada_Class 12_KSEAB": ["Kannada Literature Prose", "Poetry", "Grammar", "Composition"],

  "Malayalam_Class 9_Kerala Board (SCERT)":  ["Malayalam Prose", "Malayalam Poetry", "Short Stories", "Grammar", "Writing Skills"],
  "Malayalam_Class 10_Kerala Board (SCERT)": ["Malayalam Prose", "Poetry", "Drama", "Grammar", "Essay", "Letter Writing"],
  "Malayalam_Class 11_Kerala Board (SCERT)": ["Malayalam Literature Prose", "Poetry", "Grammar", "Writing Skills", "Composition"],
  "Malayalam_Class 12_Kerala Board (SCERT)": ["Malayalam Literature", "Poetry", "Drama", "Grammar", "Writing"],

  "Punjabi_Class 9_PSEB":  ["Punjabi Prose", "Punjabi Poetry (Kavita)", "Short Stories", "Grammar - Vyakaran", "Writing Skills"],
  "Punjabi_Class 10_PSEB": ["Punjabi Prose", "Poetry", "Drama", "Grammar", "Essay Writing", "Letter"],
  "Punjabi_Class 11_PSEB": ["Punjabi Literature Prose", "Poetry", "Grammar", "Composition"],
  "Punjabi_Class 12_PSEB": ["Punjabi Literature", "Poetry", "Grammar", "Writing Skills"],

  "Bengali_Class 9_WBBSE":  ["Bengali Prose", "Bengali Poetry", "Short Stories", "Grammar", "Writing Skills"],
  "Bengali_Class 10_WBBSE": ["Bengali Prose", "Poetry", "Drama", "Grammar", "Essay", "Letter Writing"],
  "Bengali_Class 11_WBBSE": ["Bengali Literature Prose", "Poetry", "Grammar", "Composition", "Short Stories"],
  "Bengali_Class 12_WBBSE": ["Bengali Literature", "Poetry", "Grammar", "Writing Skills"],

  "Assamese_Class 9_SEBA":  ["Assamese Prose", "Poetry", "Short Stories", "Grammar", "Writing Skills"],
  "Assamese_Class 10_SEBA": ["Assamese Prose", "Poetry", "Drama", "Grammar", "Essay Writing"],
  "Assamese_Class 11_SEBA": ["Assamese Literature Prose", "Poetry", "Grammar", "Composition"],
  "Assamese_Class 12_SEBA": ["Assamese Literature", "Poetry", "Grammar", "Writing"],

  "Marathi_Class 9_MSBSHSE":  ["Marathi Prose", "Poetry (Kavita)", "Short Stories (Katha)", "Grammar", "Writing Skills"],
  "Marathi_Class 10_MSBSHSE": ["Marathi Prose", "Poetry", "Drama (Natya)", "Grammar", "Essay Writing", "Letter"],
  "Marathi_Class 11_MSBSHSE": ["Marathi Literature Prose", "Poetry", "Grammar", "Composition"],
  "Marathi_Class 12_MSBSHSE": ["Marathi Literature", "Poetry", "Grammar", "Writing Skills"],

  "Gujarati_Class 9_GSEB":  ["Gujarati Prose", "Poetry (Kavya)", "Short Stories", "Grammar", "Writing Skills"],
  "Gujarati_Class 10_GSEB": ["Gujarati Prose", "Poetry", "Drama", "Grammar", "Essay", "Letter"],
  "Gujarati_Class 11_GSEB": ["Gujarati Literature Prose", "Poetry", "Grammar", "Composition"],
  "Gujarati_Class 12_GSEB": ["Gujarati Literature", "Poetry", "Grammar", "Writing"],

  "Odia_Class 11_CHSE Odisha": ["Odia Literature Prose", "Poetry", "Grammar", "Composition"],
  "Odia_Class 12_CHSE Odisha": ["Odia Literature", "Poetry", "Drama", "Grammar", "Writing Skills"],

  "Urdu_Class 9_BSEB (Bihar Board)":  ["Urdu Prose (Nasr)", "Urdu Poetry (Nazm/Ghazal)", "Grammar (Qawaid)", "Writing Skills"],
  "Urdu_Class 10_BSEB (Bihar Board)": ["Urdu Prose", "Poetry", "Drama", "Grammar", "Essay", "Letter Writing"],
  "Urdu_Class 11_BSEB (Bihar Board)": ["Urdu Literature Prose", "Poetry", "Grammar", "Composition"],
  "Urdu_Class 12_BSEB (Bihar Board)": ["Urdu Literature", "Poetry", "Grammar", "Writing"],

  // ══ Computer Applications (ICSE / Common) ═════════════════
  "Computer Applications_Class 9_ICSE":  ["Introduction to Java", "Variables and Data Types", "Operators", "Control Statements", "Loops", "Arrays"],
  "Computer Applications_Class 10_ICSE": ["Classes and Objects", "Constructors", "Inheritance", "Interfaces", "String Handling", "File Handling", "Recursion"],

  // ══ Information Technology (CBSE Class 10) ═════════════════
  "Information Technology_Class 10_CBSE": ["Digital Documentation", "Electronic Spreadsheet", "Database Management", "Web Applications", "Communication Skills", "Self Management Skills"],

  // ══ Statistics (Gujarat, Karnataka, Tamil Nadu) ════════════
  "Statistics_Class 11_GSEB": ["Collection of Data", "Organisation of Data", "Presentation of Data", "Measures of Central Tendency", "Measures of Dispersion", "Correlation", "Index Numbers"],
  "Statistics_Class 12_GSEB": ["Probability", "Probability Distributions", "Sampling Methods", "Testing of Hypothesis", "Time Series", "Index Numbers"],
};

// ─── LOOKUP HELPERS ─────────────────────────────────────────
export function getSubjects(cls: string, board?: string): string[] {
  let specific: string[] = [];
  if (board) {
    const key = `${board}_${cls}`;
    if (SUBJECTS_BY_BOARD_CLASS[key]) {
      specific = SUBJECTS_BY_BOARD_CLASS[key];
    }
  }
  const generic = SUBJECTS_BY_CLASS[cls] || [];
  return Array.from(new Set([...specific, ...generic]));
}

export function getChapters(subject: string, cls: string, board?: string): string[] {
  if (board) {
    // Try board-specific key first
    const boardShort = board.replace(/\s*\(.*?\)/g, '').trim(); // e.g. "WBBSE" from "WBBSE (West Bengal Board)"
    const key1 = `${subject}_${cls}_${board}`;
    const key2 = `${subject}_${cls}_${boardShort}`;
    if (CHAPTERS_BOARD[key1]) return CHAPTERS_BOARD[key1];
    if (CHAPTERS_BOARD[key2]) return CHAPTERS_BOARD[key2];
  }
  // Fall back to NCERT chapters (most boards follow NCERT for core subjects)
  const ncert = CHAPTERS[`${subject}_${cls}`];
  if (ncert && ncert.length > 0) return ncert;
  
  // Return empty array to trigger dynamic AI discovery in lib/content.ts
  return [];
}

export function getTopics(chapter: string, subject: string, cls: string): string[] {
  // 1. Try exact key match
  const key = `${chapter}_${subject}_${cls}`;
  if (TOPICS[key]) return TOPICS[key];

  // 2. Try partial match (chapter name only)
  const partialKey = Object.keys(TOPICS).find(k => k.startsWith(`${chapter}_`));
  if (partialKey) return TOPICS[partialKey];

  // 3. Fallback: return generic topic-specific list based on subject
  if (subject.includes("Mathematics")) return ["Core Concepts", "Theorems & Proofs", "Solved Examples", "Formula Bank", "Practice Exercise"];
  if (subject.includes("Physics") || subject.includes("Chemistry") || subject.includes("Science")) return ["Theory Overview", "Experiments", "Formulas & Equations", "Conceptual Doubts", "Exam Focus"];
  if (subject.includes("Social") || subject.includes("History") || subject.includes("Geography")) return ["Timeline", "Map Work", "Important Personalities", "Key Events", "Long Answer Focus"];
  if (subject.includes("Economics") || subject.includes("Business") || subject.includes("Accountancy")) return ["Definitions", "Case Studies", "Principles", "Numeric Analysis", "Summary"];

  return [];
}

export function getSubtopics(topic: string, chapter: string): string[] {
  // 1. Try exact topic_chapter key
  const exactKey = `${topic}_${chapter}`;
  if (SUBTOPICS[exactKey]) return SUBTOPICS[exactKey];

  // 2. Try partial topic name match
  const partialKey = Object.keys(SUBTOPICS).find(k => k === topic || k.startsWith(`${topic}_`));
  if (partialKey) return SUBTOPICS[partialKey];

  // 3. Fallback: generic high-quality subtopics
  return ["In-depth Explanation", "Key Facts", "Real-world Example", "Quick Memory Trick"];
}

// ─── MASTERY ROADMAP GENERATOR ────────────────────────────────
export function getMasterySequence(board: string, cls: string) {
  const subjects = getSubjects(cls, board);
  
  const subjectTopics: Record<string, { topic: string, subject: string }[]> = {};
  
  subjects.forEach(subject => {
    const chapters = CHAPTERS[`${subject}_${cls}`] || [];
    subjectTopics[subject] = [];
    
    chapters.forEach(chapter => {
      const topics = TOPICS[`${chapter}_${subject}_${cls}`] || [];
      topics.forEach(topic => {
        subjectTopics[subject].push({ topic, subject });
      });
    });
  });

  // Interleave topics: Subject A1, Subject B1, Subject C1, Subject A2, Subject B2...
  const sequence: { topic: string, subject: string }[] = [];
  let hasMore = true;
  let index = 0;
  
  while (hasMore) {
    hasMore = false;
    subjects.forEach(subject => {
      if (subjectTopics[subject] && subjectTopics[subject][index]) {
        sequence.push(subjectTopics[subject][index]);
        hasMore = true;
      }
    });
    index++;
  }
  
  return sequence;
}
