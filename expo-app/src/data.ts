// ─── Types ─────────────────────────────────────────────────────────────────────

export type AppPhase = "login" | "otp" | "welcome" | "app";
export type LoginRole = "member" | "admin" | "superAdmin";
export type MainTab = "home" | "attendance" | "leaderboard" | "settings";
export type AttendanceScenario =
  | "inside-active"
  | "outside-active"
  | "inside-closed"
  | "outside-closed";
export type SubScreen =
  | "none"
  | "elders"
  | "elderProfile"
  | "members"
  | "memberProfile"
  | "myDashboard"
  | "adminHub"
  | "superAdmin"
  | "notifications"
  | "settingsDetail"
  | "manualAttendance"
  | "publish";
/** One page in the navigation trail — the tab you were on and the screen above it. */
export interface NavEntry {
  tab: MainTab;
  sub: SubScreen;
}

export type DayBorn = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
export type AdminTier = "Super Admin" | "District Admin" | "Assembly Admin";

/** The office a church leader holds — what the directory filters by. */
export type LeaderOffice = "Elder" | "Deacon" | "Deaconess";

export interface Elder {
  id: string;
  name: string;
  /** Full title as it reads on a card, e.g. "Presiding Elder". */
  title: string;
  /** The office behind the title, so filtering does not parse strings. */
  office: LeaderOffice;
  assembly: string;
  assemblyId: string;
  since: string;
  photo: string;
  phone: string;
  email: string;
  bio: string;
  roles: string[];
  officeHours: string;
  avatar: string;
  avatarColor: string;
}

export interface AttendanceLog {
  date: string;
  service: string;
  status: "present" | "absent" | "late";
}

export interface Member {
  id: string;
  memberId: string;
  name: string;
  /** Structured directory fields; legacy records may only have `name`. */
  firstName?: string;
  middleName?: string;
  lastName?: string;
  assembly: string;
  assemblyId: string;
  district: string;
  since: string;
  photo: string;
  phone: string;
  email: string;
  avatar: string;
  avatarColor: string;
  category: "Baptized" | "Department Leader";
  departments: string[];
  attendancePct: number;
  streak: number;
  attendanceLogs: AttendanceLog[];
  milestones: { label: string; done: boolean }[];
  elderId: string;
  /** Day-born group the member belongs to. */
  dayBorn: DayBorn;
  /** True when this member leads their day-born group. */
  dayBornLeader: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  assembly: string;
  district: string;
  tier: AdminTier;
  photo: string;
  avatar: string;
  avatarColor: string;
  since: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  affectedRecord: string;
  severity: "info" | "warning" | "critical";
}

export interface Assembly {
  id: string;
  photo: number;
  /** False until the assembly is onboarded; those cards show as coming soon. */
  live: boolean;
  name: string;
  subtitle: string;
  members: number;
  founded: string;
  pastor: string;
  elder: string;
  history: string;
}

// ─── Auth (simulated backend) ─────────────────────────────────────────────────

export const PHONE_ROLES: Record<string, LoginRole> = {
  "0537096725": "superAdmin",
  "0240010002": "admin",
  "0240010003": "admin",
};

export const OTP_CODE = "1234";

// ─── Elders ───────────────────────────────────────────────────────────────────

export const elders: Elder[] = [
  {
    id: "e1",
    name: "Elder Die Ampofo",
    title: "Presiding Elder",
    office: "Elder",
    assembly: "Royal Assembly",
    assemblyId: "royal",
    since: "2025",
    photo:
      "https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?w=300&h=300&fit=crop&auto=format",
    phone: "+233 24 000 1111",
    email: "e.mensah@cop.gh",
    bio: "Elder Emmanuel Mensah has served the Church of Pentecost for over 15 years with a heart for evangelism and pastoral care. He is known for his humble spirit and fervent intercessory prayer. He leads Royal Assembly with wisdom and compassion, discipling the next generation of believers.",
    roles: [
      "Church Executive Board",
      "Evangelism Director",
      "Marriage Counsellor",
      "Men's Fellowship Chair",
    ],
    officeHours:
      "Tuesdays & Thursdays: 10:00 AM – 2:00 PM\nSaturdays: 9:00 AM – 12:00 PM",
    avatar: "EM",
    avatarColor: "#1E3A8A",
  },
  {
    id: "e2",
    name: "Elder Joseph Boateng",
    title: "Presiding Elder",
    office: "Elder",
    assembly: "SMT",
    assemblyId: "smt",
    since: "2015",
    photo:
      "https://images.unsplash.com/photo-1616805765352-beedbad46b2a?w=300&h=300&fit=crop&auto=format",
    phone: "+233 24 000 2222",
    email: "j.boateng@cop.gh",
    bio: "Elder Joseph Boateng has shepherded SMT Assembly since 2015. A trained theologian and community leader, he is passionate about prayer warfare and church planting. Under his leadership, SMT has planted two daughter assemblies in neighbouring districts.",
    roles: [
      "Prayer & Fasting Committee",
      "Church Planting Lead",
      "Youth Ministry Advisor",
      "District Executive Member",
    ],
    officeHours:
      "Mondays & Wednesdays: 9:00 AM – 1:00 PM\nFridays: 2:00 PM – 5:00 PM",
    avatar: "JB",
    avatarColor: "#7C3AED",
  },
  {
    id: "e3",
    name: "Elder Akosua Darko",
    title: "Presiding Elder",
    office: "Elder",
    assembly: "Upper Room",
    assemblyId: "upper",
    since: "2020",
    photo:
      "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=300&h=300&fit=crop&auto=format",
    phone: "+233 24 000 3333",
    email: "a.darko@cop.gh",
    bio: "Elder Akosua Darko is a trailblazer in women's ministry and intercessory prayer. Since leading Upper Room Assembly in 2020, she has cultivated a culture of 24-hour prayer and deep biblical study. She is a sought-after speaker and counsellor across the Ayigya District.",
    roles: [
      "Women's Ministry Director",
      "Intercessory Prayer Lead",
      "Counselling Ministry",
      "Area Evangelism Team",
    ],
    officeHours:
      "Tuesdays & Fridays: 8:00 AM – 12:00 PM\nThursdays: 1:00 PM – 4:00 PM",
    avatar: "AD",
    avatarColor: "#059669",
  },
  {
    id: "e4",
    name: "Elder Richard Amoah",
    title: "Presiding Elder",
    office: "Elder",
    assembly: "Grace Temple",
    assemblyId: "grace",
    since: "2021",
    photo:
      "https://images.unsplash.com/photo-1605602517387-ec78b947335e?w=300&h=300&fit=crop&auto=format",
    phone: "+233 24 000 4444",
    email: "r.amoah@cop.gh",
    bio: "Elder Richard Amoah came to Grace Temple Assembly with a vision for community transformation. A former teacher and social worker, he blends pastoral care with community outreach. His assembly runs literacy programmes, a feeding initiative, and quarterly health screenings for the community.",
    roles: [
      "Community Outreach Lead",
      "Finance Committee",
      "Youth Discipleship Mentor",
      "PEMEM Coordinator",
    ],
    officeHours:
      "Mondays & Thursdays: 10:00 AM – 3:00 PM\nSaturdays: 8:00 AM – 11:00 AM",
    avatar: "RA",
    avatarColor: "#D97706",
  },
  {
    id: "e5",
    name: "Elder Priscilla Amponsah",
    title: "Assistant Presiding Elder",
    office: "Elder",
    assembly: "Royal Assembly",
    assemblyId: "royal",
    since: "2022",
    photo:
      "https://images.unsplash.com/photo-1611432579402-7037e3e2c1e4?w=300&h=300&fit=crop&auto=format",
    phone: "+233 24 000 5555",
    email: "p.amponsah@cop.gh",
    bio: "Elder Priscilla Amponsah serves as Assistant Presiding Elder at Royal Assembly, providing spiritual oversight and administrative leadership. She coordinates the Children's Church and spearheads the assembly's digital ministry to reach younger generations.",
    roles: [
      "Children's Church Coordinator",
      "Digital Ministry Lead",
      "Deaconess Head",
      "Sunday School Supervisor",
    ],
    officeHours: "Wednesdays: 9:00 AM – 1:00 PM\nSaturdays: 10:00 AM – 2:00 PM",
    avatar: "PA",
    avatarColor: "#EC4899",
  },
  {
    id: "d1",
    name: "Deacon Yaw Osei",
    title: "Deacon",
    office: "Deacon",
    assembly: "Royal Assembly",
    assemblyId: "royal",
    since: "2019",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&auto=format",
    phone: "+233 24 000 6666",
    email: "y.osei@cop.gh",
    bio: "Deacon Yaw Osei oversees the assembly's welfare fund and leads the Monday-born Bible study class. A quiet, practical servant, he is usually the first to arrive and the last to leave.",
    roles: ["Welfare Committee", "Monday-Born Class Leader", "Ushering Coordinator", "Building Maintenance"],
    officeHours: "Wednesdays: 4:00 PM \u2013 6:00 PM\nSundays: after second service",
    avatar: "YO",
    avatarColor: "#0F766E",
  },
  {
    id: "d2",
    name: "Deacon Kofi Boadu",
    title: "Deacon",
    office: "Deacon",
    assembly: "Royal Assembly",
    assemblyId: "royal",
    since: "2021",
    photo:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&auto=format",
    phone: "+233 24 000 7777",
    email: "k.boadu@cop.gh",
    bio: "Deacon Kofi Boadu leads the youth ministry and the Thursday-born class. He runs the assembly's mentoring scheme, pairing older members with students through their exam years.",
    roles: ["Youth Ministry Lead", "Thursday-Born Class Leader", "Mentoring Scheme", "Media Team"],
    officeHours: "Thursdays: 5:00 PM \u2013 7:00 PM\nSaturdays: 10:00 AM \u2013 1:00 PM",
    avatar: "KB",
    avatarColor: "#B45309",
  },
  {
    id: "d3",
    name: "Deaconess Adwoa Nyarko",
    title: "Deaconess",
    office: "Deaconess",
    assembly: "Royal Assembly",
    assemblyId: "royal",
    since: "2018",
    photo:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&auto=format",
    phone: "+233 24 000 8888",
    email: "a.nyarko@cop.gh",
    bio: "Deaconess Adwoa Nyarko coordinates the women's fellowship and counsels young mothers in the assembly. She leads the Tuesday-born Bible study class and the hospital visitation team.",
    roles: ["Women's Fellowship", "Tuesday-Born Class Leader", "Hospital Visitation", "Counselling Team"],
    officeHours: "Tuesdays: 9:00 AM \u2013 12:00 PM\nFridays: 3:00 PM \u2013 5:00 PM",
    avatar: "AN",
    avatarColor: "#9D174D",
  },
  {
    id: "d4",
    name: "Deaconess Ama Serwaa",
    title: "Deaconess",
    office: "Deaconess",
    assembly: "Royal Assembly",
    assemblyId: "royal",
    since: "2020",
    photo:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&auto=format",
    phone: "+233 24 000 9999",
    email: "a.serwaa@cop.gh",
    bio: "Deaconess Ama Serwaa runs the children's church and the assembly library. She leads the Saturday-born class and has trained a generation of Sunday-school teachers.",
    roles: ["Children's Church", "Saturday-Born Class Leader", "Library & Resources", "Teacher Training"],
    officeHours: "Saturdays: 8:00 AM \u2013 11:00 AM\nSundays: before first service",
    avatar: "AS",
    avatarColor: "#6D28D9",
  },
];

// ─── Members ──────────────────────────────────────────────────────────────────

export const members: Member[] = [
  {
    id: "m1",
    memberId: "MEM-0042",
    name: "Kwaku Mensah",
    assembly: "Royal Assembly",
    assemblyId: "royal",
    district: "Ayigya District",
    since: "2017",
    phone: "+233 24 111 2222",
    email: "k.mensah@gmail.com",
    photo:
      "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=300&h=300&fit=crop&auto=format",
    avatar: "KM",
    avatarColor: "#1E3A8A",
    category: "Department Leader",
    departments: ["Youth Choir", "Media Team", "Ushering Team"],
    attendancePct: 94,
    streak: 12,
    attendanceLogs: [
      { date: "Aug 18, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 13, 2025", service: "Prayer Warfare", status: "present" },
      { date: "Aug 11, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 6, 2025", service: "Prayer Warfare", status: "absent" },
      { date: "Aug 4, 2025", service: "Sunday Divine Service", status: "present" },
    ],
    milestones: [
      { label: "Water Baptism", done: true },
      { label: "Confirmation", done: true },
      { label: "Marriage Certification", done: false },
    ],
    elderId: "e1",
    dayBorn: "Wednesday",
    dayBornLeader: true,
  },
  {
    id: "m2",
    memberId: "MEM-0117",
    name: "Abena Frimpong",
    assembly: "SMT",
    assemblyId: "smt",
    district: "Ayigya District",
    since: "2019",
    phone: "+233 24 222 3333",
    email: "a.frimpong@gmail.com",
    photo:
      "https://images.unsplash.com/photo-1662850886700-4ec19bd30d11?w=300&h=300&fit=crop&auto=format",
    avatar: "AF",
    avatarColor: "#059669",
    category: "Baptized",
    departments: ["Women's Ministry", "Sunday School"],
    attendancePct: 88,
    streak: 7,
    attendanceLogs: [
      { date: "Aug 18, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 11, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 6, 2025", service: "Prayer Warfare", status: "late" },
      { date: "Aug 4, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Jul 28, 2025", service: "Sunday Divine Service", status: "absent" },
    ],
    milestones: [
      { label: "Water Baptism", done: true },
      { label: "Confirmation", done: true },
      { label: "Marriage Certification", done: true },
    ],
    elderId: "e2",
    dayBorn: "Tuesday",
    dayBornLeader: false,
  },
  {
    id: "m3",
    memberId: "MEM-0254",
    name: "Yaw Acheampong",
    assembly: "Grace Temple",
    assemblyId: "grace",
    district: "Ayigya District",
    since: "2021",
    phone: "+233 24 333 4444",
    email: "y.acheampong@gmail.com",
    photo:
      "https://images.unsplash.com/photo-1562173650-f61426fbe683?w=300&h=300&fit=crop&auto=format",
    avatar: "YA",
    avatarColor: "#D97706",
    category: "Baptized",
    departments: ["Evangelism Team", "Deacons Board"],
    attendancePct: 76,
    streak: 3,
    attendanceLogs: [
      { date: "Aug 18, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 11, 2025", service: "Sunday Divine Service", status: "absent" },
      { date: "Aug 4, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Jul 28, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Jul 21, 2025", service: "Sunday Divine Service", status: "absent" },
    ],
    milestones: [
      { label: "Water Baptism", done: true },
      { label: "Confirmation", done: false },
      { label: "Marriage Certification", done: false },
    ],
    elderId: "e4",
    dayBorn: "Thursday",
    dayBornLeader: false,
  },
  {
    id: "m4",
    memberId: "MEM-0389",
    name: "Efua Asante",
    assembly: "Upper Room",
    assemblyId: "upper",
    district: "Ayigya District",
    since: "2016",
    phone: "+233 24 444 5555",
    email: "e.asante@gmail.com",
    photo:
      "https://images.unsplash.com/photo-1508002366005-75a695ee2d17?w=300&h=300&fit=crop&auto=format",
    avatar: "EA",
    avatarColor: "#7C3AED",
    category: "Department Leader",
    departments: ["Intercessory Prayer", "Women's Ministry", "Children's Church"],
    attendancePct: 97,
    streak: 24,
    attendanceLogs: [
      { date: "Aug 18, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 13, 2025", service: "Prayer Warfare", status: "present" },
      { date: "Aug 11, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 6, 2025", service: "Prayer Warfare", status: "present" },
      { date: "Aug 4, 2025", service: "Sunday Divine Service", status: "present" },
    ],
    milestones: [
      { label: "Water Baptism", done: true },
      { label: "Confirmation", done: true },
      { label: "Marriage Certification", done: true },
    ],
    elderId: "e3",
    dayBorn: "Friday",
    dayBornLeader: true,
  },
  {
    id: "m5",
    memberId: "MEM-0501",
    name: "Kofi Boateng",
    assembly: "Royal Assembly",
    assemblyId: "royal",
    district: "Ayigya District",
    since: "2020",
    phone: "+233 24 555 6666",
    email: "k.boateng@gmail.com",
    photo:
      "https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?w=300&h=300&fit=crop&auto=format",
    avatar: "KB",
    avatarColor: "#EC4899",
    category: "Baptized",
    departments: ["Youth Fellowship", "Evangelism Team"],
    attendancePct: 82,
    streak: 5,
    attendanceLogs: [
      { date: "Aug 18, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 11, 2025", service: "Sunday Divine Service", status: "late" },
      { date: "Aug 4, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Jul 28, 2025", service: "Sunday Divine Service", status: "absent" },
      { date: "Jul 21, 2025", service: "Sunday Divine Service", status: "present" },
    ],
    milestones: [
      { label: "Water Baptism", done: true },
      { label: "Confirmation", done: false },
      { label: "Marriage Certification", done: false },
    ],
    elderId: "e1",
    dayBorn: "Friday",
    dayBornLeader: false,
  },
  {
    id: "m6",
    memberId: "MEM-0613",
    name: "Akua Serwaa",
    assembly: "Royal Assembly",
    assemblyId: "royal",
    district: "Ayigya District",
    since: "2018",
    phone: "+233 24 666 7777",
    email: "a.serwaa@gmail.com",
    photo:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&h=300&fit=crop&auto=format",
    avatar: "AS",
    avatarColor: "#0EA5E9",
    category: "Baptized",
    departments: ["Women's Ministry", "Ushering Team"],
    attendancePct: 91,
    streak: 9,
    attendanceLogs: [
      { date: "Aug 18, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 13, 2025", service: "Prayer Warfare", status: "present" },
      { date: "Aug 11, 2025", service: "Sunday Divine Service", status: "late" },
      { date: "Aug 6, 2025", service: "Prayer Warfare", status: "present" },
      { date: "Aug 4, 2025", service: "Sunday Divine Service", status: "present" },
    ],
    milestones: [
      { label: "Water Baptism", done: true },
      { label: "Confirmation", done: true },
      { label: "Marriage Certification", done: false },
    ],
    elderId: "e1",
    dayBorn: "Wednesday",
    dayBornLeader: false,
  },
  {
    id: "m7",
    memberId: "MEM-0728",
    name: "Kwaku Antwi",
    assembly: "Royal Assembly",
    assemblyId: "royal",
    district: "Ayigya District",
    since: "2022",
    phone: "+233 24 777 8888",
    email: "k.antwi@gmail.com",
    photo:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&auto=format",
    avatar: "KA",
    avatarColor: "#14B8A6",
    category: "Baptized",
    departments: ["Youth Fellowship", "Media Team"],
    attendancePct: 79,
    streak: 4,
    attendanceLogs: [
      { date: "Aug 18, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 13, 2025", service: "Prayer Warfare", status: "absent" },
      { date: "Aug 11, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 4, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Jul 28, 2025", service: "Sunday Divine Service", status: "late" },
    ],
    milestones: [
      { label: "Water Baptism", done: true },
      { label: "Confirmation", done: false },
      { label: "Marriage Certification", done: false },
    ],
    elderId: "e1",
    dayBorn: "Wednesday",
    dayBornLeader: false,
  },
  {
    id: "m8",
    memberId: "MEM-0844",
    name: "Akua Boakye",
    assembly: "Royal Assembly",
    assemblyId: "royal",
    district: "Ayigya District",
    since: "2015",
    phone: "+233 24 888 9999",
    email: "a.boakye@gmail.com",
    photo:
      "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=300&fit=crop&auto=format",
    avatar: "AB",
    avatarColor: "#A855F7",
    category: "Department Leader",
    departments: ["Sunday School", "Children's Church", "Intercessory Prayer"],
    attendancePct: 96,
    streak: 18,
    attendanceLogs: [
      { date: "Aug 18, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 13, 2025", service: "Prayer Warfare", status: "present" },
      { date: "Aug 11, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 6, 2025", service: "Prayer Warfare", status: "present" },
      { date: "Aug 4, 2025", service: "Sunday Divine Service", status: "present" },
    ],
    milestones: [
      { label: "Water Baptism", done: true },
      { label: "Confirmation", done: true },
      { label: "Marriage Certification", done: true },
    ],
    elderId: "e1",
    dayBorn: "Wednesday",
    dayBornLeader: false,
  },
];

/** Logged-in member (first member is "me") */
export const ME = members[0];

// ─── Admin users & audit log ──────────────────────────────────────────────────

export const adminUsers: AdminUser[] = [
  {
    id: "a1",
    name: "Apostle K. Asante",
    // Must match the super-admin key in PHONE_ROLES so the session resolves to them.
    phone: "+233 53 709 6725",
    assembly: "Ayigya District",
    district: "Ayigya District",
    tier: "Super Admin",
    photo:
      "https://images.unsplash.com/photo-1616805765352-beedbad46b2a?w=200&h=200&fit=crop&auto=format",
    avatar: "KA",
    avatarColor: "#1E3A8A",
    since: "2019",
  },
  {
    id: "a2",
    name: "Elder Emmanuel Mensah",
    phone: "+233 24 001 0002",
    assembly: "Royal Assembly",
    district: "Ayigya District",
    tier: "Assembly Admin",
    photo:
      "https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?w=200&h=200&fit=crop&auto=format",
    avatar: "EM",
    avatarColor: "#7C3AED",
    since: "2021",
  },
  {
    id: "a3",
    name: "Elder Joseph Boateng",
    phone: "+233 24 001 0003",
    assembly: "SMT",
    district: "Ayigya District",
    tier: "Assembly Admin",
    photo:
      "https://images.unsplash.com/photo-1631131431211-4f768d89087d?w=200&h=200&fit=crop&auto=format",
    avatar: "JB",
    avatarColor: "#059669",
    since: "2020",
  },
  {
    id: "a4",
    name: "Elder Akosua Darko",
    phone: "+233 24 001 0004",
    assembly: "Upper Room",
    district: "Ayigya District",
    tier: "Assembly Admin",
    photo:
      "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=200&h=200&fit=crop&auto=format",
    avatar: "AD",
    avatarColor: "#D97706",
    since: "2022",
  },
  {
    id: "a5",
    name: "Deacon P. Frimpong",
    phone: "+233 24 001 0005",
    assembly: "Ayigya District",
    district: "Ayigya District",
    tier: "District Admin",
    photo:
      "https://images.unsplash.com/photo-1605602517387-ec78b947335e?w=200&h=200&fit=crop&auto=format",
    avatar: "PF",
    avatarColor: "#DC2626",
    since: "2023",
  },
  {
    id: "a6",
    name: "Elder Richard Amoah",
    phone: "+233 24 001 0006",
    assembly: "Grace Temple",
    district: "Ayigya District",
    tier: "Assembly Admin",
    photo:
      "https://images.unsplash.com/photo-1659093728055-45f8275166d9?w=200&h=200&fit=crop&auto=format",
    avatar: "RA",
    avatarColor: "#EC4899",
    since: "2023",
  },
];

export const auditLogs: AuditLog[] = [
  { id: "l1", timestamp: "10 mins ago", adminName: "Elder Emmanuel Mensah", action: "Created Attendance Session", affectedRecord: "Royal Assembly", severity: "info" },
  { id: "l2", timestamp: "1 hour ago", adminName: "Sis. Ama Poku", action: "Revoked Admin Role", affectedRecord: "#MEM-1042", severity: "critical" },
  { id: "l3", timestamp: "2 hours ago", adminName: "Elder Joseph Boateng", action: "Added New Member Record", affectedRecord: "#MEM-1249", severity: "info" },
  { id: "l4", timestamp: "3 hours ago", adminName: "Elder Akosua Darko", action: "Updated Geofence Boundary", affectedRecord: "Upper Room Assembly", severity: "warning" },
  { id: "l5", timestamp: "5 hours ago", adminName: "Deacon P. Frimpong", action: "Exported Master Records (PDF)", affectedRecord: "All Assemblies", severity: "info" },
  { id: "l6", timestamp: "Yesterday", adminName: "Apostle K. Asante", action: "Granted District Admin Role", affectedRecord: "#MEM-0211", severity: "warning" },
];

// ─── Assemblies ───────────────────────────────────────────────────────────────

export const assemblies: Assembly[] = [
  {
    id: "smt",
    live: false,
    photo: require("../assets/assembly/assembly-smt.jpg"),
    name: "SMT",
    subtitle: "Ayigya Municipal Temple",
    members: 312,
    founded: "1982",
    pastor: "Apostle K. Asante",
    elder: "Elder J. Boateng",
    history:
      "The SMT Assembly was established in 1982 by a pioneering group of 14 faithful members who gathered under a mango tree in Ayigya. It has since grown into one of the flagship assemblies in the area, known for its vibrant prayer culture and evangelism outreach.",
  },
  {
    id: "royal",
    live: true,
    photo: require("../assets/assembly/assembly-royal.jpg"),
    name: "Royal Assembly",
    subtitle: "Beacon of Hope",
    members: 248,
    founded: "1997",
    pastor: "Pastor E. Mensah",
    elder: "Elder P. Amponsah",
    history:
      "Founded in 1997 by Pastor E. Mensah, Royal Assembly began with a vision to establish a Christ-centred community in the heart of the district. Starting with just 22 members, it has blossomed into a thriving congregation distinguished by its youth ministry and worship excellence.",
  },
  {
    id: "upper",
    live: false,
    photo: require("../assets/assembly/assembly-upper.jpg"),
    name: "Upper Room",
    subtitle: "Prayer & Worship Centre",
    members: 176,
    founded: "2004",
    pastor: "Pastor F. Owusu",
    elder: "Elder A. Darko",
    history:
      "Upper Room Assembly was born out of a 21-day prayer and fasting event in 2004. Its founding members, led by Pastor F. Owusu, felt a divine call to raise a house of prayer. Today, it remains renowned for its powerful intercessory prayer ministry and all-night vigils.",
  },
  {
    id: "grace",
    live: false,
    photo: require("../assets/assembly/assembly-grace.jpg"),
    name: "Grace Temple",
    subtitle: "Where Grace Abides",
    members: 203,
    founded: "2010",
    pastor: "Pastor G. Acheampong",
    elder: "Elder R. Amoah",
    history:
      "Grace Temple Assembly was planted in 2010 as a mission outpost to serve the growing residential community on the eastern corridor. Under the leadership of Pastor G. Acheampong, it has become a pillar of community development, running feeding programmes and literacy outreach.",
  },
];

// ─── Carousel, leaderboard & bible study ──────────────────────────────────────

/**
 * Backdrop slides for the login and OTP screens. Kept as a distinct set from
 * `homeSlides` so the two sliders never show the same photograph.
 */
export const sliderPhotos = [
  { source: require("../assets/slider/slider-1.jpg"), label: "Praise & Worship" },
  { source: require("../assets/slider/slider-2.jpg"), label: "Sunday Divine Service" },
  { source: require("../assets/slider/slider-3.jpg"), label: "Youth Fellowship" },
  { source: require("../assets/slider/slider-4.jpg"), label: "National Youth Week" },
  { source: require("../assets/slider/slider-5.jpg"), label: "Discipleship & Mentoring" },
  { source: require("../assets/slider/slider-6.jpg"), label: "Congregational Meeting" },
  { source: require("../assets/slider/slider-7.jpg"), label: "Mid-Week Prayer" },
];

export const leaderboardData = {
  consistent: [
    { rank: 1, name: "Ebenezer Gyemfi", present: 48, total: 48, avatar: "EG" },
    { rank: 2, name: "Kwame Asante", present: 46, total: 48, avatar: "KA" },
    { rank: 3, name: "Gifty Owusu", present: 45, total: 48, avatar: "GO" },
    { rank: 4, name: "Emmanuel Boateng", present: 44, total: 48, avatar: "EB" },
    { rank: 5, name: "Priscilla Adjei", present: 43, total: 48, avatar: "PA" },
    { rank: 6, name: "Daniel Acheampong", present: 42, total: 48, avatar: "DA" },
    { rank: 7, name: "Ruth Amoah", present: 40, total: 48, avatar: "RA" },
  ],
  needsEncouragement: [
    { rank: 1, name: "Felix Boateng", present: 12, total: 48, avatar: "FB" },
    { rank: 2, name: "Ama Frimpong", present: 15, total: 48, avatar: "AF" },
    { rank: 3, name: "Kwabena Sarpong", present: 18, total: 48, avatar: "KS" },
    { rank: 4, name: "Adwoa Ntim", present: 20, total: 48, avatar: "AN" },
    { rank: 5, name: "Fiifi Agyemang", present: 21, total: 48, avatar: "FA" },
  ],
};

/**
 * A carousel photograph. `source` is whatever `Image` accepts — a bundled
 * `require()` for the seeded slides, `{ uri }` for anything an admin uploads.
 */
export interface Slide {
  id: string;
  source: number | { uri: string };
  label: string;
  caption?: string;
}

/** Resolve a cover that may be a bundled asset or a picked file URI. */
export function imageSource(cover?: string, fallback?: number) {
  if (cover) return { uri: cover };
  return fallback;
}

/** Carousel slides on the dashboard — a different set from the login backdrop. */
export const homeSlides: Slide[] = [
  { id: "hs1", source: require("../assets/home/home-1.jpg"), label: "Arise & Shine" },
  { id: "hs2", source: require("../assets/home/home-2.jpg"), label: "Fellowship" },
  { id: "hs3", source: require("../assets/home/home-3.jpg"), label: "Sunday Service" },
  { id: "hs4", source: require("../assets/home/home-4.jpg"), label: "Youth Ministry" },
  { id: "hs5", source: require("../assets/home/home-5.jpg"), label: "Youth Week" },
];

export interface ServiceSlot {
  id: string;
  day: string;
  name: string;
  time: string;
  venue: string;
  /** Optional — services added in-app fall back to a stock tile. */
  photo?: number;
  /** A photograph the admin attached when publishing, as a file URI. */
  cover?: string;
}

export const serviceFallbackPhoto = require("../assets/service/service-sun.jpg");

export const weeklySchedule: ServiceSlot[] = [
  { id: "s-sun", day: "Mon", name: "Youth Service", time: "7:00 PM", venue: "Royal Assembly", photo: require("../assets/service/service-sun.jpg") },
  { id: "s-wed", day: "Mon-Wed", name: "Morning Devotion", time: "6:00 AM", venue: "Royal Assembly", photo: require("../assets/service/service-wed.jpg") },
  { id: "s-fri", day: "Wed", name: "Men Ministry", time: "7:00 PM", venue: "Royal Assembly", photo: require("../assets/service/service-fri.jpg") },
];

// ─── Records an admin creates from the hub ────────────────────────────────────

/** The attendance geofence, as typed into the hub. */
export interface Geofence {
  lat: string;
  lng: string;
  radius: string;
}

export const defaultGeofence: Geofence = { lat: "7.3407", lng: "-2.3340", radius: "100" };

export const MILESTONE_LABELS = [
  "Water Baptism",
  "Confirmation",
  "Marriage Certification",
  "Special Ordination",
] as const;

export type MilestoneLabel = (typeof MILESTONE_LABELS)[number];

export interface MilestoneRecord {
  id: string;
  member: string;
  milestone: MilestoneLabel;
  at: string;
  loggedBy: string;
}

// ─── Manual attendance ────────────────────────────────────────────────────────

/**
 * Attendance an admin signed on a member's behalf — for members without a
 * phone, or when the network is down at the auditorium.
 */
export interface ManualAttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  service: string;
  status: "present" | "late";
  reason: ManualAttendanceReason;
  signedBy: string;
  at: string;
}

export type ManualAttendanceReason = "no-phone" | "network" | "device" | "other";

export const MANUAL_REASONS: { id: ManualAttendanceReason; label: string; hint: string }[] = [
  { id: "no-phone", label: "No phone", hint: "Member does not carry a smartphone" },
  { id: "network", label: "Network issue", hint: "No signal or data at the auditorium" },
  { id: "device", label: "Device problem", hint: "Phone lost, flat, or app not working" },
  { id: "other", label: "Other", hint: "Any other pastoral reason" },
];

// ─── Notifications ────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  kind: "attendance" | "event" | "study" | "verse" | "admin";
  unread: boolean;
}

export interface DailyVerse {
  id: string;
  reference: string;
  english: string;
  twi: string;
  publishedOn: string;
}

export const notifications: AppNotification[] = [
  { id: "n1", title: "Attendance session is open", body: "Sunday Divine Service is now taking attendance. Mark your presence before 10:30 AM.", time: "12 min ago", kind: "attendance", unread: true },
  { id: "n2", title: "District Convention 2025", body: "Join us at the Ayigya District Convention on 25 August. Buses leave the assembly at 7:00 AM.", time: "2 hours ago", kind: "event", unread: true },
  { id: "n3", title: "This week's Bible study is ready", body: "\"The Foundation of Faith\" — Hebrews 11:1–6. Tap to read the full guide.", time: "Yesterday", kind: "study", unread: true },
  { id: "n5", title: "You reached a 12-week streak", body: "You have attended every service for twelve weeks running. Keep it up!", time: "4 days ago", kind: "attendance", unread: false },
  { id: "n6", title: "Prayer & Warfare moved", body: "Wednesday's Prayer & Warfare now starts at 6:30 PM in the Prayer Room.", time: "Last week", kind: "event", unread: false },
  { id: "n7", title: "Elder Emmanuel Mensah is available", body: "Counselling appointments are open on Tuesdays and Thursdays, 10:00 AM – 2:00 PM.", time: "Last week", kind: "admin", unread: false },
];

export interface UpcomingEvent {
  id: string;
  date: string;
  name: string;
  tag: string;
  /** Optional accent; events added in-app cycle through the palette. */
  tint?: "amber" | "blue" | "violet" | "green";
  /** A photograph the admin attached when publishing, as a file URI. */
  cover?: string;
}

export const upcomingEvents: UpcomingEvent[] = [
  { id: "ev1", date: "Aug 25", name: "District Convention 2025", tag: "District", tint: "amber" },
  { id: "ev2", date: "Sep 14", name: "District Harvest Festival", tag: "District", tint: "blue" },
];

/** The language a member reads the study guide in. */
export type Lang = "en" | "tw";

export const LANGUAGES: { id: Lang; label: string; short: string }[] = [
  { id: "en", label: "English", short: "ENG" },
  { id: "tw", label: "Twi", short: "TWI" },
];

/**
 * One language's copy of a study. The pamphlet gives each week a passage, the
 * aims the class should come away with, questions to work through, and a memory
 * verse — so the model carries those separately rather than as one blob.
 */
export interface StudyText {
  title: string;
  chapter: string;
  /** What the class should learn — the pamphlet's stated aims. */
  aims: string[];
  /** Questions the class discusses together. */
  questions: string[];
  memoryVerse: string;
  /** Any further prose the admin wants to add. */
  notes?: string;
}

export interface BibleStudy {
  id: string;
  /** Week within the programme — week 1 is the first Sunday of the term. */
  weekNumber: number;
  /** The Sunday this study is taught, as YYYY-MM-DD. Drives week recognition. */
  date: string;
  pages: string;
  /** Released early by an admin. A study whose Sunday has arrived is released anyway. */
  available: boolean;
  /** A photograph the admin attached when publishing, as a file URI. */
  cover?: string;
  en: StudyText;
  tw: StudyText;
}

/** The study copy in the reader's language. */
export function studyText(study: BibleStudy, lang: Lang): StudyText {
  return lang === "tw" ? study.tw : study.en;
}

// ─── Week recognition ─────────────────────────────────────────────────────────

/**
 * The Sunday that begins the week containing `date`. Bible study weeks run
 * Sunday to Saturday, so this is what decides "the week we are in".
 */
export function weekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/** YYYY-MM-DD in local time — `toISOString` would shift the date by the UTC offset. */
export function isoDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isSunday(date: Date = new Date()): boolean {
  return date.getDay() === 0;
}

/**
 * The study for the week containing `now`. Falls back to the most recent study
 * already taught, so the card is never empty between terms.
 */
export function studyForWeek(studies: BibleStudy[], now: Date = new Date()): BibleStudy | undefined {
  const sunday = isoDate(weekStart(now));
  const thisWeek = studies.find((s) => s.date === sunday);
  if (thisWeek) return thisWeek;

  const past = studies.filter((s) => s.date <= sunday).sort((a, b) => b.date.localeCompare(a.date));
  return past[0] ?? studies[0];
}

/** True once the study's Sunday has arrived, or an admin released it early. */
export function studyReleased(study: BibleStudy, now: Date = new Date()): boolean {
  return study.available || study.date <= isoDate(weekStart(now));
}

// ─── Day-born Bible study classes ─────────────────────────────────────────────

/**
 * The assembly splits into day-born groups for Bible study, so the dashboard can
 * name the room a member should walk to. A member's `dayBorn` picks their class.
 */
export interface DayBornClass {
  day: DayBorn;
  /** The Akan name the group is known by. */
  akan: string;
  venue: string;
  leader: string;
  time: string;
}

export const dayBornClasses: DayBornClass[] = [
  { day: "Sunday", akan: "Kwasiada", venue: "Main Auditorium — Left Wing", leader: "Elder Die Ampofo", time: "8:00 AM" },
  { day: "Monday", akan: "Dwoada", venue: "Children's Hall", leader: "Deacon Yaw Osei", time: "8:00 AM" },
  { day: "Tuesday", akan: "Benada", venue: "Counselling Room", leader: "Deaconess Adwoa Nyarko", time: "8:00 AM" },
  { day: "Wednesday", akan: "Wukuada", venue: "Main Auditorium — Right Wing", leader: "Elder Priscilla Amponsah", time: "8:00 AM" },
  { day: "Thursday", akan: "Yawoada", venue: "Youth Room", leader: "Deacon Kofi Boadu", time: "8:00 AM" },
  { day: "Friday", akan: "Fiada", venue: "Prayer Room", leader: "Elder Joseph Boateng", time: "8:00 AM" },
  { day: "Saturday", akan: "Memeneda", venue: "Church Library", leader: "Deaconess Ama Serwaa", time: "8:00 AM" },
];

export function classForDayBorn(day: DayBorn): DayBornClass {
  return dayBornClasses.find((c) => c.day === day) ?? dayBornClasses[0];
}

// ─── The study programme ──────────────────────────────────────────────────────

/**
 * Seed dates run from the Sunday of the current week so the demo always lands on
 * a live week. A real term gets its dates typed in when an admin publishes.
 */
function seedSunday(offsetWeeks: number): string {
  const d = weekStart(new Date());
  d.setDate(d.getDate() + offsetWeeks * 7);
  return isoDate(d);
}

export const bibleStudies: BibleStudy[] = [
  {
    id: "b1",
    weekNumber: 1,
    date: seedSunday(0),
    pages: "pp. 1–18",
    available: true,
    en: {
      title: "The Foundation of Faith",
      chapter: "Hebrews 11:1–6",
      aims: [
        "What faith is, and how Scripture defines it",
        "Why God is pleased by faith and not by works alone",
        "How the elders of old lived by faith before they saw the promise",
      ],
      questions: [
        "What did the elders obtain a good report for?",
        "Why is it impossible to please God without faith?",
        "Where in your own life are you asked to trust before you can see?",
      ],
      memoryVerse: "Hebrews 11:6 — But without faith it is impossible to please him.",
      notes: "Faith is the substance of things hoped for, the evidence of things not seen. This week we look at what it means to be certain of what God has promised before we can see it.",
    },
    tw: {
      title: "Gyidi no Fapem",
      chapter: "Hebrifo 11:1–6",
      aims: [
        "Nea gyidi yɛ, ne sɛnea Twerɛ Kronkron kyerɛkyerɛ ase",
        "Nea enti a gyidi sɔ Onyankopɔn ani sen nnwuma nko ara",
        "Sɛnea tetefo no de gyidi tenaa ase ansa na wɔhu bɔhyɛ no",
      ],
      questions: [
        "Dɛn nti na tetefo no nyaa adanse pa?",
        "Adɛn nti na gyidi nni hɔ a, yɛntumi nsɔ Onyankopɔn ani?",
        "Wo asetena mu he na wɔhwehwɛ sɛ wugye di ansa na woahu?",
      ],
      memoryVerse: "Hebrifo 11:6 — Na gyidi nni hɔ a, yɛrentumi nsɔ n'ani.",
      notes: "Gyidi ne nneɛma a yɛn ani da so no ahotɔso, ne nneɛma a yɛnhu no adanse. Saa dapɛn yi yɛhwɛ nea ɛkyerɛ sɛ yɛwɔ awerɛhyɛm wɔ nea Onyankopɔn ahyɛ ho bɔ ansa na yɛahu.",
    },
  },
  {
    id: "b2",
    weekNumber: 2,
    date: seedSunday(1),
    pages: "pp. 19–34",
    available: true,
    en: {
      title: "Walking in the Spirit",
      chapter: "Galatians 5:16–25",
      aims: [
        "The difference between the works of the flesh and the fruit of the Spirit",
        "What it means, day by day, to walk in the Spirit",
        "How the church helps one another in this walk",
      ],
      questions: [
        "What does it mean, practically, to walk in the Spirit this week?",
        "Which fruit of the Spirit is hardest for you, and why?",
        "How can your day-born group help you grow in it?",
      ],
      memoryVerse: "Galatians 5:25 — If we live in the Spirit, let us also walk in the Spirit.",
      notes: "Paul sets the works of the flesh against the fruit of the Spirit, and calls the believer to live by the Spirit day by day rather than by impulse.",
    },
    tw: {
      title: "Honhom mu Nantew",
      chapter: "Galatifo 5:16–25",
      aims: [
        "Nsonsonoe a ɛda ɔhonam nnwuma ne Honhom no aba ntam",
        "Nea ɛkyerɛ sɛ obi nantew Honhom mu da biara",
        "Sɛnea asafo no boa wɔn ho wɔn ho wɔ saa nantew yi mu",
      ],
      questions: [
        "Da biara asetena mu, dɛn na ɛkyerɛ sɛ yɛnantew Honhom mu saa dapɛn yi?",
        "Honhom no aba mu deɛ ɛwɔ he na ɛyɛ den ma wo, na adɛn?",
        "Ɔkwan bɛn so na wo da a wɔwoo wo kuw no bɛtumi aboa wo ma woanyin wɔ mu?",
      ],
      memoryVerse: "Galatifo 5:25 — Sɛ yɛte ase wɔ Honhom mu a, momma yɛnnantew Honhom mu nso.",
      notes: "Paulo de ɔhonam nnwuma to Honhom no aba anim, na ɔfrɛ ogyidini sɛ ɔmfa Honhom no ntena ase da biara, na ɛnnyɛ n'akoma apɛde so.",
    },
  },
  {
    id: "b3",
    weekNumber: 3,
    date: seedSunday(2),
    pages: "pp. 35–52",
    available: false,
    en: {
      title: "The Power of Prayer",
      chapter: "Matthew 6:5–15",
      aims: [
        "Why the Lord warns against praying to be seen",
        "What each line of the Lord's Prayer asks for",
        "The link between being forgiven and forgiving",
      ],
      questions: [
        "Where, and how, does the Lord tell us to pray?",
        "Which part of the Lord's Prayer do you pray least?",
        "Is there someone you must forgive this week?",
      ],
      memoryVerse: "Matthew 6:6 — Pray to thy Father which is in secret.",
      notes: "The Lord teaches his disciples not only to pray, but how — in secret, without vain repetition, and with a heart ready to forgive.",
    },
    tw: {
      title: "Mpaebɔ Tumi",
      chapter: "Mateo 6:5–15",
      aims: [
        "Adɛn nti na Awurade bɔ kɔkɔ tia mpaebɔ a yɛbɔ sɛ nnipa nhu",
        "Nea Awurade Mpaebɔ no nkyekyem biara srɛ",
        "Abusuabɔ a ɛda bɔnefakyɛ a yɛanya ne bɔnefakyɛ a yɛde ma ntam",
      ],
      questions: [
        "Ɛhe, na sɛnea Awurade ka sɛ yɛmmɔ mpae?",
        "Awurade Mpaebɔ no fa bɛn na wompɛ sɛ wobɔ?",
        "Obi wɔ hɔ a ɛsɛ sɛ wode kyɛ no saa dapɛn yi?",
      ],
      memoryVerse: "Mateo 6:6 — Bɔ wo Agya a ɔwɔ kokoam no mpae.",
      notes: "Awurade nkyerɛkyerɛ n'asuafo sɛ wɔmmɔ mpae nko ara, na mmom sɛnea wɔbɔ — wɔ kokoam, a ɛnnyɛ kasa hunu, na akoma a ɛsiesie ne ho sɛ ɛde bɔne bɛkyɛ.",
    },
  },
  {
    id: "b4",
    weekNumber: 4,
    date: seedSunday(3),
    pages: "pp. 53–68",
    available: false,
    en: {
      title: "Living as the Church",
      chapter: "Acts 2:42–47",
      aims: [
        "The four things the first believers continued in",
        "How they cared for one another's needs",
        "What our own assembly would look like if we lived this out",
      ],
      questions: [
        "What four things did the early church continue in?",
        "How did they care for one another's needs?",
        "What is one thing your group can begin doing this month?",
      ],
      memoryVerse: "Acts 2:42 — And they continued stedfastly in the apostles' doctrine and fellowship.",
      notes: "The first believers continued steadfastly in the apostles' doctrine, in fellowship, in breaking of bread, and in prayers. This week we ask what that looks like in our own assembly.",
    },
    tw: {
      title: "Asafo mu Asetena",
      chapter: "Asomafo Nnwuma 2:42–47",
      aims: [
        "Nneɛma anan a gyidifo a wodi kan no kɔɔ so yɛe",
        "Sɛnea wɔhwɛɛ wɔn ho wɔn ho ahiade so",
        "Sɛnea yɛn asafo no bɛyɛ sɛ yɛn nso yɛyɛ saa a",
      ],
      questions: [
        "Nneɛma anan bɛn na tete asafo no kɔɔ so yɛe?",
        "Sɛnea wɔhwɛɛ wɔn ho wɔn ho ahiade so te sɛn?",
        "Adeɛ baako bɛn na wo kuw no bɛtumi afi ase ayɛ saa bosome yi?",
      ],
      memoryVerse: "Asomafo Nnwuma 2:42 — Na wɔkɔɔ so denneennen wɔ asomafo no nkyerɛkyerɛ ne fekubɔ mu.",
      notes: "Gyidifo a wodi kan no kɔɔ so denneennen wɔ asomafo no nkyerɛkyerɛ, fekubɔ, paanoo bubu ne mpaebɔ mu. Saa dapɛn yi yɛbisa sɛnea ɛte wɔ yɛn ankasa asafo mu.",
    },
  },
];

// ─── Admin hub record sections ────────────────────────────────────────────────

export const recordSections = [
  {
    id: "members",
    title: "Member Directory Data",
    icon: "users",
    desc: "Add members, upload photos, assign IDs and assemblies",
    pct: 87,
    color: "#1E3A8A",
    darkColor: "#3B82F6",
    actions: ["Add New Member", "Upload Profile Photo", "Assign Member ID", "Set Assembly / District"],
    pending: 14,
  },
  {
    id: "attendance",
    title: "Attendance & Geofencing",
    icon: "pin",
    desc: "Configure geofence, service times, and override logs",
    pct: 72,
    color: "#7C3AED",
    darkColor: "#A78BFA",
    actions: ["Set Geofence Coordinates", "Configure Service Times", "Manual Log Override", "Export Attendance Report"],
    pending: 3,
  },
  {
    id: "leadership",
    // Promoting elders and redrawing district boundaries is a super-admin act.
    superAdminOnly: true,
    title: "Leadership & District Roster",
    icon: "award",
    desc: "Assign elders, update contacts, reassign boundaries",
    pct: 95,
    color: "#059669",
    darkColor: "#34D399",
    actions: ["Promote / Assign Elder", "Update Contact Details", "Assign Ministry Role", "Reassign Assembly Boundary"],
    pending: 1,
  },
  {
    id: "milestones",
    title: "Spiritual Milestones Register",
    icon: "cross",
    desc: "Mark baptism dates, confirmations, and certifications",
    pct: 64,
    color: "#DC2626",
    darkColor: "#F87171",
    actions: ["Log Water Baptism", "Record Confirmation", "Add Marriage Certificate", "Mark Special Ordination"],
    pending: 22,
  },
];

/**
 * Record categories an admin may open. The leadership roster changes who holds
 * office and where district lines fall, so only a super admin sees it.
 */
export function visibleRecordSections(role: LoginRole) {
  return recordSections.filter((sec) => !sec.superAdminOnly || role === "superAdmin");
}

// ─── Filters & colour maps ────────────────────────────────────────────────────

export const assemblyFilters = ["All", "SMT", "Royal Assembly", "Upper Room", "Grace Temple"];

/** Church-leader directory filters — the offices, plus an "All" catch-all. */
export const leaderFilters: { label: string; office: LeaderOffice | "All" }[] = [
  { label: "All", office: "All" },
  { label: "Elders", office: "Elder" },
  { label: "Deacons", office: "Deacon" },
  { label: "Deaconesses", office: "Deaconess" },
];
export const memberFilters = ["All Members", "Baptized", "Department Leaders", "Day-Born Leaders"];
export const adminTierFilters = ["All Admins", "District Admins", "Assembly Admins", "Super Admins"];

export const avatarColors = ["#7C3AED", "#7C3AED", "#22C55E", "#3B82F6", "#EC4899", "#EF4444", "#F59E0B", "#14B8A6"];

export const tierColors: Record<AdminTier, { bg: string; text: string; darkBg: string; darkText: string }> = {
  "Super Admin": { bg: "#FEE2E2", text: "#DC2626", darkBg: "#DC262622", darkText: "#F87171" },
  "District Admin": { bg: "#FEF3C7", text: "#D97706", darkBg: "#D9770622", darkText: "#F59E0B" },
  "Assembly Admin": { bg: "#EFF6FF", text: "#1E3A8A", darkBg: "#1E3A8A22", darkText: "#93C5FD" },
};

export const severityColors: Record<AuditLog["severity"], { dot: string; bg: string; darkBg: string }> = {
  info: { dot: "#3B82F6", bg: "#EFF6FF", darkBg: "#1E3A8A22" },
  warning: { dot: "#D97706", bg: "#FEF3C7", darkBg: "#D9770622" },
  critical: { dot: "#DC2626", bg: "#FEE2E2", darkBg: "#DC262622" },
};

// ─── Member directory access ──────────────────────────────────────────────────

/**
 * Who may open the member directory at all.
 *
 * Admins and super admins see the whole assembly. An ordinary member sees it
 * only when they lead a day-born group — and then only their own group.
 */
export function canViewMembers(role: LoginRole, me: Member = ME): boolean {
  if (role === "admin" || role === "superAdmin") return true;
  return me.dayBornLeader;
}

/** The members a given role is allowed to see. */
export function visibleMembers(role: LoginRole, me: Member = ME, source: Member[] = members): Member[] {
  if (role === "admin" || role === "superAdmin") return source;
  if (!me.dayBornLeader) return [];
  return source.filter((m) => m.dayBorn === me.dayBorn);
}

// ─── Settings pages ───────────────────────────────────────────────────────────

export type SettingsTopic =
  | "editProfile"
  | "notificationPrefs"
  | "privacy"
  | "help"
  | "about"
  | "terms";

export interface SettingsPage {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
  contact?: { label: string; value: string; emoji: string }[];
}

export const settingsPages: Record<SettingsTopic, SettingsPage> = {
  editProfile: {
    title: "Edit Profile",
    intro: "Your membership details are held by the assembly office. Ask an administrator to correct anything that looks wrong.",
    sections: [
      { heading: "Photograph", body: "Tap the camera badge on your profile picture to choose a new one from your phone. It is stored on your device until you sync." },
      { heading: "Name & membership ID", body: "These come from the assembly register and cannot be edited in the app. Contact your presiding elder to request a change." },
      { heading: "Phone number", body: "Your number is your sign-in credential. Changing it requires re-verification by an administrator." },
    ],
  },
  notificationPrefs: {
    title: "Notification Settings",
    intro: "Choose which announcements reach your phone. Attendance reminders are always on while a session is open.",
    sections: [
      { heading: "Attendance reminders", body: "A nudge when a session opens at your assembly, and a reminder if you have not marked your presence." },
      { heading: "Events & conventions", body: "District conventions, harvest festivals, and youth week programmes." },
      { heading: "Bible study", body: "A weekly note when the new study guide is published." },
    ],
  },
  privacy: {
    title: "Privacy & Security",
    intro: "What the app collects, why it needs it, and how long it is kept.",
    sections: [
      { heading: "Location", body: "Your location is read only while you mark attendance, to confirm you are inside the auditorium geofence. It is never stored or shared." },
      { heading: "Photographs", body: "A profile picture you choose stays on your device unless you sync it to the assembly register." },
      { heading: "Attendance records", body: "Records are visible to you, your presiding elder, and assembly administrators. They are retained for the church year." },
      { heading: "Signing out", body: "Logging out clears your session on this device. Your records remain with the assembly." },
    ],
  },
  help: {
    title: "Help & Support",
    intro: "Answers to the questions we are asked most. If none of these help, reach the assembly office directly.",
    sections: [
      { heading: "I cannot mark attendance", body: "Check two things: the session must be open, and you must be inside the auditorium. Both show as green on the Attendance tab." },
      { heading: "My OTP did not arrive", body: "Wait for the timer to finish, then tap Resend via SMS. If it still does not arrive, confirm the office has your current number." },
      { heading: "My attendance percentage looks wrong", body: "Records are updated after each service. If a service is missing after 48 hours, speak to your presiding elder." },
      { heading: "I changed my phone", body: "Sign in with the same number on the new device. An administrator can move your number if it has changed." },
    ],
    contact: [
      { label: "Assembly office", value: "+233 53 709 6725", emoji: "phone" },
      { label: "Email", value: "royal.ayigya@cop.gh", emoji: "mail" },
      { label: "Office hours", value: "Tue & Thu, 10:00 AM – 2:00 PM", emoji: "clock" },
    ],
  },
  about: {
    title: "About the App",
    intro: "An attendance and membership companion for The Church of Pentecost, Royal Assembly.",
    sections: [
      { heading: "What it does", body: "Marks service attendance using a geofence, keeps your membership record and milestones, and carries the weekly Bible study guide." },
      { heading: "Built for", body: " The Church Of Pentecost-Royal Assembly ." },
      { heading: "Version", body: "1.0.0 — Expo SDK 57." },
    ],
  },
  terms: {
    title: "Terms & Policies",
    intro: "By using this app you agree to the terms below.",
    sections: [
      { heading: "Acceptable use", body: "The app is for members of The Church of Pentecost. Do not share your sign-in number or mark attendance on another member's behalf." },
      { heading: "Accuracy of records", body: "Attendance are maintained by the assembly. Report discrepancies promptly so they can be corrected." },
      { heading: "Data protection", body: "Personal data is processed for church administration only and is not sold or shared with third parties." },
      { heading: "Changes", body: "These terms may be updated. Continued use after a change means you accept the revised terms." },
    ],
  },
};

// ─── Signed-in identity ───────────────────────────────────────────────────────

export interface SessionUser {
  name: string;
  photo: string;
  avatar: string;
  avatarColor: string;
  subtitle: string;
}

/** Strip formatting so "+233 24 001 0002" and "0240010002" compare equal. */
function normalisePhone(phone: string) {
  return phone.replace(/\s/g, "").replace("+233", "0");
}

/**
 * Work out who just signed in from the verified phone number, so the welcome
 * screen can greet them by name and photo rather than showing a generic splash.
 */
export function resolveSessionUser(phone: string): SessionUser {
  const key = normalisePhone(phone);

  const admin = adminUsers.find((a) => normalisePhone(a.phone) === key);
  if (admin) {
    return {
      name: admin.name,
      photo: admin.photo,
      avatar: admin.avatar,
      avatarColor: admin.avatarColor,
      subtitle: `${admin.tier} · ${admin.assembly}`,
    };
  }

  return {
    name: ME.name,
    photo: ME.photo,
    avatar: ME.avatar,
    avatarColor: ME.avatarColor,
    subtitle: `${ME.assembly} · ${ME.memberId}`,
  };
}

// ─── Shared asset ─────────────────────────────────────────────────────────────

export const pentecostLogo = require("../assets/Pentecost_Logo.png");

/** Backdrop for the post-login welcome splash. */
export const welcomeBackground = require("../assets/welcome-bg.jpg");

/** White seal used by the native splash and the in-app startup screen. */
export const splashMark = require("../assets/splash-mark.png");

/** Purple seal, for the light-mode startup screen. */
export const splashMarkLight = require("../assets/splash-mark-light.png");
