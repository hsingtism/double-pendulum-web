const iterationPerFrame = 20 // iterationPerFrame/iterationSubdivision*60 = simulation times real time, iterationPerFrame
const simulationSpeedInverse = 30
const lineWidth = 4

const iterationSubdivision = iterationPerFrame * simulationSpeedInverse
let canvasMidpoint, canvasSize, circleConstant, pendulumContainer, trailCtx
const pi = Math.PI; const tau = pi * 2

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

let pendulumCount = 0
let p1 = []
let p2 = []
let v1 = []
let v2 = []
let canvasID = []
let canvasContext = []

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

}

function animate() {

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
