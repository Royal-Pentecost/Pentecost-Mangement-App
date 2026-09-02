import { useState, useEffect, useRef } from "react";
import pentecostLogo from "@/imports/Pentecost_Logo.png";

type Theme = "light" | "dark";
type AppPhase = "login" | "otp" | "app";
type LoginRole = "member" | "admin" | "superAdmin";

// Simulated backend phone-role map
const PHONE_ROLES: Record<string, LoginRole> = {
  "0241010001": "superAdmin",
  "0240010002": "admin",
  "0240010003": "admin",
};
const OTP_CODE = "1234";
type MainTab = "home" | "attendance" | "leaderboard" | "bible";
type AttendanceScenario = "inside-active" | "outside-active" | "inside-closed" | "outside-closed";
type SubScreen = "none" | "elders" | "elderProfile" | "members" | "memberProfile" | "myDashboard" | "adminHub" | "superAdmin";

interface Elder {
  id: string;
  name: string;
  title: string;
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

const elders: Elder[] = [
  {
    id: "e1",
    name: "Elder Emmanuel Mensah",
    title: "Presiding Elder",
    assembly: "Royal Assembly",
    assemblyId: "royal",
    since: "2018",
    photo: "https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?w=300&h=300&fit=crop&auto=format",
    phone: "+233 24 000 1111",
    email: "e.mensah@cop.gh",
    bio: "Elder Emmanuel Mensah has served the Church of Pentecost for over 15 years with a heart for evangelism and pastoral care. He is known for his humble spirit and fervent intercessory prayer. He leads Royal Assembly with wisdom and compassion, discipling the next generation of believers.",
    roles: ["Church Executive Board", "Evangelism Director", "Marriage Counsellor", "Men's Fellowship Chair"],
    officeHours: "Tuesdays & Thursdays: 10:00 AM – 2:00 PM\nSaturdays: 9:00 AM – 12:00 PM",
    avatar: "EM",
    avatarColor: "#1E3A8A",
  },
  {
    id: "e2",
    name: "Elder Joseph Boateng",
    title: "Presiding Elder",
    assembly: "SMT",
    assemblyId: "smt",
    since: "2015",
    photo: "https://images.unsplash.com/photo-1616805765352-beedbad46b2a?w=300&h=300&fit=crop&auto=format",
    phone: "+233 24 000 2222",
    email: "j.boateng@cop.gh",
    bio: "Elder Joseph Boateng has shepherded SMT Assembly since 2015. A trained theologian and community leader, he is passionate about prayer warfare and church planting. Under his leadership, SMT has planted two daughter assemblies in neighbouring districts.",
    roles: ["Prayer & Fasting Committee", "Church Planting Lead", "Youth Ministry Advisor", "District Executive Member"],
    officeHours: "Mondays & Wednesdays: 9:00 AM – 1:00 PM\nFridays: 2:00 PM – 5:00 PM",
    avatar: "JB",
    avatarColor: "#7C3AED",
  },
  {
    id: "e3",
    name: "Elder Akosua Darko",
    title: "Presiding Elder",
    assembly: "Upper Room",
    assemblyId: "upper",
    since: "2020",
    photo: "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=300&h=300&fit=crop&auto=format",
    phone: "+233 24 000 3333",
    email: "a.darko@cop.gh",
    bio: "Elder Akosua Darko is a trailblazer in women's ministry and intercessory prayer. Since leading Upper Room Assembly in 2020, she has cultivated a culture of 24-hour prayer and deep biblical study. She is a sought-after speaker and counsellor across the Ayigya District.",
    roles: ["Women's Ministry Director", "Intercessory Prayer Lead", "Counselling Ministry", "Area Evangelism Team"],
    officeHours: "Tuesdays & Fridays: 8:00 AM – 12:00 PM\nThursdays: 1:00 PM – 4:00 PM",
    avatar: "AD",
    avatarColor: "#059669",
  },
  {
    id: "e4",
    name: "Elder Richard Amoah",
    title: "Presiding Elder",
    assembly: "Grace Temple",
    assemblyId: "grace",
    since: "2021",
    photo: "https://images.unsplash.com/photo-1605602517387-ec78b947335e?w=300&h=300&fit=crop&auto=format",
    phone: "+233 24 000 4444",
    email: "r.amoah@cop.gh",
    bio: "Elder Richard Amoah came to Grace Temple Assembly with a vision for community transformation. A former teacher and social worker, he blends pastoral care with community outreach. His assembly runs literacy programmes, a feeding initiative, and quarterly health screenings for the community.",
    roles: ["Community Outreach Lead", "Finance Committee", "Youth Discipleship Mentor", "PEMEM Coordinator"],
    officeHours: "Mondays & Thursdays: 10:00 AM – 3:00 PM\nSaturdays: 8:00 AM – 11:00 AM",
    avatar: "RA",
    avatarColor: "#D97706",
  },
  {
    id: "e5",
    name: "Elder Priscilla Amponsah",
    title: "Assistant Presiding Elder",
    assembly: "Royal Assembly",
    assemblyId: "royal",
    since: "2022",
    photo: "https://images.unsplash.com/photo-1611432579402-7037e3e2c1e4?w=300&h=300&fit=crop&auto=format",
    phone: "+233 24 000 5555",
    email: "p.amponsah@cop.gh",
    bio: "Elder Priscilla Amponsah serves as Assistant Presiding Elder at Royal Assembly, providing spiritual oversight and administrative leadership. She coordinates the Children's Church and spearheads the assembly's digital ministry to reach younger generations.",
    roles: ["Children's Church Coordinator", "Digital Ministry Lead", "Deaconess Head", "Sunday School Supervisor"],
    officeHours: "Wednesdays: 9:00 AM – 1:00 PM\nSaturdays: 10:00 AM – 2:00 PM",
    avatar: "PA",
    avatarColor: "#EC4899",
  },
];

interface AttendanceLog { date: string; service: string; status: "present" | "absent" | "late"; }
interface TitheRecord { month: string; amount: string; ref: string; }
interface Member {
  id: string;
  memberId: string;
  name: string;
  assembly: string;
  assemblyId: string;
  district: string;
  since: string;
  photo: string;
  phone: string;
  email: string;
  avatar: string;
  avatarColor: string;
  category: "Baptized" | "Tithe Payer" | "Department Leader";
  departments: string[];
  attendancePct: number;
  streak: number;
  attendanceLogs: AttendanceLog[];
  tithePledge: number;
  tithePaid: number;
  titheLogs: TitheRecord[];
  milestones: { label: string; done: boolean }[];
  elderId: string;
}

const members: Member[] = [
  {
    id: "m1", memberId: "MEM-0042", name: "Kwaku Mensah", assembly: "Royal Assembly", assemblyId: "royal",
    district: "Ayigya District", since: "2017", phone: "+233 24 111 2222", email: "k.mensah@gmail.com",
    photo: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=300&h=300&fit=crop&auto=format",
    avatar: "KM", avatarColor: "#1E3A8A", category: "Department Leader",
    departments: ["Youth Choir", "Media Team", "Ushering Team"],
    attendancePct: 94, streak: 12,
    attendanceLogs: [
      { date: "Aug 18, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 13, 2025", service: "Prayer Warfare", status: "present" },
      { date: "Aug 11, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 6, 2025", service: "Prayer Warfare", status: "absent" },
      { date: "Aug 4, 2025", service: "Sunday Divine Service", status: "present" },
    ],
    tithePledge: 1200, tithePaid: 950,
    titheLogs: [
      { month: "August 2025", amount: "GH₵ 120", ref: "TXN-8821" },
      { month: "July 2025", amount: "GH₵ 100", ref: "TXN-8104" },
      { month: "June 2025", amount: "GH₵ 120", ref: "TXN-7388" },
    ],
    milestones: [
      { label: "Water Baptism", done: true },
      { label: "Confirmation", done: true },
      { label: "Marriage Certification", done: false },
    ],
    elderId: "e1",
  },
  {
    id: "m2", memberId: "MEM-0117", name: "Abena Frimpong", assembly: "SMT", assemblyId: "smt",
    district: "Ayigya District", since: "2019", phone: "+233 24 222 3333", email: "a.frimpong@gmail.com",
    photo: "https://images.unsplash.com/photo-1662850886700-4ec19bd30d11?w=300&h=300&fit=crop&auto=format",
    avatar: "AF", avatarColor: "#059669", category: "Baptized",
    departments: ["Women's Ministry", "Sunday School"],
    attendancePct: 88, streak: 7,
    attendanceLogs: [
      { date: "Aug 18, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 11, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 6, 2025", service: "Prayer Warfare", status: "late" },
      { date: "Aug 4, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Jul 28, 2025", service: "Sunday Divine Service", status: "absent" },
    ],
    tithePledge: 800, tithePaid: 680,
    titheLogs: [
      { month: "August 2025", amount: "GH₵ 90", ref: "TXN-8900" },
      { month: "July 2025", amount: "GH₵ 80", ref: "TXN-8201" },
    ],
    milestones: [
      { label: "Water Baptism", done: true },
      { label: "Confirmation", done: true },
      { label: "Marriage Certification", done: true },
    ],
    elderId: "e2",
  },
  {
    id: "m3", memberId: "MEM-0254", name: "Yaw Acheampong", assembly: "Grace Temple", assemblyId: "grace",
    district: "Ayigya District", since: "2021", phone: "+233 24 333 4444", email: "y.acheampong@gmail.com",
    photo: "https://images.unsplash.com/photo-1562173650-f61426fbe683?w=300&h=300&fit=crop&auto=format",
    avatar: "YA", avatarColor: "#D97706", category: "Tithe Payer",
    departments: ["Evangelism Team", "Deacons Board"],
    attendancePct: 76, streak: 3,
    attendanceLogs: [
      { date: "Aug 18, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 11, 2025", service: "Sunday Divine Service", status: "absent" },
      { date: "Aug 4, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Jul 28, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Jul 21, 2025", service: "Sunday Divine Service", status: "absent" },
    ],
    tithePledge: 600, tithePaid: 600,
    titheLogs: [
      { month: "August 2025", amount: "GH₵ 60", ref: "TXN-9011" },
      { month: "July 2025", amount: "GH₵ 60", ref: "TXN-8302" },
      { month: "June 2025", amount: "GH₵ 60", ref: "TXN-7600" },
    ],
    milestones: [
      { label: "Water Baptism", done: true },
      { label: "Confirmation", done: false },
      { label: "Marriage Certification", done: false },
    ],
    elderId: "e4",
  },
  {
    id: "m4", memberId: "MEM-0389", name: "Efua Asante", assembly: "Upper Room", assemblyId: "upper",
    district: "Ayigya District", since: "2016", phone: "+233 24 444 5555", email: "e.asante@gmail.com",
    photo: "https://images.unsplash.com/photo-1508002366005-75a695ee2d17?w=300&h=300&fit=crop&auto=format",
    avatar: "EA", avatarColor: "#7C3AED", category: "Department Leader",
    departments: ["Intercessory Prayer", "Women's Ministry", "Children's Church"],
    attendancePct: 97, streak: 24,
    attendanceLogs: [
      { date: "Aug 18, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 13, 2025", service: "Prayer Warfare", status: "present" },
      { date: "Aug 11, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 6, 2025", service: "Prayer Warfare", status: "present" },
      { date: "Aug 4, 2025", service: "Sunday Divine Service", status: "present" },
    ],
    tithePledge: 1500, tithePaid: 1500,
    titheLogs: [
      { month: "August 2025", amount: "GH₵ 150", ref: "TXN-9100" },
      { month: "July 2025", amount: "GH₵ 150", ref: "TXN-8400" },
      { month: "June 2025", amount: "GH₵ 150", ref: "TXN-7700" },
    ],
    milestones: [
      { label: "Water Baptism", done: true },
      { label: "Confirmation", done: true },
      { label: "Marriage Certification", done: true },
    ],
    elderId: "e3",
  },
  {
    id: "m5", memberId: "MEM-0501", name: "Kofi Boateng", assembly: "Royal Assembly", assemblyId: "royal",
    district: "Ayigya District", since: "2020", phone: "+233 24 555 6666", email: "k.boateng@gmail.com",
    photo: "https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?w=300&h=300&fit=crop&auto=format",
    avatar: "KB", avatarColor: "#EC4899", category: "Baptized",
    departments: ["Youth Fellowship", "Evangelism Team"],
    attendancePct: 82, streak: 5,
    attendanceLogs: [
      { date: "Aug 18, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Aug 11, 2025", service: "Sunday Divine Service", status: "late" },
      { date: "Aug 4, 2025", service: "Sunday Divine Service", status: "present" },
      { date: "Jul 28, 2025", service: "Sunday Divine Service", status: "absent" },
      { date: "Jul 21, 2025", service: "Sunday Divine Service", status: "present" },
    ],
    tithePledge: 500, tithePaid: 300,
    titheLogs: [
      { month: "August 2025", amount: "GH₵ 50", ref: "TXN-9200" },
      { month: "July 2025", amount: "GH₵ 50", ref: "TXN-8500" },
    ],
    milestones: [
      { label: "Water Baptism", done: true },
      { label: "Confirmation", done: false },
      { label: "Marriage Certification", done: false },
    ],
    elderId: "e1",
  },
];

// Logged-in member (first member is "me")
const ME = members[0];

// ─── Super Admin Data ──────────────────────────────────────────────────────────
type AdminTier = "Super Admin" | "District Admin" | "Assembly Admin";

interface AdminUser {
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

interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  affectedRecord: string;
  severity: "info" | "warning" | "critical";
}

const adminUsers: AdminUser[] = [
  { id: "a1", name: "Apostle K. Asante", phone: "+233 24 001 0001", assembly: "Ayigya District", district: "Ayigya District", tier: "Super Admin", photo: "https://images.unsplash.com/photo-1616805765352-beedbad46b2a?w=200&h=200&fit=crop&auto=format", avatar: "KA", avatarColor: "#1E3A8A", since: "2019" },
  { id: "a2", name: "Elder Emmanuel Mensah", phone: "+233 24 001 0002", assembly: "Royal Assembly", district: "Ayigya District", tier: "Assembly Admin", photo: "https://images.unsplash.com/photo-1614023342667-6f060e9d1e04?w=200&h=200&fit=crop&auto=format", avatar: "EM", avatarColor: "#7C3AED", since: "2021" },
  { id: "a3", name: "Elder Joseph Boateng", phone: "+233 24 001 0003", assembly: "SMT", district: "Ayigya District", tier: "Assembly Admin", photo: "https://images.unsplash.com/photo-1631131431211-4f768d89087d?w=200&h=200&fit=crop&auto=format", avatar: "JB", avatarColor: "#059669", since: "2020" },
  { id: "a4", name: "Elder Akosua Darko", phone: "+233 24 001 0004", assembly: "Upper Room", district: "Ayigya District", tier: "Assembly Admin", photo: "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=200&h=200&fit=crop&auto=format", avatar: "AD", avatarColor: "#D97706", since: "2022" },
  { id: "a5", name: "Deacon P. Frimpong", phone: "+233 24 001 0005", assembly: "Ayigya District", district: "Ayigya District", tier: "District Admin", photo: "https://images.unsplash.com/photo-1605602517387-ec78b947335e?w=200&h=200&fit=crop&auto=format", avatar: "PF", avatarColor: "#DC2626", since: "2023" },
  { id: "a6", name: "Elder Richard Amoah", phone: "+233 24 001 0006", assembly: "Grace Temple", district: "Ayigya District", tier: "Assembly Admin", photo: "https://images.unsplash.com/photo-1659093728055-45f8275166d9?w=200&h=200&fit=crop&auto=format", avatar: "RA", avatarColor: "#EC4899", since: "2023" },
];

const auditLogs: AuditLog[] = [
  { id: "l1", timestamp: "10 mins ago", adminName: "Elder Emmanuel Mensah", action: "Created Attendance Session", affectedRecord: "Royal Assembly", severity: "info" },
  { id: "l2", timestamp: "1 hour ago", adminName: "Sis. Ama Poku", action: "Revoked Admin Role", affectedRecord: "#MEM-1042", severity: "critical" },
  { id: "l3", timestamp: "2 hours ago", adminName: "Elder Joseph Boateng", action: "Added New Member Record", affectedRecord: "#MEM-1249", severity: "info" },
  { id: "l4", timestamp: "3 hours ago", adminName: "Elder Akosua Darko", action: "Updated Geofence Boundary", affectedRecord: "Upper Room Assembly", severity: "warning" },
  { id: "l5", timestamp: "5 hours ago", adminName: "Deacon P. Frimpong", action: "Exported Master Records (PDF)", affectedRecord: "All Assemblies", severity: "info" },
  { id: "l6", timestamp: "Yesterday", adminName: "Apostle K. Asante", action: "Granted District Admin Role", affectedRecord: "#MEM-0211", severity: "warning" },
  { id: "l7", timestamp: "Yesterday", adminName: "Elder Richard Amoah", action: "Logged Tithe Batch", affectedRecord: "Grace Temple · Aug 2025", severity: "info" },
];

interface Assembly {
  id: string;
  name: string;
  subtitle: string;
  members: number;
  founded: string;
  pastor: string;
  elder: string;
  history: string;
}

const assemblies: Assembly[] = [
  {
    id: "smt",
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

const carouselPhotos = [
  {
    url: "https://images.unsplash.com/photo-1519491050282-cf00c82424b4?w=800&h=500&fit=crop&auto=format",
    label: "Sunday Divine Service",
  },
  {
    url: "https://images.unsplash.com/photo-1600288480699-0b0d8a456dd8?w=800&h=500&fit=crop&auto=format",
    label: "Praise & Worship",
  },
  {
    url: "https://images.unsplash.com/photo-1521574778337-d962ef81733d?w=800&h=500&fit=crop&auto=format",
    label: "Youth Fellowship",
  },
  {
    url: "https://images.unsplash.com/photo-1560600707-eb15092eb7d9?w=800&h=500&fit=crop&auto=format",
    label: "Congregational Meeting",
  },
  {
    url: "https://images.unsplash.com/photo-1612043496438-43d1975064ab?w=800&h=500&fit=crop&auto=format",
    label: "Mid-Week Prayer",
  },
];

const leaderboardData = {
  consistent: [
    { rank: 1, name: "Kwaku Mensah", present: 48, total: 48, avatar: "KM" },
    { rank: 2, name: "Kwame Asante", present: 46, total: 48, avatar: "KA" },
    { rank: 3, name: "Gifty Owusu", present: 45, total: 48, avatar: "GO" },
    { rank: 4, name: "Emmanuel Boateng", present: 44, total: 48, avatar: "EB" },
    { rank: 5, name: "Priscilla Adjei", present: 43, total: 48, avatar: "PA" },
    { rank: 6, name: "Daniel Acheampong", present: 42, total: 48, avatar: "DA" },
    { rank: 7, name: "Ruth Amoah", present: 40, total: 48, avatar: "RA" },
  ],
  needsEncouragement: [
    { rank: 1, name: "Kofi Amoah", present: 12, total: 48, avatar: "KA" },
    { rank: 2, name: "Ama Frimpong", present: 15, total: 48, avatar: "AF" },
    { rank: 3, name: "Kwabena Sarpong", present: 18, total: 48, avatar: "KS" },
    { rank: 4, name: "Adwoa Ntim", present: 20, total: 48, avatar: "AN" },
    { rank: 5, name: "Fiifi Agyemang", present: 21, total: 48, avatar: "FA" },
  ],
};

const bibleStudies = [
  { week: "Week 1", title: "The Foundation of Faith", chapter: "Hebrews 11:1–6", pages: "pp. 1–18", available: true },
  { week: "Week 2", title: "Walking in the Spirit", chapter: "Galatians 5:16–25", pages: "pp. 19–34", available: true },
  { week: "Week 3", title: "The Power of Prayer", chapter: "Matthew 6:5–15", pages: "pp. 35–52", available: false },
  { week: "Week 4", title: "Living as the Church", chapter: "Acts 2:42–47", pages: "pp. 53–68", available: false },
];

// ─── Icon Components ──────────────────────────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function MapPinIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" fill={active ? "white" : "none"} />
    </svg>
  );
}

function TrophyIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 9a6 6 0 0 0 12 0" />
      <line x1="12" y1="15" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
      <path d="M6 2H3a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4" />
      <path d="M18 2h3a2 2 0 0 1 2 2v2a4 4 0 0 1-4 4" />
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4 transition-transform duration-300" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [appPhase, setAppPhase] = useState<AppPhase>("login");
  const [loginRole, setLoginRole] = useState<LoginRole>("member");
  const [loginPhone, setLoginPhone] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [screen, setScreen] = useState<"home" | "dashboard">("home");
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>("home");
  const [subScreen, setSubScreen] = useState<SubScreen>("none");
  const [selectedElder, setSelectedElder] = useState<Elder | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  // Derived from login role — no separate PIN needed after phone auth
  const adminUnlocked = appPhase === "app" && (loginRole === "admin" || loginRole === "superAdmin");
  const [superAdminUnlocked, setSuperAdminUnlocked] = useState(false);
  const superAdminEffective = superAdminUnlocked || (appPhase === "app" && loginRole === "superAdmin");
  const [showSuperPin, setShowSuperPin] = useState(false);
  const [superPin, setSuperPin] = useState("");
  const [superPinError, setSuperPinError] = useState(false);
  const SUPER_PIN = "9999";
  const [sessionActive, setSessionActive] = useState(false);
  const [userInside, setUserInside] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [membersPresent, setMembersPresent] = useState(89);
  const [firstTimers, setFirstTimers] = useState(7);

  const isDark = theme === "dark";
  const CORRECT_PIN = "1234";

  const handleSelectAssembly = (a: Assembly) => {
    setSelectedAssembly(a);
    setScreen("dashboard");
    setMainTab("home");
    setAttendanceMarked(false);
  };

  const handlePinSubmit = () => {
    if (adminPin === CORRECT_PIN) {
      setShowAdmin(false);
      setPinError(false);
    } else {
      setPinError(true);
      setAdminPin("");
    }
  };

  const handleActivateSession = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setSessionActive(true);
    setSessionStartTime(timeStr);
    setMembersPresent(89);
    setFirstTimers(7);
  };

  const handleTerminateSession = () => {
    setSessionActive(false);
    setSessionStartTime(null);
  };

  const scenario: AttendanceScenario =
    userInside && sessionActive ? "inside-active"
      : !userInside && sessionActive ? "outside-active"
        : userInside && !sessionActive ? "inside-closed"
          : "outside-closed";

  // Show login/OTP screens before the main app
  if (appPhase === "login" || appPhase === "otp") {
    return (
      <div className={isDark ? "dark" : ""} style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="min-h-dvh transition-colors duration-300" style={{ backgroundColor: "var(--background)" }}>
          <div className="max-w-sm mx-auto min-h-dvh">
            <LoginFlow
              isDark={isDark}
              phase={appPhase}
              onPhoneSubmit={(phone) => { setLoginPhone(phone); setAppPhase("otp"); }}
              onOtpVerified={(phone) => {
                const stripped = phone.replace(/\s/g, "").replace("+233", "0");
                const role = PHONE_ROLES[stripped] ?? "member";
                setLoginRole(role);
                setAppPhase("app");
              }}
              loginPhone={loginPhone}
              theme={theme}
              onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isDark ? "dark" : ""} style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="min-h-dvh transition-colors duration-300" style={{ backgroundColor: "var(--background)" }}>
        <div className="max-w-sm mx-auto min-h-dvh relative flex flex-col">

          {/* PIN Modal */}
          {showAdmin && (
            <div className="absolute inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
              <div className="w-full rounded-t-3xl p-6 pb-10 space-y-5" style={{ backgroundColor: "var(--card)" }}>
                <div className="w-10 h-1 rounded-full mx-auto" style={{ backgroundColor: "var(--border)" }} />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: isDark ? "#1E3A8A" : "#EFF6FF" }}>
                    <ShieldIcon />
                  </div>
                  <div>
                    <p className="font-bold text-base" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Admin Access</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Enter your 4-digit PIN to continue</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border-2"
                      style={{ borderColor: pinError ? "#EF4444" : adminPin.length > i ? "var(--primary)" : "var(--border)", backgroundColor: "var(--muted)", color: "var(--foreground)" }}>
                      {adminPin.length > i ? "●" : ""}
                    </div>
                  ))}
                </div>
                {pinError && <p className="text-center text-xs text-red-500 font-medium">Incorrect PIN. Try again.</p>}

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k, i) => (
                    <button key={i} onClick={() => {
                      if (k === "⌫") { setAdminPin(p => p.slice(0, -1)); setPinError(false); }
                      else if (k !== "" && adminPin.length < 4) { const np = adminPin + k; setAdminPin(np); if (np.length === 4) setTimeout(() => { if (np === CORRECT_PIN) { setShowAdmin(false); setPinError(false); } else { setPinError(true); setAdminPin(""); } }, 200); }
                    }}
                      className="h-12 rounded-2xl font-semibold text-lg transition-all active:scale-95"
                      style={{ backgroundColor: k === "" ? "transparent" : "var(--muted)", color: "var(--foreground)", border: k === "" ? "none" : "1px solid var(--border)" }}>
                      {k}
                    </button>
                  ))}
                </div>

                <button onClick={() => { setShowAdmin(false); setAdminPin(""); setPinError(false); }}
                  className="w-full py-3 rounded-2xl text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Super Admin PIN Modal */}
          {showSuperPin && (
            <div className="absolute inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
              <div className="w-full rounded-t-3xl p-6 pb-10 space-y-5" style={{ backgroundColor: "var(--card)" }}>
                <div className="w-10 h-1 rounded-full mx-auto" style={{ backgroundColor: "var(--border)" }} />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#DC262622" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-base" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Super Admin Access</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Enter your Super Admin PIN — restricted access only</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border-2"
                      style={{ borderColor: superPinError ? "#DC2626" : superPin.length > i ? "#DC2626" : "var(--border)", backgroundColor: "var(--muted)", color: "var(--foreground)" }}>
                      {superPin.length > i ? "●" : ""}
                    </div>
                  ))}
                </div>
                {superPinError && <p className="text-center text-xs text-red-500 font-medium">Incorrect Super Admin PIN.</p>}
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k, i) => (
                    <button key={i} onClick={() => {
                      if (k === "⌫") { setSuperPin(p => p.slice(0, -1)); setSuperPinError(false); }
                      else if (k !== "" && superPin.length < 4) {
                        const np = superPin + k;
                        setSuperPin(np);
                        if (np.length === 4) setTimeout(() => {
                          if (np === SUPER_PIN) { setSuperAdminUnlocked(true); setShowSuperPin(false); setSuperPinError(false); setSuperPin(""); setSubScreen("superAdmin"); }
                          else { setSuperPinError(true); setSuperPin(""); }
                        }, 200);
                      }
                    }}
                      className="h-12 rounded-2xl font-semibold text-lg transition-all active:scale-95"
                      style={{ backgroundColor: k === "" ? "transparent" : "var(--muted)", color: "var(--foreground)", border: k === "" ? "none" : "1px solid var(--border)" }}>
                      {k}
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowSuperPin(false); setSuperPin(""); setSuperPinError(false); }}
                  className="w-full py-3 rounded-2xl text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {screen === "home" ? (
            <HomeScreen
              isDark={isDark}
              theme={theme}
              onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
              onSelectAssembly={handleSelectAssembly}
            />
          ) : (
            <>
              {/* Dashboard with persistent tab bar */}
              <DashboardShell
                isDark={isDark}
                assembly={selectedAssembly!}
                mainTab={mainTab}
                onChangeTab={(t) => { setMainTab(t); setSubScreen("none"); }}
                onBack={() => {
                  if (subScreen === "elderProfile") { setSubScreen("elders"); setSelectedElder(null); }
                  else if (subScreen === "elders") { setSubScreen("none"); }
                  else if (subScreen === "memberProfile") { setSubScreen("members"); setSelectedMember(null); }
                  else if (subScreen === "members") { setSubScreen("none"); }
                  else if (subScreen === "myDashboard") { setSubScreen("none"); }
                  else if (subScreen === "adminHub") { setSubScreen("none"); }
                  else if (subScreen === "superAdmin") { setSubScreen("adminHub"); }
                  else { setScreen("home"); }
                }}
                scenario={scenario}
                sessionActive={sessionActive}
                sessionStartTime={sessionStartTime}
                membersPresent={membersPresent}
                firstTimers={firstTimers}
                adminUnlocked={adminUnlocked}
                onShowAdmin={() => setShowAdmin(true)}
                onActivateSession={handleActivateSession}
                onTerminateSession={handleTerminateSession}
                userInside={userInside}
                onToggleLocation={() => setUserInside(v => !v)}
                attendanceMarked={attendanceMarked}
                onMarkAttendance={() => { setAttendanceMarked(true); setMembersPresent(p => p + 1); }}
                theme={theme}
                onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
                subScreen={subScreen}
                selectedElder={selectedElder}
                onOpenElders={() => setSubScreen("elders")}
                onSelectElder={(e) => { setSelectedElder(e); setSubScreen("elderProfile"); }}
                selectedMember={selectedMember}
                onOpenMembers={() => setSubScreen("members")}
                onSelectMember={(m) => { setSelectedMember(m); setSubScreen("memberProfile"); }}
                onOpenMyDashboard={() => setSubScreen("myDashboard")}
                onOpenAdminHub={() => setSubScreen("adminHub")}
                superAdminUnlocked={superAdminEffective}
                onOpenSuperAdmin={() => {
                  if (superAdminEffective) { setSubScreen("superAdmin"); }
                  else { setShowSuperPin(true); }
                }}
                loginRole={loginRole}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

function HomeScreen({ isDark, theme, onToggleTheme, onSelectAssembly }: {
  isDark: boolean; theme: Theme;
  onToggleTheme: () => void;
  onSelectAssembly: (a: Assembly) => void;
}) {
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="sticky top-0 z-20 px-5 pt-12 pb-4 flex items-center justify-between"
        style={{ backgroundColor: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center">
            <img src={pentecostLogo} alt="The Church of Pentecost logo" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>The Church of Pentecost</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: isDark ? "#F59E0B22" : "#FEF3C7", color: isDark ? "#F59E0B" : "#92400E" }}>
                <img src={pentecostLogo} alt="" className="w-3.5 h-3.5 object-contain opacity-70" />
                Ayigya District
              </span>
            </div>
          </div>
        </div>
        <button onClick={onToggleTheme}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
          style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
          {theme === "light" ? <MoonSVG /> : <SunSVG />}
        </button>
      </header>

      <main className="flex-1 px-5 pb-8 space-y-5 overflow-y-auto pt-5">
        <div>
          <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{today}</p>
          <h1 className="text-2xl font-bold mt-1 leading-tight" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>
            Good day, <span style={{ color: "var(--primary)" }}>Faithful One</span>
          </h1>
        </div>

        <div className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: isDark ? "linear-gradient(135deg,#1E3A8A,#0F172A)" : "linear-gradient(135deg,#1E3A8A,#2563EB)" }}>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 w-16 h-16">
            <img src={pentecostLogo} alt="" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-1">Welcome</p>
          <p className="text-white font-semibold text-base leading-snug max-w-[80%]">Select your Local Assembly to proceed</p>
          <div className="mt-3 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-blue-200 text-xs">4 Assemblies Active Today</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Local Assemblies</h2>
          <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{assemblies.length} total</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {assemblies.map((a) => (
            <button key={a.id} onClick={() => onSelectAssembly(a)}
              className="rounded-2xl p-4 text-left flex flex-col gap-3 border transition-all duration-200 active:scale-95 hover:shadow-md"
              style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
              <div className="w-11 h-11 rounded-xl bg-white overflow-hidden shadow-sm flex items-center justify-center">
                <img src={pentecostLogo} alt={`${a.name} logo`} className="w-10 h-10 object-contain" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm leading-tight" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>{a.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{a.members} members</p>
              </div>
              <div className="self-end w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl p-4 flex items-center justify-around"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          {[["317", "Expected", "This Sunday"], ["289", "Last Week", "Attendance"], ["12", "This Month", "New Comers"]].map(([v, s, l], i) => (
            <div key={i} className="text-center">
              <p className="text-xl font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--primary)" }}>{v}</p>
              <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{s}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{l}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── Dashboard Shell with Tab Bar ─────────────────────────────────────────────

function DashboardShell({
  isDark, assembly, mainTab, onChangeTab, onBack, scenario,
  sessionActive, sessionStartTime, membersPresent, firstTimers,
  adminUnlocked, onShowAdmin, onActivateSession, onTerminateSession,
  userInside, onToggleLocation, attendanceMarked, onMarkAttendance,
  theme, onToggleTheme, subScreen, selectedElder, onOpenElders, onSelectElder,
  selectedMember, onOpenMembers, onSelectMember, onOpenMyDashboard, onOpenAdminHub,
  superAdminUnlocked, onOpenSuperAdmin, loginRole,
}: {
  isDark: boolean; assembly: Assembly; mainTab: MainTab;
  onChangeTab: (t: MainTab) => void; onBack: () => void;
  scenario: AttendanceScenario; sessionActive: boolean;
  sessionStartTime: string | null; membersPresent: number; firstTimers: number;
  adminUnlocked: boolean; onShowAdmin: () => void;
  onActivateSession: () => void; onTerminateSession: () => void;
  userInside: boolean; onToggleLocation: () => void;
  attendanceMarked: boolean; onMarkAttendance: () => void;
  theme: Theme; onToggleTheme: () => void;
  subScreen: SubScreen; selectedElder: Elder | null;
  onOpenElders: () => void; onSelectElder: (e: Elder) => void;
  selectedMember: Member | null;
  onOpenMembers: () => void; onSelectMember: (m: Member) => void;
  onOpenMyDashboard: () => void;
  onOpenAdminHub: () => void;
  superAdminUnlocked: boolean;
  onOpenSuperAdmin: () => void;
  loginRole: LoginRole;
}) {
  const tabs: { id: MainTab; label: string; Icon: React.ComponentType<{ active: boolean }> }[] = [
    { id: "home", label: "Home", Icon: HomeIcon },
    { id: "attendance", label: "Attendance", Icon: MapPinIcon },
    { id: "leaderboard", label: "Leaders", Icon: TrophyIcon },
    { id: "bible", label: "Bible", Icon: BookIcon },
  ];

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Top Nav */}
      <header className="sticky top-0 z-20 px-4 pt-12 pb-3"
        style={{ backgroundColor: "var(--background)" }}>
        {/* Glass blur strip */}
        <div className="absolute inset-0" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", backgroundColor: isDark ? "rgba(15,23,42,0.85)" : "rgba(248,249,250,0.88)" }} />

        <div className="relative flex items-center gap-3">
          {/* Back button */}
          <button onClick={onBack}
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ backgroundColor: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
            <ArrowLeft />
          </button>

          {/* Title block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-4 h-4 rounded-md overflow-hidden bg-white flex-shrink-0" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
                <img src={pentecostLogo} alt="" className="w-full h-full object-contain" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest truncate" style={{ color: "var(--muted-foreground)" }}>
                {subScreen === "elders" ? "Directory" : subScreen === "elderProfile" ? "Elder Profile" : subScreen === "members" ? "Members" : subScreen === "memberProfile" ? "Member Profile" : subScreen === "myDashboard" ? "Personal" : subScreen === "adminHub" ? "Admin Hub" : subScreen === "superAdmin" ? "Restricted" : "Assembly"}
              </p>
            </div>
            <h2 className="text-[17px] font-extrabold leading-tight truncate" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>
              {subScreen === "elders" ? "Presiding Elders" : subScreen === "elderProfile" ? (selectedElder?.name.replace("Elder ", "") ?? "") : subScreen === "members" ? "All Members" : subScreen === "memberProfile" ? (selectedMember?.name ?? "") : subScreen === "myDashboard" ? "My Dashboard" : subScreen === "adminHub" ? "Master Data Management" : subScreen === "superAdmin" ? "Super Admin Control" : assembly.name}
            </h2>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Role badge */}
            {loginRole === "superAdmin" && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{ background: "linear-gradient(135deg,#7f1d1d,#DC2626)", color: "white", letterSpacing: "0.04em" }}>
                👑 Super
              </span>
            )}
            {loginRole === "admin" && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                style={{ background: isDark ? "linear-gradient(135deg,#14532d,#16a34a)" : "linear-gradient(135deg,#dcfce7,#bbf7d0)", color: isDark ? "white" : "#166534", border: isDark ? "none" : "1px solid #86efac" }}>
                <ShieldIcon /> Admin
              </span>
            )}

            {/* Theme toggle */}
            <button onClick={onToggleTheme}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
              {theme === "light" ? <MoonSVG /> : <SunSVG />}
            </button>

            {/* Bell */}
            <button className="w-8 h-8 rounded-xl flex items-center justify-center relative transition-all active:scale-90"
              style={{ backgroundColor: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
              <BellIcon />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full border-2 bg-red-500"
                style={{ borderColor: "var(--background)" }} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative mt-3 h-px" style={{ background: `linear-gradient(90deg, transparent, var(--border), transparent)` }} />
      </header>

      {/* Tab Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {subScreen === "elders" && (
          <EldersDirectory isDark={isDark} onSelectElder={onSelectElder} />
        )}
        {subScreen === "elderProfile" && selectedElder && (
          <ElderProfile isDark={isDark} elder={selectedElder} />
        )}
        {subScreen === "members" && (
          <MembersDirectory isDark={isDark} onSelectMember={onSelectMember} />
        )}
        {subScreen === "memberProfile" && selectedMember && (
          <MemberProfile isDark={isDark} member={selectedMember} elders={elders} />
        )}
        {subScreen === "myDashboard" && (
          <MyDashboard isDark={isDark} scenario={scenario} sessionActive={sessionActive} attendanceMarked={attendanceMarked} onMarkAttendance={() => { }} elders={elders} onOpenElders={onOpenElders} />
        )}
        {subScreen === "adminHub" && (
          <AdminHub isDark={isDark} sessionActive={sessionActive} membersPresent={membersPresent} onOpenSuperAdmin={onOpenSuperAdmin} superAdminUnlocked={superAdminUnlocked} loginRole={loginRole} />
        )}
        {subScreen === "superAdmin" && (
          <SuperAdminHub isDark={isDark} />
        )}
        {subScreen === "none" && mainTab === "home" && (
          <HomeTab isDark={isDark} assembly={assembly} sessionActive={sessionActive} onShowAdmin={onShowAdmin} adminUnlocked={adminUnlocked} onOpenElders={onOpenElders} onOpenMembers={onOpenMembers} onOpenMyDashboard={onOpenMyDashboard}
            sessionStartTime={sessionStartTime} membersPresent={membersPresent} firstTimers={firstTimers}
            onActivateSession={onActivateSession} onTerminateSession={onTerminateSession} onOpenAdminHub={onOpenAdminHub} />
        )}
        {subScreen === "none" && mainTab === "attendance" && (
          <AttendanceTab isDark={isDark} scenario={scenario} sessionActive={sessionActive} userInside={userInside}
            onToggleLocation={onToggleLocation} attendanceMarked={attendanceMarked} onMarkAttendance={onMarkAttendance} />
        )}
        {subScreen === "none" && mainTab === "leaderboard" && <LeaderboardTab isDark={isDark} />}
        {subScreen === "none" && mainTab === "bible" && <BibleTab isDark={isDark} />}
      </main>

      {/* Admin Panel rendered inside HomeTab scroll — no fixed overlay */}

      {/* Persistent Tab Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm z-40 px-4 pb-6 pt-2"
        style={{ backgroundColor: "var(--background)", borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center justify-around">
          {tabs.map(({ id, label, Icon }) => {
            const active = mainTab === id;
            return (
              <button key={id} onClick={() => onChangeTab(id)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 active:scale-90"
                style={{ color: active ? "var(--primary)" : "var(--muted-foreground)", backgroundColor: active ? (isDark ? "#1E3A8A22" : "#EFF6FF") : "transparent" }}>
                <Icon active={active} />
                <span className="text-[10px] font-semibold">{label}</span>
                {id === "attendance" && !active && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sessionActive ? "#22C55E" : "#6B7280" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Admin toggle button — only visible to admins */}
        {adminUnlocked && (
          <button onClick={onShowAdmin}
            className="absolute right-6 -top-4 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
            style={{ backgroundColor: "var(--primary)", color: "white" }}>
            <ShieldIcon />
          </button>
        )}
      </nav>
    </div>
  );
}

// ─── Home Tab ─────────────────────────────────────────────────────────────────

function HomeTab({ isDark, assembly, sessionActive, onShowAdmin, adminUnlocked, onOpenElders, onOpenMembers, onOpenMyDashboard,
  sessionStartTime, membersPresent, firstTimers, onActivateSession, onTerminateSession, onOpenAdminHub }: {
    isDark: boolean; assembly: Assembly; sessionActive: boolean;
    onShowAdmin: () => void; adminUnlocked: boolean;
    onOpenElders: () => void; onOpenMembers: () => void; onOpenMyDashboard: () => void;
    sessionStartTime: string | null; membersPresent: number; firstTimers: number;
    onActivateSession: () => void; onTerminateSession: () => void; onOpenAdminHub: () => void;
  }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(i => (i + 1) % carouselPhotos.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4 pb-4">
      {/* Photo Carousel */}
      <div className="relative overflow-hidden" style={{ height: 220 }}>
        <div ref={trackRef} className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${slideIndex * 100}%)`, width: `${carouselPhotos.length * 100}%` }}>
          {carouselPhotos.map((photo, i) => (
            <div key={i} className="relative flex-shrink-0 bg-blue-950" style={{ width: `${100 / carouselPhotos.length}%` }}>
              <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
              <div className="absolute bottom-3 left-4">
                <span className="text-white text-xs font-semibold px-2 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(30,58,138,0.75)", backdropFilter: "blur(4px)" }}>
                  {photo.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {carouselPhotos.map((_, i) => (
            <button key={i} onClick={() => setSlideIndex(i)}
              className="rounded-full transition-all duration-300"
              style={{ width: i === slideIndex ? 16 : 6, height: 6, backgroundColor: i === slideIndex ? "white" : "rgba(255,255,255,0.45)" }} />
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Attendance Status Banner */}
        {sessionActive ? (
          <div className="rounded-2xl p-3.5 flex items-center gap-3"
            style={{ backgroundColor: isDark ? "#14532D22" : "#F0FDF4", border: `1.5px solid ${isDark ? "#4ADE80" : "#22C55E"}` }}>
            <div className="relative flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-60" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: isDark ? "#4ADE80" : "#166534" }}>Attendance Open</p>
              <p className="text-xs" style={{ color: isDark ? "#86EFAC" : "#16A34A" }}>Tap the Attendance tab to mark your presence</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-3.5 flex items-center gap-3"
            style={{ backgroundColor: "var(--muted)", border: "1.5px solid var(--border)" }}>
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--muted-foreground)" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>Attendance Closed</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Service has not started — session not yet activated</p>
            </div>
          </div>
        )}

        {/* History Card */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <button onClick={() => setHistoryOpen(o => !o)}
            className="w-full flex items-center justify-between p-4 transition-all active:opacity-80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-sm flex items-center justify-center">
                <img src={pentecostLogo} alt="" className="w-8 h-8 object-contain" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>
                  History of {assembly.name}
                </p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Est. {assembly.founded}</p>
              </div>
            </div>
            <div style={{ color: "var(--muted-foreground)" }}><ChevronDown open={historyOpen} /></div>
          </button>

          {historyOpen && (
            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm leading-relaxed pt-3" style={{ color: "var(--muted-foreground)" }}>{assembly.history}</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  ["District Pastor", assembly.pastor],
                  ["Presiding Elder", assembly.elder],
                  ["Founded", assembly.founded],
                  ["Members", String(assembly.members)],
                ].map(([label, value], i) => (
                  <div key={i} className="rounded-xl p-3" style={{ backgroundColor: "var(--muted)" }}>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--foreground)" }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          {[["47", "Today", "Present"], ["12", "Absent", "Today"], ["5", "Visitors", "Today"]].map(([v, s, l], i) => (
            <div key={i} className="rounded-2xl p-3 text-center" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-xl font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--primary)" }}>{v}</p>
              <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{s}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{l}</p>
            </div>
          ))}
        </div>

        {/* Quick directory shortcuts */}
        <div className="space-y-2.5">
          {[
            { label: "My Dashboard", sub: `Welcome back, ${ME.name.split(" ")[0]}`, icon: "🏠", accent: isDark ? "#3B82F6" : "#1E3A8A", fn: onOpenMyDashboard },
            { label: "Presiding Elders Directory", sub: `${elders.length} elders across all assemblies`, icon: "👤", accent: isDark ? "#F59E0B" : "#D97706", fn: onOpenElders },
            { label: "Church Members Directory", sub: `${members.length} registered members`, icon: "👥", accent: isDark ? "#22C55E" : "#16A34A", fn: onOpenMembers },
          ].map((item, i) => (
            <button key={i} onClick={item.fn}
              className="w-full rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-95 hover:shadow-md"
              style={{ backgroundColor: "var(--card)", border: `1px solid var(--border)` }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ backgroundColor: item.accent + "18" }}>
                {item.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-sm" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{item.sub}</p>
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.accent + "18" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="w-3.5 h-3.5" style={{ color: item.accent }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Admin Panel — inline in scroll, only when unlocked */}
        {adminUnlocked && (
          <AdminPanel isDark={isDark} sessionActive={sessionActive} sessionStartTime={sessionStartTime}
            membersPresent={membersPresent} firstTimers={firstTimers}
            onActivate={onActivateSession} onTerminate={onTerminateSession}
            onOpenAdminHub={onOpenAdminHub} />
        )}
      </div>
    </div>
  );
}

// ─── Admin Panel ───────────────────────────────────────────────────────────────

function AdminPanel({ isDark, sessionActive, sessionStartTime, membersPresent, firstTimers, onActivate, onTerminate, onOpenAdminHub }: {
  isDark: boolean; sessionActive: boolean; sessionStartTime: string | null;
  membersPresent: number; firstTimers: number;
  onActivate: () => void; onTerminate: () => void; onOpenAdminHub: () => void;
}) {
  return (
    <div className="mx-5 mb-6 rounded-3xl p-4 space-y-3 shadow-sm"
      style={{ backgroundColor: "var(--card)", border: `2px solid ${isDark ? "#3B82F6" : "#1E3A8A"}` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldIcon />
          <p className="text-sm font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Admin Session Panel</p>
        </div>
        {sessionActive && sessionStartTime && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: isDark ? "#14532D44" : "#DCFCE7", color: isDark ? "#4ADE80" : "#166534" }}>
            Since {sessionStartTime}
          </span>
        )}
      </div>

      {/* Live counter */}
      <div className="rounded-2xl p-3 flex items-center justify-around"
        style={{ backgroundColor: "var(--muted)" }}>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--primary)" }}>{membersPresent}</p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Members Present</p>
        </div>
        <div className="w-px h-10" style={{ backgroundColor: "var(--border)" }} />
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: isDark ? "#F59E0B" : "#D97706" }}>{firstTimers}</p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>First Timers</p>
        </div>
      </div>

      {sessionActive ? (
        <button onClick={onTerminate}
          className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{ backgroundColor: "#EF4444", color: "white", fontFamily: "'Outfit', sans-serif" }}>
          <span>■</span> Terminate Attendance Session
        </button>
      ) : (
        <button onClick={onActivate}
          className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{ backgroundColor: "#22C55E", color: "white", fontFamily: "'Outfit', sans-serif" }}>
          <span>▶</span> Activate Attendance Session
        </button>
      )}
      <button onClick={onOpenAdminHub}
        className="w-full py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
        style={{ backgroundColor: isDark ? "#1E3A8A33" : "#EFF6FF", color: isDark ? "#93C5FD" : "#1E3A8A", border: `1px solid ${isDark ? "#3B82F644" : "#BFDBFE"}` }}>
        🗂️ Open Master Data Hub
      </button>
    </div>
  );
}

// ─── Attendance Tab ────────────────────────────────────────────────────────────

function AttendanceTab({ isDark, scenario, sessionActive, userInside, onToggleLocation, attendanceMarked, onMarkAttendance }: {
  isDark: boolean; scenario: AttendanceScenario; sessionActive: boolean;
  userInside: boolean; onToggleLocation: () => void;
  attendanceMarked: boolean; onMarkAttendance: () => void;
}) {
  const btnConfig: Record<AttendanceScenario, { label: string; enabled: boolean; color: string }> = {
    "inside-active": { label: attendanceMarked ? "Attendance Marked ✓" : "Mark Attendance Now", enabled: !attendanceMarked, color: isDark ? "#3B82F6" : "#1E3A8A" },
    "outside-active": { label: "Out of Range — You must be inside the church auditorium", enabled: false, color: "var(--muted-foreground)" },
    "inside-closed": { label: "Attendance Session Closed by Admin", enabled: false, color: "var(--muted-foreground)" },
    "outside-closed": { label: "Attendance Session Closed by Admin", enabled: false, color: "var(--muted-foreground)" },
  };
  const btn = btnConfig[scenario];

  return (
    <div className="px-5 pt-5 pb-4 space-y-4">
      {/* Condition badges */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl p-3 flex items-center gap-2.5"
          style={{ backgroundColor: "var(--card)", border: `1.5px solid ${sessionActive ? (isDark ? "#4ADE80" : "#22C55E") : "var(--border)"}` }}>
          <div className="relative flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sessionActive ? "#22C55E" : "#6B7280" }} />
            {sessionActive && <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-60" />}
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: sessionActive ? (isDark ? "#4ADE80" : "#166534") : "var(--muted-foreground)" }}>
              {sessionActive ? "Session Active" : "Session Closed"}
            </p>
            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Condition 1</p>
          </div>
        </div>

        <div className="rounded-2xl p-3 flex items-center gap-2.5"
          style={{ backgroundColor: "var(--card)", border: `1.5px solid ${userInside ? (isDark ? "#3B82F6" : "#1E3A8A") : "var(--border)"}` }}>
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: userInside ? (isDark ? "#3B82F6" : "#1E3A8A") : "#6B7280" }} />
          <div>
            <p className="text-xs font-bold" style={{ color: userInside ? "var(--primary)" : "var(--muted-foreground)" }}>
              {userInside ? "Inside Geofence" : "Outside Geofence"}
            </p>
            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Condition 2</p>
          </div>
        </div>
      </div>

      {/* Map UI */}
      <div className="rounded-3xl overflow-hidden relative" style={{ height: 260, backgroundColor: isDark ? "#0F1F3D" : "#DBEAFE" }}>
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          {[40, 80, 120, 160, 200, 240].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke={isDark ? "#3B82F6" : "#1E3A8A"} strokeWidth="0.5" />)}
          {[40, 80, 120, 160, 200, 240, 280, 320, 360].map(x => <line key={x} x1={x} y1="0" x2={x} y2="280" stroke={isDark ? "#3B82F6" : "#1E3A8A"} strokeWidth="0.5" />)}
        </svg>

        {/* Geofence circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
            <div className="absolute inset-0 rounded-full" style={{ backgroundColor: isDark ? "rgba(59,130,246,0.12)" : "rgba(30,58,138,0.10)", border: `2px solid ${isDark ? "rgba(59,130,246,0.5)" : "rgba(30,58,138,0.4)"}` }} />
            <div className="absolute rounded-full" style={{ inset: 20, backgroundColor: isDark ? "rgba(59,130,246,0.07)" : "rgba(30,58,138,0.07)", border: `1px dashed ${isDark ? "rgba(59,130,246,0.35)" : "rgba(30,58,138,0.3)"}` }} />

            {/* Church marker */}
            <div className="absolute flex flex-col items-center" style={{ top: "30%", left: "50%", transform: "translateX(-50%)" }}>
              <div className="w-8 h-8 rounded-xl bg-white shadow-lg flex items-center justify-center">
                <img src={pentecostLogo} alt="" className="w-7 h-7 object-contain" />
              </div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent"
                style={{ borderTopColor: "white" }} />
            </div>

            {/* User dot */}
            <div className="absolute" style={{ top: userInside ? "55%" : "90%", left: userInside ? "55%" : "85%", transition: "all 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}>
              <div className="w-4 h-4 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                style={{ backgroundColor: userInside ? "#22C55E" : "#EF4444" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
              <div className="absolute inset-0 rounded-full animate-ping opacity-60"
                style={{ backgroundColor: userInside ? "#22C55E" : "#EF4444" }} />
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-4">
          <p className="text-xs font-bold" style={{ color: isDark ? "#93C5FD" : "#1E3A8A" }}>📍 Royal Assembly Auditorium</p>
        </div>
        <div className="absolute top-3 right-4 px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: isDark ? "rgba(15,23,42,0.8)" : "rgba(255,255,255,0.85)", color: userInside ? (isDark ? "#4ADE80" : "#166534") : "#EF4444", backdropFilter: "blur(4px)" }}>
          {userInside ? "You are inside" : "You are outside"}
        </div>
      </div>

      {/* Location toggle (demo control) */}
      <button onClick={onToggleLocation}
        className="w-full py-2.5 rounded-2xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
        style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
        📡 Simulate: Toggle GPS Location ({userInside ? "Move Outside" : "Move Inside"})
      </button>

      {/* Smart CTA */}
      <button onClick={btn.enabled ? onMarkAttendance : undefined}
        className="w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 leading-snug text-center px-4"
        style={{
          backgroundColor: btn.enabled ? btn.color : "var(--muted)",
          color: btn.enabled ? "white" : "var(--muted-foreground)",
          fontFamily: "'Outfit', sans-serif",
          cursor: btn.enabled ? "pointer" : "not-allowed",
          opacity: btn.enabled ? 1 : 0.75,
          border: btn.enabled ? "none" : "1px solid var(--border)",
          transition: "all 0.2s",
        }}>
        {btn.label}
      </button>

      {attendanceMarked && (
        <div className="rounded-2xl p-3.5 flex items-center gap-3"
          style={{ backgroundColor: isDark ? "#14532D22" : "#F0FDF4", border: "1.5px solid #22C55E" }}>
          <span className="text-green-500 text-xl">✓</span>
          <div>
            <p className="text-sm font-bold" style={{ color: isDark ? "#4ADE80" : "#166534" }}>Attendance Recorded!</p>
            <p className="text-xs" style={{ color: isDark ? "#86EFAC" : "#16A34A" }}>
              {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })} · Royal Assembly
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────

const avatarColors = ["#7C3AED", "#7C3AED", "#22C55E", "#3B82F6", "#EC4899", "#EF4444", "#F59E0B", "#14B8A6"];

function LeaderboardTab({ isDark }: { isDark: boolean }) {
  const [subTab, setSubTab] = useState<"consistent" | "encourage">("consistent");
  const data = subTab === "consistent" ? leaderboardData.consistent : leaderboardData.needsEncouragement;

  const streaks: Record<number, string> = { 1: "12 week streak", 2: "10 week streak", 3: "9 week streak", 4: "8 week streak", 5: "7 week streak", 6: "6 week streak", 7: "5 week streak" };

  // Podium order: 2nd, 1st, 3rd
  const top3 = [data[1], data[0], data[2]];
  const podiumRanks = [2, 1, 3];
  const podiumMedalColors = ["#94A3B8", "#F59E0B", "#CD7C2F"];
  const podiumAvatarColors = ["#7C3AED", "#7C3AED", "#22C55E"];
  const podiumPctBg = [
    isDark ? "#1E293B" : "#F1F5F9",
    isDark ? "#2D2008" : "#FEF9EC",
    isDark ? "#1E293B" : "#F1F5F9",
  ];
  const podiumPctColor = [
    isDark ? "#94A3B8" : "#475569",
    isDark ? "#F59E0B" : "#D97706",
    isDark ? "#F59E0B" : "#D97706",
  ];
  const podiumHeights = [88, 110, 76];

  return (
    <div className="pb-4">
      {/* Sub-tabs */}
      <div className="flex border-b px-5" style={{ borderColor: "var(--border)" }}>
        {[["consistent", "Consistent"], ["encourage", "Encouragement"]].map(([id, label]) => (
          <button key={id} onClick={() => setSubTab(id as "consistent" | "encourage")}
            className="flex-1 py-3 text-sm font-semibold transition-all relative"
            style={{ color: subTab === id ? "var(--primary)" : "var(--muted-foreground)" }}>
            {label}
            {subTab === id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
            )}
          </button>
        ))}
      </div>

      {/* Podium */}
      <div className="px-5 pt-6 pb-2 flex items-end justify-center gap-4">
        {top3.map((m, i) => {
          if (!m) return <div key={i} className="w-20" />;
          const pct = Math.round((m.present / m.total) * 100);
          const isFirst = podiumRanks[i] === 1;
          return (
            <div key={m.rank} className="flex flex-col items-center gap-1" style={{ width: 80 }}>
              {/* Medal icon */}
              <div className="text-xl mb-0.5">
                {podiumRanks[i] === 1 ? "🥇" : podiumRanks[i] === 2 ? "🥈" : "🥉"}
              </div>

              {/* Avatar */}
              <div
                className="rounded-full flex items-center justify-center font-bold text-white shadow-md"
                style={{
                  width: isFirst ? 56 : 48,
                  height: isFirst ? 56 : 48,
                  backgroundColor: podiumAvatarColors[i],
                  fontSize: isFirst ? 18 : 15,
                  border: `3px solid ${podiumMedalColors[i]}`,
                }}
              >
                {m.avatar}
              </div>

              {/* Name */}
              <p className="text-xs font-semibold text-center leading-tight mt-1"
                style={{ color: "var(--foreground)" }}>
                {m.name.split(" ")[0]}
              </p>

              {/* Podium block with pct */}
              <div
                className="w-full rounded-t-xl flex items-center justify-center mt-1"
                style={{
                  height: podiumHeights[i],
                  backgroundColor: podiumPctBg[i],
                  border: `1px solid ${isFirst ? (isDark ? "#F59E0B44" : "#F59E0B55") : "var(--border)"}`,
                }}
              >
                <p className="font-bold text-base" style={{ color: podiumPctColor[i], fontFamily: "'Outfit', sans-serif" }}>
                  {pct}%
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* All Rankings list */}
      <div className="px-5 pt-3 space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)" }}>
          All Rankings
        </p>
        {data.map((m, i) => {
          const pct = Math.round((m.present / m.total) * 100);
          const streak = streaks[m.rank] ?? `${m.rank} week streak`;
          const medalEmoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

          return (
            <div key={m.rank} className="flex items-center gap-3 rounded-2xl px-3 py-3"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              {/* Rank badge */}
              <div className="w-8 flex items-center justify-center flex-shrink-0">
                {medalEmoji ? (
                  <span className="text-xl">{medalEmoji}</span>
                ) : (
                  <span className="text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>#{m.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
                {m.avatar}
              </div>

              {/* Name + streak */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{m.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{streak}</p>
              </div>

              {/* Percentage */}
              <p className="text-base font-bold flex-shrink-0"
                style={{ color: isDark ? "#F59E0B" : "#D97706", fontFamily: "'Outfit', sans-serif" }}>
                {pct}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bible Tab ─────────────────────────────────────────────────────────────────

function BibleTab({ isDark }: { isDark: boolean }) {
  return (
    <div className="px-5 pt-5 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Bible Study Guide</h2>
        <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Aug 2025</span>
      </div>

      <div className="rounded-2xl p-4"
        style={{ background: isDark ? "linear-gradient(135deg,#78350F,#1E293B)" : "linear-gradient(135deg,#FEF3C7,#FDE68A)" }}>
        <p className="font-bold text-sm" style={{ fontFamily: "'Outfit', sans-serif", color: isDark ? "#F59E0B" : "#92400E" }}>Monthly Theme</p>
        <p className="text-base font-bold mt-0.5 leading-snug" style={{ fontFamily: "'Outfit', sans-serif", color: isDark ? "#FDE68A" : "#78350F" }}>
          "Growing in Grace & Knowledge"
        </p>
        <p className="text-xs mt-2" style={{ color: isDark ? "#FCD34D" : "#92400E" }}>2 Peter 3:18 — August Series</p>
      </div>

      {bibleStudies.map((study, i) => (
        <div key={i} className="rounded-2xl p-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", opacity: study.available ? 1 : 0.6 }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: study.available ? (isDark ? "#F59E0B22" : "#FEF3C7") : "var(--muted)", color: study.available ? (isDark ? "#F59E0B" : "#D97706") : "var(--muted-foreground)" }}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>{study.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{study.chapter} · {study.pages}</p>
              <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--muted-foreground)" }}>{study.week}</p>
            </div>
            {study.available ? (
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95"
                  style={{ backgroundColor: "var(--primary)", color: "white" }}>Read</button>
                <button className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg active:scale-95"
                  style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                  <DownloadIcon /> PDF
                </button>
              </div>
            ) : (
              <span className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>Soon</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Elders Directory ─────────────────────────────────────────────────────────

const assemblyFilters = ["All", "SMT", "Royal Assembly", "Upper Room", "Grace Temple"];

function EldersDirectory({ isDark, onSelectElder }: { isDark: boolean; onSelectElder: (e: Elder) => void }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filtered = elders.filter(e => {
    const matchFilter = activeFilter === "All" || e.assembly === activeFilter;
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.assembly.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      {showSearch && (
        <div className="px-5 pt-3 pb-1">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search elders or assembly…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--foreground)" }} />
            {search && (
              <button onClick={() => setSearch("")} className="text-xs" style={{ color: "var(--muted-foreground)" }}>✕</button>
            )}
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 px-5 pt-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {assemblyFilters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
            style={activeFilter === f
              ? { backgroundColor: isDark ? "#3B82F6" : "#1E3A8A", color: "white" }
              : { backgroundColor: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
            {f}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="px-5 pb-3 flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{filtered.length} elder{filtered.length !== 1 ? "s" : ""} found</p>
        <button onClick={() => setShowSearch(s => !s)} className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
          {showSearch ? "Hide Search" : "Search"}
        </button>
      </div>

      {/* Elder cards */}
      <div className="px-5 space-y-3 pb-6">
        {filtered.map(elder => (
          <button key={elder.id} onClick={() => onSelectElder(elder)}
            className="w-full rounded-2xl p-4 flex items-center gap-3 text-left transition-all active:scale-95 hover:shadow-md"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden"
                style={{ border: `2.5px solid ${isDark ? "#F59E0B" : "#D97706"}` }}>
                <img src={elder.photo} alt={elder.name} className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg absolute inset-0 rounded-xl"
                  style={{ backgroundColor: elder.avatarColor }}>{elder.avatar}</div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>{elder.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{elder.title} — {elder.assembly}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                  style={{ backgroundColor: isDark ? "#1E3A8A44" : "#EFF6FF", color: isDark ? "#93C5FD" : "#1E3A8A" }}>
                  {elder.assembly}
                </span>
                <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>In service since {elder.since}</span>
              </div>
            </div>

            {/* Chevron */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: isDark ? "#F59E0B22" : "#FEF3C7" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="w-4 h-4" style={{ color: isDark ? "#F59E0B" : "#D97706" }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>No elders found</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Try a different filter or search term</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Elder Profile ─────────────────────────────────────────────────────────────

function ElderProfile({ isDark, elder }: { isDark: boolean; elder: Elder }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="pb-32">
      {/* Hero card */}
      <div className="mx-5 mt-5 rounded-3xl overflow-hidden"
        style={{ background: isDark ? "linear-gradient(160deg,#1E3A8A 0%,#0F172A 100%)" : "linear-gradient(160deg,#1E3A8A 0%,#1D4ED8 100%)" }}>
        <div className="px-5 pt-7 pb-6 flex flex-col items-center text-center">
          {/* Avatar with gold ring */}
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-3xl overflow-hidden"
              style={{ border: `3px solid ${isDark ? "#F59E0B" : "#D97706"}`, boxShadow: `0 0 0 4px ${isDark ? "#F59E0B33" : "#D9770633"}` }}>
              {!imgError ? (
                <img src={elder.photo} alt={elder.name} className="w-full h-full object-cover"
                  onError={() => setImgError(true)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ backgroundColor: elder.avatarColor }}>{elder.avatar}</div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-md">
              <img src={pentecostLogo} alt="" className="w-6 h-6 object-contain" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{elder.name}</h2>

          <span className="mt-2 px-3 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: isDark ? "#F59E0B33" : "rgba(255,255,255,0.2)", color: isDark ? "#F59E0B" : "white" }}>
            {elder.title}
          </span>

          <span className="mt-1.5 px-3 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}>
            {elder.assembly} Assembly
          </span>

          <p className="text-blue-200 text-xs mt-2">In service since {elder.since}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 px-5 mt-4">
        {[
          { icon: "📞", label: "Call Office" },
          { icon: "✉️", label: "Send Email" },
          { icon: "📅", label: "Book Appt." },
        ].map((a, i) => (
          <button key={i}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <span className="text-xl">{a.icon}</span>
            <span className="text-[10px] font-semibold" style={{ color: "var(--foreground)" }}>{a.label}</span>
          </button>
        ))}
      </div>

      <div className="px-5 mt-4 space-y-3">
        {/* Biography */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: isDark ? "#F59E0B" : "#D97706" }} />
            <p className="text-sm font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Biography</p>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{elder.bio}</p>
        </div>

        {/* Ministry Roles */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: isDark ? "#3B82F6" : "#1E3A8A" }} />
            <p className="text-sm font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Ministry Roles</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {elder.roles.map((role, i) => (
              <span key={i} className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: isDark ? "#1E3A8A33" : "#EFF6FF", color: isDark ? "#93C5FD" : "#1E3A8A", border: `1px solid ${isDark ? "#3B82F644" : "#BFDBFE"}` }}>
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Office Hours */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: isDark ? "#22C55E" : "#16A34A" }} />
            <p className="text-sm font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Office Hours & Counselling</p>
          </div>
          {elder.officeHours.split("\n").map((line, i) => (
            <div key={i} className="flex items-start gap-2.5 mt-2">
              <span className="text-green-500 mt-0.5 flex-shrink-0">🕐</span>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{line}</p>
            </div>
          ))}
          <div className="mt-3 flex items-center gap-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <p className="text-xs font-medium" style={{ color: isDark ? "#4ADE80" : "#16A34A" }}>Currently accepting pastoral care appointments</p>
          </div>
        </div>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-sm px-5 z-30">
        <button className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95"
          style={{ background: isDark ? "linear-gradient(135deg,#1E3A8A,#3B82F6)" : "linear-gradient(135deg,#1E3A8A,#2563EB)", color: "white", fontFamily: "'Outfit', sans-serif" }}>
          💬 Send Direct Message / Request Counselling
        </button>
      </div>
    </div>
  );
}

// ─── Members Directory ────────────────────────────────────────────────────────

const memberFilters = ["All Members", "Baptized", "Tithe Payers", "Department Leaders"];

function MembersDirectory({ isDark, onSelectMember }: { isDark: boolean; onSelectMember: (m: Member) => void }) {
  const [activeFilter, setActiveFilter] = useState("All Members");
  const [search, setSearch] = useState("");

  const filtered = members.filter(m => {
    const matchFilter =
      activeFilter === "All Members" ||
      (activeFilter === "Baptized" && m.milestones[0].done) ||
      (activeFilter === "Tithe Payers" && m.category === "Tithe Payer") ||
      (activeFilter === "Department Leaders" && m.category === "Department Leader");
    const q = search.toLowerCase();
    const matchSearch = !search ||
      m.name.toLowerCase().includes(q) ||
      m.memberId.toLowerCase().includes(q) ||
      m.departments.some(d => d.toLowerCase().includes(q));
    return matchFilter && matchSearch;
  });

  return (
    <div className="pb-6">
      {/* Search bar */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID (#MEM-xxxx), or department..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--foreground)" }} />
          {search && (
            <button onClick={() => setSearch("")} className="text-sm flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>✕</button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-5 pb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {memberFilters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap"
            style={activeFilter === f
              ? { backgroundColor: isDark ? "#3B82F6" : "#1E3A8A", color: "white" }
              : { backgroundColor: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
            {f}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="px-5 pb-2">
        <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{filtered.length} member{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Member cards */}
      <div className="px-5 space-y-2.5">
        {filtered.map(member => (
          <button key={member.id} onClick={() => onSelectMember(member)}
            className="w-full rounded-2xl p-3.5 flex items-center gap-3 text-left transition-all active:scale-95 hover:shadow-md"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: member.avatarColor }}>
                  {member.avatar}
                </div>
                <img src={member.photo} alt={member.name} className="absolute inset-0 w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2"
                style={{ borderColor: "var(--card)" }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-sm leading-tight truncate" style={{ color: "var(--foreground)" }}>{member.name}</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                  style={{ backgroundColor: isDark ? "#16A34A22" : "#DCFCE7", color: isDark ? "#4ADE80" : "#166534" }}>
                  Active
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{member.assembly} · {member.memberId}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: isDark ? "#1E3A8A33" : "#EFF6FF", color: isDark ? "#93C5FD" : "#1E3A8A" }}>
                  {member.category}
                </span>
                {member.departments[0] && (
                  <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{member.departments[0]}</span>
                )}
              </div>
            </div>

            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>No members found</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Try a different filter or search term</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Member Profile ────────────────────────────────────────────────────────────

function MemberProfile({ isDark, member, elders }: { isDark: boolean; member: Member; elders: Elder[] }) {
  const [activeTab, setActiveTab] = useState<"attendance" | "finance" | "roles" | "milestones">("attendance");
  const elder = elders.find(e => e.id === member.elderId);
  const tithePct = Math.round((member.tithePaid / member.tithePledge) * 100);

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    present: { bg: isDark ? "#16A34A22" : "#DCFCE7", text: isDark ? "#4ADE80" : "#166534", label: "Present" },
    absent: { bg: isDark ? "#DC262622" : "#FEE2E2", text: isDark ? "#F87171" : "#DC2626", label: "Absent" },
    late: { bg: isDark ? "#D9770622" : "#FEF3C7", text: isDark ? "#F59E0B" : "#D97706", label: "Late" },
  };

  const profileTabs = [
    { id: "attendance", label: "Attendance" },
    { id: "finance", label: "Tithe" },
    { id: "roles", label: "Roles" },
    { id: "milestones", label: "Milestones" },
  ] as const;

  return (
    <div className="pb-32">
      {/* Hero */}
      <div className="mx-5 mt-5 rounded-3xl overflow-hidden"
        style={{ background: isDark ? "linear-gradient(160deg,#1E3A8A,#0F172A)" : "linear-gradient(160deg,#1E3A8A,#1D4ED8)" }}>
        <div className="px-5 pt-7 pb-5 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-2xl overflow-hidden relative bg-gray-200"
              style={{ border: `3px solid ${isDark ? "#F59E0B" : "#D97706"}`, boxShadow: `0 0 0 4px ${isDark ? "#F59E0B33" : "#D9770633"}` }}>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: member.avatarColor }}>{member.avatar}</div>
              <img src={member.photo} alt={member.name} className="absolute inset-0 w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-blue-900 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{member.name}</h2>
          <p className="text-blue-200 text-xs mt-0.5">{member.assembly} · {member.district}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: isDark ? "#F59E0B33" : "rgba(255,255,255,0.2)", color: isDark ? "#F59E0B" : "white" }}>
              {member.memberId}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}>
              Member since {member.since}
            </span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 px-5 mt-4">
        {[{ icon: "📞", label: "Call" }, { icon: "💬", label: "SMS" }, { icon: "🪪", label: "Digital ID" }].map((a, i) => (
          <button key={i} className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all active:scale-95"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <span className="text-xl">{a.icon}</span>
            <span className="text-[10px] font-semibold" style={{ color: "var(--foreground)" }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 mt-4 p-1 rounded-2xl" style={{ backgroundColor: "var(--muted)" }}>
        {profileTabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all"
            style={activeTab === t.id
              ? { backgroundColor: "var(--card)", color: "var(--primary)", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }
              : { color: "var(--muted-foreground)" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 mt-3 space-y-3">
        {/* Attendance tab */}
        {activeTab === "attendance" && (
          <>
            <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Annual Score</p>
                <span className="text-2xl font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: isDark ? "#3B82F6" : "#1E3A8A" }}>{member.attendancePct}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--muted)" }}>
                <div className="h-full rounded-full" style={{ width: `${member.attendancePct}%`, background: `linear-gradient(90deg,${isDark ? "#3B82F6" : "#1E3A8A"},${isDark ? "#60A5FA" : "#2563EB"})` }} />
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>🔥 {member.streak}-week streak</p>
                </div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Active</p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Recent Services</p>
              </div>
              {member.attendanceLogs.map((log, i) => {
                const sc = statusColors[log.status];
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>{log.service}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{log.date}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sc.bg, color: sc.text }}>{sc.label}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Finance tab */}
        {activeTab === "finance" && (
          <>
            <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-bold mb-3" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Annual Pledge Progress</p>
              <div className="flex items-end justify-between mb-2">
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>GH₵ {member.tithePaid.toLocaleString()} paid</p>
                <p className="text-xs font-bold" style={{ color: isDark ? "#F59E0B" : "#D97706" }}>{tithePct}%</p>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--muted)" }}>
                <div className="h-full rounded-full" style={{ width: `${tithePct}%`, background: `linear-gradient(90deg,${isDark ? "#F59E0B" : "#D97706"},#FCD34D)` }} />
              </div>
              <p className="text-[10px] mt-2" style={{ color: "var(--muted-foreground)" }}>Pledge: GH₵ {member.tithePledge.toLocaleString()} · Year 2025</p>
              <div className="mt-3 flex items-center gap-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: tithePct >= 100 ? (isDark ? "#16A34A22" : "#DCFCE7") : (isDark ? "#D9770622" : "#FEF3C7"), color: tithePct >= 100 ? (isDark ? "#4ADE80" : "#166534") : (isDark ? "#F59E0B" : "#D97706") }}>
                  {tithePct >= 100 ? "✓ Pledge Fulfilled" : `${100 - tithePct}% remaining`}
                </span>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Recent Transactions</p>
              </div>
              {member.titheLogs.map((t, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{t.month}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>Ref: {t.ref}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: isDark ? "#F59E0B" : "#D97706" }}>{t.amount}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Roles tab */}
        {activeTab === "roles" && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-bold mb-3" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Ministry & Department Roles</p>
            <div className="space-y-2.5">
              {member.departments.map((dept, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ backgroundColor: "var(--muted)" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: isDark ? "#1E3A8A33" : "#EFF6FF" }}>
                    {["🎵", "📸", "🤝", "🙏", "📖", "👥"][i % 6]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{dept}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Active Role</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: isDark ? "#16A34A22" : "#DCFCE7", color: isDark ? "#4ADE80" : "#166634" }}>Active</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestones tab */}
        {activeTab === "milestones" && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-bold mb-3" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Spiritual Milestones</p>
            <div className="space-y-3">
              {member.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ backgroundColor: m.done ? (isDark ? "#16A34A11" : "#F0FDF4") : "var(--muted)", border: `1px solid ${m.done ? (isDark ? "#4ADE8033" : "#86EFAC") : "var(--border)"}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: m.done ? (isDark ? "#16A34A33" : "#DCFCE7") : "var(--muted)" }}>
                    {m.done
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" style={{ color: isDark ? "#4ADE80" : "#16A34A" }}><polyline points="20 6 9 17 4 12" /></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" style={{ color: "var(--muted-foreground)" }}><circle cx="12" cy="12" r="10" /></svg>
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: m.done ? (isDark ? "#4ADE80" : "#166534") : "var(--muted-foreground)" }}>{m.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{m.done ? "Verified ✓" : "Not yet completed"}</p>
                  </div>
                  {m.done && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                      style={{ backgroundColor: isDark ? "#16A34A22" : "#DCFCE7", color: isDark ? "#4ADE80" : "#166534" }}>Verified</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assigned elder */}
        {elder && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)" }}>Assigned Presiding Elder</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden relative flex-shrink-0 bg-gray-200"
                style={{ border: `2px solid ${isDark ? "#F59E0B" : "#D97706"}` }}>
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: elder.avatarColor }}>{elder.avatar}</div>
                <img src={elder.photo} alt={elder.name} className="absolute inset-0 w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{elder.name}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{elder.assembly} Assembly</p>
              </div>
              <button className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: isDark ? "#1E3A8A22" : "#EFF6FF", color: isDark ? "#93C5FD" : "#1E3A8A" }}>
                Contact
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── My Dashboard (Personal) ──────────────────────────────────────────────────

function MyDashboard({ isDark, scenario, sessionActive, attendanceMarked, onMarkAttendance, elders, onOpenElders }: {
  isDark: boolean; scenario: AttendanceScenario; sessionActive: boolean;
  attendanceMarked: boolean; onMarkAttendance: () => void;
  elders: Elder[]; onOpenElders: () => void;
}) {
  const me = ME;
  const myElder = elders.find(e => e.id === me.elderId);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const canMark = scenario === "inside-active" && !attendanceMarked;

  return (
    <div className="px-5 pt-5 pb-8 space-y-4">
      {/* Personalised welcome */}
      <div className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: isDark ? "linear-gradient(135deg,#1E3A8A,#0F172A)" : "linear-gradient(135deg,#1E3A8A,#2563EB)" }}>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 w-14 h-14">
          <img src={pentecostLogo} alt="" className="w-full h-full object-contain brightness-0 invert" />
        </div>
        <p className="text-blue-200 text-xs font-semibold">{today}</p>
        <p className="text-white text-lg font-bold mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Welcome back,<br />{me.name.split(" ")[0]} 👋
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-5 h-5 rounded-lg bg-white overflow-hidden flex items-center justify-center">
            <img src={pentecostLogo} alt="" className="w-4 h-4 object-contain" />
          </div>
          <p className="text-blue-200 text-xs">{me.assembly} · {me.memberId}</p>
        </div>
      </div>

      {/* My Attendance Card */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>My Attendance</p>
          <span className="text-lg font-bold" style={{ color: isDark ? "#3B82F6" : "#1E3A8A" }}>{me.attendancePct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: "var(--muted)" }}>
          <div className="h-full rounded-full" style={{ width: `${me.attendancePct}%`, background: `linear-gradient(90deg,${isDark ? "#3B82F6" : "#1E3A8A"},${isDark ? "#60A5FA" : "#2563EB"})` }} />
        </div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>🔥 {me.streak}-week streak</p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Annual score</p>
        </div>

        {/* Live mark-attendance CTA */}
        {attendanceMarked ? (
          <div className="flex items-center gap-2 p-3 rounded-xl"
            style={{ backgroundColor: isDark ? "#16A34A22" : "#F0FDF4", border: `1px solid ${isDark ? "#4ADE80" : "#22C55E"}` }}>
            <span className="text-green-500">✓</span>
            <p className="text-xs font-semibold" style={{ color: isDark ? "#4ADE80" : "#166534" }}>Attendance marked for today!</p>
          </div>
        ) : (
          <button onClick={canMark ? onMarkAttendance : undefined}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{
              backgroundColor: canMark ? (isDark ? "#3B82F6" : "#1E3A8A") : "var(--muted)",
              color: canMark ? "white" : "var(--muted-foreground)",
              cursor: canMark ? "pointer" : "not-allowed",
              fontFamily: "'Outfit', sans-serif",
            }}>
            {!sessionActive ? "📍 Attendance Session Not Active" : scenario === "outside-active" ? "📡 You are Outside Geofence" : "📍 Mark My Attendance Now"}
          </button>
        )}
      </div>

      {/* My Presiding Elder card */}
      {myElder && (
        <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)" }}>My Presiding Elder</p>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden relative flex-shrink-0 bg-gray-200"
              style={{ border: `2.5px solid ${isDark ? "#F59E0B" : "#D97706"}` }}>
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: myElder.avatarColor }}>{myElder.avatar}</div>
              <img src={myElder.photo} alt={myElder.name} className="absolute inset-0 w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{myElder.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{myElder.title} · {myElder.assembly}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{myElder.officeHours.split("\n")[0]}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {[{ icon: "📞", label: "Call" }, { icon: "✉️", label: "Email" }, { icon: "📅", label: "Book" }].map((a, i) => (
              <button key={i} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <p className="text-sm font-bold mb-3" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Upcoming Events</p>
        {[
          { date: "Aug 25", name: "District Convention 2025", tag: "District", color: isDark ? "#F59E0B" : "#D97706" },
          { date: "Sep 14", name: "District Harvest Festival", tag: "District", color: isDark ? "#3B82F6" : "#1E3A8A" },
        ].map((ev, i) => (
          <div key={i} className={`flex items-center gap-3 ${i > 0 ? "mt-2.5" : ""}`}>
            <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
              style={{ backgroundColor: ev.color + "18" }}>
              <p className="text-[10px] font-bold" style={{ color: ev.color }}>{ev.date.split(" ")[0]}</p>
              <p className="text-base font-black leading-none" style={{ color: ev.color }}>{ev.date.split(" ")[1]}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{ev.name}</p>
              <span className="text-[10px] font-bold" style={{ color: ev.color }}>{ev.tag}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Bible Study */}
      <div className="rounded-2xl p-4"
        style={{ background: isDark ? "linear-gradient(135deg,#78350F,#1E293B)" : "linear-gradient(135deg,#FEF3C7,#FDE68A)" }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: isDark ? "#F59E0B" : "#92400E" }}>This Week's Bible Study</p>
        <p className="text-base font-bold mt-1" style={{ fontFamily: "'Outfit', sans-serif", color: isDark ? "#FDE68A" : "#78350F" }}>
          "The Foundation of Faith"
        </p>
        <p className="text-xs mt-0.5" style={{ color: isDark ? "#FCD34D" : "#92400E" }}>Hebrews 11:1–6 · Week 1 of August</p>
        <button className="mt-3 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{ backgroundColor: isDark ? "#F59E0B" : "#D97706", color: "white" }}>
          Read Guide
        </button>
      </div>
    </div>
  );
}

// ─── Admin Hub ────────────────────────────────────────────────────────────────

const recordSections = [
  {
    id: "members",
    title: "Member Directory Data",
    icon: "👥",
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
    icon: "📍",
    desc: "Configure geofence, service times, and override logs",
    pct: 72,
    color: "#7C3AED",
    darkColor: "#A78BFA",
    actions: ["Set Geofence Coordinates", "Configure Service Times", "Manual Log Override", "Export Attendance Report"],
    pending: 3,
  },
  {
    id: "finance",
    title: "Financial & Tithe Records",
    icon: "💰",
    desc: "Log tithes, welfare, pledges, and issue receipts",
    pct: 91,
    color: "#D97706",
    darkColor: "#F59E0B",
    actions: ["Log Weekly Tithe", "Record Welfare Contribution", "Log Pledge Payment", "Issue Digital Receipt"],
    pending: 6,
  },
  {
    id: "leadership",
    title: "Leadership & District Roster",
    icon: "🏅",
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
    icon: "✝️",
    desc: "Mark baptism dates, confirmations, and certifications",
    pct: 64,
    color: "#DC2626",
    darkColor: "#F87171",
    actions: ["Log Water Baptism", "Record Confirmation", "Add Marriage Certificate", "Mark Special Ordination"],
    pending: 22,
  },
];

function AdminHub({ isDark, sessionActive, membersPresent, onOpenSuperAdmin, superAdminUnlocked, loginRole }: {
  isDark: boolean; sessionActive: boolean; membersPresent: number;
  onOpenSuperAdmin: () => void; superAdminUnlocked: boolean; loginRole?: LoginRole;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const overviewStats = [
    { label: "Total Members", value: "1,248", sub: "Records", icon: "👥", color: isDark ? "#3B82F6" : "#1E3A8A", bg: isDark ? "#1E3A8A22" : "#EFF6FF" },
    { label: "Incomplete Profiles", value: "14", sub: "Pending", icon: "⚠️", color: isDark ? "#F59E0B" : "#D97706", bg: isDark ? "#D9770622" : "#FEF3C7" },
    { label: "Active Sessions", value: sessionActive ? "1" : "0", sub: sessionActive ? "Live" : "Inactive", icon: "📡", color: sessionActive ? (isDark ? "#4ADE80" : "#16A34A") : (isDark ? "#94A3B8" : "#6C757D"), bg: sessionActive ? (isDark ? "#16A34A22" : "#DCFCE7") : "var(--muted)" },
    { label: "Assemblies", value: "4", sub: "Active", icon: "⛪", color: isDark ? "#A78BFA" : "#7C3AED", bg: isDark ? "#7C3AED22" : "#EDE9FE" },
  ];

  return (
    <div className="pb-10">
      {/* Subtitle banner */}
      <div className="px-5 pt-4 pb-1">
        <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Admin portal to update, edit, and fill all church database records.
        </p>
      </div>

      {/* Overview stat cards */}
      <div className="grid grid-cols-2 gap-3 px-5 pt-3 pb-1">
        {overviewStats.map((stat, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: stat.bg }}>
                {stat.icon}
              </div>
              {stat.label === "Incomplete Profiles" && (
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: isDark ? "#F59E0B" : "#D97706" }} />
              )}
              {stat.label === "Active Sessions" && sessionActive && (
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              )}
            </div>
            <p className="text-2xl font-black" style={{ fontFamily: "'Outfit', sans-serif", color: stat.color }}>{stat.value}</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--foreground)" }}>{stat.sub}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search & filter bar */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search missing data fields across all profiles…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--foreground)" }} />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ color: "var(--muted-foreground)" }}>✕</button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            {members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.memberId.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3).map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: m.avatarColor }}>{m.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>{m.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{m.memberId} · {m.assembly}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: isDark ? "#D9770622" : "#FEF3C7", color: isDark ? "#F59E0B" : "#D97706" }}>
                  Edit
                </span>
              </div>
            ))}
            {members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.memberId.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <p className="text-xs text-center py-3" style={{ color: "var(--muted-foreground)" }}>No records match "{searchQuery}"</p>
            )}
          </div>
        )}
      </div>

      {/* Batch action buttons */}
      <div className="flex gap-2.5 px-5 pt-1 pb-4">
        <button className="flex-1 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
          style={{ background: isDark ? "linear-gradient(135deg,#1E3A8A,#3B82F6)" : "linear-gradient(135deg,#1E3A8A,#2563EB)", color: "white" }}>
          📂 Batch Import CSV
        </button>
        <button className="flex-1 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
          style={{ backgroundColor: isDark ? "#D9770622" : "#FEF3C7", color: isDark ? "#F59E0B" : "#D97706", border: `1.5px solid ${isDark ? "#F59E0B44" : "#D97706"}` }}>
          📤 Export Records
        </button>
      </div>

      {/* Record sections */}
      <div className="px-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Record Categories</p>

        {recordSections.map(section => {
          const isOpen = expandedSection === section.id;
          const accentColor = isDark ? section.darkColor : section.color;

          return (
            <div key={section.id} className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--card)", border: `1px solid ${isOpen ? accentColor + "66" : "var(--border)"}`, transition: "border-color 0.2s" }}>
              {/* Section header */}
              <button onClick={() => setExpandedSection(isOpen ? null : section.id)}
                className="w-full p-4 flex items-center gap-3 text-left transition-all active:opacity-80">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: accentColor + "18" }}>
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold leading-tight" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>
                      {section.title}
                    </p>
                    {section.pending > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: isDark ? "#D9770622" : "#FEF3C7", color: isDark ? "#F59E0B" : "#D97706" }}>
                        {section.pending} pending
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>{section.desc}</p>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--muted)" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${section.pct}%`, backgroundColor: accentColor }} />
                    </div>
                    <span className="text-[10px] font-bold flex-shrink-0" style={{ color: accentColor }}>{section.pct}%</span>
                  </div>
                </div>
                <div style={{ color: "var(--muted-foreground)", transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {/* Expanded actions */}
              {isOpen && (
                <div className="border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="p-3 grid grid-cols-2 gap-2">
                    {section.actions.map((action, i) => (
                      <button key={i}
                        className="py-3 px-3 rounded-xl text-left transition-all active:scale-95 hover:shadow-sm"
                        style={{ backgroundColor: accentColor + "0F", border: `1px solid ${accentColor}33` }}>
                        <p className="text-[11px] font-semibold leading-tight" style={{ color: accentColor }}>{action}</p>
                      </button>
                    ))}
                  </div>
                  {/* Mini form preview for first section */}
                  {section.id === "members" && (
                    <div className="mx-3 mb-3 p-3 rounded-xl" style={{ backgroundColor: "var(--muted)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted-foreground)" }}>Quick Add Member</p>
                      {["Full Name", "Phone Number", "Assigned Assembly"].map((field, i) => (
                        <div key={i} className="mb-2">
                          <div className="w-full px-3 py-2 rounded-lg text-xs"
                            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
                            {field}…
                          </div>
                        </div>
                      ))}
                      <button className="w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                        style={{ backgroundColor: accentColor, color: "white" }}>
                        + Add Member Record
                      </button>
                    </div>
                  )}
                  {section.id === "attendance" && (
                    <div className="mx-3 mb-3 p-3 rounded-xl" style={{ backgroundColor: "var(--muted)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted-foreground)" }}>Geofence Config</p>
                      {["Latitude (e.g. 7.3407)", "Longitude (e.g. -2.3340)", "Radius in metres (e.g. 100)"].map((field, i) => (
                        <div key={i} className="mb-2">
                          <div className="w-full px-3 py-2 rounded-lg text-xs"
                            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
                            {field}
                          </div>
                        </div>
                      ))}
                      <button className="w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                        style={{ backgroundColor: accentColor, color: "white" }}>
                        Save Geofence Settings
                      </button>
                    </div>
                  )}
                  {section.id === "finance" && (
                    <div className="mx-3 mb-3 p-3 rounded-xl" style={{ backgroundColor: "var(--muted)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted-foreground)" }}>Log Tithe Entry</p>
                      {["Member ID or Name", "Amount (GH₵)", "Payment Type"].map((field, i) => (
                        <div key={i} className="mb-2">
                          <div className="w-full px-3 py-2 rounded-lg text-xs"
                            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
                            {field}…
                          </div>
                        </div>
                      ))}
                      <button className="w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                        style={{ backgroundColor: accentColor, color: "white" }}>
                        Log & Issue Receipt
                      </button>
                    </div>
                  )}
                  {section.id === "milestones" && (
                    <div className="mx-3 mb-3 p-3 rounded-xl" style={{ backgroundColor: "var(--muted)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted-foreground)" }}>Mark Milestone</p>
                      {[
                        { label: "Water Baptism", done: true },
                        { label: "Confirmation", done: false },
                        { label: "Marriage Certification", done: false },
                      ].map((m, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: m.done ? accentColor : "var(--border)", backgroundColor: m.done ? accentColor + "22" : "transparent" }}>
                            {m.done && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" style={{ color: accentColor }}><polyline points="20 6 9 17 4 12" /></svg>}
                          </div>
                          <p className="text-xs" style={{ color: m.done ? "var(--foreground)" : "var(--muted-foreground)" }}>{m.label}</p>
                        </div>
                      ))}
                      <button className="w-full py-2 rounded-xl text-xs font-bold mt-1 transition-all active:scale-95"
                        style={{ backgroundColor: accentColor, color: "white" }}>
                        Save Milestone Record
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Super Admin gateway — only visible to super admins */}
      {loginRole === "superAdmin" && <div className="px-5 pt-4 pb-2">
        <button onClick={onOpenSuperAdmin}
          className="w-full py-4 rounded-2xl flex items-center gap-3 px-4 transition-all active:scale-95"
          style={{ background: isDark ? "linear-gradient(135deg,#450a0a,#1E293B)" : "linear-gradient(135deg,#FEF2F2,#FEE2E2)", border: `1.5px solid ${isDark ? "#DC262655" : "#DC2626"}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: isDark ? "#DC262622" : "#FCA5A5" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "#DC2626" }}>
              Super Admin Control Center
            </p>
            <p className="text-xs mt-0.5" style={{ color: isDark ? "#F87171" : "#991B1B" }}>
              {superAdminUnlocked ? "✓ Access granted — tap to open" : "Restricted — requires Super Admin PIN (9999)"}
            </p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>}
    </div>
  );
}

// ─── Super Admin Hub ──────────────────────────────────────────────────────────

const adminTierFilters = ["All Admins", "District Admins", "Assembly Admins", "Super Admins"];

const tierColors: Record<AdminTier, { bg: string; text: string; darkBg: string; darkText: string }> = {
  "Super Admin": { bg: "#FEE2E2", text: "#DC2626", darkBg: "#DC262622", darkText: "#F87171" },
  "District Admin": { bg: "#FEF3C7", text: "#D97706", darkBg: "#D9770622", darkText: "#F59E0B" },
  "Assembly Admin": { bg: "#EFF6FF", text: "#1E3A8A", darkBg: "#1E3A8A22", darkText: "#93C5FD" },
};

const severityColors: Record<AuditLog["severity"], { dot: string; bg: string; darkBg: string }> = {
  info: { dot: "#3B82F6", bg: "#EFF6FF", darkBg: "#1E3A8A22" },
  warning: { dot: "#D97706", bg: "#FEF3C7", darkBg: "#D9770622" },
  critical: { dot: "#DC2626", bg: "#FEE2E2", darkBg: "#DC262622" },
};

function SuperAdminHub({ isDark }: { isDark: boolean }) {
  const [activeFilter, setActiveFilter] = useState("All Admins");
  const [search, setSearch] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignName, setAssignName] = useState("");
  const [assignRole, setAssignRole] = useState<AdminTier>("Assembly Admin");
  const [assignBoundary, setAssignBoundary] = useState("Royal Assembly");
  const [grantMaster, setGrantMaster] = useState(false);
  const [revokedIds, setRevokedIds] = useState<string[]>([]);

  const filtered = adminUsers.filter(a => {
    const matchFilter =
      activeFilter === "All Admins" ||
      (activeFilter === "District Admins" && a.tier === "District Admin") ||
      (activeFilter === "Assembly Admins" && a.tier === "Assembly Admin") ||
      (activeFilter === "Super Admins" && a.tier === "Super Admin");
    const q = search.toLowerCase();
    const matchSearch = !search || a.name.toLowerCase().includes(q) || a.phone.includes(q) || a.assembly.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  }).filter(a => !revokedIds.includes(a.id));

  return (
    <div className="pb-10 relative">
      {/* Assign New Admin Modal */}
      {showAssignModal && (
        <div className="absolute inset-0 z-40 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}>
          <div className="w-full rounded-t-3xl p-5 pb-8 space-y-4" style={{ backgroundColor: "var(--card)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="w-10 h-1 rounded-full mx-auto" style={{ backgroundColor: "var(--border)" }} />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>Assign New Admin</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Grant administrative privileges to a church member</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>✕</button>
            </div>

            {/* 1. Member search */}
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>1. Search Member</p>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input value={assignName} onChange={e => setAssignName(e.target.value)}
                  placeholder="Search member by name or ID…"
                  className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--foreground)" }} />
              </div>
              {assignName && (
                <div className="mt-1 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                  {members.filter(m => m.name.toLowerCase().includes(assignName.toLowerCase())).slice(0, 3).map((m, i) => (
                    <button key={i} onClick={() => setAssignName(m.name)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left border-b last:border-0 transition-all active:opacity-70"
                      style={{ borderColor: "var(--border)" }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: m.avatarColor }}>{m.avatar}</div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{m.name}</p>
                        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{m.memberId} · {m.assembly}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Role */}
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>2. Role Assignment</p>
              <div className="flex gap-2">
                {(["Assembly Admin", "District Admin", "Super Admin"] as AdminTier[]).map(role => {
                  const tc = tierColors[role];
                  const active = assignRole === role;
                  return (
                    <button key={role} onClick={() => setAssignRole(role)}
                      className="flex-1 py-2 rounded-xl text-[10px] font-bold transition-all"
                      style={{ backgroundColor: active ? (isDark ? tc.darkBg : tc.bg) : "var(--muted)", color: active ? (isDark ? tc.darkText : tc.text) : "var(--muted-foreground)", border: `1.5px solid ${active ? (isDark ? tc.darkText : tc.text) + "66" : "var(--border)"}` }}>
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Boundary */}
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>3. Assigned Boundary</p>
              <div className="grid grid-cols-2 gap-2">
                {["Royal Assembly", "SMT", "Upper Room", "Grace Temple", "Ayigya District", "Ayigya District"].map(b => (
                  <button key={b} onClick={() => setAssignBoundary(b)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold text-left transition-all"
                    style={{ backgroundColor: assignBoundary === b ? (isDark ? "#1E3A8A33" : "#EFF6FF") : "var(--muted)", color: assignBoundary === b ? (isDark ? "#93C5FD" : "#1E3A8A") : "var(--muted-foreground)", border: `1px solid ${assignBoundary === b ? (isDark ? "#3B82F655" : "#BFDBFE") : "var(--border)"}` }}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Master data toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "var(--muted)" }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Grant Master Data Entry & Attendance Control</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>Allows editing all records and managing sessions</p>
              </div>
              <button onClick={() => setGrantMaster(g => !g)}
                className="w-12 h-6 rounded-full transition-all flex-shrink-0 ml-3 flex items-center"
                style={{ backgroundColor: grantMaster ? (isDark ? "#3B82F6" : "#1E3A8A") : "var(--border)", padding: "2px" }}>
                <div className="w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                  style={{ transform: grantMaster ? "translateX(24px)" : "translateX(0)" }} />
              </button>
            </div>

            {/* 5. Confirm */}
            <button onClick={() => { setShowAssignModal(false); setAssignName(""); setGrantMaster(false); }}
              className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
              style={{ background: isDark ? "linear-gradient(135deg,#1E3A8A,#3B82F6)" : "linear-gradient(135deg,#1E3A8A,#2563EB)", color: "white", fontFamily: "'Outfit', sans-serif" }}>
              ✓ Confirm & Grant Admin Access
            </button>
          </div>
        </div>
      )}

      {/* Subtitle */}
      <div className="px-5 pt-4 pb-1">
        <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Manage administrative privileges, assign admin roles, and monitor system security.
        </p>
      </div>

      {/* Top privilege summary cards */}
      <div className="grid grid-cols-3 gap-2.5 px-5 pt-3 pb-1">
        {[
          { label: "System Admins", value: `${adminUsers.length - revokedIds.length}`, sub: "Active Admins", icon: "🛡️", color: isDark ? "#3B82F6" : "#1E3A8A" },
          { label: "Assemblies Covered", value: "4 of 4", sub: "Assemblies", icon: "⛪", color: isDark ? "#4ADE80" : "#16A34A" },
          { label: "Security Status", value: "✓", sub: "Operational", icon: "🔒", color: isDark ? "#4ADE80" : "#16A34A" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-3 text-center" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xl mb-1">{s.icon}</p>
            <p className="text-base font-black" style={{ fontFamily: "'Outfit', sans-serif", color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-semibold" style={{ color: "var(--foreground)" }}>{s.sub}</p>
            <p className="text-[9px] leading-tight mt-0.5" style={{ color: "var(--muted-foreground)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Section: Admins Directory */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Active Admins Directory</p>
          <button onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{ backgroundColor: isDark ? "#1E3A8A" : "#1E3A8A", color: "white" }}>
            + Assign Admin
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, or assembly…"
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--foreground)" }} />
          {search && <button onClick={() => setSearch("")} style={{ color: "var(--muted-foreground)" }}>✕</button>}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {adminTierFilters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 whitespace-nowrap"
              style={activeFilter === f
                ? { backgroundColor: isDark ? "#3B82F6" : "#1E3A8A", color: "white" }
                : { backgroundColor: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
              {f}
            </button>
          ))}
        </div>

        {/* Admin cards */}
        <div className="space-y-2.5">
          {filtered.map(admin => {
            const tc = tierColors[admin.tier];
            return (
              <div key={admin.id} className="rounded-2xl p-3.5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden relative bg-gray-200"
                      style={{ border: `2px solid ${isDark ? tc.darkText : tc.text}` }}>
                      <div className="absolute inset-0 flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: admin.avatarColor }}>{admin.avatar}</div>
                      <img src={admin.photo} alt={admin.name} className="absolute inset-0 w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.opacity = "0"; }} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight truncate" style={{ color: "var(--foreground)" }}>{admin.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{admin.phone}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: isDark ? tc.darkBg : tc.bg, color: isDark ? tc.darkText : tc.text }}>
                        {admin.tier}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{admin.assembly}</span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>

                {/* Revoke button — only for non-super-admin entries */}
                {admin.tier !== "Super Admin" && (
                  <button onClick={() => setRevokedIds(ids => [...ids, admin.id])}
                    className="mt-2.5 w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    style={{ backgroundColor: isDark ? "#DC262611" : "#FEF2F2", color: "#DC2626", border: "1.5px solid #DC262633" }}>
                    ⚠ Revoke Admin Privileges
                  </button>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>No admins found</p>
            </div>
          )}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="px-5 pt-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)" }}>Admin Activity & Audit Log</p>

        {/* Table header */}
        <div className="grid rounded-t-xl px-3 py-2" style={{ gridTemplateColumns: "72px 1fr", backgroundColor: isDark ? "#1E293B" : "#F1F3F5" }}>
          <p className="text-[10px] font-bold uppercase" style={{ color: "var(--muted-foreground)" }}>When</p>
          <p className="text-[10px] font-bold uppercase" style={{ color: "var(--muted-foreground)" }}>Admin · Action · Record</p>
        </div>

        <div className="rounded-b-2xl overflow-hidden" style={{ border: "1px solid var(--border)", borderTop: "none" }}>
          {auditLogs.map((log, i) => {
            const sc = severityColors[log.severity];
            return (
              <div key={log.id} className="flex gap-3 px-3 py-3 border-b last:border-0"
                style={{ borderColor: "var(--border)", backgroundColor: i % 2 === 0 ? "var(--card)" : (isDark ? "#ffffff05" : "#00000003") }}>
                {/* Timestamp */}
                <div className="w-[72px] flex-shrink-0 flex items-start gap-1.5 pt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: sc.dot }} />
                  <p className="text-[10px] leading-tight" style={{ color: "var(--muted-foreground)" }}>{log.timestamp}</p>
                </div>
                {/* Detail */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>{log.adminName}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{log.action}</p>
                  <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-1"
                    style={{ backgroundColor: isDark ? sc.darkBg : sc.bg, color: sc.dot }}>
                    {log.affectedRecord}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Login Flow (Phone Input + OTP) ──────────────────────────────────────────

function LoginFlow({ isDark, phase, onPhoneSubmit, onOtpVerified, loginPhone, theme, onToggleTheme }: {
  isDark: boolean; phase: AppPhase;
  onPhoneSubmit: (phone: string) => void;
  onOtpVerified: (phone: string) => void;
  loginPhone: string; theme: Theme; onToggleTheme: () => void;
}) {
  return phase === "login"
    ? <PhoneInputScreen isDark={isDark} onSubmit={onPhoneSubmit} theme={theme} onToggleTheme={onToggleTheme} />
    : <OtpScreen isDark={isDark} phone={loginPhone} onVerified={onOtpVerified} onBack={() => { }} />;
}

function PhoneInputScreen({ isDark, onSubmit, theme, onToggleTheme }: {
  isDark: boolean; onSubmit: (phone: string) => void; theme: Theme; onToggleTheme: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [showCountry, setShowCountry] = useState(false);

  const countries = [
    { code: "+233", flag: "🇬🇭", name: "Ghana" },
    { code: "+234", flag: "🇳🇬", name: "Nigeria" },
    { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
    { code: "+1", flag: "🇺🇸", name: "United States" },
  ];
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);

  const fullPhone = `${selectedCountry.code} ${phone}`;

  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      {/* Status bar spacer + theme toggle */}
      <div className="flex justify-end px-5 pt-14 pb-2">
        <button onClick={onToggleTheme} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }}>
          {theme === "light" ? <MoonSVG /> : <SunSVG />}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-4">
        {/* Logo */}
        <div className="w-20 h-20 rounded-3xl bg-white shadow-lg flex items-center justify-center mb-6"
          style={{ border: "1px solid var(--border)" }}>
          <img src={pentecostLogo} alt="Church of Pentecost" className="w-16 h-16 object-contain" />
        </div>

        <h1 className="text-2xl font-bold text-center" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>
          Church Portal Login
        </h1>
        <p className="text-sm text-center mt-2 leading-relaxed max-w-xs" style={{ color: "var(--muted-foreground)" }}>
          Enter your registered phone number to receive a verification code
        </p>

        {/* Role hint pills */}
        <div className="flex gap-2 mt-5 flex-wrap justify-center">
          {[
            { label: "Member", phone: "20 123 4567", color: isDark ? "#3B82F6" : "#1E3A8A", bg: isDark ? "#1E3A8A22" : "#EFF6FF" },
            { label: "Admin", phone: "24 001 0002", color: isDark ? "#4ADE80" : "#166534", bg: isDark ? "#16A34A22" : "#DCFCE7" },
            { label: "Super Admin", phone: "24 101 0001", color: "#DC2626", bg: isDark ? "#DC262622" : "#FEE2E2" },
          ].map((hint, i) => (
            <button key={i} onClick={() => setPhone(hint.phone)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
              style={{ backgroundColor: hint.bg, color: hint.color, border: `1px solid ${hint.color}33` }}>
              Demo: {hint.label}
            </button>
          ))}
        </div>

        {/* Phone input card */}
        <div className="w-full mt-6 rounded-2xl p-5 space-y-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>Phone Number</p>
            <div className="flex gap-2">
              {/* Country selector */}
              <div className="relative">
                <button onClick={() => setShowCountry(s => !s)}
                  className="h-12 px-3 rounded-xl flex items-center gap-1.5 text-sm font-semibold flex-shrink-0 transition-all"
                  style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", minWidth: 84 }}>
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span>{selectedCountry.code}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" style={{ color: "var(--muted-foreground)" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {showCountry && (
                  <div className="absolute top-full left-0 mt-1 rounded-2xl overflow-hidden shadow-xl z-20 w-52"
                    style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                    {countries.map((c, i) => (
                      <button key={i} onClick={() => { setSelectedCountry(c); setShowCountry(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm transition-all hover:opacity-70 border-b last:border-0"
                        style={{ borderColor: "var(--border)", color: "var(--foreground)", backgroundColor: selectedCountry.code === c.code ? (isDark ? "#1E3A8A22" : "#EFF6FF") : "transparent" }}>
                        <span className="text-xl">{c.flag}</span>
                        <span className="font-semibold">{c.code}</span>
                        <span style={{ color: "var(--muted-foreground)" }}>{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Number input */}
              <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel"
                placeholder="20 123 4567"
                className="flex-1 h-12 px-4 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
              We will send a 4-digit OTP via SMS to {selectedCountry.code} {phone || "—"}
            </p>
          </div>

          <button onClick={() => phone.trim() && onSubmit(fullPhone)} disabled={!phone.trim()}
            className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ background: phone.trim() ? "linear-gradient(135deg,#1E3A8A,#2563EB)" : "var(--muted)", color: phone.trim() ? "white" : "var(--muted-foreground)", fontFamily: "'Outfit', sans-serif", cursor: phone.trim() ? "pointer" : "not-allowed" }}>
            Send Verification Code →
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-center mt-6 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          By continuing you agree to our{" "}
          <span style={{ color: isDark ? "#3B82F6" : "#1E3A8A" }}>Terms of Service</span>
          {" "}and{" "}
          <span style={{ color: isDark ? "#3B82F6" : "#1E3A8A" }}>Privacy Policy</span>
        </p>

        {/* Assembly logos strip */}
        <div className="flex items-center justify-center gap-3 mt-8 opacity-40">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <img src={pentecostLogo} alt="" className="w-6 h-6 object-contain" />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-center mt-2" style={{ color: "var(--muted-foreground)" }}>
          The Church of Pentecost · Ayigya District
        </p>
      </div>
    </div>
  );
}

function OtpScreen({ isDark, phone, onVerified, onBack }: {
  isDark: boolean; phone: string; onVerified: (phone: string) => void; onBack: () => void;
}) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [seconds, setSeconds] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    if (seconds > 0 && !canResend) {
      const t = setTimeout(() => setSeconds(s => s - 1), 1000);
      return () => clearTimeout(t);
    } else if (seconds === 0) {
      setCanResend(true);
    }
  }, [seconds, canResend]);

  useEffect(() => { inputRefs[0].current?.focus(); }, []);

  const handleDigit = (val: string, idx: number) => {
    const ch = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = ch;
    setDigits(next);
    setError(false);
    if (ch && idx < 3) inputRefs[idx + 1].current?.focus();
    if (next.every(d => d) && next.join("").length === 4) {
      const code = next.join("");
      if (code === OTP_CODE) {
        setVerified(true);
        setTimeout(() => onVerified(phone), 700);
      } else {
        setError(true);
        setDigits(["", "", "", ""]);
        setTimeout(() => inputRefs[0].current?.focus(), 50);
      }
    }
  };

  const maskedPhone = phone.replace(/(\+\d{3}\s\d{2})\s?\d{3}/, "$1 ***").trim();

  return (
    <div className="min-h-dvh flex flex-col items-center px-6" style={{ backgroundColor: "var(--background)" }}>
      <div className="w-full pt-14 flex justify-start">
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--muted)", color: "var(--foreground)" }}>
          <ArrowLeft />
        </button>
      </div>

      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mt-8 mb-5"
        style={{ border: "1px solid var(--border)" }}>
        <img src={pentecostLogo} alt="" className="w-12 h-12 object-contain" />
      </div>

      <h1 className="text-2xl font-bold text-center" style={{ fontFamily: "'Outfit', sans-serif", color: "var(--foreground)" }}>
        Verify Your Number
      </h1>
      <p className="text-sm text-center mt-2 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        Code sent to <span className="font-semibold" style={{ color: "var(--foreground)" }}>{maskedPhone}</span>
      </p>

      {/* OTP card */}
      <div className="w-full mt-8 rounded-2xl p-5 space-y-5"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>

        {/* 4 boxes */}
        <div className="flex gap-3 justify-center">
          {digits.map((d, i) => (
            <input key={i} ref={inputRefs[i]} value={d} inputMode="numeric"
              onChange={e => handleDigit(e.target.value, i)}
              onKeyDown={e => { if (e.key === "Backspace" && !d && i > 0) { inputRefs[i - 1].current?.focus(); } }}
              maxLength={1}
              className="w-14 h-14 text-center text-2xl font-bold rounded-2xl outline-none transition-all"
              style={{
                backgroundColor: verified ? (isDark ? "#16A34A22" : "#DCFCE7") : error ? (isDark ? "#DC262622" : "#FEE2E2") : "var(--muted)",
                border: `2px solid ${verified ? "#22C55E" : error ? "#DC2626" : d ? (isDark ? "#3B82F6" : "#1E3A8A") : "var(--border)"}`,
                color: verified ? "#22C55E" : error ? "#DC2626" : "var(--foreground)",
              }} />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ backgroundColor: isDark ? "#DC262622" : "#FEE2E2" }}>
            <span className="text-red-500 text-sm">✕</span>
            <p className="text-xs font-semibold text-red-500">Incorrect code. Try again. (Hint: {OTP_CODE})</p>
          </div>
        )}

        {verified && (
          <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl"
            style={{ backgroundColor: isDark ? "#16A34A22" : "#DCFCE7" }}>
            <span className="text-green-500">✓</span>
            <p className="text-xs font-semibold text-green-600">Verified! Signing you in…</p>
          </div>
        )}

        {/* Timer */}
        <div className="text-center">
          {canResend ? (
            <button onClick={() => { setSeconds(45); setCanResend(false); setError(false); setDigits(["", "", "", ""]); }}
              className="text-sm font-semibold" style={{ color: isDark ? "#3B82F6" : "#1E3A8A" }}>
              Resend via SMS
            </button>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Resend Code in{" "}
              <span className="font-bold" style={{ color: "var(--foreground)" }}>
                0:{seconds.toString().padStart(2, "0")}
              </span>
            </p>
          )}
        </div>

        {/* Verify button */}
        <button
          onClick={() => {
            const code = digits.join("");
            if (code.length === 4) {
              if (code === OTP_CODE) { setVerified(true); setTimeout(() => onVerified(phone), 700); }
              else { setError(true); setDigits(["", "", "", ""]); setTimeout(() => inputRefs[0].current?.focus(), 50); }
            }
          }}
          disabled={digits.join("").length < 4 || verified}
          className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
          style={{ background: digits.join("").length === 4 && !verified ? "linear-gradient(135deg,#1E3A8A,#2563EB)" : "var(--muted)", color: digits.join("").length === 4 && !verified ? "white" : "var(--muted-foreground)", fontFamily: "'Outfit', sans-serif", cursor: digits.join("").length === 4 && !verified ? "pointer" : "not-allowed" }}>
          {verified ? "Signing In…" : "Verify & Continue"}
        </button>
      </div>

      {/* Role preview */}
      <div className="w-full mt-4 rounded-2xl p-4" style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)" }}>Demo login roles</p>
        <div className="space-y-1.5">
          {[
            { phone: "20 123 4567", label: "Standard Member", icon: "👤", color: isDark ? "#3B82F6" : "#1E3A8A" },
            { phone: "24 001 0002 / 0003", label: "Assembly Admin", icon: "🛡️", color: isDark ? "#4ADE80" : "#166534" },
            { phone: "24 101 0001", label: "Super Admin", icon: "👑", color: "#DC2626" },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm">{r.icon}</span>
              <span className="text-xs font-semibold" style={{ color: r.color }}>{r.label}</span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>→ {r.phone}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Utility SVG icons ─────────────────────────────────────────────────────────

function SunSVG() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonSVG() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
