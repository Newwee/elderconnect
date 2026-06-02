const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_CATEGORIES = new Set(['all', 'health', 'life', 'memory']);

app.use(cors());
app.use(express.json({ limit: '64kb' }));

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


function sendProjectFile(res, filename) {
    res.sendFile(path.join(__dirname, filename));
}

app.get('/', (req, res) => sendProjectFile(res, 'index.html'));
app.get('/index.html', (req, res) => sendProjectFile(res, 'index.html'));
app.get('/style.css', (req, res) => sendProjectFile(res, 'style.css'));
app.get('/script.js', (req, res) => sendProjectFile(res, 'script.js'));
app.get('/logo.svg', (req, res) => sendProjectFile(res, 'logo.svg'));

function safeString(value, fallback = '') {
    return typeof value === 'string' ? value.trim().slice(0, 500) : fallback;
}

function sortedPinnedFirst(items) {
    return [...items].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
}

app.get('/api/feed', (req, res) => {
    const rawCategory = safeString(req.query.category, 'all') || 'all';
    const category = ALLOWED_CATEGORIES.has(rawCategory) ? rawCategory : 'all';
    const filtered = category === 'all'
        ? feedItems
        : feedItems.filter(item => item.category === category);
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

    res.json({
        success: true,
        message: `พบเพื่อนใกล้เคียงที่ ${location} แล้วค่ะ`,
        nearby: nearbyPeople
    });
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
    console.log(`[HEALTH ALERT] ยืนยันการทานยา: ${med.name}`);
    res.json({ success: true, message: `บันทึกว่า “${med.name}” ทานแล้ว และแจ้งครอบครัวเรียบร้อยค่ะ 💚` });
});

app.get('/api/health/wearable', (req, res) => {
    res.json({
        success: true,
        heartRate: 72,
        steps: 4230,
        sleepHours: '7 ชั่วโมง 30 นาที',
        status: 'ปกติ',
        fallDetected: false
    });
});

app.post('/api/memories/voice', (req, res) => {
    const textContent = safeString(req.body.textContent, '').slice(0, 1000);
    if (!textContent) {
        return res.status(400).json({ success: false, message: 'ยังไม่มีข้อความจากเสียงค่ะ' });
    }
    const newMemory = {
        id: voiceMemories.length + 1,
        text: textContent,
        date: new Date().toLocaleDateString('th-TH')
    };
    voiceMemories.push(newMemory);
    res.json({ success: true, message: 'บันทึกเรื่องเล่าเรียบร้อยค่ะ', data: voiceMemories });
});

app.get('/api/memories/voice', (req, res) => {
    res.json({ success: true, data: voiceMemories });
});

app.post('/api/ai/companion', (req, res) => {
    const message = safeString(req.body.message, '');
    const replyPools = {
        default: [
            'ขอบคุณที่เล่าให้ฟังนะคะ ฉันอยู่เป็นเพื่อนตรงนี้ค่ะ เล่าต่อได้เลย หรือพักจิบน้ำก่อนก็ได้นะคะ',
            'ฟังแล้วน่าสนใจมากค่ะ ค่อย ๆ เล่าได้เลยนะคะ ฉันตั้งใจฟังอยู่ค่ะ',
            'วันนี้คุณตาคุณยายอยากคุยเรื่องสบายใจ เรื่องสุขภาพ หรือเรื่องความหลังดีคะ',
            'ได้คุยกันแบบนี้ก็ดีต่อใจนะคะ มีเรื่องอะไรที่ทำให้ยิ้มในวันนี้บ้างไหมคะ',
            'เล่ามาได้เรื่อย ๆ เลยค่ะ ไม่ต้องรีบ ฉันจะค่อย ๆ คุยเป็นเพื่อนนะคะ'
        ],
        lonely: [
            'ไม่ต้องอยู่กับความเหงาคนเดียวนะคะ ฉันอยู่ตรงนี้เสมอ ลองเล่าเรื่องที่คิดถึงให้ฉันฟังต่อได้ค่ะ',
            'บางวันบ้านเงียบไปหน่อยก็ทำให้ใจเหงานะคะ เราคุยเรื่องเบา ๆ กันก่อนได้ค่ะ',
            'ขอบคุณที่บอกความรู้สึกนะคะ แค่ได้พูดออกมาก็ช่วยให้ใจเบาลงได้บ้างค่ะ',
            'วันนี้ลองโทรหาคนที่รัก หรือกดปุ่มชวนคุยหาเพื่อนใกล้บ้านก็ได้นะคะ ฉันเป็นกำลังใจให้ค่ะ'
        ],
        health: [
            'ขอให้ค่อย ๆ ดูแลตัวเองนะคะ อย่าลืมดูสมุดเตือนยา ดื่มน้ำให้พอ และถ้ามีอาการผิดปกติให้บอกคนในครอบครัวหรือพบแพทย์ค่ะ',
            'เรื่องสุขภาพต้องค่อย ๆ สังเกตนะคะ ถ้ามีอาการเจ็บแน่น หายใจลำบาก เวียนหัวมาก หรือหกล้ม ควรรีบบอกคนใกล้ตัวทันทีค่ะ',
            'วันนี้ลองพักสักครู่ ดื่มน้ำ และจดอาการไว้ก็ได้ค่ะ เวลาคุยกับลูกหลานหรือแพทย์จะได้เล่าได้ชัดเจนค่ะ',
            'ถ้าเป็นเรื่องยา อย่าเพิ่ม ลด หรือหยุดยาเองนะคะ ให้ดูฉลากยาและสอบถามบุคลากรทางการแพทย์ก่อนค่ะ'
        ],
        family: [
            'เรื่องลูกหลานเป็นเรื่องที่มีคุณค่ามากค่ะ ลองบันทึกเป็นความทรงจำไว้ให้เขาอ่านภายหลังได้นะคะ',
            'ลูกหลานอาจยุ่งบ้าง แต่ความห่วงใยมักยังอยู่เสมอค่ะ ลองส่งข้อความสั้น ๆ ว่า “คิดถึงนะ” ก็อบอุ่นใจดีค่ะ',
            'คุณตาคุณยายมีเรื่องน่ารักของลูกหลานที่จำได้แม่นไหมคะ เล่าให้ฉันฟังได้เลยค่ะ',
            'ความทรงจำในครอบครัวเป็นของขวัญมากค่ะ ถ้าเล่าไว้ ลูกหลานจะได้เก็บไว้ฟังนาน ๆ ค่ะ'
        ],
        food: [
            'พูดถึงอาหารแล้วอบอุ่นใจค่ะ เมนูบ้าน ๆ ที่ทำบ่อยที่สุดคืออะไรคะ',
            'อาหารฝีมือผู้ใหญ่ในบ้านมักมีเคล็ดลับพิเศษค่ะ เล่าเคล็ดลับให้ฟังหน่อยได้ไหมคะ',
            'ถ้าเป็นขนมไทย คุณตาคุณยายชอบขนมอะไรที่สุดคะ',
            'เมนูที่ลูกหลานชอบให้ทำคืออะไรคะ ฟังแล้วน่าจะมีความทรงจำดี ๆ เยอะเลยค่ะ'
        ],
        memory: [
            'เรื่องวันวานฟังแล้วมีเสน่ห์มากค่ะ สมัยก่อนบรรยากาศแถวนั้นเป็นอย่างไรบ้างคะ',
            'ความทรงจำเก่า ๆ มีค่ามากค่ะ เล่าต่อได้เลยนะคะ ฉันอยากฟังค่ะ',
            'สมัยก่อนมีเพลง หนัง หรือสถานที่ไหนที่คุณตาคุณยายคิดถึงเป็นพิเศษไหมคะ',
            'เรื่องนี้เหมาะกับการบันทึกไว้ให้ลูกหลานเลยค่ะ เล่าช้า ๆ ได้เต็มที่ค่ะ'
        ]
    };

    let pool = replyPools.default;
    if (message.includes('เหงา') || message.includes('คิดถึง') || message.includes('คนเดียว')) {
        pool = replyPools.lonely;
    } else if (message.includes('ยา') || message.includes('ป่วย') || message.includes('ไม่สบาย') || message.includes('เจ็บ') || message.includes('หมอ')) {
        pool = replyPools.health;
    } else if (message.includes('ลูก') || message.includes('หลาน') || message.includes('ครอบครัว')) {
        pool = replyPools.family;
    } else if (message.includes('อาหาร') || message.includes('ข้าว') || message.includes('ขนม') || message.includes('กิน')) {
        pool = replyPools.food;
    } else if (message.includes('อดีต') || message.includes('สมัยก่อน') || message.includes('ความหลัง') || message.includes('เพลง') || message.includes('หนัง')) {
        pool = replyPools.memory;
    }

    const reply = pool[Math.floor(Math.random() * pool.length)] || replyPools.default[0];
    res.json({ success: true, reply });
});

app.get('/api/caregivers', (req, res) => {
    res.json({ success: true, data: caregivers });
});

app.post('/api/payment/tip', (req, res) => {
    const caregiverId = Number(req.body.caregiverId);
    const amount = Number(req.body.amount);
    const caregiver = caregivers.find(item => item.id === caregiverId);

    if (!caregiver || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: 'กรุณาเลือกผู้ดูแลและระบุจำนวนเงินที่ถูกต้องค่ะ' });
    }

    res.json({ success: true, message: `ส่งทิป ${amount.toLocaleString('th-TH')} บาท ให้คุณ${caregiver.name} เรียบร้อยค่ะ 💝` });
});


app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'ไม่พบ API ที่เรียกใช้งานค่ะ' });
});

app.listen(PORT, () => {
    console.log(`🚀 ElderConnect is running at http://localhost:${PORT}`);
});
