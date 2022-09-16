const iterationPerFrame = 20 // iterationPerFrame/iterationSubdivision*60 = simulation times real time, iterationPerFrame
const simulationSpeedInverse = 30

const iterationSubdivision = iterationPerFrame * simulationSpeedInverse
let ctx, canvasMidpoint, canvasSize, circleConstant
let trailCtx // for trails
const pi = Math.PI
const tau = pi * 2

if (document.readyState === "complete" || document.readyState === "interactive") {
    pendinit()
} else {
    document.addEventListener('DOMContentLoaded', pendinit)
}

function pendinit() {
    const canvasElement = document.getElementById('c')
    ctx = canvasElement.getContext('2d')
    canvasSize = Math.min(canvasElement.width, canvasElement.height)
    canvasMidpoint = 0.5 * canvasSize
    circleConstant = 0.05 * canvasSize
    ctx.fillStyle = '#A0A0FF'
    ctx.strokeStyle = '#A0A0FF'
    ctx.lineWidth = 4
    animate()
    
    // trails
    trailCtx = document.getElementById('trails').getContext('2d')
    trailCtx.fillStyle = '#A0A0FF'
}

let pendulumRadius

function animate() {
    function update() {
        if (halt) {halt = false; return}
        for (let i = 0; i < iterationPerFrame; i++) iterate(iterationSubdivision)
        
        // scaling coordinates
        pendulumRadius = l1 + l2
        const scalingFactor = 0.4 * canvasSize / pendulumRadius
        const simulationCoordinates = getCoordinates()
        const c = simulationCoordinates.map(x => x * scalingFactor + canvasMidpoint)
        
        // drawing
        clear()
        line(canvasMidpoint, canvasMidpoint, c[0], c[1])
        ball(c[0], c[1], m1)
        line(c[0], c[1], c[2], c[3])
        ball(c[2], c[3], m2)

        //trails
        trailDraw(c[2], c[3])

        window.requestAnimationFrame(update)
    }
    window.requestAnimationFrame(update)
}

function ball(x, y, mass) {
    const circleRadius = circleConstant * Math.sqrt(mass) / (l1 + l2)
    ctx.beginPath()
    ctx.arc(x, y, circleRadius, 0, tau)
    ctx.fill()
}

function line(x1, y1, x2, y2) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
}

function trailDraw(x, y) {
    trailCtx.beginPath()
    trailCtx.arc(x, y, 1, 0, tau)
    trailCtx.fill()

    trailCtx.save()
    trailCtx.fillStyle = '#00000006'
    trailCtx.fillRect(0, 0, canvasSize, canvasSize)
    trailCtx.restore()
}

function clear() {
    ctx.clearRect(0, 0, canvasSize, canvasSize)
}

let halt = false
function killAnimation() {
    halt = true
    console.log("animation will be terminated next frame. call animate to restart.")
}

function getFramePerformance() {}