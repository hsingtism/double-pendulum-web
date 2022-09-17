const iterationPerFrame = 20 // iterationPerFrame/iterationSubdivision*60 = simulation times real time, iterationPerFrame
const simulationSpeedInverse = 30
const lineWidth = 4

let g = 2 //gravity
let l1 = 1 //length to arm 
let l2 = 1
let m1 = 1 //mass of payload
let m2 = 1

const iterationSubdivision = iterationPerFrame * simulationSpeedInverse
let canvasMidpoint, canvasSize, circleConstant, pendulumContainer, trailCtx
const pi = Math.PI; const tau = pi * 2

let pendulumCount = 0
let p1 = []
let p2 = []
let v1 = []
let v2 = []
let canvasID = []
let canvasContext = []

if (document.readyState === "complete" || document.readyState === "interactive") {
    init()
} else {
    document.addEventListener('DOMContentLoaded', init)
}

function init() {
    canvasSize = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.8)
    pendulumContainer = document.getElementById('containCanvas')
    pendulumContainer.innerHTML += `<canvas id="trails" width="${canvasSize}px" height="${canvasSize}px" style="z-index:-10;"></canvas>`
    trailCtx = document.getElementById('trails').getContext('2d')
    
    canvasMidpoint = 0.5 * canvasSize
    circleConstant = 0.04 * canvasSize

    createPendulum(2, 2.5, 0, 0, '#8080FF')

}

function createPendulum(_p1, _p2, _v1, _v2, _color) {
    p1.push(_p1)
    p2.push(_p2)
    v1.push(_v1)
    v2.push(_v2)
    const id = pendulumCount.toString().padStart(4, '0')
    canvasID.push(id)
    pendulumContainer.innerHTML += `<canvas id="${id}" width="${canvasSize}px" height="${canvasSize}px" style="z-index:${pendulumCount};"></canvas>`
    const tempContext = document.getElementById(id).getContext('2d')
    tempContext.fillStyle = _color
    tempContext.strokeStyle = _color
    tempContext.lineWidth = lineWidth
    canvasContext.push(tempContext)
    pendulumCount++
}

function iterateFrame() {
    for(let m = 0; m < iterationPerFrame; m++) 
        for(let i = 0; i < pendulumCount; i++) {
            const iterationReturn = iterate(iterationSubdivision, p1[i], p2[i], v1[i], v2[i], g, l1, l2)
            p1[i] = iterationReturn[0]
            p2[i] = iterationReturn[1]
            v1[i] = iterationReturn[2]
            v2[i] = iterationReturn[3]
        }
}

function animate() {
    let pendulumRadius
    function update() {
        if (halt) { halt = false; return }
        window.requestAnimationFrame(update)
        iterateFrame()

        // getting and scaling coordinates
        pendulumRadius = l1 + l2
        const scalingFactor = 0.4 * canvasSize / pendulumRadius

        for(let i = 0; i < pendulumCount; i++) { // TODO make all pendulums visable
            const simulationCoordinates = toCartesian(p1[i], p2[i], l1, l2)
            const c = simulationCoordinates.map(x => x * scalingFactor + canvasMidpoint)
            const workingContext = canvasContext[i]

            clear(workingContext)
            line(workingContext, canvasMidpoint, canvasMidpoint, c[0], c[1])
            ball(workingContext, c[0], c[1], m1)
            line(workingContext, c[0], c[1], c[2], c[3])
            ball(workingContext, c[2], c[3], m2)
            trailDraw(c[2], c[3], workingContext.fillStyle)
        }
    }
    window.requestAnimationFrame(update)
}

let halt = false
function killAnimation() {
    halt = true
}

function ball(ctx, x, y, mass) {
    const circleRadius = circleConstant * Math.sqrt(mass) / (l1 + l2)
    ctx.beginPath()
    ctx.arc(x, y, circleRadius, 0, tau)
    ctx.fill()
}

function line(ctx, x1, y1, x2, y2) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
}

function trailDraw(x, y, color) {
    trailCtx.beginPath()
    trailCtx.arc(x, y, 1, 0, tau)
    trailCtx.fill()

    trailCtx.save()
    trailCtx.fillStyle = '#0000000d'
    trailCtx.fillRect(0, 0, canvasSize, canvasSize)
    trailCtx.restore()
}

function clear(ctx) {
    ctx.clearRect(0, 0, canvasSize, canvasSize)
}
