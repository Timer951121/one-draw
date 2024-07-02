import * as THREE from "three";
import {getRoofModuleMeshes, GetRoundNum} from "./Common";
import { GetModuleMap, norModuleCol, selModuleCol, SetShadeMeshOnModule} from "./ModuleControl";
import {useViewerStore} from "../../../store/store";
import {ft2m} from "../Constants/Default";
import {CalculateEPC} from "./EPCControl";
import {getPathnameIncludes} from "../../../helpers/getPathname";
import { LoadingContext } from "../../../store/loadingMessageStore";
import sleep from "../../../helpers/sleep";
import { SHADE_CALCULATIONS, siteCalculationState } from "../../../services/siteCalculationState";

const shadeUnit = 0.889;
const shadeGeo = new THREE.SphereGeometry(0.05, 32, 32),
    shadeMat = new THREE.MeshStandardMaterial({color: 0x0000ff});
export const shadeMesh = new THREE.Mesh(shadeGeo, shadeMat);

export function CheckInsidePos(polygon, pos, axis = 'z') {
    const {x} = pos, zVal = pos[axis];
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const zi = polygon[i][axis];
        const xj = polygon[j].x;
        const zj = polygon[j][axis];
        const intersect = ((zi > zVal) !== (zj > zVal)) && (x < (xj - xi) * (zVal - zi) / (zj - zi) + xi)
        if (intersect) inside = !inside
    }
    return inside;
}

function GetInPos(lastPos2D, pos2DArr, x, z, maxX, minX, maxZ, minZ) {
    const inPos = {x: x - lastPos2D.x, z: z - lastPos2D.z};
    inPos.xn = Math.round(inPos.x / shadeUnit);
    inPos.zn = Math.round(inPos.z / shadeUnit);
    inPos.flag = (z !== minZ && z !== maxZ && x !== minX && x !== maxX) && CheckInsidePos(pos2DArr, {x, z});
    return inPos;
}

function GetInPos2DArr(pos2DArr, posSize, rotX) {
    const inPos2DArr = [], {maxX, minX, maxZ, minZ} = posSize, lastPos2D = pos2DArr[pos2DArr.length - 1];
    if (rotX > 0) {
        for (let z = minZ; z <= maxZ; z += shadeUnit) {
            for (let x = maxX; x >= minX; x -= shadeUnit) {
                const inPos = GetInPos(lastPos2D, pos2DArr, x, z, maxX, minX, maxZ, minZ);
                inPos2DArr.push(inPos);
            }
        }
    } else {
        for (let z = minZ; z <= maxZ; z += shadeUnit) {
            for (let x = maxX; x >= minX; x -= shadeUnit) {
                const inPos = GetInPos(lastPos2D, pos2DArr, x, z, maxX, minX, maxZ, minZ);
                inPos2DArr.push(inPos);
            }
        }
    }
    return inPos2DArr;
}
export function GetSizePos(pos2DArr) {
    const maxX = Math.max(...pos2DArr.map(o => o.x)),
        minX = Math.min(...pos2DArr.map(o => o.x)),
        maxZ = Math.max(...pos2DArr.map(o => o.z)),
        minZ = Math.min(...pos2DArr.map(o => o.z));
    return {maxX, minX, maxZ, minZ};
}

export function AddShadeMesh(shapeMesh, pos2DArr, holeArr, rotX) { // , holeBufferArr
    for (let i = shapeMesh.children.length - 1; i >= 0; i--) {
        const child = shapeMesh.children[i];
        if (child.shadePoint) shapeMesh.remove(child);
    }
    const posSize = GetSizePos(pos2DArr);
    const inPos2DArr = GetInPos2DArr(pos2DArr, posSize, rotX);
    inPos2DArr.filter(item => {
        return item.flag
    }).forEach(inPos => {
        const cloneShade = shadeMesh.clone();
        cloneShade.position.set(inPos.x, inPos.z, 0);
        cloneShade.material = new THREE.MeshStandardMaterial({color: 0x0000ff});
        cloneShade.shadePoint = true;
        shapeMesh.add(cloneShade);
    });
    const {maxX, minX, maxZ, minZ} = posSize;

    shadeMesh.name="shadePoint"
    shapeMesh.pos2DArr = pos2DArr;
    shapeMesh.holeArr = holeArr;
    // shapeMesh.holeBufferArr = holeBufferArr;
    shapeMesh.inPos2DArr = inPos2DArr;
    shapeMesh.inPosSize = {minX, minZ, maxX, maxZ, w: maxX - minX, h: maxZ - minZ};
}

export function AddShadePosArr(face, shapeMesh) {
    const shadePosArr = [], inPosArr = [];
    shapeMesh.children.forEach(item => {
        if (!item.shadePoint) return;
        item.visible = false;
        const posGlobal = item.getWorldPosition(new THREE.Vector3());
        shadePosArr.push(posGlobal);
        const {x, y, z} = item.position;
        inPosArr.push({x, y: z, z: y});
    });

    face.shadePosArr = shadePosArr;
    face.pos2DArr = shapeMesh.pos2DArr;
    face.holeArr = shapeMesh.holeArr;
    face.inPos2DArr = inPosArr;
}

function SetRayPosInfo(modelGroup) {
    modelGroup.rayPosInfo = true;
    modelGroup.traverse(child => {
        if (!child.worldPos || !child.isMesh) return;
        if (child.meshType === 'obst') {
            const {verPosArr, height} = child;
            var minZ = Infinity, maxZ = -Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
            verPosArr.forEach(verPos => {
                const {x, y, z} = verPos;
                if (x < minX) minX = x; if (x > maxX) maxX = x;
                if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
                if (y + height/2 > maxY) maxY = y + height/2;
            });
            child.rayPosInfo = {minZ, maxZ, maxY, minX, maxX};
        } else if (child.meshType === 'tree') {
            if (!child.incrossArr) child.incrossArr = [];
            const {scale, parent} = child, {x, y, z} = parent.position, treeWidth = scale.x;
            child.rayPosInfo = {maxZ:z+treeWidth, maxY:y+scale.y, minX:x-treeWidth, maxX:x+treeWidth };
        } else if (child.meshType === 'roof' || child.roofFaceId) {
            const {min, max} = new THREE.Box3(new THREE.Vector3()).setFromObject(child);
            child.rayPosInfo = {maxZ:max.z, maxY:max.y, minX:min.x, maxX:max.x };
        }
    })
}

export async function GenShadeOnFace(faces, self) {
    const {roofMeshArr, sunVecArr, modelGroup} = self;
    const loadingContext = new LoadingContext();
    loadingContext.setMessage({ title: 'Calculating Shade...' });

    const irradianceMonth = self.irradianceMonth || useViewerStore.getState().irradianceMonth;// for removing redundant irradiancemonth
    const weights = irradianceMonth;
    for (const face of faces) {

        const roofIdx = roofMeshArr.findIndex(r => r.roofFaceId === face.roofFaceId);
        loadingContext.setMessage({ title: 'Calculating Shade...', message: `Calculating for Roof ${roofIdx + 1}...` });

        // yield thread
        await sleep(0);

        const {roofFaceId, shadePosArr} = face;

        const realMeshArr = [], ptHashArr = [];

        const faceMesh = roofMeshArr.find(item=> item.roofFaceId===roofFaceId);
        var fMinX = Infinity, fMaxX = -Infinity, fMinY = Infinity, fMinZ = Infinity, fMaxZ = -Infinity;
        if(faceMesh && faceMesh.posArr){
            faceMesh.posArr?.forEach(pos => {
                const {x, y, z} = pos;
                if (x < fMinX) {fMinX = x;} if (x > fMaxX) {fMaxX = x;}
                if (y < fMinY) {fMinY = y;}
                if (z < fMinZ) {fMinZ = z;} if (z > fMaxZ) {fMaxZ = z;}
            });
        }
        if (!modelGroup.rayPosInfo) SetRayPosInfo(modelGroup);

        modelGroup.traverse(child => {
            if (!child.worldPos || !child.isMesh) return;
            if (!child.rayPosInfo || child.roofFaceId === roofFaceId) return;
            const {maxY, maxZ} = child.rayPosInfo;
            if (maxY < fMinY || maxZ < fMinZ) {return;}
            if (child.meshType === 'obst') {
                if (child.delStatus) return;
            } else if (child.meshType === 'tree') {
                if (child.parent.delStatus) return;
            }
            realMeshArr.push(child);
        })

        const faceAccess = [];
        for (let i = 0; i < 13; i++) {
            faceAccess[i] = 0;
        }

        const days = [5, 20];

        if (!shadePosArr) continue;
        const shadeMeshArr = faceMesh.children.filter(item => {
            return item.shadePoint
        });

        // let str = '';
        shadePosArr.forEach((pt, ptIdx) => {
            const posTarget = new THREE.Vector3(pt.x, pt.y, pt.z);
            // const ptRealArr = realMeshArr.filter(item=> item.rayPosInfo.maxZ > pt.z),
            // const ptNorthArr = [], ptEastArr = [], ptWestArr = [];
            // realMeshArr.forEach(mesh => {
            //     const {minX, maxX, maxZ} = mesh.rayPosInfo;
            //     if (maxZ < pt.z) return; // To avoid obstructions in north side?
            //     // if (minZ < pt.z) ptNorthArr.push(mesh);// To consider obstructions in north side
            //     if (maxX < pt.x) ptWestArr.push(mesh); // To consider obstructions in west side after noon
            //     if (minX > pt.x) ptEastArr.push(mesh); // To consider obstructions in east side before noon
            // });

            const access = [];
            for (let i = 0; i < 13; i++) {
                access[i] = 1;
            }

            sunVecArr.forEach((monthData, monthIdx) => {
                return;
                days.forEach((day) => {
                    monthData[day].forEach((vec, hourIdx) => {
                        if (vec.y < 0) return;
                        var rayMeshArr = realMeshArr;
                        // if (vec.z < pt.z) rayMeshArr = ptNorthArr
                        // if (hourIdx < 10) rayMeshArr = ptEastArr;
                        // else if (hourIdx > 14) rayMeshArr = ptWestArr;
                        // if (hourIdx < 8 || hourIdx > 18) { rayMeshArr = [...rayMeshArr, ...ptNorthArr]; }
                        if (weights[monthIdx][hourIdx].annual === 0 || weights[monthIdx][hourIdx].monthly === 0) return;
                        const posStart = new THREE.Vector3(vec.x, vec.y, vec.z);

                        const sunLineVec = new THREE.Vector3();
                        sunLineVec.subVectors(posTarget, posStart);
                        sunLineVec.normalize();
                        const raycaster = new THREE.Raycaster();
                        raycaster.set(posStart, sunLineVec);
                        const rayIntersects = raycaster.intersectObjects(rayMeshArr, false); // realMeshArr

                        var flagCross = false;
                        if (rayIntersects[0] && rayIntersects[0].object) {
                            const {point} = rayIntersects[0];
                            if (pt.x < vec.x) {
                                if (point.x > pt.x && point.x < vec.x) flagCross = true;
                            } else {
                                if (point.x < pt.x && point.x > vec.x) flagCross = true;
                            }
                        }

                        // if ( roofIdx === 3 && ptIdx === 0 ){
                        //     str += `month= ${monthIdx + 1} \n`;
                        //     str += `day= ${day + 1} \n`;
                        //     str += `hour= ${hourIdx + 1} \n`;
                        //     str += `minus value= ${weights[monthIdx][hourIdx].annual / days.length} \n`;
                        //     str += `access[0]= ${access[0]}\n`;
                        //     str += '\n';

                        //     if (monthIdx === 0 && day === 5){
                        //         const material = new THREE.LineBasicMaterial( { color: flagCross ? 0xff0000 :  0x0000ff } );
                        //         const geometry = new THREE.BufferGeometry().setFromPoints( [posTarget, posStart] );
                        //         const line = new THREE.Line( geometry, material );
                        //         self.scene.add( line );
                        //     }
                        // }

                        if (flagCross) {
                            access[0] -= weights[monthIdx][hourIdx].annual / days.length;
                            access[monthIdx + 1] -= weights[monthIdx][hourIdx].monthly / days.length;

                            const intObj = rayIntersects[0].object;
                            if (intObj.meshType === 'tree') {
                                const existingIndex = intObj.incrossArr.findIndex(item =>
                                    item.roofFaceId === roofFaceId &&
                                    item.ptIdx === ptIdx &&
                                    item.monthIdx === monthIdx &&
                                    item.day === day &&
                                    item.hourIdx === hourIdx
                                );
                                if (existingIndex === -1) {
                                    intObj.incrossArr.push({ roofFaceId, ptIdx, monthIdx, day, hourIdx });
                                }
                            }
                        }
                    });
                });
            });

            access.forEach((month, idx) => {
                if (idx ===0) return;
                faceAccess[idx] += month
            });
            const ptHashVal = Math.round(access[0] * 100);
            shadeMeshArr[ptIdx].ptHashVal = ptHashVal;
            shadeMeshArr[ptIdx].monthArr = access;
            const {position} = faceMesh.children[ptIdx];
            const selPos2DItem = faceMesh.inPos2DArr.find(item => item.x === position.x && item.z === position.y)
            if (selPos2DItem) {
                selPos2DItem.value = ptHashVal;
            }
            ptHashArr.push(ptHashVal);
        });

        // if (str != '') console.log(str);
        // let newShade = [];
        // shadeMeshArr.forEach((shdMesh)=>{
        //     let val = {};
        //     val.ptHashVal = shdMesh.ptHashVal;
        //     val.access = shdMesh.monthArr[0];
        //     newShade.push(shdMesh.ptHashVal);
        // });
        // console.log(`shadeMeshArr- RoofId:${face.roofId}:`, shadeMeshArr.map(shdMesh=> shdMesh.ptHashVal));

        face.ptHashArr = ptHashArr;
        var totalPhHashVal = 0;
        ptHashArr.forEach(item => {
            totalPhHashVal += item;
        });

        if (ptHashArr.length) {
            face.ptHashAverage = faceMesh.ptHashAverage = totalPhHashVal / ptHashArr.length;
        } else {
            face.ptHashAverage = faceMesh.ptHashAverage = 0;
        }

        const avrAccess = [];
        faceAccess.forEach((item, idx) => {
            if (idx === 0) return;
            const shadeCount = face.shadePosArr.length, avrAccessVal = shadeCount ? item / shadeCount : 0;
            avrAccess.push(avrAccessVal);
        });
        face.ptHashMonth = avrAccess;
    }

    modelGroup.traverse(child => {
        if (child.roofFaceId){
            const face = self.roofs[0].faces.find(face => face.roofFaceId === child.roofFaceId);
            if (face) child.ptHashArr = face.ptHashArr
        }
    });

    SetShadeDisplayEffect(modelGroup);
    modelGroup.rayPosInfo = false;
    CalculateEPC(modelGroup);

    SetShadeFinalResult(self);

    loadingContext.dispose();
}

export function GetDifferArr(ptValArr) {
    const differArr = [];
    ptValArr.forEach(ptHashVal => {
        if (!differArr.includes(ptHashVal)) differArr.push(ptHashVal);
    });
    return differArr.sort();
}

export function SetShadeFinalResult(self) {
    var totalArea = 0, modeTotalArea = 0;
    const totalSolarArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const irrMonthTotal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const modeTotalSolarArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const modeIrrMonthTotal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var modeTotalPtVal = 0, shadeCount = 0;

    const {roofs, roofMeshArr, modelGroup} = self;
    const faces = roofs[0].faces;
    SetShadeMeshOnModule(roofMeshArr);
    const irradianceMonth = self.irradianceMonth || useViewerStore.getState().irradianceMonth;// for removing redundant irradiancemonth
    faces.forEach((face) => {
        const selRoofMesh = roofMeshArr.find(item => {
            return item.roofFaceId === face.roofFaceId
        });
        if (selRoofMesh.disableModule) return;
        const {size, ptHashMonth} = face;
        totalArea += size;
        if(!ptHashMonth) return;
        ptHashMonth.forEach((monthVal, monthIdx) => {
            totalSolarArr[monthIdx] += monthVal * size
        });

        var modeSize = 0;
        const modeArr = selRoofMesh.children.filter(item=>{return item.module===true});
        modeArr.forEach(mode => { modeSize += (mode.selSize.w * mode.selSize.h / (ft2m * ft2m) ) });
        modeTotalArea += modeSize;

        irradianceMonth.forEach((month, monthIdx) => {
            month.forEach(hour => {
                irrMonthTotal[monthIdx] += hour.monthly * size;
                modeIrrMonthTotal[monthIdx] += hour.monthly * modeSize;
            });
        });

        const modePtHashMonth = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const shadeArr = selRoofMesh.children.filter(item=>{return item.shadePoint===true && item.onModule===true});
        shadeArr.forEach(shade => {
            if(!shade.monthArr) return;
            shade.monthArr.forEach((monthVal, monthIdx) => {
                if (monthIdx===0) modeTotalPtVal += monthVal;
                else modePtHashMonth[monthIdx - 1] += monthVal/shadeArr.length;
            });
        });
        modePtHashMonth.forEach((monthVal, monthIdx) => {
            modeTotalSolarArr[monthIdx] += monthVal * modeSize;
        });
        shadeCount += shadeArr.length;
    });

    var totalSolar = 0, modeTotalSolar = 0;
    const avrSolarArr = [], avrIrradiance = [], modeAvrSolarArr = [], modeAvrIrradiance = [];
    totalSolarArr.forEach(monthVal => {
        avrSolarArr.push(Math.round(monthVal / totalArea * 100) / 100);
        totalSolar += monthVal;
    });
    irrMonthTotal.forEach(monthVal => {
        avrIrradiance.push(Math.round(monthVal / totalArea * 100) / 100);
    });

    modeTotalSolarArr.forEach(monthVal => {
        modeAvrSolarArr.push(GetRoundNum(monthVal / modeTotalArea, 2));
        modeTotalSolar += monthVal;
    });
    modeIrrMonthTotal.forEach(monthVal => {
        modeAvrIrradiance.push(GetRoundNum(monthVal / modeTotalArea, 2));
    });

    const faceData = faces.map(f => ({
        roofFaceId: f.roofFaceId,
        size: f.size,
        ptHashAverage: f.ptHashAverage,
        ...f.oriAng,
    }));
    useViewerStore.setState({localFacePtHash: faceData});

    modelGroup.children[0].traverse(child => {
        if (child.roofFaceId === undefined || child.disableModule) return;
        child.oriAng = faces.find(f => f.roofFaceId === child.roofFaceId).oriAng;
    });

    let avrIrradianceCentPercent = avrIrradiance.map((val) => { return val * 100 })
    let avrSolarArrCentPercent = avrSolarArr.map((val) => { return val * 100 })

    const modeAvrSolarCentPercent = modeAvrSolarArr.map((val) => { return val * 100 });
    const modeAvrIrrCentPercent = modeAvrIrradiance.map((val) => { return val * 100 });

    useViewerStore.setState({
        roofCircleSolar: Math.round(totalSolar / (totalArea * 12) * 100),
        roofChartSolar: avrSolarArrCentPercent,
        roofChartIrr: avrIrradianceCentPercent,
        modeCircleSolar: Math.round(modeTotalSolar / (modeTotalArea * 12) * 100),
        modeChartSolar: modeAvrSolarCentPercent,
        modeChartIrr: modeAvrIrrCentPercent,
    });
}

export function GetShadeCol(val, rgb) {
    if      (val >= 95) return rgb ? '#FFFF00' : 0xFFFF00;
    else if (val >= 90) return rgb ? '#FFEB00' : 0xFFEB00;
    else if (val >= 85) return rgb ? '#FFD600' : 0xFFD600;
    else if (val >= 80) return rgb ? '#FFC200' : 0xFFC200;
    else if (val >= 75) return rgb ? '#FFA300' : 0xFFA300;
    else if (val >= 70) return rgb ? '#FF8F00' : 0xFF8F00;
    else if (val >= 65) return rgb ? '#FF7000' : 0xFF7000;
    else if (val >= 60) return rgb ? '#FF5C00' : 0xFF5C00;
    else if (val >= 55) return rgb ? '#FF4700' : 0xFF4700;
    else if (val >= 50) return rgb ? '#FF3300' : 0xFF3300;
    // else if (val >= 45) return rgb ? '#FF0000' : 0xFF0000;
    else                return rgb ? '#B3B3B3' : 0xB3B3B3;
}

export function SetDisplayShadePoints(self, shadeType) {
    const {roofs, modelGroup, roofMeshArr} = self;
    if (!roofs || !roofs[0] || !roofs[0].faces || !roofs[0].faces.length) return;
    modelGroup.irrType = GetShadePathname(shadeType);
    if (modelGroup.irrType) {
        const activeRoofMeshArr = roofMeshArr.filter(item => !item.disableModule);
        modelGroup.totalShadeCount = activeRoofMeshArr.length;
        siteCalculationState.useCalculations(SHADE_CALCULATIONS);
    }

    SetShadeDisplayEffect(modelGroup);
}

export function SetShadeDisplayEffect(modelGroup, showShadePoint) {
    const moduleSolarAccess = useViewerStore.getState().moduleSolarAccess;

    modelGroup.traverse(child => {
        if (child.roofFaceId) {
            const {ptHashArr} = child;
            const color = child.oriColor;
            const map = child.oriMap;

            child.material.color.setHex(color);
            child.material.map = map;
            child.material.needsUpdate = true;

            const shadeArr = child.children.filter(item => item.shadePoint);
            shadeArr.forEach((shade, idx) => {
                if (shade.visible) {
                    const shadeCol = GetShadeCol(ptHashArr[idx]);
                    shade.material.color.setHex(shadeCol);
                    shade.material.needsUpdate = true;
                }
            });

            const moduleArr = getRoofModuleMeshes(child);
            moduleArr.forEach(module => {
                if (moduleSolarAccess) {
                    SetModuleAsColored(module, module.irrColor);
                } else {
                    SetModuleAsTextured(module);
                }
            });
        }
    })
}

export function SetModuleAsTextured(module) {
    const showCol = module.select ? selModuleCol : norModuleCol;
    module.material.color.setHex(showCol);
    module.material.map = GetModuleMap(module.dir);
    module.material.needsUpdate = true;
}

export function SetModuleAsColored(module, color) {
    const showCol = module.select ? selModuleCol : color;
    module.material.color.setHex(showCol);
    module.material.map = undefined;
    module.material.needsUpdate = true;
}

function GetShadePathname(shadeType) {
    if (shadeType==='module') return 'module';
    else if (getPathnameIncludes('solar-access')) return 'point';
    else if (getPathnameIncludes('irradiance')) return 'irradiance'; // || pathname.includes('module')
    else if (getPathnameIncludes('module')) return 'module';
    else if (getPathnameIncludes('what-if') && shadeType === 'whatif') return 'irradiance';
    else if (getPathnameIncludes('price-calculation')) return 'irradiance';
    else if (shadeType === 'init') return 'init';
    else return null;
}

export function RefreshShade(self, display, shadeType) {
    siteCalculationState.needsUpdate(SHADE_CALCULATIONS);

    self.modelGroup.traverse(child => {
        if (child.worldPos && child.meshType === 'tree') {
            child.incrossArr = [];
        }
    })

    if (display) SetDisplayShadePoints(self, shadeType);
    siteCalculationState.useCalculations(SHADE_CALCULATIONS);
}
