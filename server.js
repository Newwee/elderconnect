const path = require('path');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_CATEGORIES = new Set(['all', 'health', 'life', 'memory']);
const PROJECT_DIR = __dirname;


function hashPassword(value) {
    return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase().slice(0, 160);
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Demo-only in-memory members. Replace with a real database and secure sessions before production.
const users = [
    {
        id: 1,
        name: 'คุณยายสมพร',
        email: 'demo@elderconnect.local',
        passwordHash: hashPassword('123456')
    }
];

app.use(cors());
app.use(express.json({ limit: '64kb' }));

// Serve every static file in this folder automatically
app.use(express.static(PROJECT_DIR, {
    extensions: ['html'],
    setHeaders: (res, filePath) => {
        if (/\.(html|css|js|png|jpg|jpeg|svg|webp)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'no-store');
        }
    }
}));

// In-memory Mock Database
let feedItems = [
    {
        id: 1,
        category: 'health',
        title: '💡 บริหารเข่าแบบง่ายสำหรับวัยเก๋า',
        content: 'นั่งบนเก้าอี้ที่มั่นคง เหยียดขาตรง กระดกปลายเท้าขึ้น ค้างไว้ 10 วินาที แล้วพัก ทำเช้าและเย็นอย่างละ 5 รอบค่ะ',
        author: 'แอดมินหมอใจดี',
        pinned: true
    },
    {
        id: 2,
        category: 'life',
        title: '📢 กิจกรรมรำกระบองที่สวนสาธารณะเทศบาล',
        content: 'ชวนผู้สูงอายุมาร่วมกิจกรรมรำกระบองเพื่อสุขภาพ วันเสาร์ เวลา 07:00 น. บริเวณลานน้ำพุ มีเจ้าหน้าที่ช่วยดูแลค่ะ',
        author: 'ชมรมผู้สูงอายุ',
        pinned: false
    },
    {
        id: 3,
        category: 'memory',
        title: '🎞️ นิทรรศการภาพถ่าย “พระนครในวันวาน”',
        content: 'สุดสัปดาห์นี้มีภาพถ่ายเก่าหาชมยาก ณ หอศิลป์ชุมชน เหมาะสำหรับชวนลูกหลานไปเดินชมและเล่าความหลังค่ะ',
        author: 'เจ้าหน้าที่ศูนย์',
        pinned: false
    }
];

let voiceMemories = [];
let medicineLog = [
    {
        id: 1,
        name: 'ยาความดัน (เม็ดสีขาว)',
        time: '08:00 น.',
        status: 'รอการยืนยัน',
        img: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=150&auto=format&fit=crop'
    },
    {
        id: 2,
        name: 'วิตามินบำรุงกระดูก (แคปซูลสีเหลือง)',
        time: '12:30 น.',
        status: 'รอการยืนยัน',
        img: 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?q=80&w=150&auto=format&fit=crop'
    }
];

const caregivers = [
    {
        id: 1,
        name: 'สมหญิง ใจดี',
        age: 34,
        personality: 'ร่าเริง คุยง่าย ใจเย็น ชื่นชอบเพลงสุนทราภรณ์และอาหารไทยเดิม',
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?q=80&w=200&auto=format&fit=crop'
    },
    {
        id: 2,
        name: 'สมชาย รักสงบ',
        age: 42,
        personality: 'สุภาพ รอบคอบ เคยเป็นบุรุษพยาบาล ชอบเดินสวนและช่วยดูแลการเคลื่อนไหวอย่างปลอดภัย',
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop'
    },
    {
        id: 3,
        name: 'ฟ้า พลอยสวย',
        age: 26,
        personality: 'สุภาพ อธิบายช้าและชัดเจน ชวนคุยเรื่องประวัติศาสตร์และวรรณคดีได้ดี',
        rating: 5.0,
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
    }
];

function safeString(value, fallback = '') {
    return typeof value === 'string' ? value.trim().slice(0, 500) : fallback;
}

function sortedPinnedFirst(items) {
    return [...items].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
}


app.post('/api/auth/register', (req, res) => {
    const name = safeString(req.body.name, '').slice(0, 80);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!name) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อที่ต้องการให้แสดงค่ะ' });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลให้ถูกต้องค่ะ' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษรค่ะ' });
    }
    if (users.some(user => user.email === email)) {
        return res.status(409).json({ success: false, message: 'อีเมลนี้ถูกใช้สมัครสมาชิกแล้วค่ะ' });
    }

    const user = {
        id: users.length + 1,
        name,
        email,
        passwordHash: hashPassword(password)
    };
    users.push(user);

    res.status(201).json({
        success: true,
        message: 'สมัครสมาชิกและเข้าสู่ระบบเรียบร้อยแล้วค่ะ',
        user: { id: user.id, name: user.name, email: user.email }
    });
});

app.post('/api/auth/login', (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!isValidEmail(email) || !password) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและรหัสผ่านให้ครบค่ะ' });
    }

    const user = users.find(item => item.email === email && item.passwordHash === hashPassword(password));
    if (!user) {
        return res.status(401).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้องค่ะ' });
    }

    res.json({
        success: true,
        message: `ยินดีต้อนรับ ${user.name} ค่ะ`,
        user: { id: user.id, name: user.name, email: user.email }
    });
});

app.get('/api/feed', (req, res) => {
    const rawCategory = safeString(req.query.category, 'all') || 'all';
    const category = ALLOWED_CATEGORIES.has(rawCategory) ? rawCategory : 'all';
    const filtered = category === 'all' ? feedItems : feedItems.filter(item => item.category === category);
    res.json({ success: true, data: sortedPinnedFirst(filtered) });
});

app.post('/api/checkin', (req, res) => {
    const username = safeString(req.body.username);
    const hobby = safeString(req.body.hobby);
    const location = safeString(req.body.location, 'สวนสาธารณะ') || 'สวนสาธารณะ';

    if (!username || !hobby) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อและเลือกความสนใจให้ครบค่ะ' });
    }

    const nearbyPeople = [
        { name: 'ป้าสมศรี (ระยะ 50 เมตร)', hobby, msg: 'กำลังนั่งร้อยพวงมาลัยอยู่ที่ม้านั่งใต้ต้นหูกวางค่ะ' },
        { name: 'ลุงชาญ (ระยะ 120 เมตร)', hobby: 'ฟังเพลงเก่า/เดินออกกำลังกาย', msg: 'พกวิทยุเครื่องเล็กมาเปิดฟังแถวสระน้ำ มานั่งคุยกันได้นะครับ' }
    ];

    res.json({ success: true, message: `พบเพื่อนใกล้เคียงที่ ${location} แล้วค่ะ`, nearby: nearbyPeople });
});

app.get('/api/health/meds', (req, res) => {
    res.json({ success: true, data: medicineLog });
});

app.post('/api/health/meds/confirm', (req, res) => {
    const medId = Number(req.body.medId);
    if (!Number.isInteger(medId)) {
        return res.status(400).json({ success: false, message: 'รหัสยาไม่ถูกต้องค่ะ' });
    }
    const med = medicineLog.find(item => item.id === medId);
    if (!med) {
        return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลยารายการนี้ค่ะ' });
    }
    med.status = 'ทานแล้วเรียบร้อย';
    res.json({ success: true, message: `บันทึกว่า “${med.name}” ทานแล้ว และแจ้งครอบครัวเรียบร้อยค่ะ 💚` });
});

app.get('/api/health/wearable', (req, res) => {
    res.json({ success: true, heartRate: 72, steps: 4230, sleepHours: '7 ชั่วโมง 30 นาที', status: 'ปกติ', fallDetected: false });
});

app.post('/api/memories/voice', (req, res) => {
    const textContent = safeString(req.body.textContent, '').slice(0, 1000);
    if (!textContent) {
        return res.status(400).json({ success: false, message: 'ยังไม่มีข้อความจากเสียงค่ะ' });
    }
    const newMemory = { id: voiceMemories.length + 1, text: textContent, date: new Date().toLocaleDateString('th-TH') };
    voiceMemories.push(newMemory);
    res.json({ success: true, message: 'บันทึกเรื่องเล่าเรียบร้อยค่ะ', data: voiceMemories });
});

app.get('/api/memories/voice', (req, res) => {
    res.json({ success: true, data: voiceMemories });
});

app.post('/api/ai/companion', (req, res) => {
    const message = safeString(req.body.message, '');
    const lower = message.toLowerCase();
    const groups = {
        lonely: ['เหงา', 'คนเดียว', 'คิดถึง', 'ไม่มีเพื่อน', 'เงียบ'],
        health: ['ป่วย', 'เจ็บ', 'ยา', 'ปวด', 'หมอ', 'เวียนหัว', 'ล้ม', 'สุขภาพ'],
        family: ['ลูก', 'หลาน', 'ครอบครัว', 'พ่อ', 'แม่', 'ญาติ'],
        food: ['ข้าว', 'อาหาร', 'กับข้าว', 'ขนม', 'แกง', 'หิว']
    };
    const replyPools = {
        default: [
            'ขอบคุณที่เล่าให้ฟังนะคะ ฉันอยู่เป็นเพื่อนตรงนี้ค่ะ เล่าต่อได้เลย หรือพักจิบน้ำก่อนก็ได้นะคะ',
            'ฟังแล้วน่าสนใจมากค่ะ ค่อย ๆ เล่าได้เลยนะคะ ฉันตั้งใจฟังอยู่ค่ะ',
            'วันนี้คุณตาคุณยายอยากคุยเรื่องสบายใจ เรื่องสุขภาพ หรือเรื่องความหลังดีคะ'
        ],
        lonely: [
            'ไม่ต้องอยู่กับความเหงาคนเดียวนะคะ ฉันอยู่ตรงนี้เสมอ ลองเล่าเรื่องที่คิดถึงให้ฉันฟังต่อได้ค่ะ',
            'บางวันบ้านเงียบไปหน่อยก็ทำให้ใจเหงานะคะ เราคุยเรื่องเบา ๆ กันก่อนได้ค่ะ'
        ],
        health: [
            'ขอให้ค่อย ๆ ดูแลตัวเองนะคะ อย่าลืมดูสมุดเตือนยา ดื่มน้ำให้พอ และถ้ามีอาการผิดปกติให้บอกคนในครอบครัวหรือพบแพทย์ค่ะ',
            'เรื่องสุขภาพต้องค่อย ๆ สังเกตนะคะ ถ้ามีอาการเจ็บแน่น หายใจลำบาก เวียนหัวมาก หรือหกล้ม ควรรีบบอกคนใกล้ตัวทันทีค่ะ'
        ],
        family: [
            'เรื่องลูกหลานเป็นเรื่องที่มีคุณค่ามากค่ะ ลองบันทึกเป็นความทรงจำไว้ให้เขาอ่านภายหลังได้นะคะ',
            'ลูกหลานอาจยุ่งบ้าง แต่ความห่วงใยมักยังอยู่เสมอค่ะ ลองส่งข้อความสั้น ๆ ว่า “คิดถึงนะ” ก็อบอุ่นใจดีค่ะ'
        ],
        food: [
            'พูดถึงอาหารแล้วอบอุ่นใจค่ะ เมนูบ้าน ๆ ที่ทำบ่อยที่สุดคืออะไรคะ',
            'ถ้าเป็นขนมไทย คุณตาคุณยายชอบขนมอะไรที่สุดคะ'
        ]
    };

    let group = 'default';
    for (const [key, words] of Object.entries(groups)) {
        if (words.some(word => lower.includes(word))) {
            group = key;
            break;
        }
    }
    const pool = replyPools[group] || replyPools.default;
    const reply = pool[Math.floor(Math.random() * pool.length)];
    res.json({ success: true, reply });
});

app.get('/api/caregivers', (req, res) => {
    res.json({ success: true, data: caregivers });
});

app.post('/api/caregivers/tip', (req, res) => {
    const caregiverId = Number(req.body.caregiverId);
    const amount = Number(req.body.amount);
    const caregiver = caregivers.find(item => item.id === caregiverId);
    if (!caregiver || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: 'ข้อมูลการให้ทิปไม่ถูกต้องค่ะ' });
    }
    res.json({ success: true, message: `ส่งกำลังใจ ${amount.toLocaleString('th-TH')} บาท ให้ ${caregiver.name} เรียบร้อยแล้วค่ะ` });
});

// Always return the landing page for any non-API route
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'ไม่พบ API ที่ร้องขอ' });
    }
    res.sendFile(path.join(PROJECT_DIR, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`ElderConnect running at http://localhost:${PORT}`);
});
