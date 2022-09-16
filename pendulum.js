let g = 2 //gravity
let l1 = 1 //length to arm 
let l2 = 1
let m1 = 1 //mass of payload
let m2 = 1

let p1_p = 2 //position all in angles in radians
let p2_p = 2.5
let p1_v = 0 //velocity
let p2_v = 0

const sin = Math.sin
const cos = Math.cos

function iterate(nInverse) {
    // equations taken from https://www.myphysicslab.com/pendulum/double-pendulum-en.html
    const p1_a = (-g * (2 * m1 + m2) * sin(p1_p) 
            - m2 * g * sin(p1_p - 2 * p2_p)
            - 2 * sin(p1_p - p2_p) * m2 * (p2_v * p2_v * l2 + p1_v * p1_v * l1 * cos(p1_p - p2_p)))
         / (l1 * (2 * m1 + m2 - m2 * cos(2 * p1_p - 2 * p2_p)))
    const p2_a = (2 * sin(p1_p - p2_p) * (p1_v * p1_v * l1 * (m1 + m2) + g * (m1 + m2) * cos(p1_p) + p2_v * p2_v * l2 * m2 * cos(p1_p - p2_p)))
         / (l2 * (2 * m1 + m2 - m2 * cos(2 * p1_p - 2 * p2_p)))

    p1_v += p1_a / nInverse
    p2_v += p2_a / nInverse
    p1_p += p1_v / nInverse
    p2_p += p2_v / nInverse
}

function getCoordinates() {
    const p1_x = l1 * sin(p1_p)
    const p1_y = l1 * cos(p1_p)
    const p2_x = p1_x + l2 * sin(p2_p)
    const p2_y = p1_y + l2 * cos(p2_p)
    return [p1_x, p1_y, p2_x, p2_y]
}

/*
function testPhysics(ll) {
    if (ll == 0) return
    console.log(p1_p, p2_p)
    iterate(iterationPerFrame)
    testPhysics(ll - 1)
}

function iterationSpeed(n) {
    const t1 = performance.now()
    for (let i = 0; i < n; i++) iterate(iterationSubdivision)
    console.log('sec/iter', (performance.now() - t1) / n)
    console.log('iter/sec',n / (performance.now() - t1))
    console.log('iter/frm',n / (performance.now() - t1) / 60)
}
*/
