/* ElderConnect - elder friendly and safer frontend */
document.addEventListener("DOMContentLoaded", function () {
    const API_URL = getApiBaseUrl();
    const VISION_CLASSES = ["dark-mode", "eyecare-mode", "protanopia", "deuteranopia", "tritanopia"];
    const FONT_CLASSES = ["font-large", "font-xlarge"];

    function getApiBaseUrl() {
        if (window.location.protocol === "http:" || window.location.protocol === "https:") {
            return `${window.location.origin}/api`;
        }
        return "http://localhost:3000/api";
    }

    async function fetchJson(path, options = {}) {
        const response = await fetch(`${API_URL}${path}`, options);
        let payload = null;
        try {
            payload = await response.json();
        } catch (error) {
            payload = { success: false, message: "ระบบตอบกลับไม่ถูกต้อง" };
        }
        if (!response.ok) {
            const message = payload && payload.message ? payload.message : "เชื่อมต่อระบบไม่สำเร็จ";
            throw new Error(message);
        }
        return payload;
    }

    function clearNode(node) {
        while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function createEl(tagName, className = "", text = "") {
        const node = document.createElement(tagName);
        if (className) node.className = className;
        if (text !== "") node.textContent = String(text);
        return node;
    }

    function appendText(parent, text, tagName = "span", className = "") {
        const node = createEl(tagName, className, text);
        parent.appendChild(node);
        return node;
    }

    function setLoading(target, message) {
        clearNode(target);
        target.appendChild(createEl("p", "elder-loading-text", message));
    }

    function formatNumber(value) {
        const num = Number(value);
        return Number.isFinite(num) ? num.toLocaleString("th-TH") : String(value || "-");
    }

    function normalizeAmount(value) {
        const amount = Number(value);
        if (!Number.isFinite(amount) || amount <= 0) return null;
        return Math.round(amount * 100) / 100;
    }

    const nearbyChatState = {
        partnerName: "คู่สนทนา",
        hobby: "พูดคุยทั่วไป",
        lastReplies: []
    };

    const tipPaymentState = {
        caregiverId: null,
        caregiverName: "ผู้ดูแล",
        amount: null
    };

    function pickRandom(items, recent = []) {
        const list = Array.isArray(items) ? items.filter(Boolean) : [];
        if (!list.length) return "ค่ะ";
        const filtered = list.filter(item => !recent.includes(item));
        const pool = filtered.length ? filtered : list;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    function rememberRecentReply(reply) {
        nearbyChatState.lastReplies.push(reply);
        if (nearbyChatState.lastReplies.length > 5) nearbyChatState.lastReplies.shift();
    }

    function getConversationTips(hobby = "") {
        const generic = [
            "สวัสดีค่ะ วันนี้รู้สึกเป็นอย่างไรบ้างคะ",
            "วันนี้ได้ทานข้าวและดื่มน้ำแล้วหรือยังคะ",
            "ตอนนี้นั่งอยู่แถวไหนของสวนคะ",
            "ช่วงนี้มีเรื่องอะไรที่ทำให้ยิ้มบ้างไหมคะ",
            "ชอบมาที่นี่ช่วงเช้าหรือช่วงเย็นคะ",
            "ถ้าวันนี้อยากคุยเรื่องสบายใจ อยากเริ่มจากเรื่องไหนดีคะ"
        ];
        const byHobby = {
            "ปลูกต้นไม้/ทำสวน": [
                "วันนี้ปลูกต้นไม้อะไรอยู่คะ",
                "มีวิธีดูแลต้นไม้ให้ใบสวยไหมคะ",
                "ชอบดอกไม้หรือต้นไม้ชนิดไหนเป็นพิเศษคะ",
                "ต้นไม้ต้นแรกที่เคยปลูกคืออะไรคะ",
                "รดน้ำต้นไม้ช่วงเช้าหรือเย็นดีกว่าคะ"
            ],
            "ทำอาหาร/ขนมไทย": [
                "มีเมนูโปรดสมัยก่อนแนะนำไหมคะ",
                "ขนมไทยอย่างไหนที่ทำแล้วภูมิใจที่สุดคะ",
                "เคล็ดลับทำอาหารให้อร่อยแบบบ้าน ๆ คืออะไรคะ",
                "เมนูที่ลูกหลานชอบให้ทำคืออะไรคะ",
                "สมัยก่อนซื้อวัตถุดิบจากตลาดไหนบ่อยที่สุดคะ"
            ],
            "ฟังธรรมะ/สวดมนต์": [
                "วันนี้ฟังธรรมะเรื่องอะไรอยู่คะ",
                "บทสวดไหนที่ฟังแล้วใจสงบที่สุดคะ",
                "วัดที่ชอบไปทำบุญอยู่แถวไหนคะ",
                "มีข้อคิดดี ๆ ที่อยากแบ่งปันไหมคะ",
                "เวลารู้สึกไม่สบายใจ ท่านใช้วิธีไหนให้ใจสงบคะ"
            ],
            "ออกกำลังกายเบาๆ": [
                "วันนี้เดินออกกำลังกายกี่รอบแล้วคะ",
                "มีท่าออกกำลังกายเบา ๆ แนะนำไหมคะ",
                "ชอบเดินรับลมตรงโซนไหนของสวนคะ",
                "เดินช้า ๆ แล้วพักตรงไหนสบายที่สุดคะ",
                "ก่อนเดินออกกำลังกายชอบยืดเส้นแบบไหนคะ"
            ]
        };
        const specific = byHobby[hobby] || [];
        return shuffleArrayElements([...specific, ...generic]).slice(0, 7);
    }

    function getNearbyReplyOptions(text, hobby) {
        const lower = String(text || "").trim().toLowerCase();
        const replies = [];
        const addReplies = (...items) => replies.push(...items.filter(Boolean));
        const hasAny = (...words) => words.some(word => lower.includes(word));

        if (hasAny("สวัสดี", "หวัดดี", "ดีค่ะ", "ดีครับ", "hello", "hi")) {
            addReplies(
                "สวัสดีค่ะ ดีใจมากที่ได้คุยกัน วันนี้อยากคุยเรื่องอะไรเป็นพิเศษไหมคะ 😊",
                "สวัสดีครับ ได้เพื่อนคุยแล้วรู้สึกอบอุ่นขึ้นเยอะเลยครับ",
                "สวัสดีค่ะ ทักมาได้เลยนะคะ คุยกันสบาย ๆ ไม่ต้องเกรงใจค่ะ",
                "สวัสดีจ้า วันนี้เห็นคนยิ้มแย้มแล้วใจดีขึ้นเลยค่ะ"
            );
        }
        if (hasAny("เหงา", "คนเดียว", "คิดถึง", "เงียบ", "ไม่มีเพื่อน")) {
            addReplies(
                "เข้าใจเลยค่ะ บางวันก็เหงาเป็นพิเศษ แต่ตอนนี้เรามีเพื่อนคุยตรงนี้แล้วนะคะ",
                "อยู่คนเดียวบางทีก็เงียบไปหน่อยค่ะ ลองเล่าเรื่องที่คิดถึงให้ฟังได้นะคะ",
                "ไม่ต้องเก็บไว้คนเดียวนะคะ ค่อย ๆ คุยกัน ฉันยินดีฟังค่ะ",
                "ถ้าวันนี้ใจมันเหงา เราคุยเรื่องเบา ๆ กันก่อนก็ได้ค่ะ เช่น เพลงเก่าหรือของกินที่ชอบ",
                "ขอบคุณที่ทักมานะคะ การเริ่มคุยกันนี่แหละเป็นก้าวแรกที่ดีมากค่ะ"
            );
        }
        if (hasAny("ฝน", "ร้อน", "หนาว", "อากาศ", "ลม", "แดด")) {
            addReplies(
                "ใช่ค่ะ ช่วงนี้อากาศเปลี่ยนบ่อย อย่าลืมพกร่มและจิบน้ำบ่อย ๆ นะคะ",
                "วันนี้ถ้าร้อนมาก ลองนั่งใต้ร่มไม้ก่อนนะคะ คุยกันไปพักไปก็ได้ค่ะ",
                "อากาศแบบนี้เหมาะกับการเดินช้า ๆ แล้วนั่งพักคุยกันค่ะ",
                "ถ้าลมเย็น ๆ แบบนี้ นั่งคุยใต้ต้นไม้คงสบายมากเลยค่ะ",
                "แดดแรงต้องระวังนิดหนึ่งนะคะ ใส่หมวกหรือเลือกทางเดินที่มีร่มไม้จะดีมากค่ะ"
            );
        }
        if (hasAny("ข้าว", "อาหาร", "กิน", "ขนม", "แกง", "ตลาด", "กับข้าว")) {
            addReplies(
                "พูดถึงของกินแล้วนึกถึงกับข้าวบ้าน ๆ เลยค่ะ เมนูโปรดของคุณคืออะไรคะ",
                "อาหารฝีมือคนรุ่นก่อนอร่อยมากค่ะ มีเคล็ดลับอะไรอยากเล่าไหมคะ",
                "ฟังแล้วหิวเลยค่ะ ถ้าเป็นขนมไทย ฉันชอบฟังเรื่องวิธีทำมากค่ะ",
                "เมนูบ้าน ๆ นี่มีเสน่ห์มากนะคะ สมัยก่อนชอบทำกับข้าวอะไรให้ครอบครัวทานคะ",
                "ถ้าได้เดินตลาดด้วยกันคงสนุกค่ะ คุณชอบซื้ออะไรเป็นอย่างแรกคะ"
            );
        }
        if (hasAny("ต้นไม้", "สวน", "ดอกไม้", "ปลูก", "รดน้ำ", "ปุ๋ย") || hobby === "ปลูกต้นไม้/ทำสวน") {
            addReplies(
                "เรื่องต้นไม้นี่คุยได้ยาวเลยค่ะ วันนี้ดูแลต้นอะไรอยู่คะ 🌿",
                "ปลูกต้นไม้แล้วใจสงบดีนะคะ มีต้นไหนที่เลี้ยงง่ายสำหรับมือใหม่ไหมคะ",
                "ถ้ามีโอกาสอยากขอคำแนะนำเรื่องรดน้ำกับใส่ปุ๋ยบ้างค่ะ",
                "ดอกไม้บานทีไรใจสดชื่นทุกทีค่ะ คุณชอบดอกสีอะไรที่สุดคะ",
                "สวนเล็ก ๆ ก็ทำให้บ้านมีชีวิตชีวาได้มากเลยนะคะ"
            );
        }
        if (hasAny("ธรรม", "บุญ", "สวด", "วัด", "พระ", "ใจสงบ") || hobby === "ฟังธรรมะ/สวดมนต์") {
            addReplies(
                "ฟังธรรมะแล้วใจเย็นขึ้นจริงค่ะ วันนี้มีข้อคิดอะไรดี ๆ บ้างไหมคะ 🙏",
                "บทสวดเบา ๆ ช่วยให้สบายใจมากค่ะ คุณชอบบทไหนเป็นพิเศษคะ",
                "ถ้าไปทำบุญด้วยกันคงดีนะคะ วัดใกล้บ้านคุณบรรยากาศเป็นอย่างไรบ้างคะ",
                "เรื่องธรรมะบางทีฟังสั้น ๆ แต่ช่วยให้ใจเบาขึ้นมากเลยค่ะ",
                "คุณเล่าเรื่องวัดที่ชอบไปให้ฟังหน่อยได้ไหมคะ"
            );
        }
        if (hasAny("เดิน", "ออกกำลัง", "ออกกำลังกาย", "ปวด", "เข่า", "เมื่อย", "สุขภาพ") || hobby === "ออกกำลังกายเบาๆ") {
            addReplies(
                "เดินเบา ๆ แล้วพักเป็นระยะดีมากค่ะ ไม่ต้องรีบ เอาที่ร่างกายสบายที่สุดนะคะ",
                "ถ้าปวดเข่า อย่าฝืนมากนะคะ นั่งพักแล้วค่อยเดินต่อก็ได้ค่ะ",
                "เดินไปคุยไปเพลินดีค่ะ วันนี้ตั้งใจเดินกี่รอบคะ",
                "แค่ขยับตัวนิดหน่อยทุกวันก็เก่งมากแล้วค่ะ สุขภาพค่อย ๆ ดีขึ้นได้ค่ะ",
                "ถ้าเดินเหนื่อย ลองหายใจช้า ๆ แล้วพักดื่มน้ำก่อนนะคะ"
            );
        }
        if (hasAny("ลูก", "หลาน", "ครอบครัว", "บ้าน", "แม่", "พ่อ")) {
            addReplies(
                "เรื่องลูกหลานนี่เล่าแล้วอบอุ่นใจนะคะ เขาชอบกลับมาหาช่วงไหนคะ",
                "ครอบครัวเป็นกำลังใจสำคัญเลยค่ะ มีเรื่องน่ารักของหลาน ๆ เล่าให้ฟังไหมคะ",
                "บางทีลูกหลานยุ่ง แต่เขาก็ยังห่วงเราเสมอค่ะ ลองส่งข้อความสั้น ๆ หาเขาก็ได้นะคะ",
                "ฟังเรื่องครอบครัวแล้วอบอุ่นค่ะ คุณภูมิใจเรื่องอะไรของลูกหลานที่สุดคะ",
                "บ้านที่มีเรื่องเล่าเก่า ๆ มักอบอุ่นเสมอค่ะ เล่าต่อได้เลยนะคะ"
            );
        }
        if (hasAny("เพลง", "หนัง", "ละคร", "อดีต", "สมัยก่อน", "ความหลัง", "โรงหนัง")) {
            addReplies(
                "เรื่องวันวานฟังแล้วมีเสน่ห์มากค่ะ สมัยก่อนบรรยากาศเป็นอย่างไรบ้างคะ",
                "เพลงเก่าหลายเพลงฟังแล้วใจนุ่มขึ้นเลยค่ะ คุณชอบเพลงของใครคะ",
                "ถ้าเป็นหนังหรือละครสมัยก่อน เรื่องไหนที่จำได้แม่นที่สุดคะ",
                "ความทรงจำดี ๆ มีค่ามากค่ะ เล่าให้ฟังอีกนิดได้ไหมคะ"
            );
        }

        addReplies(
            "ฟังแล้วน่าสนใจมากค่ะ เล่าต่ออีกนิดได้ไหมคะ",
            "ดีจังเลยค่ะ เรื่องนี้ทำให้นึกถึงวันเก่า ๆ เลย คุณมีความทรงจำเกี่ยวกับเรื่องนี้ไหมคะ",
            "ขอบคุณที่เล่าให้ฟังนะคะ คุยกับคุณแล้วรู้สึกสบายใจค่ะ",
            "ค่อย ๆ คุยกันได้เลยค่ะ ฉันอยู่ตรงนี้และตั้งใจฟังนะคะ",
            "ถ้าสะดวก เราเริ่มจากเรื่องง่าย ๆ ก่อนก็ได้ค่ะ วันนี้มีอะไรที่ทำให้ยิ้มบ้างคะ",
            "เรื่องนี้ฟังแล้วอบอุ่นมากค่ะ คุณอยากเล่าต่อจากตรงไหนคะ",
            "ฉันชอบฟังเรื่องที่คุณเล่านะคะ ฟังแล้วเหมือนได้เห็นภาพตามเลยค่ะ",
            "คุณเล่าได้ดีมากค่ะ ขอถามต่ออีกนิดนะคะ เรื่องนี้เกิดขึ้นช่วงไหนคะ",
            "ดีใจที่ได้คุยกันค่ะ บทสนทนาเล็ก ๆ แบบนี้ช่วยให้วันธรรมดาน่ารักขึ้นเยอะเลยค่ะ"
        );

        return replies;
    }

    function renderNearbyChatTips(hobby) {
        const tipsBox = document.getElementById("nearby-chat-tips");
        const input = document.getElementById("nearby-chat-input");
        if (!tipsBox) return;
        clearNode(tipsBox);
        getConversationTips(hobby).forEach(tip => {
            const button = createEl("button", "conversation-tip-btn", tip);
            button.type = "button";
            button.addEventListener("click", () => {
                if (input) {
                    input.value = tip;
                    input.focus();
                }
                showToast("ใส่ข้อความชวนคุยให้แล้ว กดส่งได้เลยค่ะ", "info");
            });
            tipsBox.appendChild(button);
        });
    }

    function updateTipSummary() {
        const summary = document.getElementById("tip-confirm-summary");
        const customInput = document.getElementById("tip-custom-amount");
        if (customInput && customInput.value) {
            const customAmount = normalizeAmount(customInput.value);
            if (customAmount) tipPaymentState.amount = customAmount;
        }
        if (summary) {
            summary.textContent = tipPaymentState.amount
                ? `ยอดทิปที่เลือก: ${formatNumber(tipPaymentState.amount)} บาท`
                : "ยอดทิปที่เลือก: ยังไม่ได้เลือก";
        }
        document.querySelectorAll(".tip-amount-btn").forEach(button => {
            const amount = Number(button.dataset.amount);
            button.classList.toggle("active", Number(tipPaymentState.amount) === amount);
        });
    }

    function appendChatMessage(chatBox, speaker, message, type) {
        const bubble = createEl("div", `chat-bubble-msg ${type}`);
        const speakerStrong = createEl("b", "", `${speaker}: `);
        bubble.appendChild(speakerStrong);
        bubble.appendChild(document.createTextNode(String(message)));
        chatBox.appendChild(bubble);
        chatBox.scrollTop = chatBox.scrollHeight;
        return bubble;
    }

    window.showToast = function (message, type = "info") {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const iconMap = {
            success: "✅",
            error: "⚠️",
            warning: "❗",
            info: "🔔"
        };
        const toast = createEl("div", `toast-card ${type}`);
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        toast.appendChild(createEl("div", "toast-icon", iconMap[type] || iconMap.info));
        toast.appendChild(createEl("div", "toast-message", message));
        container.appendChild(toast);
        setTimeout(() => toast.classList.add("active"), 40);
        setTimeout(() => {
            toast.classList.remove("active");
            setTimeout(() => toast.remove(), 400);
        }, 4200);
    };

    function applyVisionMode(mode) {
        document.body.classList.remove(...VISION_CLASSES);
        const classByMode = {
            dark: "dark-mode",
            eyecare: "eyecare-mode",
            protanopia: "protanopia",
            deuteranopia: "deuteranopia",
            tritanopia: "tritanopia"
        };
        if (classByMode[mode]) document.body.classList.add(classByMode[mode]);
        try { localStorage.setItem("elderconnect-vision-mode", mode); } catch (error) {}
    }

    function applyFontSize(size) {
        document.body.classList.remove(...FONT_CLASSES);
        if (size === "large") document.body.classList.add("font-large");
        if (size === "xlarge") document.body.classList.add("font-xlarge");
        try { localStorage.setItem("elderconnect-font-size", size); } catch (error) {}
    }

    const visionSelect = document.getElementById("vision-mode-select");
    if (visionSelect) {
        const savedMode = (() => {
            try { return localStorage.getItem("elderconnect-vision-mode") || "normal"; } catch (error) { return "normal"; }
        })();
        visionSelect.value = savedMode;
        applyVisionMode(savedMode);
        visionSelect.addEventListener("change", function (event) {
            applyVisionMode(event.target.value);
            showToast("ปรับโหมดสีหน้าจอเรียบร้อยแล้วค่ะ", "success");
        });
    }

    const savedFontSize = (() => {
        try { return localStorage.getItem("elderconnect-font-size") || "large"; } catch (error) { return "large"; }
    })();
    applyFontSize(savedFontSize);

    const fontNormalBtn = document.getElementById("font-normal-btn");
    const fontLargeBtn = document.getElementById("font-large-btn");
    const fontXLargeBtn = document.getElementById("font-xlarge-btn");
    if (fontNormalBtn) fontNormalBtn.addEventListener("click", () => { applyFontSize("normal"); showToast("ปรับขนาดตัวอักษรเป็นปกติแล้วค่ะ", "success"); });
    if (fontLargeBtn) fontLargeBtn.addEventListener("click", () => { applyFontSize("large"); showToast("เพิ่มตัวอักษรให้อ่านง่ายแล้วค่ะ", "success"); });
    if (fontXLargeBtn) fontXLargeBtn.addEventListener("click", () => { applyFontSize("xlarge"); showToast("เพิ่มตัวอักษรใหญ่พิเศษแล้วค่ะ", "success"); });

    window.filterFeeds = function (category) {
        document.querySelectorAll(".feed-zone-main-btn").forEach(btn => btn.classList.remove("active"));
        const targetBtn = document.getElementById(`feed-btn-${category}`);
        if (targetBtn) targetBtn.classList.add("active");
        window.loadFeeds(category);
    };

    const defaultFeeds = [
        { id: 1, category: "health", title: "🏥 ข้อควรระวังช่วงฝนตก", content: "หลีกเลี่ยงการเดินกลางแจ้งตอนฝนตก เปลี่ยนเป็นแกว่งแขนหรือเดินเบา ๆ ในบ้าน 10–15 นาที และใช้รองเท้ากันลื่นทุกครั้งค่ะ", author: "คุณหมอประจำแอป", pinned: true },
        { id: 2, category: "memory", title: "🎞️ ชวนเล่าความหลังย่านพระนคร", content: "สมาชิกท่านใดเคยไปดูหนังหรือเดินเที่ยวพระนครในอดีต ลองเล่าเรื่องสั้น ๆ ให้เพื่อน ๆ ฟังเพื่อคลายเหงาได้เลยค่ะ", author: "คุณตาประเสริฐ", pinned: false },
        { id: 3, category: "life", title: "💬 เมื่ออยู่บ้านคนเดียวแล้วเหงา", content: "ลองเลือกกิจกรรมเล็ก ๆ เช่น ปลูกต้นไม้ สวดมนต์ ฟังเพลงเก่า หรือกดปุ่มชวนคุยเพื่อหาเพื่อนใกล้บ้านค่ะ", author: "ทีม ElderConnect", pinned: false }
    ];

    window.loadFeeds = async function (category = "all") {
        const feedContainer = document.getElementById("feed-list-display");
        if (!feedContainer) return;
        setLoading(feedContainer, "กำลังโหลดข่าวสารที่อ่านง่ายให้ค่ะ...");
        try {
            const result = await fetchJson(`/feed?category=${encodeURIComponent(category)}`);
            const data = result.success && Array.isArray(result.data) && result.data.length > 0
                ? result.data
                : defaultFeeds.filter(item => category === "all" || item.category === category);
            renderFeedsUi(data, feedContainer);
        } catch (error) {
            renderFeedsUi(defaultFeeds.filter(item => category === "all" || item.category === category), feedContainer);
        }
    };

    function renderFeedsUi(data, container) {
        clearNode(container);
        data.forEach(item => {
            const card = createEl("article", `elder-feed-item-card-block ${item.pinned ? "pinned-active-border" : ""}`);
            if (item.pinned) {
                card.appendChild(createEl("span", "elder-badge-pinned-label", "📌 ข่าวสำคัญ อ่านก่อน"));
            }
            card.appendChild(createEl("h4", "block-feed-title-text", item.title));
            card.appendChild(createEl("p", "block-feed-body-text", item.content));
            const footer = createEl("div", "block-feed-footer-meta");
            footer.appendChild(document.createTextNode("ประกาศโดย: "));
            footer.appendChild(createEl("b", "", item.author || "ElderConnect"));
            card.appendChild(footer);
            container.appendChild(card);
        });
    }

    window.performElderCheckin = async function () {
        const nameInput = document.getElementById("checkin-name");
        const hobbyInput = document.getElementById("checkin-hobby");
        const resultDiv = document.getElementById("checkin-api-result");
        if (!resultDiv || !nameInput || !hobbyInput) return;
        const name = nameInput.value.trim();
        const hobby = hobbyInput.value;
        if (!name) {
            showToast("กรุณากรอกชื่อเล่นก่อนเช็คอินค่ะ", "warning");
            nameInput.focus();
            return;
        }
        setLoading(resultDiv, "กำลังค้นหาเพื่อนใกล้บ้านที่สนใจเรื่องเดียวกันค่ะ...");

        try {
            const response = await fetchJson("/checkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: name, hobby, location: "สวนลุมพินี" })
            });
            renderCheckinResult(response.nearby || [], resultDiv, response.message || "พบเพื่อนใกล้บ้านแล้วค่ะ");
        } catch (error) {
            const fallbackNearby = [
                { name: "คุณตาประเสริฐ (ห่าง 40 เมตร)", hobby, msg: "กำลังรดน้ำต้นไม้อยู่ที่ม้านั่งใต้ต้นไม้ใหญ่ เดินไปทักทายได้ค่ะ" },
                { name: "คุณป้าสมศรี (ห่าง 90 เมตร)", hobby: "ฟังธรรมะ/สวดมนต์", msg: "นั่งฟังธรรมะเบา ๆ ที่ศาลาริมน้ำค่ะ" }
            ];
            renderCheckinResult(fallbackNearby, resultDiv, "ใช้ข้อมูลตัวอย่าง เพราะยังเชื่อมต่อหลังบ้านไม่ได้ค่ะ");
        }
    };

    function renderCheckinResult(data, div, message) {
        clearNode(div);
        showToast("พบเพื่อนใกล้บ้านแล้วค่ะ", "success");
        const wrapper = createEl("div", "result-box-wrapper");
        wrapper.appendChild(createEl("h5", "result-title", `🎯 ${message}`));
        wrapper.appendChild(createEl("p", "result-helper-text", "เลือกคนที่อยากทักทาย แล้วกดปุ่มแชทได้เลยค่ะ"));

        data.forEach(person => {
            const card = createEl("div", "elder-nearby-card-item");
            card.appendChild(createEl("div", "nearby-person-name", `👤 ${person.name}`));
            const hobby = createEl("div", "nearby-person-hobby");
            hobby.appendChild(document.createTextNode("ความสนใจ: "));
            hobby.appendChild(createEl("span", "badge-hobby-giant", person.hobby || "พูดคุยทั่วไป"));
            card.appendChild(hobby);
            card.appendChild(createEl("div", "elder-chat-bubble-quote", `📢 สถานะ: ${person.msg || "พร้อมพูดคุย"}`));
            const chatButton = createEl("button", "btn-submit-post-elder", "💬 กดส่งแชทพูดคุยส่วนตัว");
            chatButton.type = "button";
            chatButton.addEventListener("click", () => window.openNearbyChat(person.name, person.hobby, person.msg));
            card.appendChild(chatButton);
            wrapper.appendChild(card);
        });
        div.appendChild(wrapper);
    }

    window.openNearbyChat = function (partnerName, hobby = "พูดคุยทั่วไป", statusMessage = "") {
        const modal = document.getElementById("nearby-chat-modal");
        const title = document.getElementById("nearby-chat-title");
        const subtitle = document.getElementById("nearby-chat-subtitle");
        const chatBox = document.getElementById("nearby-chat-box");
        if (!modal || !title || !chatBox) return;
        nearbyChatState.partnerName = partnerName || "คู่สนทนา";
        nearbyChatState.hobby = hobby || "พูดคุยทั่วไป";
        nearbyChatState.lastReplies = [];
        title.textContent = `กำลังแชทกับ ${nearbyChatState.partnerName}`;
        if (subtitle) subtitle.textContent = `ความสนใจ: ${nearbyChatState.hobby} • ใช้ทิปชวนคุยได้เลย`;
        clearNode(chatBox);
        const greetings = [
            `สวัสดีค่ะ ฉันสนใจเรื่อง${nearbyChatState.hobby}เหมือนกัน ดีใจที่ได้คุยกันนะคะ 😊`,
            "สวัสดีครับ วันนี้ดีใจที่ได้เจอเพื่อนคุยใหม่ ๆ ครับ",
            "สวัสดีค่ะ คุยกันสบาย ๆ ได้เลยนะคะ ฉันยินดีฟังค่ะ"
        ];
        appendChatMessage(chatBox, nearbyChatState.partnerName, pickRandom(greetings), "bot-type");
        if (statusMessage) appendChatMessage(chatBox, nearbyChatState.partnerName, `ตอนนี้: ${statusMessage}`, "bot-type");
        renderNearbyChatTips(nearbyChatState.hobby);
        modal.classList.remove("game-hidden");
        const input = document.getElementById("nearby-chat-input");
        if (input) {
            input.value = "";
            setTimeout(() => input.focus(), 50);
        }
    };

    window.closeNearbyChat = function () {
        const modal = document.getElementById("nearby-chat-modal");
        if (modal) modal.classList.add("game-hidden");
    };

    window.sendNearbyMessage = function () {
        const input = document.getElementById("nearby-chat-input");
        const chatBox = document.getElementById("nearby-chat-box");
        if (!input || !chatBox) return;
        const text = input.value.trim();
        if (!text) return;
        appendChatMessage(chatBox, "ฉัน", text, "user-type");
        input.value = "";
        const replyOptions = getNearbyReplyOptions(text, nearbyChatState.hobby);
        const reply = pickRandom(replyOptions, nearbyChatState.lastReplies);
        rememberRecentReply(reply);
        setTimeout(() => appendChatMessage(chatBox, nearbyChatState.partnerName, reply, "bot-type"), 500);
    };

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            window.closeNearbyChat();
            window.closeTipModal();
        }
        if (event.key === "Enter" && document.activeElement && document.activeElement.id === "nearby-chat-input") window.sendNearbyMessage();
        if (event.key === "Enter" && document.activeElement && document.activeElement.id === "chat-user-input-field") window.sendMessageToAICompanion();
    });

    window.refreshWearableData = async function () {
        const displayBox = document.getElementById("wearable-metrics-box");
        if (!displayBox) return;
        try {
            const data = await fetchJson("/health/wearable");
            renderWearableStats(data, displayBox);
        } catch (error) {
            renderWearableStats({ heartRate: 75, steps: 3820, sleepHours: "7 ชั่วโมง 30 นาที", status: "ปกติ" }, displayBox);
        }
    };

    function renderWearableStats(data, target) {
        clearNode(target);
        const list = createEl("ul", "health-stat-list");
        [
            `💓 ชีพจร: ${formatNumber(data.heartRate)} ครั้ง/นาที`,
            `🚶 ก้าวเดินวันนี้: ${formatNumber(data.steps)} ก้าว`,
            `💤 การนอน: ${data.sleepHours || "-"}`,
            `🟢 สถานะ: ${data.status || "ปกติ"}`
        ].forEach(text => list.appendChild(createEl("li", "", text)));
        target.appendChild(list);
        showToast("อัปเดตข้อมูลสุขภาพเรียบร้อยค่ะ", "success");
    }

    window.triggerFallSimulation = function () {
        showToast("🚨 ทดสอบแจ้งเตือนลื่นล้มสำเร็จ ระบบจำลองส่งพิกัดให้ครอบครัวแล้วค่ะ", "error");
        const actionSection = document.getElementById("health-section");
        if (actionSection) {
            actionSection.classList.add("screen-shake");
            setTimeout(() => actionSection.classList.remove("screen-shake"), 450);
        }
    };

    const staticMeds = [
        { id: 1, name: "ยาความดัน (เม็ดสีขาว)", time: "08:00 น.", status: "รอการยืนยัน", img: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=150&auto=format&fit=crop" },
        { id: 2, name: "วิตามินบำรุงกระดูก (แคปซูลสีเหลือง)", time: "12:30 น.", status: "รอการยืนยัน", img: "https://images.unsplash.com/photo-1611926653458-09294b3142bf?q=80&w=150&auto=format&fit=crop" }
    ];

    window.loadMeds = async function () {
        const medsContainer = document.getElementById("medicine-api-list");
        if (!medsContainer) return;
        setLoading(medsContainer, "กำลังโหลดรายการยาวันนี้ค่ะ...");
        try {
            const result = await fetchJson("/health/meds");
            renderMedsRow(result.success ? result.data : staticMeds, medsContainer);
        } catch (error) {
            renderMedsRow(staticMeds, medsContainer);
        }
    };

    function renderMedsRow(data, container) {
        clearNode(container);
        if (!Array.isArray(data) || data.length === 0) {
            container.appendChild(createEl("p", "elder-loading-text", "วันนี้ยังไม่มีรายการยาค่ะ"));
            return;
        }
        data.forEach(med => {
            const card = createEl("article", "elder-medicine-row-card");
            const image = document.createElement("img");
            image.src = med.img || "";
            image.alt = `รูปประกอบ ${med.name || "ยา"}`;
            image.loading = "lazy";
            card.appendChild(image);

            const detail = createEl("div", "medicine-detail");
            detail.appendChild(createEl("strong", "medicine-name", med.name || "รายการยา"));
            detail.appendChild(createEl("span", "medicine-time", `⏰ เวลาทาน: ${med.time || "-"}`));
            const status = createEl("span", `status-indicator ${String(med.status || "").includes("แล้ว") ? "done" : "pending"}`, `สถานะ: ${med.status || "รอการยืนยัน"}`);
            detail.appendChild(status);
            if (String(med.status || "").includes("รอ")) {
                const button = createEl("button", "btn-success-action", "✔️ กดยืนยันว่าทานยานี้แล้ว");
                button.type = "button";
                button.addEventListener("click", () => window.confirmMedicationEaten(med.id));
                detail.appendChild(button);
            }
            card.appendChild(detail);
            container.appendChild(card);
        });
    }

    window.confirmMedicationEaten = async function (id) {
        const medId = Number(id);
        if (!Number.isFinite(medId)) {
            showToast("ไม่พบรหัสยา กรุณาลองใหม่ค่ะ", "error");
            return;
        }
        try {
            const result = await fetchJson("/health/meds/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ medId })
            });
            showToast(result.message || "บันทึกการทานยาเรียบร้อยค่ะ", "success");
            window.loadMeds();
        } catch (error) {
            showToast("บันทึกในหน้านี้เรียบร้อย แต่ยังเชื่อมต่อหลังบ้านไม่ได้ค่ะ", "warning");
            const medsContainer = document.getElementById("medicine-api-list");
            staticMeds.forEach(med => {
                if (med.id === medId) med.status = "ทานแล้วเรียบร้อย";
            });
            if (medsContainer) renderMedsRow(staticMeds, medsContainer);
        }
    };

    window.recordElderStoryVoice = async function () {
        const records = [
            "สมัยอายุ 18 ปี แถวประตูน้ำยังมีคลองใสสะอาด มีบัวหลวงขึ้นเต็มสองฝั่งคลอง นั่งเรือไปตลาดแล้วมีความสุขมากค่ะ",
            "คิดถึงสูตรขนมทองเอกของคุณทวด กวนในกระทะทองเหลืองจนหอมอบควันเทียน อยากให้หลาน ๆ ช่วยกันสืบทอดค่ะ"
        ];
        const selected = records[Math.floor(Math.random() * records.length)];
        const targetDiv = document.getElementById("voice-conversion-result");
        if (targetDiv) {
            clearNode(targetDiv);
            targetDiv.appendChild(createEl("div", "elder-chat-bubble-quote", `📝 ข้อความจากเสียง: ${selected}`));
        }
        try {
            await fetchJson("/memories/voice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ textContent: selected })
            });
        } catch (error) {}
        showToast("บันทึกเรื่องเล่าเป็นตัวอักษรเรียบร้อยค่ะ", "success");
    };

    window.sendMessageToAICompanion = async function () {
        const inputField = document.getElementById("chat-user-input-field");
        const chatBox = document.getElementById("chat-box-display");
        if (!inputField || !chatBox) return;
        const text = inputField.value.trim();
        if (!text) return;
        appendChatMessage(chatBox, "🧓 คุณตาคุณยาย", text, "user-type");
        inputField.value = "";

        let answer = "เป็นเรื่องเล่าที่มีคุณค่ามากค่ะ เล่าให้ฟังต่อได้เลยนะคะ ดิฉัน/ผมอยู่เป็นเพื่อนตรงนี้ค่ะ";
        try {
            const result = await fetchJson("/ai/companion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text })
            });
            if (result && result.reply) answer = result.reply;
        } catch (error) {
            if (text.includes("เหงา")) answer = "ไม่ต้องอยู่กับความเหงาคนเดียวนะคะ ลองกดปุ่มชวนคุยคนใกล้บ้าน หรือเล่าให้ฉันฟังต่อได้เลยค่ะ";
        }
        appendChatMessage(chatBox, "🤖 เพื่อนคุยใจดี", answer, "bot-type");
    };

    const backupCaregivers = [
        { id: 1, name: "คุณสมหญิง ใจดี", age: 34, personality: "ใจเย็น คุยง่าย ชอบเพลงเก่าและพาไปทำบุญ", rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?q=80&w=200&auto=format&fit=crop" },
        { id: 2, name: "คุณสมชาย รักสงบ", age: 42, personality: "สุภาพ รอบคอบ เคยดูแลผู้สูงอายุ และชอบพาเดินสวน", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop" }
    ];

    async function loadCaregivers() {
        const targetContainer = document.getElementById("caregivers-api-cards-container");
        if (!targetContainer) return;
        setLoading(targetContainer, "กำลังโหลดรายชื่อเพื่อนพาเที่ยวที่อ่านง่ายค่ะ...");
        try {
            const result = await fetchJson("/caregivers");
            renderCaregiversStack(result.success ? result.data : backupCaregivers, targetContainer);
        } catch (error) {
            renderCaregiversStack(backupCaregivers, targetContainer);
        }
    }

    function renderCaregiversStack(data, container) {
        clearNode(container);
        data.forEach(person => {
            const card = createEl("article", "elder-caregiver-modular-card");
            const header = createEl("div", "caregiver-card-header");
            const img = document.createElement("img");
            img.src = person.imageUrl || "";
            img.alt = `รูป ${person.name || "ผู้ดูแล"}`;
            img.loading = "lazy";
            header.appendChild(img);
            const headText = createEl("div");
            headText.appendChild(createEl("h4", "caregiver-name", `${person.name} (อายุ ${person.age} ปี)`));
            headText.appendChild(createEl("span", "caregiver-rating", `⭐ คะแนนรีวิว ${person.rating} / 5`));
            header.appendChild(headText);
            card.appendChild(header);
            card.appendChild(createEl("p", "caregiver-description", `💡 บุคลิกการดูแล: ${person.personality}`));
            const actions = createEl("div", "caregiver-actions");
            const bookButton = createEl("button", "btn-submit-post-elder", "🎯 นัดหมายคนนี้");
            bookButton.type = "button";
            bookButton.addEventListener("click", () => window.bookCaregiverGuide(person.name));
            const tipButton = createEl("button", "btn-submit-post-elder btn-tip", "💝 ให้ทิป");
            tipButton.type = "button";
            tipButton.addEventListener("click", () => window.openTipModal(person.id, person.name));
            actions.appendChild(bookButton);
            actions.appendChild(tipButton);
            card.appendChild(actions);
            container.appendChild(card);
        });
    }

    window.bookCaregiverGuide = function (name) {
        showToast(`นัดหมายกับ ${name} เรียบร้อยค่ะ ระบบจำลองจะส่งรายละเอียดให้ครอบครัว`, "success");
    };

    window.openTipModal = function (id, name = "ผู้ดูแล") {
        const modal = document.getElementById("tip-payment-modal");
        const recipientBox = document.getElementById("tip-recipient-box");
        const customInput = document.getElementById("tip-custom-amount");
        const noteInput = document.getElementById("tip-note-input");
        if (!modal) return;
        tipPaymentState.caregiverId = Number(id);
        tipPaymentState.caregiverName = name || "ผู้ดูแล";
        tipPaymentState.amount = null;
        if (recipientBox) recipientBox.textContent = `กำลังให้ทิป: คุณ${tipPaymentState.caregiverName}`;
        if (customInput) customInput.value = "";
        if (noteInput) noteInput.value = "ขอบคุณที่ดูแลอย่างใจเย็นค่ะ";
        updateTipSummary();
        modal.classList.remove("game-hidden");
        setTimeout(() => {
            const firstAmount = document.querySelector(".tip-amount-btn");
            if (firstAmount) firstAmount.focus();
        }, 50);
    };

    window.closeTipModal = function () {
        const modal = document.getElementById("tip-payment-modal");
        if (modal) modal.classList.add("game-hidden");
    };

    window.confirmTipPayment = async function () {
        const customInput = document.getElementById("tip-custom-amount");
        const noteInput = document.getElementById("tip-note-input");
        if (customInput && customInput.value) {
            const customAmount = normalizeAmount(customInput.value);
            if (customAmount) tipPaymentState.amount = customAmount;
        }
        const amount = normalizeAmount(tipPaymentState.amount);
        if (!tipPaymentState.caregiverId || !amount) {
            showToast("กรุณาเลือกหรือกรอกจำนวนทิปก่อนค่ะ", "warning");
            return;
        }
        const note = noteInput ? noteInput.value.trim() : "";
        try {
            const result = await fetchJson("/payment/tip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ caregiverId: tipPaymentState.caregiverId, amount, note })
            });
            showToast(result.message || `ส่งทิป ${formatNumber(amount)} บาทสำเร็จค่ะ`, "success");
        } catch (error) {
            showToast(`จำลองส่งทิป ${formatNumber(amount)} บาท ให้คุณ${tipPaymentState.caregiverName} สำเร็จค่ะ`, "success");
        }
        window.closeTipModal();
    };

    document.querySelectorAll(".tip-amount-btn").forEach(button => {
        button.addEventListener("click", () => {
            const amount = normalizeAmount(button.dataset.amount);
            if (!amount) return;
            tipPaymentState.amount = amount;
            const customInput = document.getElementById("tip-custom-amount");
            if (customInput) customInput.value = "";
            updateTipSummary();
        });
    });

    const tipCustomInput = document.getElementById("tip-custom-amount");
    if (tipCustomInput) {
        tipCustomInput.addEventListener("input", () => {
            const amount = normalizeAmount(tipCustomInput.value);
            tipPaymentState.amount = amount;
            updateTipSummary();
        });
    }

    window.sendTipToCaregiverGuide = function (id) {
        window.openTipModal(id, "ผู้ดูแล");
    };

    window.loadFeeds("all");
    window.loadMeds();
    window.refreshWearableData();
    loadCaregivers();

    /* Picture Matching Game - robust elder friendly version */
    const GAME_ITEMS = [
        { id: "apple", icon: "🍎", label: "แอปเปิล" },
        { id: "banana", icon: "🍌", label: "กล้วย" },
        { id: "orange", icon: "🍊", label: "ส้ม" },
        { id: "strawberry", icon: "🍓", label: "สตรอว์เบอร์รี" },
        { id: "grape", icon: "🍇", label: "องุ่น" },
        { id: "watermelon", icon: "🍉", label: "แตงโม" },
        { id: "pineapple", icon: "🍍", label: "สับปะรด" },
        { id: "tomato", icon: "🍅", label: "มะเขือเทศ" },
        { id: "carrot", icon: "🥕", label: "แครอต" },
        { id: "corn", icon: "🌽", label: "ข้าวโพด" },
        { id: "broccoli", icon: "🥦", label: "บรอกโคลี" },
        { id: "eggplant", icon: "🍆", label: "มะเขือม่วง" },
        { id: "kiwi", icon: "🥝", label: "กีวี" },
        { id: "cherry", icon: "🍒", label: "เชอร์รี" }
    ];
    const GAME_DIFFICULTIES = {
        beginner: { cols: 3, rows: 2, label: "ง่ายมาก" },
        easy: { cols: 4, rows: 3, label: "ง่าย" },
        medium: { cols: 4, rows: 4, label: "ปานกลาง" }
    };

    let gameFlipped = [];
    let gameMatched = new Set();
    let gameMoves = 0;
    let gameScore = 0;
    let gameCombo = 0;
    let gameLocked = false;
    let gameTimerInterval = null;
    let gameSeconds = 0;
    let gameTotalPairs = 0;
    let gameStarted = false;

    const gameBoard = document.getElementById("game-board");
    const gameScoreEl = document.getElementById("game-score");
    const gameMovesEl = document.getElementById("game-moves");
    const gameTimerEl = document.getElementById("game-timer");
    const gameMessageEl = document.getElementById("game-message");
    const gameWinModal = document.getElementById("game-winModal");
    const gameFinalScoreEl = document.getElementById("game-finalScore");
    const gameFinalMovesEl = document.getElementById("game-finalMoves");
    const gameFinalTimeEl = document.getElementById("game-finalTime");
    const gameNewGameBtn = document.getElementById("game-newGameBtn");
    const gamePlayAgainBtn = document.getElementById("game-playAgainBtn");
    const gameDiffSelect = document.getElementById("game-difficultySelect");

    if (gameNewGameBtn) gameNewGameBtn.addEventListener("click", startFruitGameBoard);
    if (gamePlayAgainBtn) gamePlayAgainBtn.addEventListener("click", () => {
        if (gameWinModal) gameWinModal.classList.add("game-hidden");
        startFruitGameBoard();
    });
    if (gameDiffSelect) gameDiffSelect.addEventListener("change", startFruitGameBoard);
    setTimeout(startFruitGameBoard, 120);

    function setGameMessage(message, tone = "info") {
        if (!gameMessageEl) return;
        gameMessageEl.textContent = message;
        gameMessageEl.dataset.tone = tone;
    }

    function startFruitGameBoard() {
        clearInterval(gameTimerInterval);
        gameFlipped = [];
        gameMatched = new Set();
        gameMoves = 0;
        gameScore = 0;
        gameCombo = 0;
        gameLocked = false;
        gameSeconds = 0;
        gameStarted = false;
        if (gameScoreEl) gameScoreEl.textContent = "0";
        if (gameMovesEl) gameMovesEl.textContent = "0";
        if (gameTimerEl) gameTimerEl.textContent = "00:00";
        if (gameWinModal) gameWinModal.classList.add("game-hidden");
        if (!gameBoard) return;

        const selectedDifficulty = gameDiffSelect ? gameDiffSelect.value : "beginner";
        const diff = GAME_DIFFICULTIES[selectedDifficulty] || GAME_DIFFICULTIES.beginner;
        const { cols, rows } = diff;
        gameTotalPairs = Math.floor((cols * rows) / 2);
        const selectedItems = shuffleArrayElements([...GAME_ITEMS]).slice(0, gameTotalPairs);
        const deck = shuffleArrayElements([...selectedItems, ...selectedItems].map((item, index) => ({
            ...item,
            cardKey: `${item.id}-${index}-${Math.random().toString(36).slice(2, 7)}`
        })));

        gameBoard.style.gridTemplateColumns = `repeat(${cols}, minmax(88px, 1fr))`;
        gameBoard.setAttribute("aria-label", `กระดานเกมจับคู่รูปภาพ ระดับ${diff.label} มี ${gameTotalPairs} คู่`);
        clearNode(gameBoard);
        setGameMessage(`เริ่มระดับ${diff.label}: กดเปิดป้ายรูปภาพ 2 ใบ ถ้าเหมือนกันจะจับคู่สำเร็จค่ะ`, "info");

        deck.forEach((item) => {
            const card = createGameCard(item);
            gameBoard.appendChild(card);
        });
    }

    function createGameCard(item) {
        const card = createEl("button", "game-card");
        card.type = "button";
        card.dataset.pairId = item.id;
        card.dataset.label = item.label;
        card.setAttribute("aria-label", `ไพ่คว่ำ รูป${item.label} กดเพื่อเปิด`);
        card.setAttribute("aria-pressed", "false");

        const cover = createEl("span", "game-card-cover", "?");
        cover.setAttribute("aria-hidden", "true");

        const picture = createEl("span", "game-card-picture");
        picture.setAttribute("aria-hidden", "true");
        picture.appendChild(createEl("span", "game-card-emoji", item.icon));
        picture.appendChild(createEl("span", "game-card-label", item.label));

        card.appendChild(cover);
        card.appendChild(picture);
        card.addEventListener("click", () => handleGameCardClick(card));
        return card;
    }

    function startGameTimerOnce() {
        if (gameStarted) return;
        gameStarted = true;
        clearInterval(gameTimerInterval);
        gameTimerInterval = setInterval(() => {
            gameSeconds += 1;
            if (gameTimerEl) gameTimerEl.textContent = formatGameTime(gameSeconds);
        }, 1000);
    }

    function handleGameCardClick(card) {
        if (!card || gameLocked || card.disabled || card.classList.contains("game-flipped") || card.classList.contains("game-matched")) return;
        startGameTimerOnce();
        revealGameCard(card);
        gameFlipped.push(card);
        setGameMessage(gameFlipped.length === 1 ? "เลือกอีก 1 ใบ เพื่อหาคู่ที่เหมือนกันค่ะ" : "กำลังตรวจว่ารูปตรงกันไหม...", "info");
        if (gameFlipped.length !== 2) return;

        gameLocked = true;
        gameMoves += 1;
        if (gameMovesEl) gameMovesEl.textContent = String(gameMoves);
        const [firstCard, secondCard] = gameFlipped;
        if (firstCard.dataset.pairId === secondCard.dataset.pairId) {
            gameCombo += 1;
            gameScore += 10 + (gameCombo - 1) * 5;
            if (gameScoreEl) gameScoreEl.textContent = String(gameScore);
            markGameCardMatched(firstCard);
            markGameCardMatched(secondCard);
            gameMatched.add(firstCard.dataset.pairId);
            gameFlipped = [];
            gameLocked = false;
            setGameMessage(`ถูกต้องค่ะ! จับคู่รูป${firstCard.dataset.label}สำเร็จ เหลืออีก ${Math.max(gameTotalPairs - gameMatched.size, 0)} คู่`, "success");
            if (gameMatched.size === gameTotalPairs) showGameWinModal();
        } else {
            gameCombo = 0;
            firstCard.classList.add("game-wrong");
            secondCard.classList.add("game-wrong");
            setGameMessage("ยังไม่ตรงกันค่ะ จำรูปไว้ แล้วลองใหม่อีกครั้งนะคะ", "warning");
            setTimeout(() => {
                hideGameCard(firstCard);
                hideGameCard(secondCard);
                firstCard.classList.remove("game-wrong");
                secondCard.classList.remove("game-wrong");
                gameFlipped = [];
                gameLocked = false;
                setGameMessage("กดเปิดป้ายรูปภาพ 2 ใบ เพื่อหาคู่ที่เหมือนกันค่ะ", "info");
            }, 950);
        }
    }

    function revealGameCard(card) {
        card.classList.add("game-flipped");
        card.setAttribute("aria-pressed", "true");
        card.setAttribute("aria-label", `เปิดแล้ว เป็นรูป${card.dataset.label}`);
    }

    function hideGameCard(card) {
        card.classList.remove("game-flipped");
        card.setAttribute("aria-pressed", "false");
        card.setAttribute("aria-label", `ไพ่คว่ำ รูป${card.dataset.label} กดเพื่อเปิด`);
    }

    function markGameCardMatched(card) {
        card.classList.add("game-matched");
        card.disabled = true;
        card.setAttribute("aria-label", `จับคู่สำเร็จ รูป${card.dataset.label}`);
    }

    function showGameWinModal() {
        clearInterval(gameTimerInterval);
        setGameMessage("เยี่ยมมากค่ะ จับคู่ครบทุกภาพแล้ว!", "success");
        setTimeout(() => {
            if (gameFinalScoreEl) gameFinalScoreEl.textContent = String(gameScore);
            if (gameFinalMovesEl) gameFinalMovesEl.textContent = String(gameMoves);
            if (gameFinalTimeEl) gameFinalTimeEl.textContent = formatGameTime(gameSeconds);
            if (gameWinModal) gameWinModal.classList.remove("game-hidden");
            showToast("🎉 เก่งมากค่ะ จับคู่รูปภาพครบแล้ว", "success");
        }, 250);
    }

    function shuffleArrayElements(array) {
        for (let i = array.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function formatGameTime(seconds) {
        const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
        const remainingSeconds = String(seconds % 60).padStart(2, "0");
        return `${minutes}:${remainingSeconds}`;
    }


    /* Wood sliding puzzle - drag red block out of the frame */
    const woodBoard = document.getElementById("wood-board");
    const woodMovesEl = document.getElementById("wood-moves");
    const woodMessageEl = document.getElementById("wood-message");
    const woodResetBtn = document.getElementById("wood-reset-btn");
    const WOOD_SIZE = 6;
    const WOOD_BLOCKS_START = [
        { id: "red", x: 1, y: 2, w: 2, h: 1, target: true },
        { id: "a", x: 0, y: 0, w: 1, h: 2 },
        { id: "b", x: 1, y: 0, w: 2, h: 1 },
        { id: "c", x: 3, y: 1, w: 1, h: 2 },
        { id: "d", x: 4, y: 0, w: 2, h: 1 },
        { id: "f", x: 2, y: 3, w: 2, h: 1 },
        { id: "g", x: 0, y: 3, w: 1, h: 2 },
        { id: "h", x: 4, y: 4, w: 2, h: 1 },
        { id: "i", x: 0, y: 5, w: 3, h: 1 },
        { id: "j", x: 5, y: 1, w: 1, h: 2 }
    ];
    let woodBlocks = [];
    let woodMoves = 0;
    let woodCell = 0;
    let woodDrag = null;

    function setWoodMessage(text, tone = "info") {
        if (!woodMessageEl) return;
        woodMessageEl.textContent = text;
        woodMessageEl.dataset.tone = tone;
    }

    function startWoodPuzzle() {
        if (!woodBoard) return;
        woodBlocks = WOOD_BLOCKS_START.map(block => ({ ...block }));
        woodMoves = 0;
        if (woodMovesEl) woodMovesEl.textContent = "0";
        setWoodMessage("ลากไม้สีแดงออกทางช่องด้านขวาเพื่อผ่านด่านค่ะ", "info");
        renderWoodPuzzle();
    }

    function renderWoodPuzzle() {
        if (!woodBoard) return;
        clearNode(woodBoard);
        woodCell = woodBoard.clientWidth / WOOD_SIZE;
        woodBlocks.forEach(block => {
            const el = createEl("button", `wood-block ${block.w > block.h ? "horizontal" : "vertical"}${block.target ? " target" : ""}`);
            el.type = "button";
            el.dataset.id = block.id;
            el.setAttribute("aria-label", block.target ? "ไม้สีแดง ลากออกทางขวา" : "ไม้สีน้ำตาล ลากเพื่อเปิดทาง");
            placeWoodElement(el, block);
            el.addEventListener("pointerdown", startWoodDrag);
            woodBoard.appendChild(el);
        });
    }

    function placeWoodElement(el, block) {
        const boardSize = woodBoard.clientWidth;
        const cell = boardSize / WOOD_SIZE;
        woodCell = cell;
        el.style.left = `${block.x * cell}px`;
        el.style.top = `${block.y * cell}px`;
        el.style.width = `${block.w * cell - 8}px`;
        el.style.height = `${block.h * cell - 8}px`;
    }

    function startWoodDrag(event) {
        if (!woodBoard) return;
        const el = event.currentTarget;
        const block = woodBlocks.find(item => item.id === el.dataset.id);
        if (!block) return;
        event.preventDefault();
        el.setPointerCapture(event.pointerId);
        woodCell = woodBoard.clientWidth / WOOD_SIZE;
        woodDrag = {
            id: block.id,
            startX: event.clientX,
            startY: event.clientY,
            originalX: block.x,
            originalY: block.y,
            axis: block.w > block.h ? "x" : "y",
            el
        };
        el.classList.add("dragging");
        el.addEventListener("pointermove", moveWoodDrag);
        el.addEventListener("pointerup", endWoodDrag);
        el.addEventListener("pointercancel", endWoodDrag);
    }

    function moveWoodDrag(event) {
        if (!woodDrag || !woodBoard) return;
        const block = woodBlocks.find(item => item.id === woodDrag.id);
        if (!block) return;
        const deltaPx = woodDrag.axis === "x" ? event.clientX - woodDrag.startX : event.clientY - woodDrag.startY;
        const rawStep = Math.round(deltaPx / woodCell);
        const allowed = clampWoodStep(block, woodDrag.axis, rawStep, woodDrag.originalX, woodDrag.originalY);
        const previewX = woodDrag.axis === "x" ? woodDrag.originalX + allowed : block.x;
        const previewY = woodDrag.axis === "y" ? woodDrag.originalY + allowed : block.y;
        woodDrag.el.style.left = `${previewX * woodCell}px`;
        woodDrag.el.style.top = `${previewY * woodCell}px`;
    }

    function endWoodDrag(event) {
        if (!woodDrag) return;
        const block = woodBlocks.find(item => item.id === woodDrag.id);
        const el = woodDrag.el;
        el.classList.remove("dragging");
        el.removeEventListener("pointermove", moveWoodDrag);
        el.removeEventListener("pointerup", endWoodDrag);
        el.removeEventListener("pointercancel", endWoodDrag);
        if (block) {
            const currentLeft = parseFloat(el.style.left || "0");
            const currentTop = parseFloat(el.style.top || "0");
            const newX = Math.round(currentLeft / woodCell);
            const newY = Math.round(currentTop / woodCell);
            if (newX !== block.x || newY !== block.y) {
                block.x = newX;
                block.y = newY;
                woodMoves += 1;
                if (woodMovesEl) woodMovesEl.textContent = String(woodMoves);
                setWoodMessage("ดีมากค่ะ เปิดทางต่ออีกนิด ไม้แดงใกล้ถึงทางออกแล้ว", "info");
            }
            placeWoodElement(el, block);
            if (block.target && block.x + block.w >= WOOD_SIZE) {
                setWoodMessage(`ผ่านด่านแล้วค่ะ! ใช้ทั้งหมด ${woodMoves} ครั้ง เก่งมากค่ะ 🎉`, "success");
                showToast("🧩 ผ่านเกม Puzzle เลื่อนไม้แล้วค่ะ", "success");
                woodBoard.querySelectorAll(".wood-block").forEach(button => button.disabled = true);
            }
        }
        woodDrag = null;
    }

    function clampWoodStep(block, axis, desiredStep, originX, originY) {
        if (desiredStep === 0) return 0;
        const direction = desiredStep > 0 ? 1 : -1;
        let step = 0;
        for (let i = 1; i <= Math.abs(desiredStep); i += 1) {
            const testStep = i * direction;
            const testBlock = { ...block, x: axis === "x" ? originX + testStep : originX, y: axis === "y" ? originY + testStep : originY };
            if (canWoodBlockOccupy(testBlock, block.id)) step = testStep;
            else break;
        }
        return step;
    }

    function canWoodBlockOccupy(testBlock, movingId) {
        if (testBlock.x < 0 || testBlock.y < 0 || testBlock.y + testBlock.h > WOOD_SIZE) return false;
        if (!testBlock.target && testBlock.x + testBlock.w > WOOD_SIZE) return false;
        if (testBlock.target && testBlock.x + testBlock.w > WOOD_SIZE && testBlock.y !== 2) return false;
        return !woodBlocks.some(other => other.id !== movingId && rectanglesOverlap(testBlock, other));
    }

    function rectanglesOverlap(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    if (woodResetBtn) woodResetBtn.addEventListener("click", startWoodPuzzle);
    if (woodBoard) {
        setTimeout(startWoodPuzzle, 180);
        window.addEventListener("resize", () => {
            if (woodBoard && woodBlocks.length) renderWoodPuzzle();
        });
    }

});

/* Reference landing navigation for mobile */
document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("mobile-menu-toggle");
    const menu = document.getElementById("reference-nav-menu");
    if (!toggle || !menu) return;

    const setMenuOpen = (open) => {
        menu.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", String(open));
        const icon = toggle.querySelector("i");
        if (icon) {
            icon.classList.toggle("fa-bars", !open);
            icon.classList.toggle("fa-xmark", open);
        }
    };

    toggle.addEventListener("click", () => {
        setMenuOpen(!menu.classList.contains("open"));
    });

    menu.querySelectorAll("a[href^='#']").forEach((link) => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 820) setMenuOpen(false);
        });
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 820) setMenuOpen(false);
    });
});


/* Functional login and registration modal */
document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("auth-modal");
    const openLoginBtn = document.getElementById("open-login-btn");
    const openRegisterBtn = document.getElementById("open-register-btn");
    const loginTab = document.getElementById("auth-login-tab");
    const registerTab = document.getElementById("auth-register-tab");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const authTitle = document.getElementById("auth-title");
    const authMessage = document.getElementById("auth-message");
    const accountMenu = document.getElementById("account-menu");
    const accountName = document.getElementById("account-name");
    const logoutBtn = document.getElementById("logout-btn");
    const menu = document.getElementById("reference-nav-menu");

    if (!modal || !openLoginBtn || !openRegisterBtn || !loginForm || !registerForm) return;

    const AUTH_STORAGE_KEY = "elderconnect-auth-user";

    function getApiUrl(path) {
        if (window.location.protocol === "http:" || window.location.protocol === "https:") {
            return `${window.location.origin}/api${path}`;
        }
        return `http://localhost:3000/api${path}`;
    }

    function notify(message, type = "info") {
        if (typeof window.showToast === "function") {
            window.showToast(message, type);
        }
    }

    function setAuthMessage(message = "", type = "") {
        if (!authMessage) return;
        authMessage.textContent = message;
        authMessage.className = `auth-message${type ? ` ${type}` : ""}`;
    }

    function setMode(mode) {
        const isLogin = mode === "login";
        loginForm.classList.toggle("auth-hidden", !isLogin);
        registerForm.classList.toggle("auth-hidden", isLogin);
        loginTab.classList.toggle("active", isLogin);
        registerTab.classList.toggle("active", !isLogin);
        loginTab.setAttribute("aria-selected", String(isLogin));
        registerTab.setAttribute("aria-selected", String(!isLogin));
        if (authTitle) authTitle.textContent = isLogin ? "เข้าสู่ระบบ ElderConnect" : "สมัครสมาชิก ElderConnect";
        setAuthMessage();
        setTimeout(() => {
            const focusTarget = isLogin
                ? document.getElementById("login-email")
                : document.getElementById("register-name");
            if (focusTarget) focusTarget.focus();
        }, 40);
    }

    function openModal(mode = "login") {
        setMode(mode);
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("auth-modal-open");
        if (window.innerWidth <= 1100 && menu) menu.classList.remove("open");
    }

    function closeModal() {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("auth-modal-open");
        setAuthMessage();
    }

    function saveUser(user) {
        try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        } catch (error) {}
        renderUser(user);
    }

    function loadUser() {
        try {
            const raw = localStorage.getItem(AUTH_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    function clearUser() {
        try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch (error) {}
        renderUser(null);
    }

    function renderUser(user) {
        const loggedIn = Boolean(user && user.name);
        openLoginBtn.classList.toggle("auth-hidden", loggedIn);
        openRegisterBtn.classList.toggle("auth-hidden", loggedIn);
        if (accountMenu) accountMenu.classList.toggle("auth-hidden", !loggedIn);
        if (accountName) accountName.textContent = loggedIn ? user.name : "สมาชิก";
    }

    async function postAuth(path, payload) {
        const response = await fetch(getApiUrl(path), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        let data = {};
        try {
            data = await response.json();
        } catch (error) {
            throw new Error("ระบบตอบกลับไม่ถูกต้อง กรุณาลองใหม่ค่ะ");
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "ไม่สามารถดำเนินการได้ กรุณาลองใหม่ค่ะ");
        }
        return data;
    }

    async function submitForm(form, path) {
        const submitBtn = form.querySelector("button[type='submit']");
        if (!form.reportValidity()) return;

        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset.originalText = submitBtn.textContent;
            submitBtn.textContent = "กำลังตรวจสอบ...";
        }
        setAuthMessage("กำลังเชื่อมต่อระบบ...", "");

        try {
            const result = await postAuth(path, payload);
            saveUser(result.user);
            setAuthMessage(result.message || "เข้าสู่ระบบสำเร็จค่ะ", "success");
            notify(result.message || "เข้าสู่ระบบสำเร็จค่ะ", "success");
            form.reset();
            setTimeout(closeModal, 650);
        } catch (error) {
            setAuthMessage(error.message, "error");
            notify(error.message, "error");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.originalText || "ยืนยัน";
            }
        }
    }

    openLoginBtn.addEventListener("click", () => openModal("login"));
    openRegisterBtn.addEventListener("click", () => openModal("register"));
    loginTab.addEventListener("click", () => setMode("login"));
    registerTab.addEventListener("click", () => setMode("register"));

    modal.querySelectorAll("[data-auth-close]").forEach((button) => {
        button.addEventListener("click", closeModal);
    });

    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        submitForm(loginForm, "/auth/login");
    });

    registerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        submitForm(registerForm, "/auth/register");
    });

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            clearUser();
            notify("ออกจากระบบเรียบร้อยแล้วค่ะ", "success");
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });

    renderUser(loadUser());
});


// ===== Simple front-end auth for demo UI =====
(function () {
    const DEMO_EMAIL = "demo@elderconnect.local";
    const DEMO_PASSWORD = "123456";

    function $(id) {
        return document.getElementById(id);
    }

    function setLoggedInUser(user) {
        try {
            if (user) localStorage.setItem("elderconnect-user", JSON.stringify(user));
            else localStorage.removeItem("elderconnect-user");
        } catch (error) {}
        updateAuthNav();
    }

    window.updateAuthNav = function () {
        let user = null;
        try {
            user = JSON.parse(localStorage.getItem("elderconnect-user") || "null");
        } catch (error) {
            user = null;
        }

        const loginBtn = document.querySelector(".reference-login-btn");
        const registerBtn = document.querySelector(".reference-register-btn");

        document.body.classList.toggle("auth-logged-in", Boolean(user));
        if (user && loginBtn && registerBtn) {
            loginBtn.textContent = user.name ? `สวัสดี ${user.name}` : "เข้าสู่ระบบแล้ว";
            loginBtn.onclick = () => showToast("คุณเข้าสู่ระบบอยู่แล้วค่ะ", "info");
            registerBtn.textContent = "ออกจากระบบ";
            registerBtn.onclick = () => {
                setLoggedInUser(null);
                showToast("ออกจากระบบเรียบร้อยแล้วค่ะ", "success");
            };
        } else if (loginBtn && registerBtn) {
            loginBtn.textContent = "เข้าสู่ระบบ";
            loginBtn.onclick = () => openAuthModal("login");
            registerBtn.textContent = "สมัครสมาชิก";
            registerBtn.onclick = () => openAuthModal("register");
        }
    };

    window.openAuthModal = function (mode = "login") {
        const modal = $("auth-modal");
        if (!modal) return;
        modal.classList.remove("game-hidden");
        switchAuthMode(mode);
        setTimeout(() => {
            const email = $("auth-email");
            if (email) email.focus();
        }, 50);
    };

    window.closeAuthModal = function () {
        const modal = $("auth-modal");
        if (modal) modal.classList.add("game-hidden");
    };

    window.switchAuthMode = function (mode = "login") {
        const isRegister = mode === "register";
        const title = $("auth-modal-title");
        const subtitle = $("auth-modal-subtitle");
        const submit = $("auth-submit-btn");
        const nameWrap = $("auth-name-wrap");
        const loginTab = $("auth-login-tab");
        const registerTab = $("auth-register-tab");

        if (title) title.textContent = isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ";
        if (subtitle) subtitle.textContent = isRegister ? "สร้างบัญชีใหม่เพื่อเริ่มใช้งาน ElderConnect" : "เข้าสู่ระบบเพื่อใช้งาน ElderConnect";
        if (submit) submit.textContent = isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ";
        if (nameWrap) nameWrap.style.display = isRegister ? "grid" : "none";
        if (loginTab) loginTab.classList.toggle("active", !isRegister);
        if (registerTab) registerTab.classList.toggle("active", isRegister);
        const form = $("auth-form");
        if (form) form.dataset.mode = mode;
    };

    window.handleAuthSubmit = function (event) {
        event.preventDefault();

        const form = $("auth-form");
        const mode = form ? form.dataset.mode || "login" : "login";
        const email = ($("auth-email")?.value || "").trim();
        const password = $("auth-password")?.value || "";
        const name = ($("auth-name")?.value || "").trim();

        if (mode === "login") {
            const savedUsers = JSON.parse(localStorage.getItem("elderconnect-registered-users") || "{}");
            const savedUser = savedUsers[email];

            if ((email === DEMO_EMAIL && password === DEMO_PASSWORD) || (savedUser && savedUser.password === password)) {
                setLoggedInUser({
                    email,
                    name: savedUser?.name || "ผู้ใช้งาน"
                });
                closeAuthModal();
                showToast("เข้าสู่ระบบเรียบร้อยแล้วค่ะ", "success");
                return;
            }

            showToast("อีเมลหรือรหัสผ่านไม่ถูกต้อง ลองใช้บัญชีทดลอง demo@elderconnect.local / 123456", "error");
            return;
        }

        if (!name || !email || password.length < 4) {
            showToast("กรุณากรอกชื่อ อีเมล และรหัสผ่านอย่างน้อย 4 ตัวอักษรค่ะ", "warning");
            return;
        }

        const users = JSON.parse(localStorage.getItem("elderconnect-registered-users") || "{}");
        users[email] = { name, password };
        localStorage.setItem("elderconnect-registered-users", JSON.stringify(users));
        setLoggedInUser({ email, name });
        closeAuthModal();
        showToast("สมัครสมาชิกและเข้าสู่ระบบเรียบร้อยแล้วค่ะ", "success");
    };

    document.addEventListener("DOMContentLoaded", updateAuthNav);
})();
