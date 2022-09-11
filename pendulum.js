const iterationPerFrame = 10

let g = 10 //gravity
let l1 = 1 //length to arm 
let l2 = 1
let m1 = 1 //mass of payload
let m2 = 1
let p1_p = 1 //position all in angles in radians
let p2_p = 0
let p1_v = 0 //velocity
let p2_v = 0
let p1_a = 0 //acceleration
let p2_a = 0

const sin = Math.sin
const cos = Math.cos

let ctx

if (document.readyState === "complete") {
    pendinit()
} else {
    document.addEventListener('DOMContentLoaded', pendinit)
}

function pendinit() {
    ctx = document.getElementById('c').getContext('2d')
    // TODO draw the actual pendulums, make scalable?
}

function frameUpdate() {
    function update() {
        // TODO do this
        const p1_x = null
        const p1_y = null
        const p2_x = null
        const p2_y = null
        // TODO draw the pendulums
        // TODO draw a path, maybe multiple pendulums?
        for(let i = 0; i < iterationPerFrame; i++) iterate(iterationPerFrame)
    }
    window.requestAnimationFrame(update)
}

function testPhysics(ll) {
    if (ll == 0) return
    console.log(p1_p, p2_p)
    iterate(iterationPerFrame)
    testPhysics(ll - 1)
}

function iterate(nInverse) {
    // equations taken from https://www.myphysicslab.com/pendulum/double-pendulum-en.html
    p1_a = (-g * (2 * m1 + m2) * sin(p1_p) 
            - m2 * g * sin(p1_p - 2 * p2_p)
            - 2 * sin(p1_p - p2_p) * m2 * (p2_v * p2_v * l2 + p1_v * p1_v * l1 * cos(p1_p - p2_p)))
         / (l1 * (2 * m1 + m2 - m2 * cos(2 * p1_p - 2 * p2_p)))
    p2_a = (2 * sin(p1_p - p2_p) * (p1_v * p1_v * l1 * (m1 + m2) + g * (m1 + m2) * cos(p1_p) + p2_v * p2_v * l2 * m2 * cos(p1_p - p2_p)))
         / (l2 * (2 * m1 + m2 - m2 * cos(2 * p1_p - 2 * p2_p)))

    p1_v += p1_a / nInverse
    p2_v += p2_a / nInverse
    p1_p += p1_v / nInverse
    p2_p += p2_v / nInverse
}