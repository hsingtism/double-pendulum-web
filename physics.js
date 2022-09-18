const sin = Math.sin
const cos = Math.cos

function iterate(nInverse, p1_p, p2_p, p1_v, p2_v, g, l1, l2) {
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

    return [p1_p, p2_p, p1_v, p2_v]
}

function toCartesian(p1_p, p2_p, l1, l2) {
    const p1_x = l1 * sin(p1_p)
    const p1_y = l1 * cos(p1_p)
    const p2_x = p1_x + l2 * sin(p2_p)
    const p2_y = p1_y + l2 * cos(p2_p)
    return [p1_x, p1_y, p2_x, p2_y]
}

function simulationDiscrepancyManager(_angleAMH1, _angleAMH2, _angularVelocity1, _angularVelocity2, _angle1, _angle2, _g, _l1, _l2, _m1, _m2) {
    // energy calculation based on https://en.wikipedia.org/wiki/Double_pendulum#Lagrangian
    const dataLength = _angle1.length
    const momentOfIntertia1 = m1 * l1 * l1
    const momentOfIntertia2 = m2 * l2 * l2

    function centerOfMass(p1_p, p2_p, l1, l2) {
        const p1_x = l1 * sin(p1_p)
        const p1_y = -l1 * cos(p1_p)
        const p2_x = p1_x + l2 * sin(p2_p)
        const p2_y = p1_y - l2 * cos(p2_p)
        return [p1_x, p1_y, p2_x, p2_y]
    }

    let totalEnergy = Array(dataLength).fill(null)
    for (let i = 0; i < dataLength; i++) {
        const cartesianAMH = centerOfMass(_angleAMH1[i], _angleAMH2[i], _l1, _l2)
        const cartesian = centerOfMass(_angle1[i], _angle2[i], _l1, _l2)
        
        const potentialEnergy = g * Math.abs(m1 * cartesian[1] + m2 * cartesian[3])
        const angularKineticEnergy = 0.5 * (
            momentOfIntertia1 * _angularVelocity1[i] * _angularVelocity1[i] 
            + momentOfIntertia2 * _angularVelocity2[i] * _angularVelocity2[i]
        )

        let linearDeltaSquared = []
        for(let j = 0; j < 4; j++) {
            linearDeltaSquared[j] = cartesian[j] - cartesianAMH[j]
            linearDeltaSquared[j] *= linearDeltaSquared[j]
            linearDeltaSquared[j] = Math.sqrt(linearDeltaSquared[j])
            linearDeltaSquared[j] * iterationSubdivision
        }
        const linearKineticEnergy1 = 0.5 * m1 * (linearDeltaSquared[0] + linearDeltaSquared[1])
        const linearKineticEnergy2 = 0.5 * m2 * (linearDeltaSquared[2] + linearDeltaSquared[3])

        totalEnergy[i] = potentialEnergy + angularKineticEnergy + linearKineticEnergy1 + linearKineticEnergy2
    }
    console.log(totalEnergy)
}
