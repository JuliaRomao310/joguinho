const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 900 },
            debug: false
        }
    },
    scene: {
        preload,
        create,
        update
    }
};

let player;
let ground;
let enemies;
let speed = 200;
let gameOver = false;

// HUD
let score = 0;
let scoreText;
let speedText;
let restartText;

// frutas
let fruits;

// nuvens
let clouds;

// sons
let soundJump, soundFundo, soundPontos, soundGameOver, soundMorri;

// pulo duplo
let jumpCount = 0;
const maxJumps = 2;

// fundo
let graphics;

new Phaser.Game(config);

function preload() {
    this.load.image('walk1', 'assets/walk1.png');
    this.load.image('walk2', 'assets/walk2.png');
    this.load.image('ground', 'assets/chao.png');
    this.load.image('enemy', 'assets/inimigo.png');

    // frutas
    this.load.image('apple', 'assets/apple.png');
    this.load.image('morango', 'assets/morango.png');
    this.load.image('cereja', 'assets/cereja.png');
    this.load.image('banana', 'assets/banana.png');

    // sons
    this.load.audio('pulo', 'assets/pulo.mp3');
    this.load.audio('fundo', 'assets/fundo.mp3');
    this.load.audio('pontos', 'assets/pontos.mp3');
    this.load.audio('gameover', 'assets/gameover.mp3');
    this.load.audio('morri', 'assets/morri.mp3');
}

function create() {
    gameOver = false;
    score = 0;
    speed = 200;
    jumpCount = 0;

    // sons
    soundJump = this.sound.add('pulo');
    soundFundo = this.sound.add('fundo', { loop: true, volume: 0.5 });
    soundPontos = this.sound.add('pontos');
    soundGameOver = this.sound.add('gameover');
    soundMorri = this.sound.add('morri');

    soundFundo.play();

    // fundo gradiente
    graphics = this.add.graphics();
    drawBackground();

    // nuvens
    createClouds.call(this);

    // chão
    ground = this.add.tileSprite(config.width / 2, config.height - 40, config.width, 80, 'ground');
    this.physics.add.existing(ground, true);

    // player
    player = this.physics.add.sprite(150, ground.y - 100, 'walk1');
    player.setCollideWorldBounds(true);
    player.setScale(1.2);

    this.anims.create({
        key: 'run',
        frames: [{ key: 'walk1' }, { key: 'walk2' }],
        frameRate: 6,
        repeat: -1
    });
    player.play('run');

    this.physics.add.collider(player, ground);

    // input
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // HUD
    scoreText = this.add.text(20, 20, 'Pontos: 0', {
        fontSize: '26px',
        fill: '#00ffcc',
        fontStyle: 'bold'
    });

    speedText = this.add.text(20, 60, 'Velocidade: ' + speed, {
        fontSize: '26px',
        fill: '#00ffcc',
        fontStyle: 'bold'
    });

    // frutas
    fruits = this.physics.add.group();

    // inimigos
    enemies = this.physics.add.group();
    spawnEnemy.call(this);

    // loop frutas
    this.time.addEvent({
        delay: 2500,
        callback: spawnFruit,
        callbackScope: this,
        loop: true
    });

    // loop inimigos
    this.time.addEvent({
        delay: 4000,
        callback: spawnEnemy,
        callbackScope: this,
        loop: true
    });

    this.scale.resize(window.innerWidth, window.innerHeight);
}

function update() {
    if (gameOver) {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.scene.restart();
        }
        return;
    }

    // mover fundo
    graphics.tilePositionX += speed * 0.02;

    // atualizar nuvens
    updateClouds();

    // mover chão
    ground.tilePositionX += speed * 0.02;

    // pulo duplo
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && jumpCount < maxJumps) {
        player.setVelocityY(-700);
        soundJump.play();
        jumpCount++;
    }
    if (player.body.touching.down) {
        jumpCount = 0;
    }

    // mover inimigos
    enemies.children.iterate(function(e) {
        if (e) {
            e.setVelocityX(-speed);
            if (e.x < -e.width / 2) e.destroy();
        }
    });

    // mover frutas
    fruits.children.iterate(function(fruit) {
        if (fruit) {
            fruit.setVelocityX(-speed);
            if (fruit.x < -fruit.width / 2) fruit.destroy();
        }
    });
}

// ================= FUNÇÕES FUNDO =================
function drawBackground() {
    let topColor = 0x87ceeb;
    let bottomColor = 0x1e90ff;
    let height = config.height;

    for (let y = 0; y < height; y++) {
        let color = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(topColor),
            Phaser.Display.Color.ValueToColor(bottomColor),
            height,
            y
        );
        graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
        graphics.fillRect(0, y, config.width, 1);
    }
}

// ================= FUNÇÕES NUVENS =================
function createClouds() {
    clouds = this.add.group();
    for (let i = 0; i < 5; i++) {
        let cloud = this.add.ellipse(
            Phaser.Math.Between(0, config.width),
            Phaser.Math.Between(50, 150),
            Phaser.Math.Between(100, 180),
            Phaser.Math.Between(40, 80),
            0xffffff,
            0.5
        );
        clouds.add(cloud);
    }
}

function updateClouds() {
    clouds.children.iterate(function(cloud) {
        cloud.x -= 0.3;
        if (cloud.x < -100) cloud.x = config.width + 100;
    });
}

// ================= FUNÇÕES DO JOGO =================
function spawnEnemy() {
    let enemyCount = Phaser.Math.Between(1, 2);
    for (let i = 0; i < enemyCount; i++) {
        let e = enemies.create(config.width + Phaser.Math.Between(50, 200), ground.y - 64, 'enemy');
        e.setScale(0.8);
        e.body.setAllowGravity(false);
        e.setAngularVelocity(200); // sentido horário
        this.physics.add.overlap(player, e, hitEnemy, null, this);
    }
}

function spawnFruit() {
    const fruitTypes = [
        { key: 'apple', points: 2 },
        { key: 'morango', points: 3 },
        { key: 'cereja', points: 5 },
        { key: 'banana', points: 4 }
    ];
    const random = Phaser.Math.Between(0, fruitTypes.length - 1);
    const fruitData = fruitTypes[random];
    let fruit = fruits.create(config.width + 50, ground.y - Phaser.Math.Between(150, 250), fruitData.key);
    fruit.setScale(0.7);
    fruit.setData('points', fruitData.points);
    fruit.body.setAllowGravity(false);
    this.physics.add.overlap(player, fruit, collectFruit, null, this);
}

function collectFruit(player, fruit) {
    score += fruit.getData('points');
    scoreText.setText('Pontos: ' + score);
    soundPontos.play();
    fruit.destroy();
}

function hitEnemy() {
    gameOver = true;
    this.physics.pause();
    player.anims.stop();

    if (soundFundo.isPlaying) soundFundo.stop();
    soundMorri.play();

    this.time.delayedCall(1000, () => {
        restartText = this.add.text(config.width/2, config.height/2, 
            'GAME OVER!!!!!!!!\nPontuação: ' + score + '\nAperte ESPAÇO para reiniciar', 
        {
            fontSize: '28px',
            fill: '#ff0000',
            fontStyle: 'bold',
            align: 'center'
        });
        restartText.setOrigin(0.5);
        soundGameOver.play();
    });
}