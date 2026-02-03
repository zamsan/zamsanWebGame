const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');

// 게임 상태
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let animationId;

// 플레이어 (우주선)
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 80,
    width: 50,
    height: 50,
    speed: 7,
    dx: 0
};

// 운석 배열
let meteors = [];
let meteorSpeed = 3;
let meteorSpawnRate = 60;
let frameCount = 0;

// 별 배열 (배경)
let stars = [];

// 키 입력 상태
const keys = {
    left: false,
    right: false
};

// 최고 점수 표시
highScoreDisplay.textContent = highScore;

// 별 생성
function createStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 2 + 0.5
        });
    }
}

// 운석 생성
function createMeteor() {
    const size = Math.random() * 30 + 20;
    meteors.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: meteorSpeed + Math.random() * 2
    });
}

// 우주선 그리기
function drawPlayer() {
    ctx.save();

    // 우주선 본체
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height - 15);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // 우주선 불꽃
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2 - 8, player.y + player.height - 10);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height + 15);
    ctx.lineTo(player.x + player.width / 2 + 8, player.y + player.height - 10);
    ctx.closePath();
    ctx.fill();

    // 조종석
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + 20, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// 운석 그리기
function drawMeteors() {
    meteors.forEach(meteor => {
        ctx.save();
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.arc(
            meteor.x + meteor.width / 2,
            meteor.y + meteor.height / 2,
            meteor.width / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // 운석 크레이터
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(
            meteor.x + meteor.width / 3,
            meteor.y + meteor.height / 3,
            meteor.width / 6,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
            meteor.x + meteor.width * 0.6,
            meteor.y + meteor.height * 0.6,
            meteor.width / 8,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
    });
}

// 별 그리기
function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// 별 업데이트
function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

// 플레이어 업데이트
function updatePlayer() {
    if (keys.left && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.right && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

// 운석 업데이트
function updateMeteors() {
    meteors.forEach((meteor, index) => {
        meteor.y += meteor.speed;

        // 화면 밖으로 나간 운석 제거
        if (meteor.y > canvas.height) {
            meteors.splice(index, 1);
            score += 10;
            scoreDisplay.textContent = score;
        }
    });
}

// 충돌 감지
function checkCollision() {
    for (let meteor of meteors) {
        // 원형 충돌 감지
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const meteorCenterX = meteor.x + meteor.width / 2;
        const meteorCenterY = meteor.y + meteor.height / 2;

        const dx = playerCenterX - meteorCenterX;
        const dy = playerCenterY - meteorCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const playerRadius = player.width / 3;
        const meteorRadius = meteor.width / 2;

        if (distance < playerRadius + meteorRadius) {
            return true;
        }
    }
    return false;
}

// 게임 오버
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);

    // 최고 점수 업데이트
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreDisplay.textContent = highScore;
    }

    // 게임 오버 화면
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(`점수: ${score}`, canvas.width / 2, canvas.height / 2 + 20);

    startBtn.textContent = '다시 시작';
}

// 게임 루프
function gameLoop() {
    // 화면 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 별 그리기 및 업데이트
    drawStars();
    updateStars();

    // 운석 생성
    frameCount++;
    if (frameCount % meteorSpawnRate === 0) {
        createMeteor();
    }

    // 난이도 증가
    if (frameCount % 500 === 0 && meteorSpawnRate > 20) {
        meteorSpawnRate -= 5;
        meteorSpeed += 0.5;
    }

    // 게임 요소 업데이트
    updatePlayer();
    updateMeteors();

    // 게임 요소 그리기
    drawMeteors();
    drawPlayer();

    // 충돌 체크
    if (checkCollision()) {
        gameOver();
        return;
    }

    animationId = requestAnimationFrame(gameLoop);
}

// 게임 시작
function startGame() {
    // 게임 초기화
    gameRunning = true;
    score = 0;
    scoreDisplay.textContent = score;
    meteors = [];
    meteorSpeed = 3;
    meteorSpawnRate = 60;
    frameCount = 0;
    player.x = canvas.width / 2 - player.width / 2;

    createStars();
    startBtn.textContent = '게임 중...';

    gameLoop();
}

// 이벤트 리스너
startBtn.addEventListener('click', () => {
    if (!gameRunning) {
        startGame();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = false;
    }
});

// 모바일 컨트롤
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// 터치 이벤트 (모바일)
leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.left = true;
});

leftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.left = false;
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.right = true;
});

rightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.right = false;
});

// 마우스 이벤트 (데스크톱에서 테스트용)
leftBtn.addEventListener('mousedown', () => keys.left = true);
leftBtn.addEventListener('mouseup', () => keys.left = false);
leftBtn.addEventListener('mouseleave', () => keys.left = false);

rightBtn.addEventListener('mousedown', () => keys.right = true);
rightBtn.addEventListener('mouseup', () => keys.right = false);
rightBtn.addEventListener('mouseleave', () => keys.right = false);

// 초기 화면 그리기
createStars();
drawStars();
ctx.fillStyle = '#fff';
ctx.font = '20px Arial';
ctx.textAlign = 'center';
ctx.fillText('시작 버튼을 누르세요', canvas.width / 2, canvas.height / 2);
