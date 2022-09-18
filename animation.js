// get starting parameters
let parsedHash
try {
    parsedHash = JSON.parse(decodeURIComponent(location.hash))
} catch {
    parsedHash = {}
}

const startingAngle      = parsedHash.startingAngle || 2
const startingAngleDelta = parsedHash.startingAngleDelta || 0.01
const pendulumNumber     = parsedHash.pendulumNumber || 8
const hslOffsetDeg       = parsedHash.hslOffsetDeg || 30

const startingVelocity1  = parsedHash.startingVelocity1 || 0
const startingVelocity2  = parsedHash.startingVelocity2 || 0

let g = parsedHash.g || 1 //gravity
let l1 = parsedHash.l1 || 1 //length to arm 
let l2 = parsedHash.l2 || 1
let m1 = parsedHash.m1 || 1 //mass of payload
let m2 = parsedHash.m2 || 1

const iterationPerFrame = parsedHash.iterationPerFrame || 1000 // iterationPerFrame/iterationSubdivision*60 = simulation times real time, iterationPerFrame

// 
const simulationSpeedInverse = 20
const lineWidth = 4
const relativeCircleSize = 0.04

const canvasSize = 1000
const trailColorDecayOverlay = '#00000008'

const iterationSubdivision = iterationPerFrame * simulationSpeedInverse
let canvasMidpoint, circleConstant, trailCtx
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
    const generateColor = (subDiv, n) => `hsl(${360 / subDiv * n - hslOffsetDeg}deg, 100%, 50%)`
    trailCtx = document.getElementById('trails').getContext('2d')
    
    canvasMidpoint = 0.5 * canvasSize
    circleConstant = relativeCircleSize * canvasSize

    for (let i = 0; i < pendulumNumber; i++) {
        createPendulum(startingAngle, startingAngle + startingAngleDelta * i, startingVelocity1, startingVelocity2, generateColor(pendulumNumber, i))
    }

    animate()
}

function createPendulum(_p1, _p2, _v1, _v2, _color) {
    if(pendulumCount == 9) {
        alert('pendulum limit hit. function will be terminated')
        return
    }
    p1.push(_p1)
    p2.push(_p2)
    v1.push(_v1)
    v2.push(_v2)
    const id = pendulumCount.toString().padStart(4, '0')
    canvasID.push(id)
    const tempContext = document.getElementById(id).getContext('2d')
    tempContext.globalAlpha = 0.75
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
    const performanceDisplay = document.getElementById('renderTime')
    function update() {
        let t1 = performance.now()
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
        performanceDisplay.innerText = `rendered in ${(performance.now() - t1).toFixed(5)}ms`
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
    trailCtx.fillStyle = color
    trailCtx.beginPath()
    trailCtx.arc(x, y, 1, 0, tau)
    trailCtx.fill()

    trailCtx.save()
    trailCtx.fillStyle = trailColorDecayOverlay
    trailCtx.fillRect(0, 0, canvasSize, canvasSize)
    trailCtx.restore()
}

function clear(ctx) {
    ctx.clearRect(0, 0, canvasSize, canvasSize)
}
