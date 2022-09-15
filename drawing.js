const iterationPerFrame = 100
const iterationSubdivision = 1000
const canvasSize = 600
const canvasMidpoint = 0.5 * canvasSize 

let ctx, circleRadius
const pi = Math.PI
const tau = pi * 2

if (document.readyState === "complete" || document.readyState === "interactive") {
    pendinit()
} else {
    document.addEventListener('DOMContentLoaded', pendinit)
}

function pendinit() {
    ctx = document.getElementById('c').getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 4
    circleRadius = 15
}

let pendulumRadius

function scaleCoordinates() {
    pendulumRadius ||= l1 + l2
    const scalingFactor = 0.4 * canvasSize / pendulumRadius
    const simulationCoordinates = getCoordinates()
    return simulationCoordinates.map(x => x * scalingFactor + canvasMidpoint)
}

function frameUpdate() {
    function update() {
        for (let i = 0; i < iterationPerFrame; i++) iterate(iterationSubdivision)
        const c = scaleCoordinates()
        clear()
        line(canvasMidpoint, canvasMidpoint, c[0], c[1])
        ball(c[0], c[1])
        line(c[0], c[1], c[2], c[3])
        ball(c[2], c[3])

        window.requestAnimationFrame(update)
    }
    window.requestAnimationFrame(update)
}

function ball(x, y) {
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

function clear() {
    ctx.clearRect(0, 0, canvasSize, canvasSize)
}