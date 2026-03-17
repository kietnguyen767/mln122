/* ═══════════════════════════════════════════════
   CANVAS 2D CHARACTERS & EFFECTS
   ═══════════════════════════════════════════════ */
const canvas = document.getElementById('arena-canvas');
const ctx = canvas.getContext('2d');

let ropeAnim = 50, ropeTarget = 50;
let animFrame = null, pullPhase = 0;
let particles = []; // Dust/Sparkle effects

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.round(rect.width);
    canvas.height = 160;
}

// Particle System
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -Math.random() * 2;
        this.life = 1.0;
        this.size = Math.random() * 4 + 2;
        this.color = color;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.life -= 0.02;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

function spawnDust(x, y, color) {
    for (let i = 0; i < 3; i++) particles.push(new Particle(x, y, color));
}

function drawChar(x, y, facing, primary, secondary, bobOffset, strength, emoji) {
    const bob = Math.sin(bobOffset) * 6;
    const leanAngle = - (0.2 + strength * 0.15) * facing;
    const cy = -60 + bob; // Center height of the emoji/aura

    // ── SHADOW (On ground, not leaning) ──
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 25 + strength * 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── LEANING TRANSFORMATION (For Aura and Body effects) ──
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(leanAngle);

    // ── Team Aura ──
    if (strength > 0.6) {
        ctx.save();
        ctx.shadowBlur = 30;
        ctx.shadowColor = primary;
        ctx.strokeStyle = primary;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(0, cy, 48, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        // Particles spawn at feet
        if (Math.random() > 0.5) spawnDust(x + facing * Math.random() * 20, y, primary);
    }

    ctx.restore();

    // ── EMOJI HEAD (Drawn with direct coordinates to stay upright) ──
    // Calculate precise position based on rotation
    const ex = x + Math.sin(leanAngle) * -cy;
    const ey = y + Math.cos(leanAngle) * cy;

    ctx.save();
    ctx.translate(ex, ey);
    ctx.font = '80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Slight drop shadow for the emoji
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
}

function drawScene() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Ground & Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.7);
    skyGrad.addColorStop(0, '#0d1f38'); skyGrad.addColorStop(1, '#152b4a');
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H * 0.7);
    const groundGrad = ctx.createLinearGradient(0, H * 0.7, 0, H);
    groundGrad.addColorStop(0, '#1e3a55'); groundGrad.addColorStop(1, '#0e2035');
    ctx.fillStyle = groundGrad; ctx.fillRect(0, H * 0.7, W, H * 0.3);

    // Center Flag/Line
    const cx = W / 2;
    ctx.strokeStyle = 'rgba(255,215,0,0.4)'; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(cx, 20); ctx.lineTo(cx, H * 0.7); ctx.stroke(); ctx.setLineDash([]);

    // Particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.update(); p.draw(ctx); });

    // ROPE knot calculation
    const knotX = (W * 0.2) + (ropeAnim / 100) * (W * 0.6);
    const ropeY = H * 0.7 - 65;

    // Drawing Rope segments
    drawRope(ctx, W * 0.15 + (ropeAnim - 50) * 0.2, ropeY, knotX - 5, ropeY, '#8B6332', '#c8a040', 8);
    drawRope(ctx, knotX + 5, ropeY, W * 0.85 - (ropeAnim - 50) * 0.2, ropeY, '#8B6332', '#c8a040', 8);

    // Knot
    ctx.save(); ctx.translate(knotX, ropeY);
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2);
    const kGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 12);
    kGrad.addColorStop(0, '#fff8d0'); kGrad.addColorStop(1, '#a07010');
    ctx.fillStyle = kGrad; ctx.fill(); ctx.stroke(); ctx.restore();

    // Characters
    const fy = H * 0.7 - 2;
    const drift = (ropeAnim - 50) * 0.85;
    const bS = Math.max(0, (50 - ropeAnim) / 50), rS = Math.max(0, (ropeAnim - 50) / 50);

    // Emoji Logic
    const blueEmoji = ropeAnim < 40 ? '😎' : (ropeAnim > 60 ? '😰' : '😤');
    const redEmoji = ropeAnim > 60 ? '😎' : (ropeAnim < 40 ? '😰' : '😤');

    // Single large emoji per side
    drawChar(W * 0.2 + drift, fy, 1, '#1b6ca8', '#0a3d6b', pullPhase, 0.4 + bS, blueEmoji);
    drawChar(W * 0.8 - drift, fy, -1, '#e63946', '#c1121f', pullPhase + 0.6, 0.4 + rS, redEmoji);
}

function drawRope(ctx, x1, y1, x2, y2, col1, col2, w) {
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = w + 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1 + 3); ctx.lineTo(x2, y2 + 3); ctx.stroke();
    ctx.strokeStyle = col1; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    // Texture lines
    const dist = Math.hypot(x2 - x1, y2 - y1), n = Math.floor(dist / 15);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
        const t = i / n, mx = x1 + (x2 - x1) * t, my = y1 + (y2 - y1) * t;
        ctx.beginPath(); ctx.moveTo(mx - 3, my - w / 2); ctx.lineTo(mx + 3, my + w / 2); ctx.stroke();
    }
}

function animate() {
    pullPhase += 0.05;
    ropeAnim += (ropeTarget - ropeAnim) * 0.1;
    drawScene();
    animFrame = requestAnimationFrame(animate);
}

function startAnimation() {
    if (!animFrame) { resizeCanvas(); animFrame = requestAnimationFrame(animate); }
}
function stopAnimation() {
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
}
window.addEventListener('resize', () => { resizeCanvas(); drawScene(); });

/* ═══════════════════════════════════════════════
   UI LOGIC
   ═══════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
function go(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
    if (id === 's-team') startAnimation(); else stopAnimation();
    if (id !== 's-team') clearInterval(teamGlobalTimer);
    if (id === 's-name') { lbExpanded = false; populateMiniLB(true); }
}


let lbExpanded = false;
async function populateMiniLB(forceFetch = false) {
    let lb = [];
    try {
        if (forceFetch) {
            const res = await fetch('/api/leaderboard');
            if (res.ok) {
                lb = await res.json();
                localStorage.setItem('tq_lb', JSON.stringify(lb));
            } else {
                lb = JSON.parse(localStorage.getItem('tq_lb') || '[]');
            }
        } else {
            lb = JSON.parse(localStorage.getItem('tq_lb') || '[]');
        }
    } catch (e) {
        lb = JSON.parse(localStorage.getItem('tq_lb') || '[]');
    }

    const list = $('mini-lb-list');
    if (!list) return;
    list.innerHTML = '';

    const btn = $('lb-more-btn');
    if (btn) {
        btn.style.display = lb.length > 5 ? 'inline-flex' : 'none';
        btn.textContent = lbExpanded ? 'Thu gọn ▴' : 'Xem thêm ▾';
    }

    if (lb.length === 0) {
        list.innerHTML = '<div style="color:var(--dim); font-size:0.95rem; padding: 2rem; text-align:center;">Chưa có kỷ lục nào.<br>Hãy là người đầu tiên ghi danh!</div>';
        return;
    }

    const count = lbExpanded ? lb.length : 5;
    lb.slice(0, count).forEach((e, i) => {
        const item = document.createElement('div');
        item.className = 'mini-lb-item';
        item.innerHTML = `
            <div class="mini-lb-rank">${i + 1}</div>
            <div class="mini-lb-name">${e.name}</div>
            <div class="mini-lb-score">${e.score}/${e.total}</div>
        `;
        list.appendChild(item);
    });
}

function toggleLBExpanded() {
    lbExpanded = !lbExpanded;
    populateMiniLB();
}

let tIdx = 0, rope = 50, bScore = 0, rScore = 0, tQS = [], answered = false, autoTimer = null;
let wrongCount = 0;
let teamGlobalTimer = null, teamTimeLeft = 420; // 7 minutes
const STEP = 14;

function startTeam() {
    closeWin();
    tIdx = 0; rope = 50; ropeTarget = 50; bScore = 0; rScore = 0;
    tQS = [...QS].sort(() => Math.random() - 0.5);
    go('s-team');
    loadTQ();
    startTeamTimer();
}

function startTeamTimer() {
    clearInterval(teamGlobalTimer);
    teamTimeLeft = 420;
    const updateTime = () => {
        const m = Math.floor(teamTimeLeft / 60);
        const s = teamTimeLeft % 60;
        $('t-timer').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        if (teamTimeLeft <= 0) {
            clearInterval(teamGlobalTimer);
            if (bScore > rScore) showWin('blue');
            else if (rScore > bScore) showWin('red');
            else showWin('draw');
        }
        teamTimeLeft--;
    };
    updateTime();
    teamGlobalTimer = setInterval(updateTime, 1000);
}

function loadTQ() {
    clearTimeout(autoTimer);
    answered = false;
    wrongCount = 0; // Reset wrong count for new question
    $('auto-banner').textContent = '';
    const q = tQS[tIdx];
    $('tq-cnt').textContent = `Câu ${tIdx + 1}`;

    // Update both question boxes
    if ($('q-text-blue')) $('q-text-blue').textContent = q.q;
    if ($('q-text-red')) $('q-text-red').textContent = q.q;

    $('st-blue').textContent = ''; $('st-red').textContent = '';
    renderTA('a-blue', q, 'blue'); renderTA('a-red', q, 'red');
}

function renderTA(cid, q, team) {
    const c = $(cid); c.innerHTML = '';
    const L = ['A', 'B', 'C', 'D'];
    q.opts.forEach((opt, i) => {
        const b = document.createElement('button');
        b.className = 'ans-btn';
        b.innerHTML = `<span class="al">${L[i]}</span><span>${opt}</span>`;
        b.onclick = () => teamAns(team, i, q.ans, b, c);
        c.appendChild(b);
    });
}

function teamAns(team, chosen, correct, btn, container) {
    if (answered) return; // Prevent clicking after question is completed

    const isCorrect = chosen === correct;
    const sid = team === 'blue' ? 'st-blue' : 'st-red';

    if (isCorrect) {
        // Disable all buttons in both teams immediately
        document.querySelectorAll('.ans-btn').forEach(b => {
            b.disabled = true;
            const idx = Array.from(b.parentNode.children).indexOf(b);
            if (idx === correct) b.classList.add('correct');
        });

        $(sid).textContent = '✦ CHÍNH XÁC! ✦';
        if (team === 'blue') { bScore++; rope = Math.max(0, rope - STEP); }
        else { rScore++; rope = Math.min(100, rope + STEP); }
        ropeTarget = rope;

        answered = true;
        scheduleNext(0.8); // FAST transition on correct
    } else {
        // Wrong answer - shake only without color or hiding
        btn.disabled = true;
        btn.classList.add('wrong');

        // Remove shake class after animation so it can be re-applied if needed (though disabled here)
        setTimeout(() => btn.classList.remove('wrong'), 400);

        wrongCount++;
        if (wrongCount >= 3) {
            // Show correct answer and move on
            document.querySelectorAll('.ans-btn').forEach(b => {
                b.disabled = true;
                const idx = Array.from(b.parentNode.children).indexOf(b);
                if (idx === correct) {
                    b.classList.add('correct');
                    b.style.opacity = '1';
                }
            });
            $('auto-banner').textContent = 'Cả hai đội đã sai 3 lần!';
            answered = true;
            scheduleNext(1.5); // Fast skip
        }
    }
}


function scheduleNext(delaySec = 3) {
    clearTimeout(autoTimer);
    if (delaySec < 1) {
        autoTimer = setTimeout(() => {
            tIdx++;
            if (tIdx >= tQS.length) {
                tQS = [...QS].sort(() => Math.random() - 0.5);
                tIdx = 0;
            }
            loadTQ();
        }, delaySec * 1000);
        return;
    }

    let c = Math.ceil(delaySec);
    $('auto-banner').textContent = `Câu tiếp theo sau ${c} giây...`;

    autoTimer = setInterval(() => {
        c--;
        if (c > 0) {
            $('auto-banner').textContent = `Câu tiếp theo sau ${c} giây...`;
        } else {
            clearInterval(autoTimer);
            $('auto-banner').textContent = '';
            tIdx++;
            if (tIdx >= tQS.length) {
                tQS = [...QS].sort(() => Math.random() - 0.5);
                tIdx = 0;
            }
            loadTQ();
        }
    }, 1000);
}

function resetLB() {
    const pw = prompt('Nhập mật khẩu để xóa bảng xếp hạng:');
    if (pw === 'nammodi') {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ bảng xếp hạng không?')) {
            localStorage.removeItem('tq_lb');
            populateMiniLB();
            // Also refresh the main lb body if we are on that screen
            const body = $('lb-body');
            if (body) body.innerHTML = '';
            alert('Đã xóa bảng xếp hạng thành công!');
        }
    } else if (pw !== null) {
        alert('Sai mật khẩu!');
    }
}

function showWin(team) {
    const t = $('win-title'), s = $('win-sub');
    if (team === 'blue') { t.textContent = 'ĐỘI XANH THẮNG!'; t.className = 'win-title blue'; s.textContent = `Chiến thắng thuyết phục: ${bScore} - ${rScore}`; }
    else if (team === 'red') { t.textContent = 'ĐỘI ĐỎ THẮNG!'; t.className = 'win-title red'; s.textContent = `Chiến thắng thuyết phục: ${rScore} - ${bScore}`; }
    else { t.textContent = 'HÒA NHAU!'; t.className = 'win-title'; s.textContent = 'Trận đấu cân tài cân sức!'; }
    $('win-ov').classList.add('show');
}
function closeWin() { $('win-ov').classList.remove('show'); go('s-mode'); }

/* SOLO MODE */
let sIdx = 0, sSc = 0, sPname = '', sQS = [], sTmr = null, sStart = 0;
const STIME = 15;

function startSolo() {
    const n = $('pname-in').value.trim(); if (!n) { $('pname-in').focus(); return; }
    sPname = n; sIdx = 0; sSc = 0;
    sQS = [...QS].sort(() => Math.random() - .5).slice(0, 60); // Random questions
    sStart = Date.now();
    $('s-pname').textContent = n; $('s-score').textContent = '0';
    go('s-solo'); loadSQ();
}

function loadSQ() {
    clearInterval(sTmr);
    const bar = $('t-bar'); bar.style.transition = 'none'; bar.style.width = '100%';
    const q = sQS[sIdx];
    $('s-qnum').textContent = `Câu ${sIdx + 1}/60`;
    $('s-qtxt').textContent = q.q;
    $('s-fb').textContent = ''; $('s-nxt').style.display = 'none';
    renderSA(q);
    setTimeout(() => { bar.style.transition = `width ${STIME}s linear`; bar.style.width = '0%'; }, 50);
    let tl = STIME;
    sTmr = setInterval(() => { tl--; if (tl <= 0) { clearInterval(sTmr); soloTO(q.ans); } }, 1000);
}

function renderSA(q) {
    const c = $('s-ans'); c.innerHTML = '';
    const L = ['A', 'B', 'C', 'D'];
    q.opts.forEach((opt, i) => {
        const b = document.createElement('button'); b.className = 'ans-btn';
        b.innerHTML = `<span class="al" style="background:var(--glass);">${L[i]}</span><span>${opt}</span>`;
        b.onclick = () => soloAns(i, q.ans); c.appendChild(b);
    });
}

function soloAns(chosen, correct) {
    clearInterval(sTmr); $('t-bar').style.transition = 'none';
    document.querySelectorAll('#s-ans .ans-btn').forEach((b, i) => {
        b.disabled = true;
        if (i === correct) b.classList.add('correct');
        else if (i === chosen) b.classList.add('wrong');
    });
    if (chosen === correct) { sSc++; $('s-score').textContent = sSc; $('s-fb').textContent = '✦ CHÍNH XÁC! ✦'; $('s-fb').style.color = 'var(--green)'; }
    else { $('s-fb').textContent = '✕ SAI RỒI! ✕'; $('s-fb').style.color = 'var(--redL)'; }

    // Auto-next logic
    if (sIdx < sQS.length - 1) {
        setTimeout(nextSolo, 1200);
    } else {
        setTimeout(finishSolo, 1500);
    }
}

function soloTO(correct) {
    document.querySelectorAll('#s-ans .ans-btn').forEach((b, i) => { b.disabled = true; if (i === correct) b.classList.add('correct'); });
    $('s-fb').textContent = 'HẾT GIỜ!'; $('s-fb').style.color = 'var(--gold)';

    if (sIdx < sQS.length - 1) {
        setTimeout(nextSolo, 1200);
    } else {
        setTimeout(finishSolo, 1500);
    }
}

function nextSolo() { sIdx++; loadSQ(); }

async function finishSolo() {
    const el = Math.round((Date.now() - sStart) / 1000);
    const ts = `${~~(el / 60)}:${String(el % 60).padStart(2, '0')}`;
    const entry = { name: sPname, score: sSc, total: sQS.length, time: ts, ts: Date.now() };

    let lb = [];
    try {
        const res = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
        if (res.ok) {
            lb = await res.json();
            localStorage.setItem('tq_lb', JSON.stringify(lb));
        } else {
            throw new Error();
        }
    } catch (e) {
        try { lb = JSON.parse(localStorage.getItem('tq_lb') || '[]'); } catch (e2) { }
        lb.push(entry);
        lb.sort((a, b) => b.score - a.score || a.ts - b.ts);
        lb = lb.slice(0, 20);
        localStorage.setItem('tq_lb', JSON.stringify(lb));
    }
    showLB(entry, lb);
}

function showLB(latest, lb) {
    $('lb-name').textContent = latest.name; $('lb-score').textContent = `${latest.score}/${latest.total}`;
    const b = $('lb-body'); b.innerHTML = '';
    lb.forEach((e, i) => {
        const tr = document.createElement('tr');
        if (e.ts === latest.ts) tr.style.background = 'rgba(255,215,0,0.1)';
        tr.innerHTML = `<td>${i + 1}</td><td>${e.name}</td><td>${e.score}/${e.total}</td><td>${e.time}</td>`;
        b.appendChild(tr);
    });
    go('s-lb');
}

// Initial draw
resizeCanvas(); drawScene();
