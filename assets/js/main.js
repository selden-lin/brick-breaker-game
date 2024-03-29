const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const BRICKS_WIDTH = 60;
const BRICKS_HEIGHT = 30;
const BALL_RADIUS = 8;
const FULL_X_SPEED = 7;
const KEYCODE_LEFT = 37;
const KEYCODE_RIGHT = 39;
const SPACEBAR = 32;

var stage, paddle, ball;
var bricks = [];
var score = 0;
var lives = 3;
var scoreText;
var gameStarted = false;
var keyboardMoveLeft = false;
var keyboardMoveRight = false;
var highScore = 0;

function init() {
    if(typeof(Storage) !== "undefined") {
        if(localStorage.highScore == undefined) {
            localStorage.highScore = 0;
        }
        highScore = localStorage.highScore;
    } else {
        highScore = 0;
    }
    
    stage = new createjs.Stage("gameCanvas");
    createjs.Touch.enable(stage);
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener("tick", tick);

    createScoreText();
    createBrickGrid();
    createPaddle();
    createBall();
    
    window.onkeyup = keyUpHandler;
    window.onkeydown = keyDownHandler;

    stage.on("stagemousemove", function (event) {
        paddle.x = stage.mouseX;
    });
    
    stage.on("stagemousedown", function (event) {
        startLevel();
    });
    
    stage.canvas.height = window.innerHeight;
}

function createScoreText() {
    scoreText = new createjs.Text("", "16px Arial", "#000000");
    scoreText.y = stage.canvas.height - 16;
    stage.addChild(scoreText);
    addToScore(0);
}

function loseLife() {
    lives--;
    updateStatusLine();
    ball.xSpeed = 0;
    ball.ySpeed = 0;
    ball.x = paddle.x;
    ball.y = paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS;
    
    if(lives == 0) {
        if(score > highScore) {
            highScore = score;
            if (localStorage) { localStorage.highScore = score; }
        }
        lives = 3;
        score = 0;
        updateStatusLine();
    }
}

function addToScore(points) {
    score += points;
    updateStatusLine();
}

function updateStatusLine() {
    scoreText.text = "Score: " + score + " / Lives: " + lives + " / High score: "+highScore;
}

function tick() {
    stage.update();
    
    if(keyboardMoveLeft) {
        paddle.x -= 5;
    }
    if(keyboardMoveRight) {
        paddle.x += 5;
    }
    
    if (paddle.x + PADDLE_WIDTH / 2 > stage.canvas.width) {
        paddle.x = stage.canvas.width - PADDLE_WIDTH / 2;
    }
    if (paddle.x - PADDLE_WIDTH / 2 < 0) {
        paddle.x = PADDLE_WIDTH / 2;
    }

    if (!gameStarted) {
        ball.x = paddle.x;
        ball.y = paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS;
        stage.update();
        return;
    }

    if (ball.up) {
        ball.y -= ball.ySpeed;
    } else {
        ball.y += ball.ySpeed;
    }

    if (ball.right) {
        ball.x += ball.xSpeed;
    } else {
        ball.x -= ball.xSpeed;
    }

    for (var i = 0; i < bricks.length; i++) {
        if (checkCollision(ball, bricks[i])) {
            destroyBrick(bricks[i]);
            bricks.splice(i, 1);
            i--;
        }
    }

    if (checkCollision(ball, paddle)) {
        newBallXSpeedAfterCollision(ball, paddle);
    }

    //Check if we've reached the walls
    checkHitWall();

    ball.lastX = ball.x;
    ball.lastY = ball.y;
}

function startLevel() {
    if (!gameStarted) {
        gameStarted = true;
        ball.up = true;
        ball.right = true;
        ball.xSpeed = 5;
        ball.ySpeed = 5;
    }
}

function createBrick(x, y) {
    var brick = new createjs.Shape();
    brick.graphics.beginFill("#000FFF");
    brick.graphics.drawRect(0, 0, BRICKS_WIDTH, BRICKS_HEIGHT);
    brick.graphics.endFill();

    brick.regX = BRICKS_WIDTH / 2;
    brick.regY = BRICKS_HEIGHT / 2;
    brick.x = x;
    brick.y = y;
    brick.setBounds(brick.regX, brick.regY, BRICKS_WIDTH, BRICKS_HEIGHT);
    stage.addChild(brick);
    bricks.push(brick);
}

function createBall() {
    ball = new createjs.Shape();
    ball.graphics.beginFill("Red").drawCircle(0, 0, BALL_RADIUS);

    ball.x = paddle.x;
    ball.y = paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS;
    ball.up = false;
    ball.right = false;
    ball.xSpeed = 0;
    ball.ySpeed = 0;
    ball.lastX = 0;
    ball.lastY = 0;

    stage.addChild(ball);
}

function createPaddle() {
    paddle = new createjs.Shape();
    paddle.graphics.beginFill("#000000").drawRect(0, 0, PADDLE_WIDTH, PADDLE_HEIGHT);
    paddle.width = PADDLE_WIDTH;
    paddle.height = PADDLE_HEIGHT;
    paddle.x = stage.canvas.width / 2 - PADDLE_WIDTH / 2;
    paddle.y = stage.canvas.height * 0.9;
    paddle.regX = PADDLE_WIDTH / 2;
    paddle.regY = PADDLE_HEIGHT / 2;
    paddle.setBounds(paddle.regX, paddle.regY, PADDLE_WIDTH, PADDLE_HEIGHT);
    stage.addChild(paddle);
}

function destroyBrick(brick) {
    addToScore(100);
    createjs.Tween.get(brick, {}).to({
        scaleX: 0,
        scaleY: 0
    }, 500);
    setTimeout(removeBrickFromScreen, 500, brick);
}

function removeBrickFromScreen(brick) {
    stage.removeChild(brick)
}

function checkCollision(ballElement, hitElement) {
    var leftBorder = (hitElement.x - hitElement.getBounds().width / 2);
    var rightBorder = (hitElement.x + hitElement.getBounds().width / 2);
    var topBorder = (hitElement.y - hitElement.getBounds().height / 2);
    var bottomBorder = (hitElement.y + hitElement.getBounds().height / 2);
    var previousBallLeftBorder = ballElement.lastX - BALL_RADIUS;
    var previousBallRightBorder = ballElement.lastX + BALL_RADIUS;
    var previousBallTopBorder = ballElement.lastY - BALL_RADIUS;
    var previousBallBottomBorder = ballElement.lastY + BALL_RADIUS;
    var ballLeftBorder = ballElement.x - BALL_RADIUS;
    var ballRightBorder = ballElement.x + BALL_RADIUS;
    var ballTopBorder = ballElement.y - BALL_RADIUS;
    var ballBottomBorder = ballElement.y + BALL_RADIUS;


    if ((ballLeftBorder <= rightBorder) && (ballRightBorder >= leftBorder) && (ballTopBorder <= bottomBorder) && (ballBottomBorder >= topBorder)) {
        if ((ballTopBorder <= bottomBorder) && (previousBallTopBorder > bottomBorder)) {
            //Hit from the bottom
            ballElement.up = false;
            ballElement.y = bottomBorder + BALL_RADIUS;
        }

        if ((ballBottomBorder >= topBorder) && (previousBallBottomBorder < topBorder)) {
            //Hit from the top
            ballElement.up = true;
            ballElement.y = topBorder - BALL_RADIUS;
        }
        if ((ballLeftBorder <= rightBorder) && (previousBallLeftBorder > rightBorder)) {
            //Hit from the right
            ballElement.right = true;
            ballElement.x = rightBorder + BALL_RADIUS;
        }

        if ((ballRightBorder >= leftBorder) && (previousBallRightBorder < leftBorder)) {
            //Hit from the left
            ballElement.right = false;
            ballElement.x = leftBorder - BALL_RADIUS;
        }

        ballElement.lastX = ballElement.x;
        ballElement.lastY = ballElement.y;
        return true;
    }
    return false;
}

function newBallXSpeedAfterCollision(ballElement, hitElement) {
    var startPoint = hitElement.x - hitElement.getBounds().width / 2;
    var midPoint = hitElement.x;
    var endPoint = hitElement.x + hitElement.getBounds().width / 2;

    if (ballElement.x < midPoint) {
        ball.right = false;
        ball.xSpeed = FULL_X_SPEED - ((ballElement.x - startPoint) / (midPoint - startPoint)) * FULL_X_SPEED
    } else {
        ball.xSpeed = FULL_X_SPEED - ((endPoint - ballElement.x) / (endPoint - midPoint)) * FULL_X_SPEED
        ball.right = true;
    }
}

function checkHitWall() {
    if (ball.x + BALL_RADIUS >= stage.canvas.width) {
        ball.x = stage.canvas.width - BALL_RADIUS;
        ball.right = false;
    }
    if (ball.x - BALL_RADIUS <= 0) {
        ball.x = BALL_RADIUS;
        ball.right = true;
    }
    if (ball.y - BALL_RADIUS <= 0) {
        ball.y = BALL_RADIUS;
        ball.up = false;
    }
    if (ball.y - BALL_RADIUS >= stage.canvas.height) {
        loseLife();
        gameStarted = false;
    }
}

function createBrickGrid() {
    for (var x = 0; x < 14; x++) {
        for (var y = 0; y < 5; y++) {
            createBrick(x * (BRICKS_WIDTH + 10) + 40, y * (BRICKS_HEIGHT + 5) + 20)
        }
    }
}

function keyDownHandler(e) {
    switch(e.keyCode) {
        case KEYCODE_LEFT: 
            keyboardMoveLeft = true;
            break;
        case KEYCODE_RIGHT: 
            keyboardMoveRight = true;
            break;
        case SPACEBAR: 
            startLevel();
            break;
    }
}

function keyUpHandler(e) {
    switch(e.keyCode) {
        case KEYCODE_LEFT: 
            keyboardMoveLeft = false;
            break;
        case KEYCODE_RIGHT: 
            keyboardMoveRight = false;
            break;
        break;
    }
}
