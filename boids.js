class Boid
{
    constructor(x, y, xMax, yMax, boids)
    {
        this.xMax = xMax;
        this.yMax = yMax;
        this.radius = 100;
        this.boids = boids;
        this.color = getRandomColor();

        //vector members
        this.position = math.matrix([x, y]);
        this.velocity = math.matrix([Math.random() * 4 - 2, Math.random() * 4 - 2]);
        this.acceleration = math.matrix([0, 0]);
    }

    get heading()
    {
        return math.atan2(velocity[1], velocity[0]) * 180.0 / math.pi;
    }

    testMove()
    {
        this.position = math.add(this.position, 1);
        this.wrapAround();
    }
    wrapAround()
    {
        if (this.position.get([0]) <= 0)
        {
            this.position = math.add(this.position, math.matrix([this.xMax, 0]));
        }
        if (this.position.get([0]) > this.xMax)
        {
            this.position = math.subtract(this.position, math.matrix([this.xMax, 0]));
        }

        if (this.position.get([1]) <= 0)
        {
            this.position = math.add(this.position, math.matrix([0, this.yMax]));
        }
        if (this.position.get([1]) > this.yMax)
        {
            this.position = math.subtract(this.position, math.matrix([0, this.yMax]));
        }
    }
    move()
    {
        let separationVec = this.separation;
        let cohesionVec = this.cohesion;
        let alignmentVec = this.alignment;

        //scale vectors before accelerating
        separationVec = math.multiply(separationVec, 1.3);
        alignmentVec = math.multiply(alignmentVec, 1.1);
        cohesionVec = math.multiply(cohesionVec, 1);

        this.acceleration = math.add(this.acceleration, separationVec);
        this.acceleration = math.add(this.acceleration, cohesionVec);
        this.acceleration = math.add(this.acceleration, alignmentVec);
        this.acceleration = Boid.limit(this.acceleration, .5);

        this.velocity = math.add(this.velocity, this.acceleration);
        this.velocity = math.multiply(Boid.normalize(this.velocity), 2);

        this.position = math.add(this.position, this.velocity);
        this.wrapAround();

        this.acceleration = math.matrix([0, 0]);
    }


    steer(desiredDir)
    {
        return math.subtract(desiredDir, this.velocity);
    }

    get neighbors()
    {
        let neighbors = [];

        for (let i = 0; i < this.boids.length; i++)
        {
            let neighborDist = math.distance(this.position, boids[i].position);

            if (this !== boids[i] && neighborDist <= this.radius && neighborDist >= 0)
            {
                neighbors.push(boids[i]);
            }
        }

        return neighbors;
    }

    static magnitude(vec)
    {
        return math.sqrt(vec.get([0]) * vec.get([0]) + vec.get([1]) * vec.get([1]));
    }
    static normalize(vec)
    {
        let mag = Boid.magnitude(vec);
        return math.matrix([ vec.get([0]) / mag, vec.get([1]) / mag ]);
    }
    static limit(vec, maxForce)
    {
        let mag = Boid.magnitude(vec);
        if (mag > maxForce)
        {
            return math.multiply(Boid.normalize(vec), maxForce);
        }
        else
        {
            return vec;
        }
    }

    static getRandomColor()
    {
        let r = Math.round(Math.random() * 255).toString(16);
        let g = Math.round(Math.random() * 255).toString(16);
        let b = Math.round(Math.random() * 255).toString(16);
        let a = Math.round(Math.random() * 255).toString(16);
        return '#' + r + g + b + a;
    }

    get separation()
    {
        let desiredDir = math.matrix([0, 0]);
        let neighbors = this.neighbors;

        for (let i = 0; i < neighbors.length; i++)
        {
            let diff = math.subtract(this.position, neighbors[i].position);
            diff = Boid.normalize(diff);
            diff = math.divide(diff, math.distance(this.position, neighbors[i].position));
            desiredDir = math.add(desiredDir, diff);
        }

        if (neighbors.length > 0)
        {
            desiredDir = math.divide(desiredDir, neighbors.length);
        }

        if (math.norm(desiredDir) > 0)
        {
            desiredDir = Boid.normalize(desiredDir);
            return this.steer(desiredDir);
        }
        return desiredDir;
    }

    get alignment()
    {
        let avgVelocity = math.zeros(2);
        let neighbors = this.neighbors;
        for (let i = 0; i < neighbors.length; i++)
        {
            //let dist = math.distance(this.position, neighbors[i].position);
            avgVelocity = math.add(avgVelocity, neighbors[i].velocity);
        }

        if (neighbors.length > 0)
        {
            avgVelocity = math.divide(avgVelocity, neighbors.length);
            avgVelocity = Boid.normalize(avgVelocity);
            return this.steer(avgVelocity);
        }
        return avgVelocity;
    }

    get cohesion()
    {
        let avgPosition = math.zeros(2);
        let neighbors = this.neighbors;
        for (let i = 0; i < neighbors.length; i++)
        {
            avgPosition = math.add(avgPosition, neighbors[i].position);
        }

        if (neighbors.length > 0)
        {
            avgPosition = math.divide(avgPosition, neighbors.length);
            let desiredDir = math.subtract(avgPosition, this.position);
            desiredDir = Boid.normalize(desiredDir);
            return this.steer(desiredDir);
        }
        return avgPosition;
    }
}

//init rendering
let canvas = document.getElementById('game-window');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let renderContext = canvas.getContext('2d');

let boids = [];
for (let i = 0; i < 60; i++)
{
    let randX = Math.floor(Math.random() * canvas.width);
    let randY = Math.floor(Math.random() * canvas.height);

    boids.push(new Boid(randX, randY, canvas.width, canvas.height, boids));
}

function getRandomColor()
{
    let r = Math.round(Math.random() * 255).toString(16);
    let g = Math.round(Math.random() * 255).toString(16);
    let b = Math.round(Math.random() * 255).toString(16);
    let a = Math.round(Math.random() * 255).toString(16);
    return '#' + r + g + b + a;
}

function drawBoid(boid)
{
    let directionVec = math.multiply(Boid.normalize(boid.velocity), 20);
    let lineDest = math.add(boid.position, directionVec);

    renderContext.beginPath();
    renderContext.fillStyle = '#36D0FF';
    //renderContext.fillStyle = boid.color;
    renderContext.arc(Math.floor(boid.position.get([0])), Math.floor(boid.position.get([1])), 4, 0, 2 * math.pi);
    renderContext.fill();

    renderContext.beginPath();
    renderContext.strokeStyle = '#FFA378';
    //renderContext.strokeStyle = boid.color;
    renderContext.moveTo(boid.position.get([0]), boid.position.get([1]));
    renderContext.lineTo(lineDest.get([0]), lineDest.get([1]));
    renderContext.stroke();

    renderContext.beginPath();
    //renderContext.strokeStyle = '#70FF96';
    renderContext.strokeStyle = '#CDCDCD';
    renderContext.arc(Math.floor(boid.position.get([0])), Math.floor(boid.position.get([1])), boid.radius, 0, 2 * math.pi);
    renderContext.stroke();
}

function eventLoop(boids)
{
    renderContext.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < boids.length; i++)
    {
        boids[i].move();
        drawBoid(boids[i]);
    }

    requestAnimationFrame(function() { eventLoop(boids) });
}

eventLoop(boids);
