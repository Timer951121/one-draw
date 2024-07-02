export const inch2m = 0.0254, m2ft = 3.28084, ft2m = 0.3048;
export const inch4 = 4 * inch2m, inch6 = 6 * inch2m;


export const defaults = {
    ROOF_FACE_COLOR: 0xffffff,
    ROOF_EDGE_COLOR: 0x000000,
    OBSTRUCTION_COLOR: 0xff0000,
    WALL_COLOR: 0xCCCCCC,
}


function GetRoundNum(val, num) {
    if (!num) num = 0;
    return Math.round(val * Math.pow(10, num)) / Math.pow(10, num);
}

const roundS = 4;

export const moduleInfo = {
    gap: GetRoundNum(inch4, roundS),
    snapDis: GetRoundNum(inch6, roundS),
    space: GetRoundNum(1 * inch2m, roundS)
};
