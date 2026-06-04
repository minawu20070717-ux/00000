let video;
let handPose;
let hands = [];

// 系統狀態
let systemState = "START_SCREEN"; 
let bootProgress = 0; 
let isModelReady = false; 

// 遊戲邏輯與計分
let score = 0;
let itemX, itemY;
let itemTargetX; // 垃圾要飛去的目標 X 座標
let itemSpeedY = 2.0; // 往下掉的速度
let itemType = ""; 
let itemName = "";
let isItemActive = false; 

// 兩個固定垃圾桶的座標與大小
let leftBucketX, rightBucketX, bucketY;
let bucketWidth, bucketHeight;

let btnX, btnY, btnW, btnH;

const recyclablePool = [
    { name: "🍼 寶特瓶", type: "RECYCLABLE" },
    { name: "📦 廢紙箱", type: "RECYCLABLE" },
    { name: "🥫 鋁罐", type: "RECYCLABLE" },
    { name: "🍾 玻璃瓶", type: "RECYCLABLE" }
];

const trashPool = [
    { name: "🍌 香蕉皮", type: "TRASH" },
    { name: "🧻 髒衛生紙", type: "TRASH" },
    { name: "🍪 零食包裝", type: "TRASH" },
    { name: "🛍️ 塑膠袋", type: "TRASH" }
];

let currentGesture = "系統準備就緒...";

function preload() {
    handPose = ml5.handPose(modelReady);
}

function modelReady() {
    isModelReady = true;
}

function setup() {
    let canvasW = min(windowWidth - 20, 640);
    let canvasH = (canvasW / 4) * 3; 
    
    let canvas = createCanvas(canvasW, canvasH);
    canvas.parent('game-container');
    rectMode(CENTER);

    bucketWidth = width * 0.25;
    bucketHeight = height * 0.1;

    // 【核心設定】定義左右兩個桶子的固定位置
    leftBucketX = width * 0.2;
    rightBucketX = width * 0.8;
    bucketY = height - (bucketHeight / 2 + 25); 

    btnX = width / 2;
    btnY = height * 0.8;
    btnW = width * 0.45;
    btnH = height * 0.12;

    video = createCapture(VIDEO);
    video.size(canvasW, canvasH);
    video.hide();

    handPose.detectStart(video, gotHands);

    generateNextItem();
}

function gotHands(results) {
    hands = results;
}

function draw() {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();

    background(10, 10, 20, 220);

    if (systemState === "START_SCREEN") {
        drawStartScreen();
    } else if (systemState === "LOADING") {
        drawLoadingScreen();
    } else if (systemState === "PLAYING") {
        drawGameCore();
    }
}

function drawStartScreen() {
    fill(0, 242, 254);
    noStroke();
    textSize(width * 0.055);
    textAlign(CENTER, CENTER);
    text("🎒 小學生垃圾分類大挑戰", width / 2, height * 0.15);

    stroke(0, 242, 254, 40);
    fill(255, 255, 255, 10);
    rect(width / 2, height * 0.46, width * 0.9, height * 0.42, 10);

    noStroke();
    textAlign(CENTER, CENTER);
    
    fill(255, 240, 0);
    textSize(width * 0.04);
    text("【 用手控制垃圾飛進正確的桶子裡 】", width / 2, height * 0.3);

    textSize(width * 0.035);
    textAlign(LEFT, CENTER);
    
    fill(0, 255, 153);
    text("👈 手放【左邊】 ➔ 讓垃圾往【左下角】資源回收桶飛去", width * 0.08, height * 0.38);
    fill(255, 255, 255, 180);
    textSize(width * 0.028);
    text(" （回收: 🍼寶特瓶、📦紙箱、🥫鋁罐、🍾玻璃瓶）", width * 0.08, height * 0.43);

    fill(255, 0, 127);
    text("👉 手放【右邊】 ➔ 讓垃圾往【右下角】一般垃圾桶飛去", width * 0.08, height * 0.51);
    fill(255, 255, 255, 180);
    textSize(width * 0.028);
    text(" （垃圾: 🍌香蕉皮、🧻衛生紙、🍪零食袋、🛍️塑膠袋）", width * 0.08, height * 0.56);

    fill(255, 255, 255, 120);
    textSize(width * 0.026);
    textAlign(CENTER, CENTER);
    text("※ 請舉起單手面對鏡頭左右移動，控制垃圾的飛行方向！", width / 2, height * 0.63);

    stroke(0, 242, 254);
    strokeWeight(2);
    if (mouseX > btnX - btnW/2 && mouseX < btnX + btnW/2 && mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2) {
        fill(0, 242, 254, 70); 
        cursor(HAND);
    } else {
        fill(0, 242, 254, 25);
        cursor(ARROW);
    }
    rect(btnX, btnY, btnW, btnH, 6);

    noStroke();
    fill(0, 242, 254);
    textSize(width * 0.045);
    text("開始挑戰 ➔", btnX, btnY);
}

function mousePressed() {
    if (systemState === "START_SCREEN") {
        if (mouseX > btnX - btnW/2 && mouseX < btnX + btnW/2 && mouseY > btnY - btnH/2 && mouseY < btnY + btnH/2) {
            systemState = "LOADING"; 
        }
    }
}

function drawLoadingScreen() {
    cursor(ARROW);
    if (bootProgress < 75) {
        bootProgress += 2.5; 
    } else if (bootProgress >= 75 && bootProgress < 99 && isModelReady) {
        bootProgress += 4.0; 
    } else if (isModelReady && bootProgress >= 99) {
        bootProgress = 100;  
    }

    if (bootProgress >= 100) {
        systemState = "PLAYING";
        return;
    }

    stroke(0, 242, 254, 80);
    strokeWeight(1);
    noFill();
    rect(width / 2, height / 2, width * 0.8, height * 0.5, 8);

    noStroke();
    fill(0, 242, 254);
    textSize(width * 0.045);
    textAlign(CENTER, CENTER);
    text("// AI 攝影機準備中 //", width / 2, height / 2 - (height * 0.1));
    
    textSize(width * 0.032);
    fill(255, 200);
    let displayPercent = floor(bootProgress);
    text("請允許攝影機權限... " + displayPercent + "%", width / 2, height / 2);

    noFill();
    stroke(0, 242, 254, 50);
    rect(width / 2, height / 2 + (height * 0.1), width * 0.5, 12, 6);
    
    fill(0, 242, 254, 200);
    noStroke();
    let maxBarW = width * 0.5 - 4;
    let currentBarWidth = map(displayPercent, 0, 100, 0, maxBarW);
    
    rectMode(LEFT); 
    rect(width / 2 - maxBarW/2, height / 2 + (height * 0.1), currentBarWidth, 8, 4);
    rectMode(CENTER); 
}

function drawGameCore() {
    drawTechHUD();
    processHandTracking();
    manageFallingObjects();
    drawStaticBuckets(); // 繪製左右常駐的垃圾桶
    drawUI();
}

function drawTechHUD() {
    strokeWeight(1);
    fill(0, 255, 153, 12);
    stroke(0, 255, 153, 50);
    rect(width * 0.25, height / 2, width / 2 - 12, height - 20, 8);
    
    fill(255, 0, 127, 12);
    stroke(255, 0, 127, 60);
    rect(width * 0.75, height / 2, width / 2 - 12, height - 20, 8);

    noStroke();
    textSize(width * 0.03); 
    fill(0, 255, 153);
    textAlign(LEFT, TOP);
    text("🟢【資源回收區】\n手放這邊 ➔ 垃圾往左導向", 15, 20);

    fill(255, 0, 127);
    textAlign(RIGHT, TOP);
    text("🔴【一般垃圾區】\n手放這邊 ➔ 垃圾往右導向", width - 15, 20);
}

function processHandTracking() {
    if (hands.length > 0) {
        let hand = hands[0];
        let rawHandX = hand.keypoints[0].x;
        let displayHandX = width - rawHandX; 

        for (let i = 0; i < hand.keypoints.length; i++) {
            let kp = hand.keypoints[i];
            fill(0, 242, 254, 220);
            noStroke();
            ellipse(width - kp.x, kp.y, 6, 6);
        }

        // 根據手部位置，決定垃圾要往左邊固定桶子飛、還是右邊固定桶子飛
        if (displayHandX < width / 2) { 
            currentGesture = "系統導向: 手部在【左側】 ➔ 垃圾導向回收桶";
            itemTargetX = leftBucketX; 
        } else {
            currentGesture = "系統偵測: 手部在【右側】 ➔ 垃圾導向垃圾桶";
            itemTargetX = rightBucketX; 
        }
    } else {
        currentGesture = "安全提示: 請把手舉起來控制垃圾方向！";
    }
}

function generateNextItem() {
    itemY = -30;
    itemX = width / 2; // 垃圾一律從正中央頂端出生
    itemTargetX = width / 2; // 預設直線往下，等手部控制才偏轉
    
    if (random(1) > 0.5) {
        let selected = random(recyclablePool);
        itemName = selected.name;
        itemType = selected.type; 
    } else {
        let selected = random(trashPool);
        itemName = selected.name;
        itemType = selected.type; 
    }
    isItemActive = true; 
}

function manageFallingObjects() {
    if (!isItemActive) return;

    itemY += itemSpeedY;
    // 使用 lerp 讓垃圾卡片平滑地往玩家指定的左右垃圾桶「滑翔吸過去」
    itemX = lerp(itemX, itemTargetX, 0.08);

    push();
    stroke(0, 242, 254, 200);
    strokeWeight(1.2);
    fill(5, 10, 25, 240);
    let cardW = width * 0.32; 
    rect(itemX, itemY, cardW, 32, 4);

    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(width * 0.026); 
    text(itemName, itemX, itemY);
    pop();

    // 檢測垃圾是否到達底部桶子高度
    if (itemY >= bucketY - bucketHeight / 2) {
        // 判斷落點偏左還是偏右
        let landedInLeft = (itemX < width / 2);
        
        // 正確得分邏輯比對
        if ((landedInLeft && itemType === "RECYCLABLE") || (!landedInLeft && itemType === "TRASH")) {
            score += 10; 
        } else {
            score = max(0, score - 5); 
        }
        
        isItemActive = false;
        setTimeout(generateNextItem, 10);
    }
}

// 🪣 【全新加入】在畫面底端同時畫出左、右兩個常駐的垃圾桶
function drawStaticBuckets() {
    push();
    // 1. 左邊固定綠色回收桶
    stroke(0, 255, 153);
    fill(0, 255, 153, 35);
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(0, 255, 153, 0.6)';
    rect(leftBucketX, bucketY, bucketWidth, bucketHeight, 6);
    
    drawingContext.shadowBlur = 0;
    noStroke();
    fill(255);
    textSize(width * 0.025);
    textAlign(CENTER, CENTER);
    text("♻️ 資源回收桶", leftBucketX, bucketY);

    // 2. 右邊固定紅色一般垃圾桶
    stroke(255, 0, 127);
    fill(255, 0, 127, 35);
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(255, 0, 127, 0.6)';
    rect(rightBucketX, bucketY, bucketWidth, bucketHeight, 6);
    
    drawingContext.shadowBlur = 0;
    noStroke();
    fill(255);
    text("🗑️ 一般垃圾桶", rightBucketX, bucketY);
    pop();
}

function drawUI() {
    fill(0, 242, 254);
    noStroke();
    textSize(width * 0.035);
    textAlign(CENTER, TOP);
    text("目前得分: " + score, width / 2, height * 0.18); 

    rectMode(CENTER);
    fill(5, 5, 12, 240);
    stroke(0, 242, 254, 70);
    strokeWeight(1);
    rect(width / 2, height - 20, width * 0.85, 22, 4);

    noStroke();
    fill(0, 242, 254);
    textSize(width * 0.022);
    textAlign(CENTER, CENTER);
    text(currentGesture, width / 2, height - 20);
}

function windowResized() {
    let canvasW = min(windowWidth - 20, 640);
    let canvasH = (canvasW / 4) * 3;
    resizeCanvas(canvasW, canvasH);
    bucketWidth = width * 0.25;
    bucketHeight = height * 0.1;
    leftBucketX = width * 0.2;
    rightBucketX = width * 0.8;
    bucketY = height - (bucketHeight / 2 + 25);
    btnX = width / 2;
    btnY = height * 0.8;
    btnW = width * 0.45;
    btnH = height * 0.12;
}