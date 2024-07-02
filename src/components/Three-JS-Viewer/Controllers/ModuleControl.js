import * as THREE from "three";

import {useViewerStore} from "../../../store/store";
import {
    CheckInsidePos,
    GetShadeCol,
    SetModuleAsColored,
    SetModuleAsTextured,
    SetShadeDisplayEffect
} from "./RefreshShade";
import {inch2m, inch4, moduleInfo} from "../Constants/Default";
import {GetIdStr, GetShapePosArr, testMesh} from "./Loader";
import {GetClickObj, GetDegVal, GetDis, GetMousePos, GetRoundNum, getRoofModuleCount, getRoofModuleMeshes, random} from "./Common";
import imgModulePort from '../../../assets/img/module/port.png';
import imgModuleLand from '../../../assets/img/module/land.jpg';
import {AddPathwayMesh, SetPathwayActiveModule, UpdateSetbackDepth} from "./PathwayControl";
import {AddStep} from "./StepControl";
import {getAccessMultiplier, getIdealMultiplier} from "../../../services/MultiplierService";
import {SetObstVPos} from "./ObstructionControl";
import sleep from "../../../helpers/sleep";
import { ACCESS_MULTIPLIERS, MODULE_GRAPH, SHADE_CALCULATIONS, siteCalculationState } from "../../../services/siteCalculationState";
import { logger } from "../../../services/loggingService";
import { DoesIntersectOBB, SetMeshOBB, UpdateMeshOBB, UpdateWallMeshOBB } from "./MeshControl";
import { createLabel, getMultiplierLabelPrefix } from "./EPCControl";

const {gap, snapDis, space} = moduleInfo;

const moduleMapPort = new THREE.TextureLoader().load(imgModulePort);
const moduleMapLand = new THREE.TextureLoader().load(imgModuleLand);

export const selModuleCol = 0x00FF00, norModuleCol = 0xFFFFFF, errModuleCol = 0xFF0000, addModuleCol = 0x0000FF,
    timeModuleDelay = 300;

export function GetModuleMap(dir) {
    return dir === 'port' ? moduleMapPort : moduleMapLand;
}

export const ModulePlacementStatusOk = '';
export const ModulePlacementStatusRoofShape = 'roofShape';
export const ModulePlacementStatusModule = 'module';
export const ModulePlacementStatusSetback = 'setback';
export const ModulePlacementStatusPathway = 'pathway';
export const ModulePlacementStatusObstruction = 'obstruction';
export const ModulePlacementStatusWall = 'wall';

function GetSetPathArr(roofGroup, roofId) {
    const pathwayArr = [], setbackArr = [];
    roofGroup.traverse(child => {
        if (child.pathWayRoofId === roofId) {
            const {meshType, pathwayPosArr, pathwayId, pathActive} = child;
            if (meshType === 'pathway') pathwayArr.push({type: meshType, posArr: pathwayPosArr, pathwayId, pathActive});
            else if (meshType === 'setback') setbackArr.push({type: meshType, posArr: pathwayPosArr});
        }
    })
    return {pathwayArr, setbackArr};
}

export function SetPreModuleArr(self) {
    const {roofMeshArr, obstGroup} = self;
    const {faces} = self.roofs[0];

    const selSize = useViewerStore.getState().activeModule;

    moduleMapPort.anisotropy = self.renderer.capabilities.getMaxAnisotropy();
    moduleMapLand.anisotropy = self.renderer.capabilities.getMaxAnisotropy();

    const buildingArr = [];

    roofMeshArr.forEach(roofMesh => {
        roofMesh.obstArr = [];
        for (let i = roofMesh.children.length - 1; i >= 0; i--) {
            const childMesh = roofMesh.children[i];
            if (childMesh.module) {
                const meshIdx = self.meshArr.findIndex(item => {
                    return item.moduleId === childMesh.moduleId
                });
                self.meshArr.splice(meshIdx, 1); // shift
                roofMesh.remove(childMesh);
            }
        }
        const {sizeM} = roofMesh, {buildingName} = roofMesh.userData;
        var existBuilding = false;
        buildingArr.forEach(item => {
            if (item.name === buildingName) {
                existBuilding = true;
                item.size += sizeM;
                item.sizeSqFt += sizeM * 10.7639;
            }
        });
        if (!existBuilding) {
            buildingArr.push({name: buildingName, size: sizeM , sizeSqFt : sizeM * 10.7639});
        }
    });

    buildingArr.forEach(building => {

        //Add extra 1 inch to the module width and height
        const correctedModuleWidth = selSize.w + 0.0254
        const correctedModuleHeight = selSize.h + 0.0254

        const moduleWidthInInch = correctedModuleWidth * 39.3701
        const moduleHeightInInch = correctedModuleHeight * 39.3701

        const moduleAreaInSqInch = moduleWidthInInch * moduleHeightInInch
        const buildingAreaInSqInch = building.size * 1550

        building.modeCount33 = Math.ceil((buildingAreaInSqInch * 0.33) / moduleAreaInSqInch)
    });
    useViewerStore.setState({modeCount33Arr: buildingArr});

    self.buildingArr = [...buildingArr];
    self.moduleMeshArr = [];
    obstGroup.children.forEach((obst) => {
        const obstMesh = obst.children[0].children[0].children[0];
        const {roofId, roofPos, radius, shapeNum, width, length, verPosArr, selfRot} = obstMesh;
        if (!roofId || !roofPos) return;
        const selRoof = roofMeshArr.find(item => item.roofFaceId === roofId);
        selRoof.obstArr.push({roofPos, radius, shapeNum, width, length, verPosArr, selfRot});
    });

    roofMeshArr.forEach(roofMesh => {
        const {posArr, rotX, rotY, obstArr} = roofMesh,
        lastNode = posArr[posArr.length - 1];

        const obstPosArr = [], disGap = 0.1;
        obstArr.forEach(obst => {
            obstPosArr.push(obst.roofPos);
        });
        const newPos2DInfo = GetShapePosArr([...obstPosArr, ...posArr], -rotX, -rotY, lastNode);

        for (let i = 0; i < obstArr.length; i++) {
            const cPos = newPos2DInfo.pos2DArr[i], verArr = [], {radius, shapeNum, width, length, selfRot} = obstArr[i];
            const xDis = shapeNum === 1 ? width : radius, xDelta = xDis / 2 + disGap,
                  zDis = shapeNum === 1 ? length : radius, zDelta = zDis / 2 + disGap;
            if (selfRot) {
                const cubeR = GetDis({x:0, z:0}, {x:xDelta, z:zDelta}), ang = Math.atan2(xDelta, zDelta);
                [ang, -ang, Math.PI+ang, Math.PI-ang].forEach(val => {
                    const rotX = cPos.x + Math.sin(val + selfRot) * cubeR,
                          rotZ = cPos.z + Math.cos(val + selfRot) * cubeR;
                    verArr.push({x:rotX, z:rotZ});
                });
            } else {
                [-1, 1].forEach(xDir => {
                    [-1, 1].forEach(zDir => {
                        verArr.push({x: cPos.x + xDir * xDelta, z: cPos.z + zDir * zDelta})
                    });
                });
            }
            const x0 = cPos.x - xDelta, z0 = cPos.z - zDelta,
                  x1 = cPos.x + xDelta, z1 = cPos.z + zDelta;
            obstArr[i].cPos = cPos;
            obstArr[i].verArr = verArr;
            obstArr[i].verInfo = {x0, z0, x1, z1};
        }
    });
}

export function SetModuleArr(self, type, selRoofId, selDir) {
    const {
        roofs,
        roofMeshArr,
        moduleDir,
        virModule,
        modelGroup,
        roofGroup,
        obstGroup,
        flagModulePathway,
        wallMeshArr,
        moduleMeshArr,
    } = self;
    const selSize = useViewerStore.getState().activeModule;
    SetObstVPos(obstGroup);
    if (!selRoofId) SetPreModuleArr(self);

    const oldModeArrInfo = useViewerStore.getState().localModeInfo;
    const modeArrInfo = [...oldModeArrInfo];
    const oldRoofLength = modeArrInfo.length;
    const accessoryBuildingList = useViewerStore.getState().accessoryBuildingList;
    const obstMeshArr = obstGroup.children.map(c => c.children[0].children[0].children[0]);

    const showLabel = useViewerStore.getState().isModuleMultiplierLabelVisible;

    roofMeshArr.forEach((roofMesh, idx) => {
        roofMesh.moduleArr = [];

        if (roofMesh.disableModule || accessoryBuildingList.includes(roofMesh.userData.buildingName)) return;
        if (selRoofId) {
            if (selRoofId !== roofMesh.roofFaceId) return;

            const modules = getRoofModuleMeshes(roofMesh);
            DeleteModule(modules, roofMesh, moduleMeshArr, self);
        }

        const {rotX, pos2DArr, holeArr, size, roofFaceId, oriAng} = roofMesh, {tilt} = oriAng;

        if ((size && size < 36.11111)) return;


        const {pathwayArr, setbackArr} = GetSetPathArr(roofGroup, roofMesh.roofFaceId);
        const oldModeInfo = modeArrInfo.find(oldInfo => oldInfo.roofFaceId === roofFaceId);

        if (type === 'oldMode' && oldModeInfo && !roofMesh.flatRoof) {
            roofMesh.moduleArr = oldModeInfo.moduleArr;
        } else {
            const moduleArr = GetModuleFaceArr(roofMesh, pos2DArr, holeArr, obstMeshArr, selSize, selDir || moduleDir, rotX, setbackArr, pathwayArr, flagModulePathway, wallMeshArr);
            if (type === 'moduleCount') {
                if (!roofMesh.userData.moduleCount) roofMesh.userData.moduleCount = {};
                roofMesh.userData.moduleCount[selDir] = moduleArr.length;
                return;
            }
            roofMesh.moduleArr = moduleArr;
            modeArrInfo.push({roofFaceId, moduleArr});
        }

        roofMesh.moduleArr.forEach((item) => {
            AddIndividualMode(roofMesh, item, true, self.moduleMeshArr, self.meshArr, showLabel);
        });
    });

    siteCalculationState.needsUpdate(MODULE_GRAPH);

    UpdateSetbackDepth(self, type, selDir);
    if (type !== 'moduleCount') {
        roofMeshArr.forEach(roofMesh => {
            if (roofMesh.disableModule) return;
            if (selRoofId && selRoofId !== roofMesh.roofFaceId) return;
            const {lines} = roofs[0].faces.find(face=>{return face.roofFaceId===roofMesh.roofFaceId});
            lines.forEach(line => {
                SetPathwayActiveModule(self, line.lineId);
            });
        });
    }
    if (selRoofId || type === 'moduleCount') return;
    if (!type || oldRoofLength !== roofMeshArr.length) {
        useViewerStore.setState({localModeInfo: modeArrInfo});

        if (oldRoofLength !== roofMeshArr.length) {
           // AddStep(self, 'module', '', JSON.stringify(oldModeArrInfo), JSON.stringify(modeArrInfo));
        }
    }

    roofMeshArr.forEach(roofMesh => {
        roofMesh.children.filter(item=>item.meshType==='module').forEach(module => {
            module.wPos = module.getWorldPosition(new THREE.Vector3());
        });
    });

    SetBtnDirClass(moduleDir);
    SetVirModuleSize(virModule, 'size', selSize);
    SetVirModuleSize(virModule, 'dir', moduleDir);
    setTimeout(() => {
        modelGroup.irrType = null;
        SetShadeDisplayEffect(modelGroup);
        SetModuleDisplay(modelGroup, true);
    }, 100);
}

export function SetMaxFillForRoofs(self) {
    const { roofMeshArr, roofGroup, obstGroup, wallMeshArr, flagModulePathway, moduleDir } = self;
    const selSize = useViewerStore.getState().activeModule;
    const obstMeshArr = obstGroup.children.map(c => c.children[0].children[0].children[0]);

    roofMeshArr.map(roofMesh => {
        if (roofMesh.disableModule) return { roofFaceId: roofMesh.roofFaceId, moduleCount: 0 };

        const { rotX, pos2DArr, holeArr, size, roofFaceId } = roofMesh;
        const { pathwayArr, setbackArr } = GetSetPathArr(roofGroup, roofFaceId);

        const directions = ['port', 'land', 'both'];


        directions.forEach(dir => {
            const moduleArr = GetModuleFaceArr(roofMesh, pos2DArr, holeArr, obstMeshArr, selSize, dir, rotX, setbackArr, pathwayArr, flagModulePathway, wallMeshArr);
            if(roofMesh.userData.moduleCount){
                roofMesh.userData.moduleCount[dir] = moduleArr.length;
            }

        });

    });
}


export function UpdateMaxFillForRoof(self, roofId) {
    const { roofMeshArr, roofGroup, obstGroup, wallMeshArr, flagModulePathway, moduleDir } = self;
    const selSize = useViewerStore.getState().activeModule;
    const obstMeshArr = obstGroup.children.map(c => c.children[0].children[0].children[0]);

    const roofMesh = roofMeshArr.find(mesh => mesh.roofFaceId === roofId);

    if (!roofMesh || roofMesh.disableModule) {
        return { roofFaceId: roofId, moduleCount: 0 };
    }

    const { rotX, pos2DArr, holeArr, size, roofFaceId } = roofMesh;

    const { pathwayArr, setbackArr } = GetSetPathArr(roofGroup, roofFaceId);

    const directions = ['port', 'land', 'both'];

    directions.forEach(dir => {
        const moduleArr = GetModuleFaceArr(roofMesh, pos2DArr, holeArr, obstMeshArr, selSize, dir, rotX, setbackArr, pathwayArr, flagModulePathway, wallMeshArr);
        if (roofMesh.userData.moduleCount) {
            roofMesh.userData.moduleCount[dir] = moduleArr.length;
        }
    });

}



export function SetBuildingModule(self, value) {
    const {preSelRoofId, roofMeshArr} = self;
    if (!preSelRoofId) {
        return;
    }

    const selRoofMesh = roofMeshArr.find(item => item.roofFaceId === preSelRoofId);
    const {userData, disableModule} = selRoofMesh;
    if (disableModule === value
        || (disableModule === undefined && !value)   && !useViewerStore.getState().accessoryBuildingList.includes(userData.buildingName)
    ) {
        return;
    }

    const selRoofArr = roofMeshArr.filter(item => item.userData.buildingName === userData.buildingName);
    // siteCalculationState.needsUpdate(SHADE_CALCULATIONS);

    if (value) {
        // Setbuilding Accessory
        selRoofArr.forEach(roof => {
            roof.disableModule = true;

            const modules = getRoofModuleMeshes(roof);
            if (modules.length > 0) {
                DeleteModule(modules, roof, self.moduleMeshArr, self);
            }

            for (let i = roof.children.length - 1; i >= 0; i--) {
                const child = roof.children[i];
                if (child.meshType === 'pathway') {
                    roof.remove(child);
                    self.meshArr.splice(self.meshArr.findIndex(m => m.uuid === child.uuid), 1);
                    self.pathwayMeshArr.splice(self.pathwayMeshArr.findIndex(m => m.uuid === child.uuid), 1);
                } else if (child.meshType === 'setback') {
                    roof.remove(child);
                }
            }
        });

        useViewerStore.setState({
            accessoryBuildingList: [...useViewerStore.getState().accessoryBuildingList, userData.buildingName],
        });
    } else {
        // Setbuilding Primary
        selRoofArr.forEach(roof => {
            roof.disableModule = false;

            if (roof.userData.roof_size_type === 'normal_face') {
                AddPathwayMesh(roof, roof, JSON.parse(JSON.stringify(roof.pos2DArr)), self);
                SetModuleArr(self, false, roof.roofFaceId, 'port')
            }
        });

        //compare roofId of all items in selfRoofArr and add missing items to localModeInfo
        selRoofArr.forEach(roof => {
            // make active all pathways that are green
            const roofChildren = roof.children;
            roofChildren.forEach(child => {
                if (child.meshType === 'pathway') {
                    //check if pathway color is set to green then set pathActive to true
                    const pathwayColor = child.material.color.getHex();
                    if (pathwayColor === 0x00FF00) {
                        child.pathActive = true;
                    }
                }
            });

            const roofFaceId = roof.roofFaceId;
            const oldModeArrInfo = useViewerStore.getState().localModeInfo;
            const oldRoof = oldModeArrInfo.find(r => r.roofFaceId === roofFaceId);
            if (!oldRoof) {
                const newRoof = {
                    roofFaceId: roofFaceId,
                    moduleArr: []
                }
                useViewerStore.setState(state => ({
                    localModeInfo: [...state.localModeInfo, newRoof]
                }));
            }
        });

        useViewerStore.setState(state => ({
            accessoryBuildingList: state.accessoryBuildingList.filter(b => b !== userData.buildingName),
        }));
        const updateIdx = self.roofs[0].faces.findIndex(face => face.roofFaceId === selRoofArr[0].roofFaceId);
        siteCalculationState.needsUpdate(ACCESS_MULTIPLIERS, updateIdx);
        siteCalculationState.useCalculations(ACCESS_MULTIPLIERS);
    }
}

export function GetModuleXZ(selSize, dir) {
    return {
        dX: dir === 'port' ? selSize.w : selSize.h,
        dZ: dir === 'port' ? selSize.h : selSize.w
    };
}

export function GetVerArr(cPos, selSize, dir) {
    const {x, z} = cPos, verArr = [], {dX, dZ} = GetModuleXZ(selSize, dir);
    [-1, 1].forEach(xDir => {
        [-1, 1].forEach(zDir => {
            verArr.push({x: GetRoundNum(x + xDir * dX / 2, 4), z: GetRoundNum(z + zDir * dZ / 2, 4)})
        });
    });
    const x0 = cPos.x - dX / 2, x1 = cPos.x + dX / 2, z0 = cPos.z - dZ / 2, z1 = cPos.z + dZ / 2;
    return {verArr, x0, x1, z0, z1, dX, dZ};
}

export function GetVer3DArr(roofMesh, verArr) {
    const ver3DArr = [];
    verArr.forEach(ver => {
        const cloneTestMesh = testMesh.clone();
        cloneTestMesh.position.set(ver.x, ver.z, 0);
        roofMesh.add(cloneTestMesh);
        const wPos = cloneTestMesh.getWorldPosition(new THREE.Vector3());
        roofMesh.remove(cloneTestMesh);
        ver3DArr.push(wPos);
    });
    return ver3DArr;
}

function GetLimitPosValue(posArr) {
    const xArr = [], zArr = [], lastNum = posArr.length - 1;
    posArr.forEach(pos => {
        xArr.push(pos.x);
        zArr.push(pos.z);
    });
    xArr.sort((a, b) => a - b);
    zArr.sort((a, b) => a - b);
    return {minX:xArr[0], maxX:xArr[lastNum], minZ:zArr[0], maxZ:zArr[lastNum]};
}

function GetModuleFaceArr(roofMesh, pos2DArr, holeArr, obstMeshArr, selSize, preDir, rotX, setbackArr, pathwayArr, flagPath, wallMeshArr) {
    const mPos2DArr = [], moduleDir = preDir === 'land' ? 'land' : 'port', posInsideArr = [];
    pos2DArr.forEach(pos => {
        posInsideArr.push({x:pos.x, z:flagPath ? pos.backZ ?? pos.z : pos.z});
    });
    const {minX, maxX, minZ, maxZ} = GetLimitPosValue(posInsideArr);

    const dX = moduleDir === 'land' ? selSize.h : selSize.w,
          dZ = moduleDir === 'land' ? selSize.w : selSize.h,
        gapDeltaX = gap + dX / 2, gapDeltaZ = gap + dZ / 2 + 0.005, gapLand = gap + selSize.h / 2,
        realMinZ = minZ + gapDeltaZ,
        realMaxZ = maxZ - gapDeltaZ,
        realMinX = minX + gapDeltaX,
        realMaxX = maxX - gapDeltaX;
    let lastZ, lastX, zDir, xStart, xDir;
    if (rotX > 0) {
        lastZ = realMaxZ; zDir = -1;
        xStart = realMinX; xDir = 1;
    } else {
        lastZ = realMinZ; zDir = 1;
        xStart = realMaxX; xDir = -1;
    }

    const canPlaceModule = (verInfo, roundX, roundZ, dir) => {
        const module = CreateModuleMesh({x:roundX, z:roundZ, selSize, dir: dir});
        roofMesh.add(module);

        // do not remove
        module.getWorldPosition(new THREE.Vector3());

        const flag = CanModuleBePlaced(verInfo, pos2DArr, holeArr, obstMeshArr, roofMesh, setbackArr, flagPath, module, [], pathwayArr, wallMeshArr);
        roofMesh.remove(module);
        return flag;
    }

    while (lastZ>=realMinZ && lastZ<=realMaxZ) {
        lastX = xStart;
        while (lastX>=realMinX && lastX<=realMaxX) {
            const roundX = GetRoundNum(lastX, 4), roundZ = GetRoundNum(lastZ, 4);
            const verInfo = GetVerArr({x:roundX, z:roundZ}, selSize, moduleDir);
            const flag = canPlaceModule(verInfo, roundX, roundZ, moduleDir);
            lastX += (dX + space) * xDir;
            if (flag !== ModulePlacementStatusOk) continue;
            mPos2DArr.push({ x:roundX, z:roundZ, selSize, dir:moduleDir, moduleId:GetIdStr(), overPathIds:GetOverPathIds(verInfo, pathwayArr) });
        }
        lastZ += (dZ+space) * zDir;
    }
    if (preDir === 'both') {
        lastZ += (dZ/-2 + selSize.w / 2) * zDir;
        lastX = xDir===1?minX + gapLand:maxX - gapLand;
        while (lastX>=minX + gapLand && lastX<=maxX - gapLand) {
            const roundX = GetRoundNum(lastX, 4), roundZ = GetRoundNum(lastZ, 4);
            const verInfo = GetVerArr({x:roundX, z:roundZ}, selSize, 'land');
            const flag = canPlaceModule(verInfo, roundX, roundZ, 'land');
            lastX += (selSize.h + space) * xDir;
            if (flag !== ModulePlacementStatusOk) continue;
            mPos2DArr.push({ x:roundX, z:roundZ, selSize, dir:'land', moduleId:GetIdStr(), overPathIds:GetOverPathIds(verInfo, pathwayArr) });
        }
    }

    return mPos2DArr;
}

function GetOverPathIds(verInfo, pathwayArr) {
    const {verArr} = verInfo, lineArr = [verArr[0], verArr[1], verArr[3], verArr[2]];
    const overPathIds = [];
    verArr.forEach(pos => {
        pathwayArr.forEach(pathway => {
            if (!overPathIds.includes(pathway.pathwayId) && CheckInsidePos(pathway.posArr, pos)) overPathIds.push(pathway.pathwayId);
        });
    });
    pathwayArr.forEach(pathway => {
        pathway.posArr.forEach(pos => {
            if (!overPathIds.includes(pathway.pathwayId) && CheckInsidePos(lineArr, pos)) overPathIds.push(pathway.pathwayId);
        });
    });
    return overPathIds;
}

// Check if module position is valid -
function CheckModulePos(verInfo, pos2DArr, holeArr, obstArr, setbackArr, flagPath, module, wallMeshArr) {
    const {verArr, x0, x1, z0, z1} = verInfo, lineArr = [verArr[0], verArr[1], verArr[3], verArr[2]], insideDelta = inch4 - 0.1;
    const bufferVerArr = [
        {x: x0 - insideDelta, z: z0 - insideDelta},
        {x: x1 + insideDelta, z: z0 - insideDelta},
        {x: x1 + insideDelta, z: z1 + insideDelta},
        {x: x0 - insideDelta, z: z1 + insideDelta},
    ]
    for (const pos of bufferVerArr) {
        if (!CheckInsidePos(pos2DArr, pos)) return ModulePlacementStatusRoofShape;
    }

    for (const pos of pos2DArr) {
        if (CheckInsidePos(bufferVerArr, pos)) return ModulePlacementStatusRoofShape;
    }

    for (const pos of bufferVerArr) {
        for (const holePosArr of holeArr) {
            if (CheckInsidePos(holePosArr, pos)) return ModulePlacementStatusRoofShape;
        }
    }

    if (flagPath) {
        for (const pos of verArr) {
            for (const setback of setbackArr) {
                if (CheckInsidePos(setback.posArr, pos)) return ModulePlacementStatusSetback;
            }
        }

        for (const setback of setbackArr) {
            for (const pos of setback.posArr) {
                if (CheckInsidePos(lineArr, pos)) return ModulePlacementStatusSetback;
            }
        }
    }

    if (module) {
        UpdateMeshOBB(module, 0);

        for (const obstItem of obstArr) {

            //if(obstMesh.delStatus) then ignore the obstruction
            if(obstItem.delStatus) continue;

            UpdateMeshOBB(obstItem, inch4);




            if (DoesIntersectOBB(module, obstItem)) {
                return ModulePlacementStatusObstruction;
            }
        }

        for (const wall of wallMeshArr) {
            UpdateWallMeshOBB(wall, 4 * inch2m);

            if (DoesIntersectOBB(module, wall)) {
                return ModulePlacementStatusWall;
            }
        }
    }

    return ModulePlacementStatusOk;
}

function GetNearModules(moduleArr, verInfo, moduleId, nearDis = snapDis, type) {
    return moduleArr.filter(item => {
        const flagTransCheck = type === 'overCheck' || (type === 'snapPos' && item.select !== true);
        return item.moduleId !== moduleId && flagTransCheck &&
            verInfo.x0 < item.verInfo.x1 + nearDis &&
            verInfo.x1 > item.verInfo.x0 - nearDis &&
            verInfo.z0 < item.verInfo.z1 + nearDis &&
            verInfo.z1 > item.verInfo.z0 - nearDis;
    });
}

// Check if module overlapping - return true if not overlapping
function CheckModuleOver(selItem, moduleArr) {
    // UpdateMeshOBB(selItem, 0);

    // for (const module of moduleArr) {
    //     UpdateMeshOBB(module, inch2m);

    //     if (DoesIntersectOBB(selItem, module)) {
    //         return false;
    //     }
    // }

    // return true;

    const {moduleId, verInfo, position} = selItem,
        selVerArr = verInfo.verArr,
        verMin = selVerArr[0],
        verMax = selVerArr[3];
    const nearModules = GetNearModules(moduleArr, verInfo, moduleId, undefined, 'overCheck');
    var flag = true;
    nearModules.forEach(item => {
        if (flag === false) return;
        const {x0, x1, z0, z1} = item.verInfo;
        const disNear = Math.abs(position.x - item.position.x) + Math.abs(position.y - item.position.y);
        if (disNear < 0.6) flag = false;
        selVerArr.forEach(ver => {
            if ((ver.x >= x0) && (ver.x <= x1) && (ver.z >= z0) && (ver.z <= z1)) flag = false;
        });
        item.verInfo.verArr.forEach(ver => {
            if ((ver.x >= verMin.x) && (ver.x <= verMax.x) && (ver.z >= verMin.z) && (ver.z <= verMax.z)) flag = false;
        });
    });
    return flag;
}

export function SetModuleOriPos(self, moduleMeshArr) {
    const selModules = GetSelModules(moduleMeshArr);
    if (!selModules || !selModules.length) return;
    const wrongModule = selModules.find(item => item.flag === false);
    const {roofId} = selModules[0], selRoof = self.roofMeshArr.find(roofMesh=>{return roofMesh.roofFaceId===roofId});

    const oldModeArrInfo = JSON.parse(JSON.stringify(useViewerStore.getState().localModeInfo)); //Added for undo/redo position change
    if (!wrongModule) {
        // deep copy
        const modeArrInfo = JSON.parse(JSON.stringify(useViewerStore.getState().localModeInfo));
        const oldRoof = modeArrInfo.find(r => r.roofFaceId === roofId);

        selModules.forEach(selModule => {
            const {verInfo, moduleId} = selModule, {x0, x1, z0, z1} = verInfo;
            const xM = GetRoundNum((x0 + x1) / 2, 4), zM = GetRoundNum((z0 + z1) / 2, 4);
            const oldIdx = oldRoof.moduleArr.findIndex(oldMode => oldMode.moduleId === moduleId);
            if (oldIdx !== -1) {
                oldRoof.moduleArr[oldIdx].x = xM;
                oldRoof.moduleArr[oldIdx].z = zM;
            }

            const idx = selRoof.moduleArr.findIndex(m => m.moduleId === moduleId);
            selRoof.moduleArr[idx].x = xM;
            selRoof.moduleArr[idx].z = zM;
        });

        siteCalculationState.needsUpdate(MODULE_GRAPH);

        useViewerStore.setState({localModeInfo: modeArrInfo});
        AddStep(self, 'module', '', JSON.stringify(oldModeArrInfo), JSON.stringify(modeArrInfo));//Updated for undo/redo position change
        return;
    }
    selModules.forEach(module => {
        const {oriPos} = module;
        module.position.set(oriPos.x, oriPos.y, oriPos.z);
        module.material.color.setHex(selModuleCol);
    });
}

export function AddIndividualMode(shapeMesh, item, visible, moduleMeshArr, meshArr, showLabel) {
    const {overPathIds} = item;
    const moduleMesh = CreateModuleMesh(item);
    moduleMesh.visible = visible;
    if (overPathIds) {
        moduleMesh.overPathIds = [...overPathIds];
    }
    moduleMesh.roofId = shapeMesh.roofFaceId;

    moduleMesh.verInfo.verArr.forEach(ver => {
        const cloneTest = testMesh.clone();
        cloneTest.position.set(ver.x, ver.z, 0);
        shapeMesh.add(cloneTest);
        const worldPos = cloneTest.getWorldPosition(new THREE.Vector3());
        moduleMesh.wPosArr.push(worldPos);
        shapeMesh.remove(cloneTest);
    });

    // add edge line array
    const cornerArr = [];
    [0, 1, 3, 2].forEach(nodeIdx => {
        cornerArr.push(moduleMesh.wPosArr[nodeIdx]);
    });
    moduleMesh.edgeLineArr = [];
    cornerArr.forEach((corner, idx) => {
        moduleMesh.edgeLineArr.push({start: corner, end: cornerArr[(idx + 1) % 4]});
    });

    // Creates module label
    const moduleLabel = createLabel('', '#fff', new THREE.Vector3(0, 0, 0));
    moduleLabel.visible = showLabel;
    moduleLabel.meshType = 'moduleLabel';
    moduleMesh.add(moduleLabel);

    shapeMesh.add(moduleMesh);
    moduleMeshArr.push(moduleMesh);

    meshArr.push(moduleMesh);

    siteCalculationState.needsUpdate(MODULE_GRAPH);
    siteCalculationState.useCalculations(MODULE_GRAPH);
}

export function CreateModuleMesh(item) {
    const {x, z, selSize, dir, moduleId} = item;
    const moduleMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 0.02),
        new THREE.MeshStandardMaterial()
    );

    SetModuleSize(moduleMesh, selSize, dir);
    moduleMesh.meshType = 'module';
    moduleMesh.position.set(x, z, -0.02);
    moduleMesh.module = true;
    moduleMesh.moduleId = moduleId;
    moduleMesh.verInfo = GetVerArr({x, z}, selSize, dir);
    moduleMesh.wPosArr = [];

    //Add Outline to moduleMesh using EdgesGeometry ( Basic Outline )
    const outline = new THREE.LineSegments(
        new THREE.EdgesGeometry(moduleMesh.geometry),
        new THREE.LineBasicMaterial({color: 0x000000})
    );
    moduleMesh.add(outline);

    SetMeshOBB(moduleMesh);
    return moduleMesh;
}

function SetModuleSize(module, selSize, dir, virMesh) {
    const {dX, dZ} = GetModuleXZ(selSize, dir);
    if (virMesh) {
        module.scale.set(dX, 1, dZ);
    } else {
        module.scale.set(dX, dZ, 1);
        module.material.map = GetModuleMap(dir);
    }
    module.selSize = selSize;
    module.dir = dir;
}

export function SetSelModuleArr(moduleArr, module, event) {
    const select = event.button === 2 ? true : !module.select;
    const hideModuleTexture = useViewerStore.getState().moduleSolarAccess
    var irrMapFlag = false;
    if (hideModuleTexture) irrMapFlag = true;
    if (select) {
        const oldModule = moduleArr.find(item => item.select);
        const oldRoofId = oldModule ? oldModule.roofId : null;
        if (oldRoofId !== module.roofId) {
            ResetSelModuleArr(moduleArr)
        }
    } else {
        const showCol = irrMapFlag ? module.irrColor : norModuleCol;
        module.material.color.setHex(showCol);
    }
    const showCol = irrMapFlag ? module.irrColor : norModuleCol;
    module.material.color.setHex(select ? selModuleCol : showCol);
    module.select = select;
    const selModuleArr = moduleArr.filter(item => {
        return item.select === true
    });
    module.first = selModuleArr.length === 1;
    SetMoveBtn(selModuleArr[0]);
}

export function ResetSelModuleArr(moduleArr) {
    const hideModuleTexture = useViewerStore.getState().moduleSolarAccess
    var irrMapFlag = false;
    if (hideModuleTexture ) irrMapFlag = true;
    moduleArr.forEach(module => {
        const showCol = irrMapFlag ? module.irrColor : norModuleCol;
        module.material.color.setHex(showCol);
        module.select = false;
        module.first = false;
    });
}

function GetSnapPos(pos, moduleArr, oriVerInfo, selModule) {
    const {moduleId, verInfo} = selModule, halfDX = verInfo.dX / 2, halfDZ = verInfo.dZ / 2;
    const nearModules = GetNearModules(moduleArr, oriVerInfo, moduleId, snapDis * 5, 'snapPos');
    var minDisX = Infinity, minDisZ = Infinity, snapPos = {...pos};
    const spaceSingle = space, snapDelta = snapDis * 1;
    const unitDX = spaceSingle + halfDX;
    const unitDZ = spaceSingle + halfDZ;
    [...nearModules].forEach(near => {
        const {x0, x1, z0, z1} = near.verInfo;
        if (pos.x > x0 && pos.x < x1) {
            const newX0 = x0 + halfDX, disX0 = Math.abs(pos.x - newX0);
            if (disX0 < snapDelta && disX0 < minDisX) {
                minDisX = disX0;
                snapPos.x = newX0;
            }
            const newX1 = x1 - halfDX, disX1 = Math.abs(pos.x - newX1);
            if (disX1 < snapDelta && disX1 < minDisX) {
                minDisX = disX1;
                snapPos.x = newX1;
            }
        } else if (x1 < pos.x) {
            const newX = x1 + unitDX, disX = Math.abs(pos.x - newX);
            if (disX < snapDelta && disX < minDisX) {
                minDisX = disX;
                snapPos.x = newX;
            }
        } else if (x0 > pos.x) {
            const newX = x0 - unitDX, disX = Math.abs(pos.x - newX);
            if (disX < snapDelta && disX < minDisX) {
                minDisX = disX;
                snapPos.x = newX;
            }
        }

        if (pos.z > z0 && pos.z < z1) {
            const newZ0 = z0 + halfDZ, disZ0 = Math.abs(pos.z - newZ0);
            if (disZ0 < snapDelta && disZ0 < minDisZ) {
                minDisZ = disZ0;
                snapPos.z = newZ0;
            }
            const newZ1 = z1 - halfDZ, disZ1 = Math.abs(pos.z - newZ1);
            if (disZ1 < snapDelta && disZ1 < minDisZ) {
                minDisZ = disZ1;
                snapPos.z = newZ1;
            }
        } else if (z1 < pos.z) {
            const newZ = z1 + unitDZ, disZ = Math.abs(pos.z - newZ);
            if (disZ < snapDelta && disZ < minDisZ) {
                minDisZ = disZ;
                snapPos.z = newZ;
            }
        } else if (z0 > pos.z) {
            const newZ = z0 - unitDZ, disZ = Math.abs(pos.z - newZ);
            if (disZ < snapDelta && disZ < minDisZ) {
                minDisZ = disZ;
                snapPos.z = newZ;
            }
        }
    });

    return snapPos;
}

export class MoveModuleState {
    constructor(moveOtherModules, moveOnRoof, moveModules, firstMoveModule, moveModuleArea, roofObst) {
        this.moveOtherModules = moveOtherModules;
        this.moveOnRoof = moveOnRoof;
        this.moveModules = moveModules;
        this.firstMoveModule = firstMoveModule;
        this.moveModuleArea = moveModuleArea;
        this.roofObst = roofObst;
    }
}

export function ReadyTransModules(self) {
    const {moduleMeshArr, roofMeshArr, virFlatPlane} = self;
    const moveModules = moduleMeshArr.filter(item => { return item.select === true });
    const firstMoveModule = moduleMeshArr.find(item => { return item.first === true }) || moveModules[0];
    const moveOnRoof = roofMeshArr.find(item => { return item.roofFaceId === firstMoveModule.roofId });
    const {pos2DArr, posArr} = moveOnRoof;
    if (!moveOnRoof.posLimit) moveOnRoof.posLimit = GetLimitPosValue(pos2DArr);

    const {oriPos, selSize, dir, moduleId} = firstMoveModule, {dX, dZ} = GetModuleXZ(selSize, dir);
    var deltaMinX = dX/-2, deltaMaxX = dX/2, deltaMinZ = dZ/-2, deltaMaxZ = dZ/2;
    moveModules.filter(other=>{return other.moduleId !== moduleId}).forEach(other => {
        const otherDXZ = GetModuleXZ(other.selSize, other.dir),
            deltaCX = other.oriPos.x - oriPos.x,
            deltaCZ = other.oriPos.y - oriPos.y;
        if (deltaCX - otherDXZ.dX/2 < deltaMinX) {deltaMinX = deltaCX - otherDXZ.dX/2;}
        if (deltaCX + otherDXZ.dX/2 > deltaMaxX) {deltaMaxX = deltaCX + otherDXZ.dX/2;}
        if (deltaCZ - otherDXZ.dZ/2 < deltaMinZ) {deltaMinZ = deltaCZ - otherDXZ.dZ/2;}
        if (deltaCZ + otherDXZ.dZ/2 > deltaMaxZ) {deltaMaxZ = deltaCZ + otherDXZ.dZ/2;}
    });

    const posCount = posArr.length, posLast = posArr[posCount - 1], posBefore = posArr[posCount - 2], posFirst = posArr[0];
    virFlatPlane.setFromCoplanarPoints(
        new THREE.Vector3(posLast.x, posLast.y, posLast.z),
        new THREE.Vector3(posFirst.x, posFirst.y, posFirst.z),
        new THREE.Vector3(posBefore.x, posBefore.y, posBefore.z)
    );

    const roofObst = [];

    for (const obst of self.obstGroup.children) {
        if (obst.roofId !== moveOnRoof.roofFaceId) {
            continue;
        }

        const p1 = new THREE.Vector3(obst.vPos.min.x, obst.vPos.min.y, obst.vPos.min.z);
        const p2 = new THREE.Vector3(obst.vPos.max.x, obst.vPos.max.y, obst.vPos.max.z);
        moveOnRoof.worldToLocal(p1);
        moveOnRoof.worldToLocal(p2);

        roofObst.push({min: p1, max: p2, obstId: obst.obstId});
    }

    return new MoveModuleState(
        moveOnRoof.children.filter(item => item.moduleId !== undefined && !item.select),
        moveOnRoof,
        moveModules,
        firstMoveModule,
        {deltaMinX, deltaMaxX, deltaMinZ, deltaMaxZ},
        roofObst,
    );
}

let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();

export function TransModule(e, self, state) {
    const {roofGroup, camera, cSize, posModuleDown, virFlatPlane, obstGroup, wallMeshArr} = self;

    const {posX, posY} = GetMousePos(e);
    mouse.x = (posX / cSize.w) * 2 - 1;
    mouse.y = -(posY / cSize.h) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = new THREE.Vector3();
    raycaster.ray.intersectPlane(virFlatPlane, intersects);

    const {pos2DArr, holeArr, posLimit, roofFaceId} = state.moveOnRoof, {minX, maxX, minZ, maxZ} = posLimit;
    const posDrag = state.moveOnRoof.worldToLocal(intersects);
    const mX = posDrag.x - posModuleDown.x, mY = posDrag.y - posModuleDown.y;

    const {oriPos} = state.firstMoveModule;
    const newPosX = oriPos.x + mX, newPosY = oriPos.y + mY;
    const {deltaMinX, deltaMaxX, deltaMinZ, deltaMaxZ} = state.moveModuleArea;
    const obstMeshArr = obstGroup.children.map(c => c.children[0].children[0].children[0]);

    const constrain = (pos) => {
        // constrains to movable roof area (externally adjusted for multiple selected modules)
        if      (pos.x + deltaMinX - gap <= minX) pos.x = minX - deltaMinX + gap;
        else if (pos.x + deltaMaxX + gap >= maxX) pos.x = maxX - deltaMaxX - gap;
        if      (pos.z + deltaMinZ - gap <= minZ) pos.z = minZ - deltaMinZ + gap;
        else if (pos.z + deltaMaxZ + gap >= maxZ) pos.z = maxZ - deltaMaxZ - gap;
    };

    let snapPos = {x: newPosX, z: newPosY};
    let minSnapDist = Infinity;
    let moduleSnap = undefined;

    // find the closest snap point among the selected modules
    for (const module of state.moveModules) {
        const p = {x: module.oriPos.x + mX, z: module.oriPos.y + mY};
        const pos = GetSnapPos(p, state.moveOtherModules, module.verInfo, module);
        const dx = pos.x - p.x;
        const dz = pos.z - p.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0 && dist < minSnapDist) {
            snapPos = pos;
            minSnapDist = dist;
            moduleSnap = module;
        }
    }

    if (moduleSnap) {
        // align snap point relative to first selected module
        snapPos.x += oriPos.x - moduleSnap.oriPos.x;
        snapPos.z += oriPos.z - moduleSnap.oriPos.z;
    }

    constrain(snapPos);

    const {pathwayArr} = GetSetPathArr(roofGroup, roofFaceId);
    const deltaX = snapPos.x - oriPos.x, deltaZ = snapPos.z - oriPos.y;

    let isColliding = false;

    for (const item of state.moveModules) {
        const {oriPos, selSize, dir} = item;

        item.position.x = oriPos.x + deltaX;
        item.position.y = oriPos.y + deltaZ;
        item.position.z = oriPos.z;
        item.verInfo = GetVerArr({x: item.position.x, z: item.position.y}, selSize, dir);

        if (!isColliding) {
            const canModuleBePlaced = CanModuleBePlaced(item.verInfo, pos2DArr, holeArr, obstMeshArr, state.moveOnRoof, [], false, item, state.moveOtherModules, pathwayArr, wallMeshArr);
            if (canModuleBePlaced !== ModulePlacementStatusOk) {
                useViewerStore.setState(() => ({modulePlacementStatus: canModuleBePlaced}));
                isColliding = true;
            }
        }
    }

    if (!isColliding) {
        useViewerStore.setState(() => ({modulePlacementStatus: ModulePlacementStatusOk}));
    }

    const isValidPlacement = !isColliding;
    const moduleColor = isValidPlacement ? selModuleCol : errModuleCol;

    const deltaPoint = {x: newPosX, z: newPosY};
    constrain(deltaPoint);

    for (let i = 0; i < state.moveModules.length; i++) {
        const item = state.moveModules[i];

        if (isColliding) {
            // revert snap position if collision is detected
            item.position.x = item.oriPos.x + deltaPoint.x - oriPos.x;
            item.position.y = item.oriPos.y + deltaPoint.z - oriPos.y;
            item.position.z = item.oriPos.z;
        }

        item.flag = isValidPlacement;
        item.material.color.setHex(moduleColor);
        item.verInfo = GetVerArr({x: item.position.x, z: item.position.y}, item.selSize, item.dir);
    }
}

function GetSelModuleInfo(self) {
    const {moduleMeshArr, roofMeshArr} = self,
        selModules = moduleMeshArr.filter(module => module.select === true),
        selRoofMesh = roofMeshArr.find(roofMesh => roofMesh.roofFaceId === (selModules[0] && selModules[0].roofId)) || {children:[]},
        roofModules = selRoofMesh.children.filter(item => item.moduleId !== undefined ),
        deselModeArr = roofModules.filter(module => module.select !== true )
        return {selModules, selRoofMesh, deselModeArr}
}

export function UpdateSelModuleArr(self, type, info) {
    const {selModules, selRoofMesh, deselModeArr} = GetSelModuleInfo(self);
    const {inch, dirStr} = info;
    const obstMeshArr = self.obstGroup.children.map(c => c.children[0].children[0].children[0]);

    const oldVerInfoArr = [], oldPosArr = [], oldDirArr = [];
    selModules.forEach((module, mIdx) => {
        oldPosArr[mIdx] = {...module.position};
        oldVerInfoArr[mIdx] = {...module.verInfo};
        oldDirArr[mIdx] = module.dir;
        if (type==='moveInch') {
            const dirRoof = selRoofMesh.rotX >= 0 ? 1 : -1,
                axis = (dirStr === 'top' || dirStr === 'bottom') ? 'y' : 'x',
                dirMove = (dirStr === 'left' || dirStr === 'top') ? -1 : 1;
            module.position[axis] += inch * inch2m * dirMove * dirRoof;
        } else if (type==='dir') {
            module.dir = info;
            SetModuleSize(module, module.selSize, info);
        }
    });
    const {pos2DArr, holeArr, roofFaceId} = selRoofMesh;
    const {pathwayArr} = GetSetPathArr(self.roofGroup, roofFaceId);
    var flagModule = true;
    selModules.forEach(module => {
        const {position, selSize, dir} = module;
        const newVerInfo = GetVerArr({x: position.x, z: position.y}, selSize, dir);
        module.verInfo = {...newVerInfo};

        const canModuleBePlaced = CanModuleBePlaced(newVerInfo, pos2DArr, holeArr, obstMeshArr, selRoofMesh, [], false, module, deselModeArr, pathwayArr, self.wallMeshArr);
        if (canModuleBePlaced !== ModulePlacementStatusOk) {
            flagModule = false;
        }
    });

    if (flagModule) return;
    setTimeout(() => {
        selModules.forEach(module => {
            module.material.color.setHex(errModuleCol);
        });
    }, 0);
    setTimeout(() => {
        selModules.forEach((module, mIdx) => {
            module.material.color.setHex(selModuleCol);
            module.verInfo = oldVerInfoArr[mIdx];
            module.dir = oldDirArr[mIdx];
            module.position.x = oldPosArr[mIdx].x;
            module.position.y = oldPosArr[mIdx].y;
            SetModuleSize(module, module.selSize, module.dir);
        });
    }, timeModuleDelay);
}

export function SetModuleDisplay() {
    SetBtnModule('move', false);
    SetBtnModule('add', false);
}

function SetBtnDirClass(dir) {
    const btnPort = document.getElementsByClassName('btnModulePort')[0];
    const btnLand = document.getElementsByClassName('btnModuleLand')[0];
    if (!btnPort || !btnLand) return;
    if (dir === 'port') {
        btnPort.classList.add('active');
        btnLand.classList.remove('active');
    } else if (dir === 'land') {
        btnPort.classList.remove('active');
        btnLand.classList.add('active');
    }
}

function SetMoveBtn(select) {
    const btnModuleMove = document.getElementsByClassName('btnModuleMove')[0];
    const btnModuleDel = document.getElementsByClassName('btnModuleDel')[0];
    if (!btnModuleMove || !btnModuleDel) return;
    if (select) {
        btnModuleMove.classList.remove('disabled');
        btnModuleDel.classList.remove('disabled');
    } else {
        btnModuleMove.classList.add('disabled');
        btnModuleDel.classList.add('disabled');
    }
}

export function SetBtnModule(type, value) {
    const btnModuleEdit = document.getElementsByClassName('btnModuleEdit')[0];
    const btnModuleMove = document.getElementsByClassName('btnModuleMove')[0];
    const btnModuleAdd = document.getElementsByClassName('btnModuleAdd')[0];
    const btnModulePort = document.getElementsByClassName('btnModulePort')[0];
    const btnModuleLand = document.getElementsByClassName('btnModuleLand')[0];
    const selectModuleSize = document.getElementsByClassName('selectModuleSize')[0];

    if (!btnModuleMove || !btnModuleAdd) return;
    if (type === 'move') {
        if (value) {
            btnModuleMove?.classList.add('active');
            btnModuleAdd?.classList.add('disabled');
            btnModuleEdit?.classList.remove('active');
            btnModulePort?.classList.add('disabled');
            btnModuleLand?.classList.add('disabled');
            selectModuleSize?.classList.add('disabled');
        } else {
            btnModuleMove?.classList.remove('active');
            btnModuleAdd?.classList.remove('disabled');
        }
    } else if (type === 'add') {
        if (value) {
            btnModuleAdd?.classList.add('active');
            btnModuleMove?.classList.add('disabled');
            btnModuleEdit?.classList.remove('active');
        } else {
            btnModuleMove?.classList.remove('disabled');
            btnModuleAdd?.classList.remove('active');
        }
    }
    if (!btnModuleMove?.classList.contains('active')) {
        btnModulePort?.classList.remove('disabled');
        btnModuleLand?.classList.remove('disabled');
        selectModuleSize?.classList.remove('disabled');
        if (!btnModuleAdd?.classList.contains('active')) {
            btnModuleEdit?.classList.add('active');
        }
    }
}

export function GetPosModuleDown(interInfo, moduleMeshArr) {
    if (!interInfo) return;
    const selModules = GetSelModules(moduleMeshArr);
    if (!selModules || !selModules.length) return;
    selModules.forEach(item => {
        const {x, y, z} = item.position;
        item.oriPos = {x, y, z};
    });
    const roofMesh = interInfo.object;
    if (selModules[0].roofId !== roofMesh.roofFaceId) return;
    const posLocal = roofMesh.worldToLocal(interInfo.point);
    return posLocal;
}

export function GetSelModules(meshArr) {
    return meshArr.filter(item => item.select === true);
}

export function InitModulePush(self) {
    const {moduleMeshArr, virModule, moduleDir} = self;
    ResetSelModuleArr(moduleMeshArr);
    SetModuleSize(virModule.children[0], useViewerStore.getState().activeModule, moduleDir, true);
}

function highlightRowBeingUpdatedInTable (selRoofMesh){
    //get data-roofId
    const roofRowInTable= document.querySelector(`[data-roofid="${selRoofMesh.roofFaceId}"]`);

    //blink the row in the table
    if(roofRowInTable){
        roofRowInTable.classList.add('highlightRow');
        setTimeout(()=>{
            roofRowInTable.classList.remove('highlightRow');
        }, 1000);
    }
}

export function SetVirModulePos(self, e) {
    const {virModule, roofMeshArr, camera, cSize, obstGroup, roofGroup} = self;
    const interInfo = GetClickObj(e, roofMeshArr, camera, cSize);
    virModule.visible = interInfo ? true : false;
    if (!interInfo) return;
    const virMesh = virModule.children[0];
    const {selSize, dir} = virMesh;
    const {point, object} = interInfo,
        {rotX, rotY, posArr, roofFaceId, pos2DArr, holeArr, oriAng} = object,
        {azimuth, tilt} = oriAng,
        lastNode = posArr[posArr.length - 1];
    const newPos2DInfo = GetShapePosArr([point, ...posArr], tilt, azimuth, lastNode);
    const cPos = newPos2DInfo.pos2DArr[0];
    const roofModules = object.children.filter(item => item.moduleId !== undefined);
    const oriVerInfo = GetVerArr(cPos, selSize, dir);
    if (!object.posLimit) object.posLimit = GetLimitPosValue(pos2DArr);

    const snapPos = GetSnapPos(cPos, roofModules, oriVerInfo, {moduleId: '', verInfo: oriVerInfo});
    const {minX, maxX, minZ, maxZ} = object.posLimit,
        halfDX = oriVerInfo.dX/2, halfDZ = oriVerInfo.dZ/2;
    if (snapPos.x - halfDX < minX + inch4) snapPos.x = minX + inch4 + halfDX;
    if (snapPos.x + halfDX > maxX - inch4) snapPos.x = maxX - inch4 - halfDX;
    if (snapPos.z - halfDZ < minZ + inch4) snapPos.z = minZ + inch4 + halfDZ;
    if (snapPos.z + halfDZ > maxZ - inch4) snapPos.z = maxZ - inch4 - halfDZ;
    const snapVerInfo = GetVerArr(snapPos, selSize, dir);
    const cloneTest = testMesh.clone();
    object.add(cloneTest);
    cloneTest.position.set(snapPos.x, snapPos.z, 0);
    const worldPos = cloneTest.getWorldPosition(new THREE.Vector3());
    object.remove(cloneTest);

    const {pathwayArr} = GetSetPathArr(roofGroup, roofFaceId);
    const obstMeshArr = obstGroup.children.map(c => c.children[0].children[0].children[0]);

    virMesh.verInfo = snapVerInfo;
    const canModuleBePlaced = CanModuleBePlaced(snapVerInfo, pos2DArr, holeArr, obstMeshArr, object, [], false, virMesh, roofModules, pathwayArr, self.wallMeshArr);
    virModule.flag = canModuleBePlaced === ModulePlacementStatusOk;

    useViewerStore.setState(() => ({modulePlacementStatus: canModuleBePlaced}));

    virModule.position.set(worldPos.x, worldPos.y, worldPos.z);
    virModule.rotation.y = rotY;
    virModule.children[0].rotation.x = rotX;

    virModule.roofId = roofFaceId;
    virModule.snapPos = snapPos;
    virModule.children[0].material.color.setHex(virModule.flag ? addModuleCol : errModuleCol);
}

function CanModuleBePlaced(verInfo, pos2DArr, holeArr, obstArr, roofMesh, setbackArr, flagPath, module, moduleArr, pathwayArr, wallMeshArr) {
    if (roofMesh && (roofMesh.disableModule) || useViewerStore.getState().accessoryBuildingList.includes(roofMesh.userData.buildingName)) {
        return ModulePlacementStatusRoofShape;
    }

    const modulePos = CheckModulePos(verInfo, pos2DArr, holeArr, obstArr, setbackArr, flagPath, module, wallMeshArr);
    if (modulePos !== ModulePlacementStatusOk) {
        return modulePos;
    }

    if (module && !CheckModuleOver(module, moduleArr)) {
        return ModulePlacementStatusModule;
    }

    const overPathIds = GetOverPathIds(verInfo, pathwayArr);
    if (overPathIds.length===1) {
        const selPath = pathwayArr.find(pathway => overPathIds.includes(pathway.pathwayId));
        if (selPath.pathActive) {
            return ModulePlacementStatusPathway;
        }


    }
    else {
        //check even if one of the pathways is active and the module is not allowed to be placed on active pathways and break the loop
        for (let i = 0; i < overPathIds.length; i++) {
            const selPath = pathwayArr.find(pathway => overPathIds[i] === pathway.pathwayId);
            if (selPath.pathActive) {
                return ModulePlacementStatusPathway;
            }
        }

    }

    return ModulePlacementStatusOk;
}

export function SetVirModuleSize(virModule, type, value) {
    const virModuleMesh = virModule.children[0];
    if (type === 'dir') SetModuleSize(virModuleMesh, virModuleMesh.selSize, value, true);
    else if (type === 'size') {
        SetModuleSize(virModuleMesh, value, virModuleMesh.dir, true);
    }
}

export function CreateModule(self) {
    const {virModule, roofMeshArr, moduleMeshArr, meshArr, roofGroup} = self;
    if (!virModule.visible || !virModule.flag) return;
    const {roofId, snapPos} = virModule,
        selRoof = roofMeshArr.find(item => {
            return item.roofFaceId === roofId
        });
    if (selRoof.disableModule) return;
    const {selSize, dir} = virModule.children[0];

    const currentModArr = JSON.parse(JSON.stringify(useViewerStore.getState().localModeInfo));
    const item = {x: GetRoundNum(snapPos.x, 4), z: GetRoundNum(snapPos.z, 4), selSize, dir, moduleId: GetIdStr()};

    // deep copy
    const modeArrInfo = JSON.parse(JSON.stringify(useViewerStore.getState().localModeInfo));
    const oldRoof = modeArrInfo.find(r => r.roofFaceId === roofId);

    oldRoof.moduleArr.push(item);
    selRoof.moduleArr.push(item);

    useViewerStore.setState({localModeInfo: modeArrInfo});
    const verInfo = GetVerArr({x: item.x, z: item.z}, selSize, dir);

    AddStep(self, 'module', item.moduleId,  JSON.stringify(currentModArr), JSON.stringify(modeArrInfo)); // Updated for undo-redo changes

    const {pathwayArr} = GetSetPathArr(roofGroup, roofId);
    item.overPathIds = GetOverPathIds(verInfo, pathwayArr);

    AddIndividualMode(selRoof, item, true, moduleMeshArr, meshArr, useViewerStore.getState().isModuleMultiplierLabelVisible);
    highlightRowBeingUpdatedInTable(selRoof);
    UpdateSetbackDepth(self);
}

export function DeleteModule(selModules, selRoof, moduleMeshArr, self) {
    const {roofFaceId} = selRoof, modeArrInfo = JSON.parse(JSON.stringify(useViewerStore.getState().localModeInfo));
    const oldModeArrInfo = JSON.parse(JSON.stringify(useViewerStore.getState().localModeInfo));
    const oldRoof = modeArrInfo.find(r => r.roofFaceId === roofFaceId);

    selModules.forEach(module => {
        const selModuleId = module.moduleId;
        const idx = moduleMeshArr.findIndex(item => item.moduleId === selModuleId);
        moduleMeshArr.splice(idx, 1); // shift
        const selMesh = selRoof.children.find(item => item.moduleId === selModuleId);
        selRoof.remove(selMesh);
        self.meshArr = self.meshArr.filter(item => item.moduleId !== selModuleId);

        const oldIdx = oldRoof.moduleArr.findIndex(oldModule => oldModule.moduleId === selModuleId);
        oldRoof.moduleArr.splice(oldIdx, 1);
        selRoof.moduleArr.splice(oldIdx, 1);

        const labels = module.children.filter(c => c.meshType === 'moduleLabel');
        for (const label of labels) {
            module.remove(label);
        }
    });

    useViewerStore.setState({localModeInfo: modeArrInfo});
    //AddStep(self, 'module', '', JSON.stringify(useViewerStore.getState().localModeInfo), JSON.stringify(oldModeArrInfo));
    AddStep(self, 'module', '', JSON.stringify(oldModeArrInfo), JSON.stringify(modeArrInfo));//updated for module delete redo

    UpdateSetbackDepth(self);
    highlightRowBeingUpdatedInTable(selRoof);

    siteCalculationState.needsUpdate(MODULE_GRAPH);
}

export function SwitchModuleIrrMat(self, value) {
    const {roofs, modelGroup, roofMeshArr} = self;
    if (!roofs || !roofs[0] || !roofs[0].faces || !roofs[0].faces.length) return;
    if (value) {
        const activeRoofMeshArr = roofMeshArr.filter(item => !item.disableModule);
        modelGroup.totalShadeCount = activeRoofMeshArr.length;
        modelGroup.irrType = 'module';
        siteCalculationState.useCalculations(SHADE_CALCULATIONS);
    } else {
        modelGroup.irrType = null;
        SetShadeDisplayEffect(modelGroup);
    }
}

export function SetShadeMeshOnModule(roofMeshArr) {
    roofMeshArr.forEach((roofMesh) => {
        const {size, children} = roofMesh;
        if (size && size < 52) return;
        const shadeArr = children.filter(mesh => {
            return mesh.shadePoint === true
        });
        const moduleMeshArr = getRoofModuleMeshes(roofMesh);
        shadeArr.forEach((shade) => {
            shade.onModule = false;
            if (CheckInShade(shade, moduleMeshArr)) {
                shade.onModule = true;
            }
        });
    });
}

export function SetModuleGraph(roofMeshArr) {
    const roofInfoArr = [];
    let shadeCount = 0, roofAreaSize = 0;
    SetShadeMeshOnModule(roofMeshArr);
    let totalWeightedSolarAccess = 0;
    let totalModuleArea = 0;

    const angArr = useViewerStore.getState().localAngMultiplierArr;

    // deep copy
    const angIdeal = JSON.parse(JSON.stringify(useViewerStore.getState().localAngIdeal));
    angIdeal.forEach(ang => {
        ang.tilt = parseFloat(ang.tilt);
        ang.azimuth = parseFloat(ang.azimuth);
        ang.ideal = parseFloat(ang.ideal);
    });

    // deep copy
    const facePtInfo = JSON.parse(JSON.stringify(useViewerStore.getState().localFacePtHash));
    let totalTsrf = 0, totalArea = 0, totalMultiplier = 0;

    facePtInfo.forEach(face => {
        face.size = parseFloat(face.size);
        const ptVal = parseInt(face.ptHashAverage);
        const azimuth = GetRoundNum(parseFloat(face.azimuth), 4);
        const tilt = GetRoundNum(parseFloat(face.tilt), 2) ;
        const selProdAng = angArr.find(item => GetRoundNum(item.azimuth, 4) ===  azimuth && GetRoundNum(item.tilt,2) === tilt && item.multipliers);
        const multipliers = selProdAng?.multipliers ?? [];
        const prodInfo = multipliers.find(item => item.access === ptVal);
        face.multiplier = prodInfo ? prodInfo.multiplier : 0;
        face.multipliers = multipliers;

        const selIdealAng = angIdeal.find(item => GetRoundNum(item.tilt,2) === tilt );
        face.idealMulti = selIdealAng ? selIdealAng.ideal : 0;
        const idealMulti = face.idealMulti / 10000;
        face.TSRF = idealMulti ? face.multiplier / idealMulti : 0;
        totalArea += face.size;
        totalTsrf += face.TSRF * face.size;
        totalMultiplier += face.multiplier * face.size;
    });

    let weighted_efficiency = 0;
    let total_module_count = 0;
    let totalSystemSize = 0;
    let actualWattage = 0;
    let utilityWattage = 0;
    let moduleMultiplierTotal = 0;
    let average_multiplier = 0;

    const modulePower = useViewerStore.getState().activeModule.power;

    roofMeshArr.forEach((roofMesh, roofIdx) => {
        const {oriAng, size, children, roofFaceId} = roofMesh, {azimuth, tilt} = oriAng;
        const roofSize = size ?? 0;
        let array_size = 0;

        const shadeArr = children.filter(mesh => mesh.shadePoint === true);
        const roofInShadeArr = shadeArr.filter(shade => shade.onModule === true);
        const moduleMeshArr = getRoofModuleMeshes(roofMesh);

        shadeCount += shadeArr.length;
        roofAreaSize += GetRoundNum(roofSize, 2);
        if (roofMesh.userData.roof_size_type === 'small_face') return;
        const totalShadeModule = roofInShadeArr.reduce((p, c) => p + c.ptHashVal, 0);

        let solarAccessValue = 0;
        if(totalShadeModule && roofInShadeArr.length) {
            solarAccessValue = (totalShadeModule / roofInShadeArr.length).toFixed(1);
        }

        let weightedSolarAccess = solarAccessValue*totalShadeModule
        totalWeightedSolarAccess += weightedSolarAccess;
        totalModuleArea += totalShadeModule;

        let solar_access = 0;
        let efficiency = 0;
        let module_count = 0;

        const faceInfo = facePtInfo.find(f => f.roofFaceId === roofMesh.roofFaceId);
        if (!faceInfo) {
            roofInfoArr.push({
                buildingName: roofMesh.userData.buildingName,
                roofFaceId,
                roofNum : roofMesh.userData.roof_tag_id,
                arraySize: (array_size / 1000).toFixed(3),
                azimuth: azimuth.toFixed(1),
                pitch: tilt.toFixed(1),
                solarAccess: solarAccessValue.toString(),
                efficiency: (efficiency * 100).toFixed(1),
                modules: moduleMeshArr.length.toString(),
                utility_production: '0',
                actual_production: '0',
            });
            return;
        }

        const {multipliers, multiplier, idealMulti} = faceInfo;
        const access_multipliers = angArr.find(item => item.azimuth === roofMesh.oriAng.azimuth && item.tilt === roofMesh.oriAng.tilt)
            ?.multipliers;
        const default_multiplier = access_multipliers ? access_multipliers[0].multiplier : 0


        moduleMeshArr.forEach((module) => {
            module_count++;
            total_module_count++;

            array_size += modulePower;

            // const {irrPro} = module;
            const irrPro = GetIrrPro(module.verInfo, shadeArr) || 0;
            module.irrPro = irrPro
            solar_access += irrPro;
            const prodInfo = multipliers.find(item => item.access === Math.floor(irrPro));
            const module_multiplier = prodInfo?.multiplier ?? 0;
            module.multiplier = module_multiplier;
            moduleMultiplierTotal += module_multiplier;

            const module_efficiency = idealMulti ? module_multiplier / idealMulti * 10000 : 0;
            efficiency += module_efficiency;
            weighted_efficiency += module_efficiency;
            // Set module irradiance color and material
            module.irrColor = module_efficiency === 0 ?  GetShadeCol(irrPro) : GetShadeCol(module_efficiency * 100);
            module.irrMat = new THREE.MeshStandardMaterial({color: module.irrColor});
            module.oriMat = module.material;

            UpdateModuleLabel(module);

            if (useViewerStore.getState().moduleSolarAccess) {
                SetModuleAsColored(module, module.irrColor);
            } else {
                SetModuleAsTextured(module);
            }
        });

        efficiency = module_count ? efficiency / module_count : 0;
        solar_access = module_count ? Math.round(solar_access / module_count) : 0;
        const prodInfo = multipliers.find(item => item.access === Math.floor(solar_access));
        const roof_multiplier = prodInfo?.multiplier ?? 0;
        average_multiplier += roof_multiplier * module_count;
        const actual_production = module_count * modulePower * roof_multiplier;
        const utility_production = Math.round(array_size * default_multiplier);

        totalSystemSize += (array_size / 1000);
        actualWattage += actual_production;
        utilityWattage += utility_production;

        roofInfoArr.push({
            buildingName: roofMesh.userData.buildingName,
            roofFaceId,
            roofNum : roofMesh.userData.roof_tag_id,
            arraySize: (array_size / 1000).toFixed(3),
            azimuth: azimuth,
            pitch: tilt,
            solarAccess: solarAccessValue.toString(),
            efficiency: (efficiency * 100).toFixed(1),
            modules: moduleMeshArr.length.toString(),
            roofMultiplier: roof_multiplier,
            utility_production: utility_production.toFixed(1),
            actual_production: actual_production.toFixed(1),
        });
    });

    const weightedSolarAccess = totalModuleArea > 0
        ? Math.round(totalWeightedSolarAccess / totalModuleArea)
        : 0;

    SetModuleCount(roofMeshArr);

    weighted_efficiency = total_module_count > 0
        ? Math.round((weighted_efficiency * 100) / total_module_count)
        : 0;

    const moduleMultiplierAverage = total_module_count === 0 ? 0 : moduleMultiplierTotal / total_module_count; 
    // const multiplier = GetRoundNum(totalMultiplier / totalArea, 2);
    const multiplier = total_module_count === 0 ? 0 : GetRoundNum(average_multiplier / total_module_count, 2);

    useViewerStore.setState({
        modeCount: total_module_count,
        roofAreaSize,
        roofInfoArr,
        multiplier,
        roofCircleTSRF: Math.round(totalTsrf / totalArea * 100),
        actualWattage: GetRoundNum(actualWattage, 4),
        totalSystemSize,
        utilityWattage,
        efficiency: weighted_efficiency,
        weightedSolarAverage: weightedSolarAccess,
        localMultiplier: multiplier,
        moduleMultiplierAverage: moduleMultiplierAverage,
    });

    roofMeshArr.map(r => getRoofModuleMeshes(r).map(module => {
        UpdateModuleLabel(module);
    }));
}

function UpdateModuleLabel(module) {
    const moduleLabel = module.children.find(c => c.meshType === 'moduleLabel');
    if (moduleLabel === undefined) {
        return;
    }

    const multiplierAverage = useViewerStore.getState().moduleMultiplierAverage;
    // const multiplierAverage = useViewerStore.getState().multiplier;

    const content = `${getMultiplierLabelPrefix(module.multiplier > multiplierAverage, true, 9)}${GetRoundNum(module.multiplier, 4)}`;
    moduleLabel.element.innerHTML = content;
    moduleLabel.element.style.color = '#fff';
    moduleLabel.element.style.fontSize = "11px";
}

function CheckInShade(shade, moduleArr) {
    const {x, y} = shade.position;
    var flagIn = false;
    moduleArr.forEach(module => {
        if (flagIn) return;
        const {x0, x1, z0, z1} = module.verInfo;
        if (x > x0 && x < x1 && y > z0 && y < z1) {
            flagIn = true;
        }
    });
    return flagIn;
}

function GetIrrPro(verInfo, shadeArr) {
    var totalVal = 0, count = 0;
    const {x0, x1, z0, z1} = verInfo;
    shadeArr.forEach(shade => {
        const {x, y} = shade.position;
        if (x > x0 && x < x1 && y > z0 && y < z1) {
            totalVal += shade.ptHashVal || 0;
            count++;
        }
    });
    if (count === 0) {
        logger.error('Error shadePoint');
    }
    return count ? totalVal / count : 0;
}

export async function GetFaceProdAPI(location, angArr, roofMeshArr, num) {
    let {localAngMultiplierArr} =  useViewerStore.getState();
    const angArrFiltered = [];
    const getMultipliers = async (payload) => {
        while (true) {
            const multiplierResponse = await getAccessMultiplier(payload);
            if (multiplierResponse['status'] === 'pending') {
                await sleep(10 * 1000 * random(0.5, 1.5));
                continue;
            }

            const saveLocation = useViewerStore.getState().localLocation;

            if (payload.latitude !== saveLocation.latitude || payload.longitude !== saveLocation.longitude) {
                logger.warn('other-load');
                return;
            }

            const multiplierResults = multiplierResponse['data'] || [];
            if(angArr.length > 0 && multiplierResults.length > 0) {
                for (let i = num; i < angArr.length; i++) {
                    if (!angArr[i]) continue;
                    angArrFiltered.push(angArr[i]);
                    const {azimuth, tilt} = angArr[i];
                    const multiplierResultsFiltererd = multiplierResults.find(md => md.azimuth === GetRoundNum(azimuth, 4) && md.tilt === GetRoundNum(tilt, 2));
                    if(multiplierResultsFiltererd) {
                        angArr[i].multipliers = multiplierResultsFiltererd.accessMultipliers;
                    }
                }
            }
            break;
        }
    }

    const opportunityId = sessionStorage.getItem('SalesForceId');
    const {latitude, longitude} = location;

    const payload = { "opportunityId": opportunityId, "latitude": latitude, "longitude": longitude };
    const roofProperties = [];
    for (let i = num; i < angArr.length; i++) {
        if (!angArr[i]) continue;
        const {azimuth, tilt} = angArr[i];
        const roofTagId = roofMeshArr.find(m => m.oriAng.azimuth === azimuth && m.oriAng.tilt === tilt && m.userData.roof_tag_id)
            ?.userData.roof_tag_id;
        if (roofTagId) {
            let roofProperty = { "azimuth": GetRoundNum(azimuth, 4), "tilt": GetRoundNum(tilt, 2), "roofTagId": roofTagId };
            let localAngMultiplierData =  localAngMultiplierArr.find(itm => (itm.azimuth === azimuth && itm.tilt === tilt));
            if (localAngMultiplierData && localAngMultiplierData.multipliers && localAngMultiplierData.multipliers[0] != 0) {
                angArr[i].multipliers = localAngMultiplierData.multipliers;
            }
            // else {
                roofProperties.push(roofProperty);
            // }
        }
    }

    if (roofProperties.length > 0) {
        payload.roofProperties = roofProperties;
        await getMultipliers(payload);
    }


    useViewerStore.setState({
        localAngMultiplierArr: [
            ...useViewerStore.getState().localAngMultiplierArr,
            ...angArrFiltered
        ],
    });
}

export async function GetFaceIdealAPI(location, angArr) {
    const localAngIdeal = useViewerStore.getState().localAngIdeal;

    for (const ang of angArr) {
        const { latitude, longitude } = location;
        if (!ang) continue;
        const { azimuth, tilt, ideal } = ang;
        if (ideal) continue;

        let idealAngData =  localAngIdeal.find(itm => (itm.azimuth === azimuth && itm.tilt === tilt));

         if(idealAngData) {
            ang.ideal = idealAngData.ideal;
         } else {
            ang.ideal = await getIdealMultiplier(latitude, longitude, tilt, azimuth);
        }
    }

    useViewerStore.setState({ localAngIdeal: angArr });
}

export function CheckSingleModuleRoofs(roofMeshArr){
    return roofMeshArr.filter(r => getRoofModuleCount(r) === 1)
        .map(r => r.userData.roof_tag_id);
}

export function SetModuleCount(roofMeshArr) {
    var verCount = 0, horCount = 0;
    roofMeshArr.forEach(roofMesh => {
        const moduleArr = getRoofModuleMeshes(roofMesh);
        const verC = moduleArr.filter(item => {
            return item.dir === 'port'
        }).length, horC = moduleArr.length - verC;
        verCount += verC;
        horCount += horC;
    });
    const inputModuleCountVertical = document.getElementById('inputModuleCountVertical'),
        inputModuleCountHorizontal = document.getElementById('inputModuleCountHorizontal'),
        inputModuleSpace = document.getElementById('inputModuleSpace'),
        inputSetbackEave = document.getElementById('inputSetbackEave'),
        inputSetbackHip = document.getElementById('inputSetbackHip'),
        inputSetbackRidge = document.getElementById('inputSetbackRidge'),
        inputSetbackValley = document.getElementById('inputSetbackValley'),
        inputSetbackRake = document.getElementById('inputSetbackRake');
    if (inputModuleCountVertical && inputModuleCountHorizontal) {
        inputModuleCountVertical.value = verCount;
        inputModuleCountHorizontal.value = horCount;
    }
    if (inputModuleSpace) {
        inputModuleSpace.value = 1;
    }
    const edgeCount = useViewerStore.getState().localEdgeCount;
    if (inputSetbackEave && inputSetbackHip && inputSetbackRidge && inputSetbackValley && inputSetbackRake && edgeCount) {
        const {ridge, valley, eave, rake, other} = edgeCount;
        inputSetbackEave.value = eave;
        inputSetbackValley.value = valley;
        inputSetbackRidge.value = ridge;
        inputSetbackRake.value = rake;
    }

    sessionStorage.setItem("setbackInfo", JSON.stringify(edgeCount));

    useViewerStore.setState({setbackInfoObject: edgeCount});
}

export function SaveEdgeCount(edgeArr) {
    const edgeCount = {ridge: 0, valley: 0, eave: 0, rake: 0, other: 0};
    edgeArr.forEach(edge => {
        if (edge.type === 'ridge') edgeCount.ridge++;
        else if (edge.type === 'valley') edgeCount.valley++;
        else if (edge.type === 'eave') edgeCount.eave++;
        else if (edge.type === 'rake') edgeCount.rake++;
        else edgeCount.other++;
    });
    useViewerStore.setState({localEdgeCount: edgeCount});
}

export function SetClearFaceModule(self, faceMesh) {
    const selModules = faceMesh.children.filter(item => item.module);
    DeleteModule(selModules, faceMesh, self.moduleMeshArr, self);
}
