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

const pendulumNumber     = parsedHash.pendulumNumber ?? 3
const iterationPerFrame  = parsedHash.iterationPerFrame || 1000 // iterationPerFrame/iterationSubdivision*60 = simulation times real time
const startingAngle      = parsedHash.startingAngle ?? 2
const startingAngleDelta = parsedHash.startingAngleDelta ?? 0.005
const hslOffsetDeg       = parsedHash.hslOffsetDeg ?? 30
const displayFrameRate   = parsedHash.displayFrameRate ?? true

// these environment variables can be changed mid-simulation
let l1 = parsedHash.l1 ?? 1 //length to arm 
let l2 = parsedHash.l2 ?? 1
let m1 = parsedHash.m1 ?? 1 //mass of payload
let m2 = parsedHash.m2 ?? 1
const startingVelocity1  = parsedHash.startingVelocity1 ?? 0
const startingVelocity2  = parsedHash.startingVelocity2 ?? 0
let g = parsedHash.g ?? 1 //gravity

/*--------------------------------*/
// animations and stuff
const simulationSpeedInverse = 20 //don't let the user touch this, let them change the environment parameters
const lineWidth = 4
const relativeCircleSize = 0.04

const canvasSize = 1000
const trailColorDecayOverlay = '#00000004' //black plus alpha. the more opaque the faster the trail decay

const dragConstantThing = 0 // not used, set to 0
const iterationSubdivision = iterationPerFrame * simulationSpeedInverse
let canvasMidpoint, circleConstant, trailCtx, displayTrails, flushExportStats
const pi = Math.PI; const tau = pi * 2

let pendulumCount = 0
let p1 = []
let p2 = []
let v1 = []
let v2 = []
let colors = []

if (document.readyState === "complete" || document.readyState === "interactive") {
    init()
    initializeUserInteractions()
} else {
    document.addEventListener('DOMContentLoaded', init)
    document.addEventListener('DOMContentLoaded', initializeUserInteractions)
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
    
    displayTrails = true
    canvasMidpoint = 0.5 * canvasSize
    circleConstant = relativeCircleSize * canvasSize

    for (let i = 0; i < pendulumNumber; i++) {
        createPendulum(startingAngle, startingAngle + startingAngleDelta * i, startingVelocity1, startingVelocity2, generateColor(pendulumNumber, i))
    }

    animate()
    initializeStatTable()
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
    initialEnergy.push(gravitionalPotentialEnergy(m1, toCartesian(_p1, _p2, l1, l2)[1], m2, toCartesian(_p1, _p2, l1, l2)[3], g)
        + kineticEnergy(m1, _p1, l1, _v1, m2, _p2, l2, _v2)
    )
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
            
            if(flushExportStats) centerOfMassP[i] = [simulationCoordinates[0] * m1 * 0.5 + simulationCoordinates[2] * m2 * 0.5, simulationCoordinates[1] * m1 * 0.5 + simulationCoordinates[3] * m2 * 0.5]
        }

        if (displayFrameRate) performanceDisplay.innerText = `frame: ${(performance.now() - t1).toFixed(4)}ms`
        if(flushExportStats) displayStat()
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
    if(!toggleTrails) return;
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

// function accelFromDrag(velocity, csarea, halfDensityTimescoefficent, mass) {
//     const fdrag = halfDensityTimescoefficent * csarea * velocity * velocity * Math.sign(velocity) 
//     return fdrag / mass 
// }

function iterate(nInverse, p1_p, p2_p, p1_v, p2_v, g, l1, l2, dragConstantThing) {
    // equations taken from https://www.myphysicslab.com/pendulum/double-pendulum-en.html
    const p1_a = (-g * (2 * m1 + m2) * sin(p1_p)
        - m2 * g * sin(p1_p - 2 * p2_p)
        - 2 * sin(p1_p - p2_p) * m2 * (p2_v * p2_v * l2 + p1_v * p1_v * l1 * cos(p1_p - p2_p)))
        / (l1 * (2 * m1 + m2 - m2 * cos(2 * p1_p - 2 * p2_p)))
        // - accelFromDrag(p1_v, m1 ** 3/2, dragConstantThing, m1)
    const p2_a = (2 * sin(p1_p - p2_p) * (p1_v * p1_v * l1 * (m1 + m2) + g * (m1 + m2) * cos(p1_p) + p2_v * p2_v * l2 * m2 * cos(p1_p - p2_p)))
        / (l2 * (2 * m1 + m2 - m2 * cos(2 * p1_p - 2 * p2_p)))
        // - accelFromDrag(p2_v, m2 ** 3/2, dragConstantThing, m2)
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

// auxiliary physics functions
function kineticEnergy(m1, p1, l1, v1, m2, p2, l2, v2) {
    // https://scienceworld.wolfram.com/physics/DoublePendulum.html
    return 0.5 * m1 * l1 * l1 * v1 * v1 
        + 0.5 * m2 * (l1 * l1 * v1 * v1 + l2 * l2 * v2 * v2 + 2 * l1 * l2 * v1 * v2 * cos(p1 - p2))
}

function gravitionalPotentialEnergy(m1, x1, m2, x2, g) {
    // stright forward Ug = mgh
    const _1 = m1 * x1
    const _2 = m2 * x2 
    return (_1 + _2) * -g 
}

/*--------------------------------*/
// user interactions
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

    // Start of auxiliary options
    const toggleTrailsBtn = document.getElementById('toggleTrails')
    toggleTrailsBtn.addEventListener('click', () => {
        clear(trailCtx)
        toggleTrailsBtn.innerText = (toggleTrails ? 'show' : 'hide') + ' trails'
        toggleTrails = !toggleTrails
    })

    const toggleStatBtn = document.getElementById('toggleNerd')
    const statsDiv = document.getElementById('auxDisplay')
    toggleStatBtn.addEventListener('click', () => {
        statsDiv.style.display = flushExportStats ? 'none' : 'block'
        flushExportStats = !flushExportStats
    })
}

/*--------------------------------*/
// data table
const displayStatFormat = n => isNaN(n) ? '****' : n.toFixed(18).substring(0, 18)
const generateID = (pendulumID, referenceDiscriminant, dataField) => 'sf-' + pendulumID.toString(16) + referenceDiscriminant + dataField
const dataFieldsCache = {fields: []}
function initializeStatTable() {
    const physDataTable = document.getElementById('dataTable')

    const tempIDtable = ['sf-g', 'sf-iter', 'sf-fram', 'sf-l1', 'sf-m1', 'sf-l2', 'sf-m2']
    dataFieldsCache.environmentSize = tempIDtable.length
    
    const dataFields = ['pendID', 'discrimant', 'theta', 'omega', 'Ug', 'KE', 'ME', 'DeltaE']
    dataFieldsCache.dataFieldSize = dataFields.length
    
    const referenceDiscriminants = ['inner', 'outer', 'total']
    dataFieldsCache.discrimiantSize = referenceDiscriminants.length
    
    let feedstring = '<tr><td>acceleration from gravity</td><td id="sf-g"></td><td>total iterations (per pendulum)</td><td id="sf-iter"></td><td>frames since start</td><td id="sf-fram"></td></tr><tr><td>inner arm length</td><td id="sf-l1"></td><td>inner bob mass</td><td id="sf-m1"></td></tr><tr><td>outer arm length</td><td id="sf-l2"></td><td>outer bob mass</td><td id="sf-m2"></td></tr><tr><td>pendulum ID</td><td></td><td>angular position</td><td>angular velocity</td><td>gravitional <br>potential energy</td><td>kinetic energy</td><td>&Sigma; mechanical energy</td><td>energy created or destroyed <br>(actual energy / expected energy)&dagger;</td></tr>'
    for(let i = 0; i < pendulumCount; i++) {
        for(let j = 0; j < referenceDiscriminants.length; j++) {
            feedstring += '<tr>'
            for (let k = 0; k < dataFields.length; k++) {
                const id = generateID(i, referenceDiscriminants[j], dataFields[k])
                tempIDtable.push(id)
                feedstring += `<td id="${id}">`
            }
            feedstring += '</tr>'
        }
    }
    physDataTable.innerHTML += feedstring
    // await sleep(0)

    for(let i = 0; i < tempIDtable.length; i++) {
        dataFieldsCache.fields.push(document.getElementById(tempIDtable[i]))
    }
}

const centerOfMassP = []
const initialEnergy = []
function dataFieldWrite(fieldIndex, content, bypassFormatting) {
    dataFieldsCache.fields[fieldIndex].innerText = bypassFormatting ? content : displayStatFormat(content)
}

function displayStat() {
    dataFieldWrite(0, g)    
    dataFieldWrite(1, frameCount * iterationPerFrame)    
    dataFieldWrite(2, frameCount)    
    dataFieldWrite(3, l1)    
    dataFieldWrite(4, m1)    
    dataFieldWrite(5, l2)    
    dataFieldWrite(6, m2)
    let workingI = dataFieldsCache.environmentSize
    for(let i = 0; i < pendulumCount; i++) {
        const Ug = gravitionalPotentialEnergy(m1 + m2, centerOfMassP[i][1], 0, 0, g)
        const KE = kineticEnergy(m1, p1[i], l1, v1[i], m2, p2[i], l2, v2[i])
        const UgCorrection = centerOfMassP[i][1] * (m1 + m2) * -g

        dataFieldWrite(workingI + 0, i, true)
        dataFieldWrite(workingI + 1, 'inner bob', true)
        dataFieldWrite(workingI + 2, p1[i])
        dataFieldWrite(workingI + 3, v1[i])
        dataFieldWrite(workingI + 9, 'outer bob', true)
        dataFieldWrite(workingI + 10, p2[i])
        dataFieldWrite(workingI + 11, v2[i])
        dataFieldWrite(workingI + 17, 'center of mass', true)
        dataFieldWrite(workingI + 20, Ug)
        dataFieldWrite(workingI + 21, KE)
        dataFieldWrite(workingI + 22, Ug + KE)
        dataFieldWrite(workingI + 23, (Ug + KE - UgCorrection) / (initialEnergy[i] - UgCorrection))

        workingI += dataFieldsCache.dataFieldSize * dataFieldsCache.discrimiantSize
    }

}

