window.addEventListener('load', () => {
    /** @type {HTMLCanvasElement} */

    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    let CW = canvas.width = innerWidth;
    let CH = canvas.height = innerHeight;

    const canvasInput = document.getElementById('canvas2');
    const ctxInput = canvasInput.getContext('2d');
    let CWInput = canvasInput.width = innerWidth;
    let CHInput = canvasInput.height = innerHeight;

    $(window).resize(() => {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        canvasInput.width = innerWidth;
        canvasInput.height = innerHeight;
    });

    const PI = Math.PI;
    const getRandom = (min, max) => {
        return Math.random() * (max - min) + min;
    }

    class Particle {
        constructor () {
            this.scale = 0.1;
            this.radiusMinSize = 1;
            this.radiusMaxSize = 5;
            this.radius = Math.floor(getRandom(this.radiusMinSize, this.radiusMaxSize));
            this.oriRadius = this.radius;
            this.pointSize = 7;

            this.isPainting = false;
            this.isReady = false;
            this.x = Math.random() * (CW - this.radius * 2) + this.radius;
            this.y = Math.random() * (CH - this.radius * 2) + this.radius;
            
            this.offsetX = 0;
            this.offsetY = 0;
            
            this.oriX = this.x;
            this.oriY = this.y;

            this.newX = this.x + Math.random() * 70 - 35;
            this.newY = this.y + Math.random() * 70 - 35;

            this.targetX = null;
            this.targetY = null;

            this.isExpanding = false;
            this.isScale = false;
            
            this.alpha = getRandom(0.1, 0.5);
            this.oriAlpha = this.alpha;

            this.random = Math.random();

            this.timer = getRandom(0, 500);
            this.interval = getRandom(800, 1500);
        }

        update(deltaTime) {
            if (this.targetX != null && this.isPainting) {
                if (this.alpha <= 1) this.alpha += this.scale;

                this.dx = this.x - this.targetX;
                this.dy = this.y - this.targetY;

                this.offsetX = Math.max(-.15, Math.min(.15, this.offsetX));
                this.offsetY = Math.max(-.15, Math.min(.15, this.offsetY));

                this.offsetX += (Math.random() - 0.5);
                this.offsetY += (Math.random() - 0.5);

                this.x += this.offsetX;
                this.y += this.offsetY;

                if (this.dx <= 1 && this.dy <= 1) this.isReady = true;
                else this.isReady = false;

            } else {
                this.dx = this.x - this.newX;
                this.dy = this.y - this.newY;
            }

            if (this.timer > this.interval && !this.isPainting) {
                this.timer = 0;
                this.newX = this.newX + Math.random() * 70 - 35;
                this.newY = this.newY + Math.random() * 70 - 35;
            }
            else this.timer += deltaTime;

            if (this.isPainting) {
                if (this.radius < this.pointSize) {
                    this.radius += this.scale;
                    this.alpha -= this.scale;
                } else this.radius -= this.scale;

                if (this.alpha <= 1) this.alpha += this.scale;

            } else {
                this.isExpanding = false;
                this.isScale = false;
                if (this.radius <= this.oriRadius) {
                    this.radius += this.scale;
                } else {
                    this.radius -= this.scale;
                }
                if (this.alpha >= this.oriAlpha) this.alpha -= this.scale;
            }

            if (this.random > 0.95 && this.isPainting) {
                if (this.timer > this.interval) {
                    this.x -= this.dx / (getRandom(10, 20));
                    this.y -= this.dy / (getRandom(10, 20));
                }
            } else {
                this.x -= this.dx / (getRandom(10, 20));
                this.y -= this.dy / (getRandom(10, 20));
            }
        }

        draw() {
            ctx.save();
            ctx.beginPath();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = 'white';
            ctx.arc(this.x, this.y, this.radius, PI * 2, 0);
            ctx.fill();
            ctx.restore();
        }
    }

    let defaultParticles = [];
    let particles = [];
    let usedPoints = [];

    let newPoint;
    let maxUsedPoint = [];

    let imageData;

    const initParticle = (amount) => {
        for (let i = 0; i < amount; i++) {
            defaultParticles.push(new Particle());
        }
    }

    initParticle(300);

    const getTextData = (imageData) => {
        let sampleRate = Math.floor(30 / textLength) < 10 ? 10 : Math.floor(30 / textLength);
        for (let j = 0; j < CHInput; j += sampleRate) {
            for (let i = 0; i < CWInput; i += sampleRate) {
                let alpha = imageData[(i + j * CWInput) * 4 + 3];
                if (alpha > 0) {
                    if (usedPoints.some(p => p.i == i && p.j == j)) {
                        continue;
                    } else {
                        usedPoints.push({i, j});
                    }

                    maxUsedPoint.push(usedPoints.length);

                    newPoint = !usedPoints.some(p => p.x == i && p.y == j); // 檢查是否有重複位置
                    
                    if (newPoint) {
                        if (defaultParticles.length === 0) {
                            initParticle(1);
                        }
                        let particle = defaultParticles.pop();
                            
                        particle.isPainting = true;
                        particle.pointSize = 10 / textLength < 5 ? 5 : 10 / textLength;
                        particle.targetX = i;
                        particle.targetY = j;
                        particles.push(particle);

                        particles.sort(() => {
                            return (0.5 - Math.random());
                        });
                    }
                }
            }
        }
    }

    let text = '';
    let textLength = 1;
    let fontSize = CWInput / 5;

    $('#stringInput').change(e => {
        text = e.target.value;
        textLength = text.length;
        fontSize = CHInput / textLength * 0.8;
        if (text) {
            $('#stringInput')[0].value = '';
        }

        particles.forEach(particle => {
            particle.radius += particle.scale;
            particle.isPainting = false;
            particle.targetX = null;
            particle.targetY = null;

        });

        usedPoints = [];
        defaultParticles = particles.concat(defaultParticles);
        particles = [];
    })


    const img = new Image();
    img.src = './logo.png';

    let lastTime = 0;
    const animate = (timeStamp) => {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, CW, CH);
        
        ctxInput.font = `${fontSize}px sans-serif`;
        ctxInput.textAlign = 'center';
        ctxInput.textBaseline = 'middle';
        ctxInput.fillText(`${text}`, CWInput / 2, CHInput / 2);
        if (!text) ctxInput.drawImage(img, CWInput / 2 - img.width / 2, CHInput / 2 - img.height / 2);
        imageData = ctxInput.getImageData(0, 0, CWInput, CHInput).data;
        getTextData(imageData, textLength);
        ctxInput.clearRect(0, 0, CWInput, CHInput);
        

        [...defaultParticles, ...particles].forEach(particle => {
            particle.update(deltaTime);
            particle.draw();
        });

        requestAnimationFrame(animate);
    }

    animate(0);
});
