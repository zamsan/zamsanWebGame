const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');

// 게임 상태
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('cookieRunnerHighScore') || 0;
let animationId;
let gameSpeed = 6;
let frameCount = 0;

// 바닥 높이
const groundY = canvas.height - 60;

// 플레이어 (쿠키)
const player = {
    x: 100,
    y: groundY,
    width: 50,
    height: 60,
    velocityY: 0,
    isJumping: false,
    isSliding: false,
    jumpPower: -18,
    gravity: 0.8
};

// 장애물 배열
let obstacles = [];
let coins = [];

// 배경 요소
let clouds = [];
let trees = [];

// 입력 상태
const keys = {
    jump: false,
    slide: false
};

// 최고 점수 표시
highScoreDisplay.textContent = highScore;

// 구름 생성
function createCloud() {
    clouds.push({
        x: canvas.width + 100,
        y: Math.random() * 100 + 20,
        width: Math.random() * 80 + 60,
        speed: gameSpeed * 0.3
    });
}

// 나무 생성
function createTree() {
    trees.push({
        x: canvas.width + 50,
        y: groundY - 80,
        width: 40,
        height: 80
    });
}

// 장애물 생성
function createObstacle() {
    const types = ['low', 'high', 'double'];
    const type = types[Math.floor(Math.random() * types.length)];

    let obstacle = {
        x: canvas.width,
        type: type
    };

    if (type === 'low') {
        // 낮은 장애물 - 점프로 피함
        obstacle.y = groundY - 40;
        obstacle.width = 30;
        obstacle.height = 40;
    } else if (type === 'high') {
        // 높은 장애물 - 슬라이드로 피함
        obstacle.y = groundY - 80;
        obstacle.width = 60;
        obstacle.height = 30;
    } else {
        // 이중 장애물 - 타이밍 맞춰 점프
        obstacle.y = groundY - 50;
        obstacle.width = 40;
        obstacle.height = 50;
    }

    obstacles.push(obstacle);
}

// 코인 생성
function createCoin() {
    const heights = [groundY - 50, groundY - 100, groundY - 150];
    coins.push({
        x: canvas.width,
        y: heights[Math.floor(Math.random() * heights.length)],
        size: 20,
        collected: false
    });
}

// 플레이어 그리기 (쿠키 캐릭터)
function drawPlayer() {
    ctx.save();

    const drawX = player.x;
    let drawY = player.y;
    let drawHeight = player.height;

    if (player.isSliding) {
        drawHeight = 30;
        drawY = groundY - 30;
    }

    // 쿠키 몸체 (원형)
    ctx.fillStyle = '#D2691E';
    ctx.beginPath();
    ctx.ellipse(drawX + player.width/2, drawY - drawHeight/2, player.width/2 - 5, drawHeight/2 - 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 쿠키 테두리
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 눈
    ctx.fillStyle = '#000';
    if (!player.isSliding) {
        ctx.beginPath();
        ctx.arc(drawX + 15, drawY - drawHeight/2 - 5, 4, 0, Math.PI * 2);
        ctx.arc(drawX + 35, drawY - drawHeight/2 - 5, 4, 0, Math.PI * 2);
        ctx.fill();

        // 볼터치
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.arc(drawX + 10, drawY - drawHeight/2 + 8, 5, 0, Math.PI * 2);
        ctx.arc(drawX + 40, drawY - drawHeight/2 + 8, 5, 0, Math.PI * 2);
        ctx.fill();

        // 입
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(drawX + player.width/2, drawY - drawHeight/2 + 5, 8, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
    } else {
        // 슬라이드 중 표정
        ctx.beginPath();
        ctx.arc(drawX + 20, drawY - drawHeight/2, 3, 0, Math.PI * 2);
        ctx.arc(drawX + 35, drawY - drawHeight/2, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // 달리는 효과 (먼지)
    if (gameRunning && !player.isJumping) {
        ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(drawX - 10 - i * 15, groundY - 10 - Math.random() * 10, 5 + Math.random() * 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

// 장애물 그리기
function drawObstacles() {
    obstacles.forEach(obs => {
        ctx.save();

        if (obs.type === 'low') {
            // 바위
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.moveTo(obs.x, groundY);
            ctx.lineTo(obs.x + obs.width/2, obs.y);
            ctx.lineTo(obs.x + obs.width, groundY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#4a4a4a';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (obs.type === 'high') {
            // 날아오는 새/장애물
            ctx.fillStyle = '#8B0000';
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            // 가시
            ctx.fillStyle = '#FF0000';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(obs.x + i * 20, obs.y + obs.height);
                ctx.lineTo(obs.x + i * 20 + 10, obs.y + obs.height + 15);
                ctx.lineTo(obs.x + i * 20 + 20, obs.y + obs.height);
                ctx.closePath();
                ctx.fill();
            }
        } else {
            // 선인장
            ctx.fillStyle = '#228B22';
            ctx.fillRect(obs.x + 10, obs.y, 20, obs.height);
            ctx.fillRect(obs.x, obs.y + 15, 15, 10);
            ctx.fillRect(obs.x + 25, obs.y + 25, 15, 10);
        }

        ctx.restore();
    });
}

// 코인 그리기
function drawCoins() {
    coins.forEach(coin => {
        if (!coin.collected) {
            ctx.save();
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, coin.size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 코인 빛 효과
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(coin.x - 3, coin.y - 3, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    });
}

// 배경 그리기
function drawBackground() {
    // 하늘
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, groundY);

    // 구름
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.width/3, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width/3, cloud.y - 10, cloud.width/4, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width/2, cloud.y, cloud.width/3, 0, Math.PI * 2);
        ctx.fill();
    });

    // 산
    ctx.fillStyle = '#9ACD32';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(150, groundY - 100);
    ctx.lineTo(300, groundY);
    ctx.fill();

    ctx.fillStyle = '#6B8E23';
    ctx.beginPath();
    ctx.moveTo(200, groundY);
    ctx.lineTo(400, groundY - 150);
    ctx.lineTo(600, groundY);
    ctx.fill();

    ctx.fillStyle = '#556B2F';
    ctx.beginPath();
    ctx.moveTo(500, groundY);
    ctx.lineTo(700, groundY - 120);
    ctx.lineTo(900, groundY);
    ctx.fill();

    // 잔디
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, groundY, canvas.width, 60);

    // 잔디 디테일
    ctx.fillStyle = '#32CD32';
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, groundY);
        ctx.lineTo(i + 5, groundY - 10);
        ctx.lineTo(i + 10, groundY);
        ctx.fill();
    }

    // 땅
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, groundY + 30, canvas.width, 30);
}

// 플레이어 업데이트
function updatePlayer() {
    // 점프 처리
    if (keys.jump && !player.isJumping && !player.isSliding) {
        player.velocityY = player.jumpPower;
        player.isJumping = true;
    }

    // 중력 적용
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    // 바닥 충돌
    if (player.y >= groundY) {
        player.y = groundY;
        player.velocityY = 0;
        player.isJumping = false;
    }

    // 슬라이드 처리
    player.isSliding = keys.slide && !player.isJumping;
}

// 장애물 업데이트
function updateObstacles() {
    obstacles.forEach((obs, index) => {
        obs.x -= gameSpeed;

        if (obs.x + obs.width < 0) {
            obstacles.splice(index, 1);
            score += 10;
        }
    });
}

// 코인 업데이트
function updateCoins() {
    coins.forEach((coin, index) => {
        coin.x -= gameSpeed;

        if (coin.x + coin.size < 0) {
            coins.splice(index, 1);
        }
    });
}

// 배경 업데이트
function updateBackground() {
    clouds.forEach((cloud, index) => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
            clouds.splice(index, 1);
        }
    });
}

// 충돌 감지
function checkCollision() {
    const playerLeft = player.x + 10;
    const playerRight = player.x + player.width - 10;
    let playerTop, playerBottom;

    if (player.isSliding) {
        playerTop = groundY - 30;
        playerBottom = groundY;
    } else {
        playerTop = player.y - player.height;
        playerBottom = player.y;
    }

    // 장애물 충돌
    for (let obs of obstacles) {
        const obsLeft = obs.x;
        const obsRight = obs.x + obs.width;
        const obsTop = obs.y;
        const obsBottom = obs.y + obs.height;

        if (playerRight > obsLeft && playerLeft < obsRight &&
            playerBottom > obsTop && playerTop < obsBottom) {
            return true;
        }
    }

    // 코인 수집
    coins.forEach(coin => {
        if (!coin.collected) {
            const dx = (playerLeft + playerRight) / 2 - coin.x;
            const dy = (playerTop + playerBottom) / 2 - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < coin.size/2 + 20) {
                coin.collected = true;
                score += 50;
            }
        }
    });

    return false;
}

// 게임 오버
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cookieRunnerHighScore', highScore);
        highScoreDisplay.textContent = highScore;
    }

    // 게임 오버 화면
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.fillText(`점수: ${score}`, canvas.width / 2, canvas.height / 2 + 20);

    if (score >= highScore && score > 0) {
        ctx.fillStyle = '#FF6347';
        ctx.font = '24px Arial';
        ctx.fillText('NEW RECORD!', canvas.width / 2, canvas.height / 2 + 60);
    }

    startBtn.textContent = '다시 시작';
}

// 게임 루프
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 그리기
    drawBackground();

    // 프레임 카운트
    frameCount++;

    // 장애물/코인 생성
    if (frameCount % 90 === 0) {
        createObstacle();
    }
    if (frameCount % 60 === 0) {
        createCoin();
    }
    if (frameCount % 200 === 0) {
        createCloud();
    }

    // 난이도 증가
    if (frameCount % 500 === 0 && gameSpeed < 15) {
        gameSpeed += 0.5;
    }

    // 점수 증가
    if (frameCount % 10 === 0) {
        score += 1;
        scoreDisplay.textContent = score;
    }

    // 업데이트
    updatePlayer();
    updateObstacles();
    updateCoins();
    updateBackground();

    // 그리기
    drawCoins();
    drawObstacles();
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
    gameRunning = true;
    score = 0;
    scoreDisplay.textContent = score;
    obstacles = [];
    coins = [];
    clouds = [];
    gameSpeed = 6;
    frameCount = 0;

    player.y = groundY;
    player.velocityY = 0;
    player.isJumping = false;
    player.isSliding = false;

    // 초기 구름 생성
    for (let i = 0; i < 3; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 100 + 20,
            width: Math.random() * 80 + 60,
            speed: gameSpeed * 0.3
        });
    }

    startBtn.textContent = '게임 중...';
    gameLoop();
}

// 이벤트 리스너
startBtn.addEventListener('click', () => {
    if (!gameRunning) {
        startGame();
    }
});

// 키보드 이벤트
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        keys.jump = true;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        keys.slide = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        keys.jump = false;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keys.slide = false;
    }
});

// 모바일 컨트롤
const jumpBtn = document.getElementById('jumpBtn');
const slideBtn = document.getElementById('slideBtn');

// 터치 이벤트
jumpBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.jump = true;
});
jumpBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.jump = false;
});

slideBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.slide = true;
});
slideBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.slide = false;
});

// 마우스 이벤트 (데스크톱 테스트용)
jumpBtn.addEventListener('mousedown', () => keys.jump = true);
jumpBtn.addEventListener('mouseup', () => keys.jump = false);
jumpBtn.addEventListener('mouseleave', () => keys.jump = false);

slideBtn.addEventListener('mousedown', () => keys.slide = true);
slideBtn.addEventListener('mouseup', () => keys.slide = false);
slideBtn.addEventListener('mouseleave', () => keys.slide = false);

// 초기 화면 그리기
function drawInitialScreen() {
    drawBackground();
    player.y = groundY;
    drawPlayer();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('쿠키 러너', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('시작 버튼을 누르세요!', canvas.width / 2, canvas.height / 2 + 20);
}

drawInitialScreen();
