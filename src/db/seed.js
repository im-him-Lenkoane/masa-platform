// ================================================
// M@SA PLATFORM - DATABASE SEED
// src/db/seed.js
// Run with: npm run db:seed
// Populates all grades, subjects, faculties, topics
// ================================================

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'masa_db',
  user:     process.env.DB_USER || 'masa_user',
  password: process.env.DB_PASSWORD,
});

// ── SEED DATA ────────────────────────────────────

const grades = [
  { name: '10', display_name: 'Grade 10', description: 'Foundation year of the FET phase', sort_order: 1 },
  { name: '11', display_name: 'Grade 11', description: 'Intermediate year — deeper concepts', sort_order: 2 },
  { name: '12', display_name: 'Grade 12', description: 'Matric year — exam preparation', sort_order: 3 },
];

const faculties = [
  { name: 'Engineering', slug: 'engineering', icon: '⚙️', description: 'Civil, Mechanical, Electrical, Chemical Engineering and more', sort_order: 1 },
  { name: 'Natural Sciences', slug: 'natural-sciences', icon: '🔬', description: 'Physics, Chemistry, Biology, Earth Sciences', sort_order: 2 },
  { name: 'Health Sciences', slug: 'health-sciences', icon: '🏥', description: 'Medicine, Pharmacy, Nursing, Physiotherapy', sort_order: 3 },
  { name: 'Information Technology', slug: 'information-technology', icon: '💻', description: 'Computer Science, Software Engineering, Networks, Data Science', sort_order: 4 },
  { name: 'Built Environment', slug: 'built-environment', icon: '🏗️', description: 'Architecture, Urban Planning, Quantity Surveying, Construction', sort_order: 5 },
  { name: 'Agricultural Sciences', slug: 'agricultural-sciences', icon: '🌱', description: 'Agronomy, Animal Science, Agricultural Economics, Food Science', sort_order: 6 },
];

// CAPS Curriculum - School subjects per grade with full topic lists
const schoolSubjects = [
  // ── GRADE 10 ──────────────────────────────────
  {
    grade: '10', name: 'Mathematics', slug: 'mathematics', icon: '🔢',
    description: 'CAPS-aligned Grade 10 Mathematics covering algebra, functions, geometry, trigonometry and statistics.',
    ai_context: 'This is Grade 10 Mathematics following the South African CAPS curriculum. Students are 15-16 years old. Explain concepts clearly with examples, using simple language. Reference the South African curriculum and real-world context where possible.',
    topics: [
      'Algebraic Expressions and Equations',
      'Exponents and Surds',
      'Number Patterns',
      'Functions and Graphs',
      'Finance — Simple and Compound Interest',
      'Trigonometry — Ratios and Graphs',
      'Euclidean Geometry — Lines and Angles',
      'Analytical Geometry',
      'Statistics — Data Handling',
      'Probability',
    ]
  },
  {
    grade: '10', name: 'Physical Sciences', slug: 'physical-sciences', icon: '⚗️',
    description: 'CAPS-aligned Grade 10 Physical Sciences covering mechanics, waves, electricity and chemistry.',
    ai_context: 'This is Grade 10 Physical Sciences (CAPS). The subject covers both Physics and Chemistry. Students are approximately 15-16 years old. Explain concepts at an introductory level with clear definitions and relatable examples.',
    topics: [
      'Skills for Science — Scientific Method',
      'Classification of Matter',
      'States of Matter and the Kinetic Molecular Theory',
      'The Atom — Structure and Models',
      'Periodic Table',
      'Chemical Bonding',
      'Transverse Pulses and Waves',
      'Longitudinal Waves — Sound',
      'Electromagnetic Radiation',
      'Vectors and Scalars',
      'Motion in One Dimension',
      'Energy — Gravitational Potential and Kinetic',
      'Electric Circuits — Ohm\'s Law',
      'Magnetism and Faraday\'s Law',
    ]
  },
  {
    grade: '10', name: 'Life Sciences', slug: 'life-sciences', icon: '🧬',
    description: 'CAPS-aligned Grade 10 Life Sciences exploring cells, genetics, ecology and diversity of life.',
    ai_context: 'This is Grade 10 Life Sciences (CAPS South Africa). Topics cover biology at an introductory level. Explain processes using biological terminology appropriate for 15-16 year olds.',
    topics: [
      'The Chemistry of Life',
      'Cell Structure and Function',
      'Cell Division — Mitosis',
      'Plant and Animal Tissues',
      'Nutrition — Autotrophic and Heterotrophic',
      'Transport Systems in Plants',
      'Transport Systems in Animals — Blood and Circulation',
      'Biodiversity and Classification of Microorganisms',
      'Biodiversity — Plants',
      'Biodiversity — Animals',
      'Environmental Studies — Biosphere and Ecosystems',
    ]
  },
  {
    grade: '10', name: 'Geography', slug: 'geography', icon: '🌍',
    description: 'CAPS-aligned Grade 10 Geography covering map skills, climate, geomorphology and settlements.',
    ai_context: 'This is Grade 10 Geography (CAPS). Topics span physical and human geography at an introductory level for South African students aged 15-16.',
    topics: [
      'Map Skills — Topographic Maps',
      'Map Skills — Orthophoto Maps',
      'Atmosphere — Weather and Climate',
      'Geomorphology — Lithosphere',
      'Fluvial Processes — Rivers',
      'Coastal Processes',
      'Population Geography',
      'Settlement Geography — Urban and Rural',
      'Economic Geography',
    ]
  },
  {
    grade: '10', name: 'Accounting', slug: 'accounting', icon: '📊',
    description: 'CAPS-aligned Grade 10 Accounting covering bookkeeping, financial statements and business concepts.',
    ai_context: 'This is Grade 10 Accounting (CAPS). Topics cover introductory bookkeeping and financial accounting for South African learners aged 15-16.',
    topics: [
      'Introduction to Accounting — Accounting Concepts',
      'Bookkeeping — Source Documents',
      'Journals — Cash Receipts and Payments',
      'Ledger Accounts — General Ledger',
      'Trial Balance',
      'Final Accounts — Income Statement',
      'Balance Sheet',
      'Bank Reconciliation',
      'Creditors\' and Debtors\' Reconciliation',
      'Petty Cash',
    ]
  },
  {
    grade: '10', name: 'Information Technology', slug: 'information-technology', icon: '💻',
    description: 'CAPS-aligned Grade 10 IT covering hardware, software, networks, and introduction to programming.',
    ai_context: 'This is Grade 10 Information Technology (CAPS). Topics cover computing fundamentals and Delphi/Pascal programming for South African learners aged 15-16.',
    topics: [
      'Hardware — Input, Processing, Output, Storage',
      'Software — System and Application Software',
      'Networks — Types and Topologies',
      'Internet and Email',
      'Social Implications of Technology',
      'Introduction to Programming — Delphi',
      'Variables, Data Types and Operators',
      'Sequence, Selection and Iteration',
      'Procedures and Functions',
      'Arrays and String Handling',
    ]
  },
  {
    grade: '10', name: 'History', slug: 'history', icon: '📜',
    description: 'CAPS-aligned Grade 10 History covering historical concepts, Cold War, colonialism and South African history.',
    ai_context: 'This is Grade 10 History (CAPS). Topics explore 20th-century world history and South African history with a critical thinking approach for learners aged 15-16.',
    topics: [
      'Historical Concepts and Skills',
      'The Cold War — USA vs USSR',
      'Independent Africa — Challenges of Independence',
      'The End of Colonialism — Africa',
      'Civil Society Protests — 1950s-1970s',
      'The Anti-Apartheid Struggle in South Africa',
      'South Africa in the 1970s and 1980s',
    ]
  },

  // ── GRADE 11 ──────────────────────────────────
  {
    grade: '11', name: 'Mathematics', slug: 'mathematics', icon: '🔢',
    description: 'CAPS-aligned Grade 11 Mathematics extending into quadratics, probability, trigonometry and calculus.',
    ai_context: 'This is Grade 11 Mathematics (CAPS). Students are 16-17 years old. Concepts become more abstract. Use worked examples with step-by-step solutions. This feeds directly into Grade 12 and matric exams.',
    topics: [
      'Exponents and Surds',
      'Equations and Inequalities — Quadratic',
      'Number Patterns — Arithmetic and Geometric Sequences',
      'Analytical Geometry',
      'Functions — Quadratic, Hyperbola, Exponential',
      'Trigonometric Functions and Identities',
      'Trigonometry — 2D and 3D Problems',
      'Finance — Future and Present Value',
      'Probability — Counting Principles',
      'Statistics — Variance and Standard Deviation',
      'Euclidean Geometry — Proportionality',
      'Measurement',
    ]
  },
  {
    grade: '11', name: 'Physical Sciences', slug: 'physical-sciences', icon: '⚗️',
    description: 'CAPS-aligned Grade 11 Physical Sciences — Newton\'s laws, electricity, waves and organic chemistry.',
    ai_context: 'This is Grade 11 Physical Sciences (CAPS). Students are 16-17 years old studying both Physics and Chemistry. Explain at an intermediate level with equations, diagrams and worked examples. Topics link strongly to Grade 12.',
    topics: [
      'Vectors in Two Dimensions',
      "Newton's Laws of Motion",
      'Momentum and Impulse',
      'Work, Energy and Power',
      'Doppler Effect',
      'Colour and Diffraction of Light',
      'Electrostatics — Coulomb\'s Law',
      'Electric Circuits — Series and Parallel',
      'Electromagnetism — Faraday\'s Law',
      'Atomic Combinations — Molecular Shape',
      'Intermolecular Forces',
      'Ideal Gases and Thermal Properties',
      'Quantitative Aspects of Chemical Change — Stoichiometry',
      'Reaction Rates',
      'Electrochemical Reactions — Galvanic and Electrolytic Cells',
    ]
  },
  {
    grade: '11', name: 'Life Sciences', slug: 'life-sciences', icon: '🧬',
    description: 'CAPS-aligned Grade 11 Life Sciences covering DNA, evolution, nervous system and ecology.',
    ai_context: 'This is Grade 11 Life Sciences (CAPS). Students are 16-17 years old. Topics go deeper into biological systems. Use scientific terminology with clear explanations and biological diagrams described in text.',
    topics: [
      'DNA — The Code of Life',
      'Meiosis and Sexual Reproduction',
      'Genetics and Inheritance — Mendel\'s Laws',
      'Evolution — Theories of Evolution',
      'Human Evolution',
      'Nervous System — Structure and Function',
      'Sense Organs — Eye and Ear',
      'Hormonal Control — Endocrine System',
      'Homeostasis — Thermoregulation and Osmoregulation',
      'Immune System',
      'Population Ecology',
      'Human Impact on the Environment',
    ]
  },
  {
    grade: '11', name: 'Geography', slug: 'geography', icon: '🌍',
    description: 'CAPS-aligned Grade 11 Geography — climatology, geomorphology, settlement and development geography.',
    ai_context: 'This is Grade 11 Geography (CAPS) for South African learners aged 16-17. Topics include physical and human geography at an intermediate level.',
    topics: [
      'Climate and Weather — Global Atmospheric Circulation',
      'Climate Zones of the World',
      'Climate Change — Causes and Consequences',
      'Geomorphology — Drainage Basins',
      'Karst Topography — Limestone',
      'Desert Landforms — Arid Environments',
      'Development Geography — Measuring Development',
      'Economic Activities and Development',
      'Settlement Patterns and Urban Growth',
      'Rural Land Use',
    ]
  },
  {
    grade: '11', name: 'Accounting', slug: 'accounting', icon: '📊',
    description: 'CAPS-aligned Grade 11 Accounting — partnerships, companies and financial analysis.',
    ai_context: 'This is Grade 11 Accounting (CAPS). Students learn more complex accounting including partnerships and companies. Explain accounting principles with step-by-step workings.',
    topics: [
      'Partnerships — Concepts and Formation',
      'Partnership Journals and Ledgers',
      'Partnership Financial Statements',
      'Companies — Formation and Share Capital',
      'Company Journals and Ledgers',
      'Company Financial Statements',
      'Analysis and Interpretation — Ratios',
      'Fixed Assets — Depreciation',
      'VAT — Value Added Tax',
      'Manufacturing — Cost Accounting',
    ]
  },
  {
    grade: '11', name: 'Information Technology', slug: 'information-technology', icon: '💻',
    description: 'CAPS-aligned Grade 11 IT — advanced Delphi programming, databases, networks and data structures.',
    ai_context: 'This is Grade 11 Information Technology (CAPS). Students extend their Delphi programming skills. Explain programming concepts with code examples in Delphi/Pascal syntax.',
    topics: [
      'System Technologies — Hardware Advances',
      'Communication and Network Technologies',
      'Data and Information Management — Databases',
      'Solution Development — Advanced Delphi',
      'Object-Oriented Programming Concepts',
      'File Handling — Text and Binary Files',
      'Database Access from Delphi',
      'User Interface Design',
      'Algorithms and Problem Solving',
      'Social and Ethical Implications',
    ]
  },

  // ── GRADE 12 ──────────────────────────────────
  {
    grade: '12', name: 'Mathematics', slug: 'mathematics', icon: '🔢',
    description: 'CAPS-aligned Grade 12 Mathematics — calculus, sequences, probability and statistics for matric.',
    ai_context: 'This is Grade 12 Mathematics (CAPS). This is matric level — the highest school grade. Students are preparing for NSC exams. Provide clear worked examples, identify common exam mistakes, and link to NSC past paper question types.',
    topics: [
      'Patterns, Sequences and Series — Sigma Notation',
      'Functions — Revision and Advanced',
      'Inverse Functions and Logarithms',
      'Differential Calculus — Derivatives',
      'Applications of Differential Calculus',
      'Integrated Calculus — Area under Curve',
      'Analytical Geometry — Circles',
      'Euclidean Geometry — Proofs',
      'Trigonometry — Compound and Double Angles',
      'Trigonometry — 2D and 3D Problems',
      'Finance — Annuities and Loan Repayments',
      'Counting Principles and Probability',
      'Statistics — Regression and Correlation',
    ]
  },
  {
    grade: '12', name: 'Physical Sciences', slug: 'physical-sciences', icon: '⚗️',
    description: 'CAPS-aligned Grade 12 Physical Sciences — mechanics, electrodynamics, organic chemistry and more.',
    ai_context: 'This is Grade 12 Physical Sciences (CAPS) — matric level. Students must master both Physics and Chemistry for NSC exams (Paper 1 and Paper 2). Include typical exam question styles, common mistakes, and marking guide tips.',
    topics: [
      'Momentum and Impulse — Advanced',
      'Vertical Projectile Motion',
      'Organic Chemistry — Functional Groups',
      'Organic Chemistry — Reactions',
      'Work, Energy and Power — Advanced',
      'Doppler Effect — Applications',
      'Rate and Extent of Reaction',
      'Chemical Equilibrium — Le Chatelier\'s Principle',
      'Acids and Bases — pH Scale',
      'Electrochemistry — Cells and Electrolysis',
      'Electrodynamics — AC and DC Generators',
      'Optical Phenomena — Photoelectric Effect',
      'Nuclear Reactions — Radioactivity',
      'Exam Paper 1 Preparation — Physics',
      'Exam Paper 2 Preparation — Chemistry',
    ]
  },
  {
    grade: '12', name: 'Life Sciences', slug: 'life-sciences', icon: '🧬',
    description: 'CAPS-aligned Grade 12 Life Sciences — genetics, evolution, human physiology for matric.',
    ai_context: 'This is Grade 12 Life Sciences (CAPS) at matric level. Students prepare for NSC exams. Include diagram-based explanations and typical exam question formats including essays and data interpretation.',
    topics: [
      'DNA — Replication and Protein Synthesis',
      'Genetics — Mutation and Genetic Engineering',
      'Human Reproduction — Fertilisation to Birth',
      'Endocrine System — Advanced',
      'Defence Against Disease — Immune Response',
      'Responding to the Environment — Plant Growth',
      'Ecosystems — Energy Flow and Nutrient Cycles',
      'Diversity of Life — Classification Systems',
      'History of Life on Earth — Fossil Evidence',
      'Human Evolution — Hominid Features',
      'Exam Preparation — Essays and Data Questions',
    ]
  },
  {
    grade: '12', name: 'Geography', slug: 'geography', icon: '🌍',
    description: 'CAPS-aligned Grade 12 Geography — climatology, geomorphology and development for matric.',
    ai_context: 'This is Grade 12 Geography (CAPS) at matric level. Topics require both knowledge and application. Link concepts to South African examples and current global issues. Include typical NSC exam styles.',
    topics: [
      'Climate and Weather — Mid-Latitude Cyclones',
      'Climate — Southern African Rainfall',
      'Geomorphology — Fluvial Processes Advanced',
      'Glacial Processes and Landforms',
      'Development — South Africa\'s Development Challenges',
      'World Population Distribution',
      'Migration — Causes and Consequences',
      'Economic Sectors and Employment',
      'Geographical Information Systems (GIS)',
      'Exam Preparation — Mapwork and Essays',
    ]
  },
  {
    grade: '12', name: 'Accounting', slug: 'accounting', icon: '📊',
    description: 'CAPS-aligned Grade 12 Accounting — companies, cash flow statements and financial analysis for matric.',
    ai_context: 'This is Grade 12 Accounting (CAPS) at matric level. Topics include complex company accounting and financial analysis. Link to NSC exam standards and common error patterns.',
    topics: [
      'Companies — Share Transactions and Retained Income',
      'Company Financial Statements — Advanced',
      'Cash Flow Statements',
      'Analysis and Interpretation — Investors and Managers',
      'Audit Reports and Internal Control',
      'Budgets and Projections',
      'Fixed Assets — Detailed Treatment',
      'Ethics in Accounting',
      'Exam Preparation — Financial Statements',
    ]
  },
  {
    grade: '12', name: 'Information Technology', slug: 'information-technology', icon: '💻',
    description: 'CAPS-aligned Grade 12 IT — advanced Delphi, complex databases and networking for matric.',
    ai_context: 'This is Grade 12 Information Technology (CAPS) at matric level. Include complex programming problems typical of NSC Paper 2. Explain algorithmic thinking clearly with Delphi examples.',
    topics: [
      'System Technologies — Emerging Technologies',
      'Network Technologies — Advanced Security',
      'Database Management — SQL Queries',
      'Solution Development — Complex Delphi Applications',
      'Object-Oriented Programming — Advanced',
      'Recursion and Complex Algorithms',
      'Data Structures — Arrays and Linked Lists',
      'File Handling — Advanced',
      'GUI Design and User Experience',
      'Exam Preparation — Paper 1 Practical',
      'Exam Preparation — Paper 2 Theory',
    ]
  },
  {
    grade: '12', name: 'Engineering Graphics and Design', slug: 'engineering-graphics-design', icon: '📐',
    description: 'CAPS-aligned Grade 12 EGD — drawing, CAD, and engineering design for matric.',
    ai_context: 'This is Grade 12 Engineering Graphics and Design (CAPS). Topics cover technical drawing, CAD, and engineering principles for matric level learners.',
    topics: [
      'Geometric Constructions',
      'Orthographic Drawing — Third Angle Projection',
      'Isometric and Oblique Drawing',
      'Sectional Views',
      'Auxiliary Views',
      'Civil Drawing — Building Plans',
      'Electrical Drawing — Circuit Diagrams',
      'Mechanical Drawing — Assembly Drawings',
      'Computer-Aided Design (CAD)',
      'Design Process and Exam Preparation',
    ]
  },
];

// Tertiary subjects
const tertiarySubjects = [
  {
    name: 'Calculus I', slug: 'calculus-1', icon: '∫',
    description: 'Introduction to differential and integral calculus. Covers limits, derivatives, and integration techniques.',
    ai_context: 'This is Calculus I at a South African university. Students are first-year undergraduates. Assume knowledge of Grade 12 Mathematics. Explain rigorously with formal notation but keep examples accessible. Reference standard university-level textbooks.',
    faculties: ['engineering', 'natural-sciences'],
    topics: [
      'Limits and Continuity',
      'The Derivative — Definition and Rules',
      'Differentiation — Chain, Product, Quotient Rules',
      'Implicit Differentiation',
      'Related Rates',
      'Applications of Derivatives — Optimisation',
      'Mean Value Theorem',
      'Antiderivatives and Indefinite Integrals',
      'The Definite Integral — Riemann Sums',
      'Fundamental Theorem of Calculus',
      'Integration by Substitution',
      'Applications of Integration — Area and Volume',
    ]
  },
  {
    name: 'Linear Algebra', slug: 'linear-algebra', icon: '🔷',
    description: 'Vectors, matrices, linear transformations, eigenvalues and vector spaces.',
    ai_context: 'This is Linear Algebra at university level. Respond with formal mathematical rigour. Use proper notation. Students have completed Grade 12 Mathematics.',
    faculties: ['engineering', 'natural-sciences', 'information-technology'],
    topics: [
      'Vectors and Vector Spaces',
      'Matrix Operations',
      'Systems of Linear Equations — Gaussian Elimination',
      'Determinants',
      'Linear Transformations',
      'Eigenvalues and Eigenvectors',
      'Diagonalisation',
      'Inner Product Spaces',
      'Applications in Engineering and Computer Science',
    ]
  },
  {
    name: 'Introduction to Programming', slug: 'intro-programming', icon: '💻',
    description: 'Fundamentals of programming using Python. Variables, control flow, functions, and data structures.',
    ai_context: 'This is Introduction to Programming at university level, typically using Python. Students may be absolute beginners to programming. Explain concepts clearly with code examples. Correct common beginner mistakes patiently.',
    faculties: ['information-technology', 'engineering', 'natural-sciences'],
    topics: [
      'Python Environment Setup',
      'Variables, Data Types and Operators',
      'Input and Output',
      'Conditional Statements — if/elif/else',
      'Loops — for and while',
      'Functions — Definition and Scope',
      'Lists, Tuples and Dictionaries',
      'Strings and String Methods',
      'File Handling',
      'Introduction to Object-Oriented Programming',
      'Error Handling — Try/Except',
      'Modules and Libraries',
    ]
  },
  {
    name: 'Chemistry I', slug: 'chemistry-1', icon: '⚗️',
    description: 'University-level general chemistry — atomic structure, bonding, thermodynamics and reactions.',
    ai_context: 'This is first-year university Chemistry. Students have completed Grade 12 Physical Sciences. Explain at a rigorous introductory university level. Include thermodynamic and quantum mechanical treatments where appropriate.',
    faculties: ['natural-sciences', 'health-sciences', 'engineering'],
    topics: [
      'Quantum Mechanics and Atomic Structure',
      'Periodic Trends',
      'Chemical Bonding — Molecular Orbital Theory',
      'Gases — Kinetic Theory and Equations',
      'Thermodynamics — Enthalpy and Entropy',
      'Chemical Equilibrium — Equilibrium Constants',
      'Acids and Bases — Buffers',
      'Electrochemistry',
      'Reaction Kinetics',
      'Introduction to Organic Chemistry',
    ]
  },
  {
    name: 'Physics I', slug: 'physics-1', icon: '⚛️',
    description: 'University-level classical mechanics, waves, thermodynamics and electromagnetism.',
    ai_context: 'This is first-year university Physics (classical mechanics and thermodynamics). Students have Grade 12 Physical Sciences. Use calculus-based derivations where appropriate. Explain at a rigorous university level.',
    faculties: ['engineering', 'natural-sciences'],
    topics: [
      'Kinematics in 2D and 3D',
      "Newton's Laws — Advanced Applications",
      'Work and Energy Theorem',
      'Momentum — Collisions in 2D',
      'Rotational Dynamics',
      'Oscillations and Simple Harmonic Motion',
      'Wave Mechanics',
      'Thermodynamics — Laws and Applications',
      'Electric Fields and Gauss\'s Law',
      'Magnetic Fields and Induction',
    ]
  },
  {
    name: 'Human Anatomy I', slug: 'human-anatomy-1', icon: '🫀',
    description: 'Gross anatomy of the human body — skeletal, muscular, cardiovascular and nervous systems.',
    ai_context: 'This is Human Anatomy I for first-year health science students. Use correct anatomical terminology. Explain spatial relationships and functions at an appropriate health sciences level.',
    faculties: ['health-sciences'],
    topics: [
      'Anatomical Terminology and Planes',
      'Skeletal System — Axial Skeleton',
      'Skeletal System — Appendicular Skeleton',
      'Joints — Classification and Movement',
      'Muscular System — Upper Limb',
      'Muscular System — Lower Limb and Trunk',
      'Cardiovascular System — Heart Anatomy',
      'Cardiovascular System — Major Vessels',
      'Nervous System — Brain and Cranial Nerves',
      'Nervous System — Spinal Cord and Peripheral Nerves',
    ]
  },
  {
    name: 'Construction Technology', slug: 'construction-technology', icon: '🏗️',
    description: 'Principles of construction, materials science, building systems and project management.',
    ai_context: 'This is Construction Technology for Built Environment students. Topics cover practical and theoretical aspects of building construction at a South African university level.',
    faculties: ['built-environment'],
    topics: [
      'Construction Materials — Concrete, Steel, Timber',
      'Foundations and Substructure',
      'Masonry and Brickwork',
      'Roofing Systems',
      'Waterproofing and Damp Proofing',
      'Structural Systems',
      'Services — Plumbing and Electrical',
      'Construction Project Management',
      'Health and Safety on Site',
      'South African Building Standards and SANS',
    ]
  },
  {
    name: 'Soil Science', slug: 'soil-science', icon: '🌱',
    description: 'Physical, chemical and biological properties of soils and their role in agriculture.',
    ai_context: 'This is Soil Science for first-year Agricultural Sciences students at a South African university. Include South African soil types and local examples where relevant.',
    faculties: ['agricultural-sciences'],
    topics: [
      'Soil Formation and Profile',
      'Soil Texture and Structure',
      'South African Soil Classification',
      'Soil Water — Retention and Movement',
      'Soil Organic Matter',
      'Soil Biology — Microorganisms',
      'Soil Chemistry — pH and Nutrients',
      'Plant Available Nutrients — Macronutrients',
      'Plant Available Nutrients — Micronutrients',
      'Soil Fertility and Fertilisers',
      'Soil Conservation and Erosion',
    ]
  },
];

// ── SEED FUNCTION ────────────────────────────────

async function seed() {
  console.log('\n  M@SA — Database Seed\n');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert Grades
    console.log('  Seeding grades...');
    const gradeIds = {};
    for (const g of grades) {
      const res = await client.query(
        `INSERT INTO grades (name, display_name, description, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING RETURNING id`,
        [g.name, g.display_name, g.description, g.sort_order]
      );
      if (res.rows[0]) gradeIds[g.name] = res.rows[0].id;
      else {
        const r = await client.query('SELECT id FROM grades WHERE name=$1', [g.name]);
        gradeIds[g.name] = r.rows[0].id;
      }
    }
    console.log('  ✓ Grades seeded');

    // Insert Faculties
    console.log('  Seeding faculties...');
    const facultyIds = {};
    for (const f of faculties) {
      const res = await client.query(
        `INSERT INTO faculties (name, slug, icon, description, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
        [f.name, f.slug, f.icon, f.description, f.sort_order]
      );
      facultyIds[f.slug] = res.rows[0].id;
    }
    console.log('  ✓ Faculties seeded');

    // Insert School Subjects and Topics
    console.log('  Seeding school subjects and topics...');
    for (const s of schoolSubjects) {
      const gradeId = gradeIds[s.grade];
      const subRes = await client.query(
        `INSERT INTO subjects (name, slug, icon, description, path_type, grade_id, ai_context, caps_aligned)
         VALUES ($1, $2, $3, $4, 'school', $5, $6, true)
         ON CONFLICT (slug, grade_id) DO UPDATE SET description=EXCLUDED.description RETURNING id`,
        [s.name, s.slug, s.icon, s.description, gradeId, s.ai_context]
      );
      const subjectId = subRes.rows[0].id;

      // Insert topics
      for (let i = 0; i < s.topics.length; i++) {
        await client.query(
          `INSERT INTO topics (subject_id, title, sort_order)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [subjectId, s.topics[i], i + 1]
        );
      }
    }
    console.log('  ✓ School subjects and topics seeded');

    // Insert Tertiary Subjects, Topics, Faculty links
    console.log('  Seeding tertiary subjects and topics...');
    for (const s of tertiarySubjects) {
      const subRes = await client.query(
        `INSERT INTO subjects (name, slug, icon, description, path_type, grade_id, ai_context, caps_aligned)
         VALUES ($1, $2, $3, $4, 'tertiary', NULL, $5, false)
         ON CONFLICT (slug, grade_id) DO UPDATE SET description=EXCLUDED.description RETURNING id`,
        [s.name, s.slug, s.icon, s.description, s.ai_context]
      );
      const subjectId = subRes.rows[0].id;

      // Link to faculties
      for (const fSlug of s.faculties) {
        const fId = facultyIds[fSlug];
        if (fId) {
          await client.query(
            `INSERT INTO faculty_subjects (faculty_id, subject_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [fId, subjectId]
          );
        }
      }

      // Insert topics
      for (let i = 0; i < s.topics.length; i++) {
        await client.query(
          `INSERT INTO topics (subject_id, title, sort_order)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [subjectId, s.topics[i], i + 1]
        );
      }
    }
    console.log('  ✓ Tertiary subjects and topics seeded');

    // Sample events
    console.log('  Seeding sample events...');
    await client.query(`
      INSERT INTO events (title, description, event_date, location, event_type, is_featured)
      VALUES
        ('Grade 12 Mathematics Boot Camp',
         'Intensive exam prep covering calculus, trigonometry and statistics for matrics.',
         NOW() + INTERVAL '25 days', 'Messelaar Community Centre', 'in-person', true),
        ('University Pathways: Engineering',
         'Guidance on engineering faculty applications, bursaries and university life.',
         NOW() + INTERVAL '32 days', 'Online — Zoom', 'online', false),
        ('Physical Sciences Workshop: Electricity',
         'Hands-on lab activities for Grade 10 and 11 learners.',
         NOW() + INTERVAL '45 days', 'Messelaar Community Centre', 'in-person', false)
      ON CONFLICT DO NOTHING
    `);
    console.log('  ✓ Events seeded');

    // Sample programs
    await client.query(`
      INSERT INTO programs (title, description, icon, status, is_featured)
      VALUES
        ('Science Olympiad Preparation', 'Preparing Grade 10-12 learners for regional and national science competitions.', '🔬', 'ongoing', true),
        ('Coding for Schools', 'Introduction to programming and computational thinking for secondary school students.', '💻', 'ongoing', true),
        ('Built Environment Bursary Drive', 'Connecting matriculants with architecture and engineering bursary opportunities.', '🏗️', 'completed', false),
        ('Maths Mentorship Programme', 'Peer-led tutoring pairing tertiary students with Grade 11 and 12 learners.', '📐', 'ongoing', false)
      ON CONFLICT DO NOTHING
    `);
    console.log('  ✓ Programs seeded');

    await client.query('COMMIT');
    console.log('\n  ✅ All data seeded successfully!');
    console.log('  Now run: npm run dev\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n  ✗ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
