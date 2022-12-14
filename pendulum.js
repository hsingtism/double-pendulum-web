/*--------------------------------*/
// get starting parameters
let parsedHash
try {
    let hash = window.location.hash
    if (hash[0] == '#') hash = hash.substring(1)
    parsedHash = JSON.parse(decodeURIComponent(hash))
} catch {
    parsedHash = {}
}

const pendulumNumber     = parsedHash.pendulumNumber || 3
const iterationPerFrame  = parsedHash.iterationPerFrame || 1000 // iterationPerFrame/iterationSubdivision*60 = simulation times real time
const startingAngle      = parsedHash.startingAngle || 2
const startingAngleDelta = parsedHash.startingAngleDelta || 0.005
const hslOffsetDeg       = parsedHash.hslOffsetDeg || 30
const displayFrameRate   = parsedHash.displayFrameRate ?? true

// these environment variables can be changed mid-simulation
let l1 = parsedHash.l1 || 1 //length to arm 
let l2 = parsedHash.l2 || 1
let m1 = parsedHash.m1 || 1 //mass of payload
let m2 = parsedHash.m2 || 1
const startingVelocity1  = parsedHash.startingVelocity1 || 0
const startingVelocity2  = parsedHash.startingVelocity2 || 0
let g = parsedHash.g || 1 //gravity

/*--------------------------------*/
// animations and stuff
const simulationSpeedInverse = 20 //don't let the user touch this, let them change the environment parameters
const lineWidth = 4
const relativeCircleSize = 0.04

const canvasSize = 1000
const trailColorDecayOverlay = '#00000004' //black plus alpha. the more opaque the faster the trail decay

const dragConstantThing = 0.00 // not used, set to 0
const iterationSubdivision = iterationPerFrame * simulationSpeedInverse
let canvasMidpoint, circleConstant, trailCtx
const pi = Math.PI; const tau = pi * 2

let pendulumCount = 0
let p1 = []
let p2 = []
let v1 = []
let v2 = []
let colors = []

if (document.readyState === "complete" || document.readyState === "interactive") {
    init()
} else {
    document.addEventListener('DOMContentLoaded', init)
}

let mainCanvas

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function init() {
    let feedString = `<canvas id="trails" width="${canvasSize}px" height="${canvasSize}px" style="z-index:-10;"></canvas><canvas id="mainp" width="${canvasSize}px" height="${canvasSize}px" style="z-index:5;"></canvas>`
    document.getElementById('containCanvas').innerHTML += feedString
    
    await sleep(0)

    const generateColor = (subDiv, n) => `hsl(${360 / subDiv * n - hslOffsetDeg}deg, 100%, 50%)`
    mainCanvas = document.getElementById('mainp').getContext('2d')
    trailCtx = document.getElementById('trails').getContext('2d')
    
    canvasMidpoint = 0.5 * canvasSize
    circleConstant = relativeCircleSize * canvasSize

    for (let i = 0; i < pendulumNumber; i++) {
        createPendulum(startingAngle, startingAngle + startingAngleDelta * i, startingVelocity1, startingVelocity2, generateColor(pendulumNumber, i))
    }

    animate()
}

function createPendulum(_p1, _p2, _v1, _v2, _color) {
    p1.push(_p1)
    p2.push(_p2)
    v1.push(_v1)
    v2.push(_v2)
    colors.push(_color)
    mainCanvas.globalAlpha = 0.75
    mainCanvas.lineWidth = lineWidth
    pendulumCount++
}

function iterateFrame() {
    for(let m = 0; m < iterationPerFrame; m++) 
        for(let i = 0; i < pendulumCount; i++) {
            const iterationReturn = iterate(iterationSubdivision, p1[i], p2[i], v1[i], v2[i], g, l1, l2, dragConstantThing)
            p1[i] = iterationReturn[0]
            p2[i] = iterationReturn[1]
            v1[i] = iterationReturn[2]
            v2[i] = iterationReturn[3]
        }
}

let frameCount = 0 // for debug
function animate() {
    let pendulumRadius, t1
    const performanceDisplay = document.getElementById('renderTime')
    function update() {
        if (halt) { halt = false; return }
        window.requestAnimationFrame(update)
        iterateFrame()
        clear(mainCanvas)
        trailFade()
        
        pendulumRadius = l1 + l2
        const scalingFactor = 0.4 * canvasSize / pendulumRadius
        
        for (let i = 0; i < pendulumCount; i++) {
            const simulationCoordinates = toCartesian(p1[i], p2[i], l1, l2)
            const c = simulationCoordinates.map(x => x * scalingFactor + canvasMidpoint)
            
            mainCanvas.fillStyle = colors[i]
            mainCanvas.strokeStyle = colors[i]
            line(canvasMidpoint, canvasMidpoint, c[0], c[1])
            ball(c[0], c[1], m1)
            line(c[0], c[1], c[2], c[3])
            ball(c[2], c[3], m2)
            trailDraw(c[2], c[3], mainCanvas.fillStyle)
        }

        if (displayFrameRate) performanceDisplay.innerText = `frame: ${(performance.now() - t1).toFixed(4)}ms`
        t1 = performance.now()
        frameCount++
    }
    window.requestAnimationFrame(update)
}

let halt = false // call this to pause, call animate to restart
function killAnimation() {
    halt = true
}

function ball(x, y, mass) {
    const circleRadius = circleConstant * Math.sqrt(mass) / (l1 + l2)
    mainCanvas.beginPath()
    mainCanvas.arc(x, y, circleRadius, 0, tau)
    mainCanvas.fill()
}

function line(x1, y1, x2, y2) {
    mainCanvas.beginPath()
    mainCanvas.moveTo(x1, y1)
    mainCanvas.lineTo(x2, y2)
    mainCanvas.stroke()
}

function trailDraw(x, y, color) {
    trailCtx.fillStyle = color
    trailCtx.beginPath()
    trailCtx.arc(x, y, 1, 0, tau)
    trailCtx.fill()
}

function trailFade() {
    trailCtx.fillStyle = trailColorDecayOverlay
    trailCtx.fillRect(0, 0, canvasSize, canvasSize)
}

function clear(ctx) {
    ctx.clearRect(0, 0, canvasSize, canvasSize)
}

/*--------------------------------*/
// physics functions
// this section is to be kept purely functional from the rest of the script
const sin = Math.sin
const cos = Math.cos

function accelFromDrag(velocity, csarea, halfDensityTimescoefficent, mass) {
    const fdrag = halfDensityTimescoefficent * csarea * velocity * velocity * Math.sign(velocity) // simple formula for drag
    return fdrag / mass // newton's second law
}

function iterate(nInverse, p1_p, p2_p, p1_v, p2_v, g, l1, l2, dragConstantThing) {
    // equations taken from https://www.myphysicslab.com/pendulum/double-pendulum-en.html
    const p1_a = (-g * (2 * m1 + m2) * sin(p1_p)
        - m2 * g * sin(p1_p - 2 * p2_p)
        - 2 * sin(p1_p - p2_p) * m2 * (p2_v * p2_v * l2 + p1_v * p1_v * l1 * cos(p1_p - p2_p)))
        / (l1 * (2 * m1 + m2 - m2 * cos(2 * p1_p - 2 * p2_p)))
        - accelFromDrag(p1_v, m1 ** 3/2, dragConstantThing, m1)
    const p2_a = (2 * sin(p1_p - p2_p) * (p1_v * p1_v * l1 * (m1 + m2) + g * (m1 + m2) * cos(p1_p) + p2_v * p2_v * l2 * m2 * cos(p1_p - p2_p)))
        / (l2 * (2 * m1 + m2 - m2 * cos(2 * p1_p - 2 * p2_p)))
        - accelFromDrag(p2_v, m2 ** 3/2, dragConstantThing, m2)
    p1_v += p1_a / nInverse
    p2_v += p2_a / nInverse
    p1_p += p1_v / nInverse
    p2_p += p2_v / nInverse

    return [p1_p, p2_p, p1_v, p2_v]
}

function toCartesian(p1_p, p2_p, l1, l2) {
    const p1_x = l1 * sin(p1_p)
    const p1_y = l1 * cos(p1_p)
    const p2_x = p1_x + l2 * sin(p2_p)
    const p2_y = p1_y + l2 * cos(p2_p)
    return [p1_x, p1_y, p2_x, p2_y]
}

/*--------------------------------*/
// user interactions
// this section is to be seprated from the other scripts; only interact with DOM or using JSON in hash
if (document.readyState === "complete" || document.readyState === "interactive") {
    initializeUserInteractions()
} else {
    document.addEventListener('DOMContentLoaded', initializeUserInteractions)
}

function initializeUserInteractions() {
    const showHideOption = document.getElementById('showHideOptions')
    const parameterBox = document.getElementById('parameter')
    let optionShown = false
    showHideOption.addEventListener('click', () => {
        if (optionShown) {
            showHideOption.innerText = 'show options'
            parameterBox.style.display = 'none'
        } else {
            showHideOption.innerText = 'hide options'
            parameterBox.style.display = 'block'
        }
        optionShown = !optionShown
    })
    
    const userOptions = {}

    function setParameter(key, value) {
        if (value.length == 0) return
        value = Number(value)
        if (!Number.isFinite(value)) {
            alert('cannot parse entered value; please enter a number')
            return false
        }
        userOptions[key] = value
        return true
    }

    const ELToAttach = ['l1', 'l2', 'm1', 'm2', 'v1', 'v2', 'g']
    for (let i = 0; i < ELToAttach.length; i++) {
        document.getElementById(ELToAttach[i]).addEventListener('click', () => {
            const key = ELToAttach[i]
            const input = prompt(`changing ${key}, enter value`)
            setParameter(key, input)
        })
    }

    function parameterSubmit() {
        const valuesToGet = [
            'pendulumNumber',
            'iterationPerFrame',
            'startingAngle',
            'startingAngleDelta',
            'hslOffsetDeg',
            'displayFrameRate'
        ] // element ID and object key value (must match)
        for (let i = 0; i < valuesToGet.length; i++) {
            setParameter(valuesToGet[i], document.getElementById(valuesToGet[i]).value)
        }

        if (userOptions.pendulumNumber == -1) {
            const input = prompt('enter number of pendulums. more than 20 pendulums will impact animation smoothness on slower machines.')
            if (!setParameter('pendulumNumber', input)) return
        }

        window.location.hash = encodeURIComponent(JSON.stringify(userOptions))
        window.location.reload()
    }

    function hardResetReload() {
        window.location.hash = ''
        window.location.reload()
    }

    document.getElementById('restartSimulation').addEventListener('click', parameterSubmit)
    document.getElementById('hardReset').addEventListener('click', hardResetReload)
}
