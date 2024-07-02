import * as THREE from "three";
import {Line} from "three";
import {calculateMeshAreaInSquareFeet, CreateRoof, GetIdStr, GetShapePath} from './Loader';
import {inch2m} from "../Constants/Default";
import {GetDegVal, GetRadVal, getRoofModuleMeshes} from "./Common";
import {CheckInsidePos} from "./RefreshShade";
// import { SetModuleArr } from "./ModuleControl";
import setbackPathwayService from "../../../services/setbackPathwayService";
import {useViewerStore} from "../../../store/store";
import {DeleteModule, SetMaxFillForRoofs, UpdateMaxFillForRoof} from "./ModuleControl";
import { logger } from "../../../services/loggingService";
import {Line2, LineGeometry, LineMaterial} from "three-fatline";

export const apiFlagPathway = true;

export const deSetbackW = 18 / 30, dePathW = 1;

function CheckPos(pos0, pos1) {
    return pos0.x === pos1.x && pos0.y === pos1.y && pos0.z === pos1.z;
}

function GetPosArr(lines) {
    const posArr = [], line0 = lines[0].points;
    posArr.push(line0[0], line0[1]);
    lines[0].pass = true;
    while (posArr.length < lines.length) {
        const lastPos = posArr[posArr.length - 1];
        var nextPos;
        lines.forEach(line => {
            if (line.pass) return;
            const {points} = line;
            if (CheckPos(points[0], lastPos)) {
                nextPos = points[1];
                line.pass = true;
            } else if (CheckPos(points[1], lastPos)) {
                nextPos = points[0];
                line.pass = true;
            }
        });
        posArr.push(nextPos);
    }
    return posArr;
}

export function checkSamePos(posA, posB) {
    return posA.x === posB.x && posA.y === posB.y && posA.z === posB.z;
}

export function checkSameLine(lineA, lineB) {
    return (checkSamePos(lineA[0], lineB[0]) && checkSamePos(lineA[1], lineB[1])) ||
        (checkSamePos(lineA[0], lineB[1]) && checkSamePos(lineA[1], lineB[0]));
}

function checkExistEdge(edgeArr, lineN) {
    var flagExist = false;
    edgeArr.forEach(edge => {
        if (flagExist) return;
        const lineE = edge.posArr;
        if (checkSameLine(lineE, lineN)) flagExist = true;
    });
    return flagExist;
}

export function SetPathway(self, modelType) {
    const {roofs} = self;
    if (!self.roofJson && roofs && roofs[0]) {
        const {faces, edges, nodes} = roofs[0];
        self.roofJson = GetRoofJson([...faces], [...edges], [...nodes]);
        CustomRoofData(self);
        if (modelType==='glb') {
            setTimeout(() => { CreateRoof(self, 'pathway', modelType); }, 200);
            return;
        }
        if (apiFlagPathway) {
            const oppoutunityId = sessionStorage.getItem('SalesForceId')
            fetchSetbackInfo(oppoutunityId, self).then(lines=>{
                if (lines){
                    self.roofJson.structures[0].roofs.forEach((roof, roofIdx) => {
                        roof.lines.forEach((line, lineIdx) => {
                            const selApiLine = lines.find(apiLine => apiLine.type.toLowerCase() === line.type.toLowerCase());
                            if (!selApiLine) return;

                            const {possiblePathway} = selApiLine;
                            line.setback = self.roofs[0].faces[roofIdx].lines[lineIdx].setback = 36; // setback?parseInt(setback.substring(0, 2)):0;
                            line.possiblePathway = self.roofs[0].faces[roofIdx].lines[lineIdx].possiblePathway = line.type !== 'RIDGE' && possiblePathway === 'true';
                        });
                    });
                }
                CreateRoof(self, 'pathway');
            });
        } else {
            CreateRoof(self);
        }
    }
}

export async function fetchSetbackInfo(oppoutunityId, self) {
    return setbackPathwayService.getSetbackPathway(oppoutunityId).then(res => {
        if (!res.data || !res.data[0]) {
            logger.error('SETBACK/PATHWAY API ERROR');
            if (self) {
                self.viewerAlert({
                    show: true,
                    type: "error",
                    title: 'SETBACK/PATHWAY API ERROR',
                    message: "Setback Error",
                    isModal: true,
                });
            }
            useViewerStore.setState({ aHJ_Township: '', setbackNotes: [] });
            return [];
        }
        const { lines, ahjTown } = res.data[0], notes = [];
        lines.forEach((line) => {
            if (!notes.includes(line.notes)) notes.push(line.notes)
        })
        useViewerStore.setState({ aHJ_Township: ahjTown, setbackNotes: notes });
        return lines;
    }).catch(err => {
        useViewerStore.setState({ aHJ_Township: '', setbackNotes: [] });
        logger.error(err);
        if (self) {
            self.viewerAlert({
                show: true,
                type: "error",
                title: 'SETBACK/PATHWAY API ERROR',
                message: err.message,
                isModal: true,
            });
        }
        return [];
    })
}

function CustomRoofData(self) {
    if (!self.roofJson) return;
    const roofs = JSON.parse(JSON.stringify(self.roofJson.structures[0].roofs)), faces = [], edges = []; // fullAddress, opportunityId,
    const roofFaceIdArr = useViewerStore.getState().localFaceIdStr;
    const holeInfoArr = useViewerStore.getState().localHoleInfo;

    roofs.forEach((face, idx) => {
        face.lines.forEach(line => {
            line.points.forEach(pos => {
                const oldZ = pos.z;
                pos.z = pos.y * -1;
                pos.y = oldZ;
                pos.oldY = oldZ;
            });
            if (!checkExistEdge(edges, line.points)) {
                edges.push({posArr: [...line.points], type: line.type?.toLowerCase()});
            }
        });
        face.buildingName = self.roofs[0].faces[idx].buildingName;
        face.irrDir = {tilt: -face.tilt, azimuth: -face.azimuth};
        face.posArr = GetPosArr(face.lines);
        face.azimuth = GetRadVal(face.azimuth);
        face.pitch = GetRadVal(face.tilt);
        face.roofFaceId = roofFaceIdArr[idx];
        const holeInfo = holeInfoArr[idx];

        face.holes = null;
        if (holeInfo && holeInfo !== 'null' && holeInfo.length) {
            face.holes = [];
            holeInfo.forEach(holeItem => {
                holeItem.posArr.forEach(pos => {
                    pos = {x: parseFloat(pos.x), y: parseFloat(pos.y), z: parseFloat(pos.z)}
                });
                face.holes.push(holeItem);
            });
        }
        faces.push({...face});
    });

    self.roofs[0].faces = faces;
    self.roofs[0].edges = edges;
}

export function GetNodeItem(pos, nodeArr) {
    return nodeArr.find(node => {
        return pos.x === node.X && pos.y === -node.Y && pos.z === node.Z
    });
}

function GetRoofJson(faceArr, edgeArr, nodeArr) {
    const roofJson = [], faces = [], edges = [];

    [faceArr, edgeArr].forEach((partArr, partIdx) => {
        partArr.forEach(part => {
            const posArr = [], {azimuth, pitch, size, oriAng} = part;
            part.posArr.forEach(pos => {
                posArr.push({x: pos.x, y: -pos.z, z: pos.y});
            });
            if (partIdx === 0) {
                faces.push({posArr, azimuth, pitch, size, oriAng});
            } else edges.push({posArr, type: part.type});
        });
    });
    faces.forEach((face, faceIdx) => {
        const lines = [], {azimuth, pitch, size, posArr, oriAng} = face;

        posArr.forEach((pos, posIdx) => {
            const idxNext = posIdx === posArr.length - 1 ? 0 : posIdx + 1, posNext = posArr[idxNext];
            const points = [{...pos}, {...posNext}];
            let lineType;
            edges.forEach(edge => {
                if (!checkSameLine(points, edge.posArr) || lineType) return;
                lineType = edge.type;
            });

            const type = lineType?.toUpperCase();
            const lineItem = {lineId: GetIdStr(), points, type, streetSide: false, enforcedPathway: false};
            if (!apiFlagPathway) {
                lineItem.possiblePathway = (type === 'VALLEY' || type === 'RAKE' || type === 'HIP');
                lineItem.setback = type === 'RIDGE' ? 18 : 0;
            }

            lines.push(lineItem);
        });

        roofJson.push({
            roofId: faceIdx.toString(),
            size,
            modules: 0,
            tilt: GetDegVal(pitch),
            azimuth: GetDegVal(azimuth),
            oriAng,
            lines,
        });
    });

    return {
        opportunityId: '0065b00000sKxibAAC',
        fullAddress: useViewerStore.getState().siteAddress,
        structures: [{roofs: roofJson, structureId: '7a07ee9c-c351-4eb4-a9e3-c9f49f7e9960', usedArea: 3.3}]
    }
}

function GetPosPath2D(pos2DArr, type, pathW, posIdx, idxNext) {
    const posFirst = pos2DArr[posIdx], posNext = pos2DArr[idxNext],
        disX = posFirst.x - posNext.x, disZ = posFirst.z - posNext.z;
    const pos02D = pos2DArr[posIdx], pos12D = pos2DArr[idxNext]
    const radH = Math.atan(disX / disZ), radV = (type === 'VALLEY' || type === 'HIP') ? Math.PI / 2 + radH : radH;
    const deltaX = Math.cos(radV) * pathW, deltaZ = Math.sin(radV) * pathW;
    const pos0d0 = {x: pos02D.x + deltaX, y: 0, z: pos02D.z + deltaZ},
        pos0d1 = {x: pos02D.x - deltaX, y: 0, z: pos02D.z - deltaZ},
        pos1d0 = {x: pos12D.x + deltaX, y: 0, z: pos12D.z + deltaZ},
        pos1d1 = {x: pos12D.x - deltaX, y: 0, z: pos12D.z - deltaZ};
    var flagD0 = false, flagD1 = false, posPath2D;
    const countInterval = 4;
    const  intervalX0 = (pos1d0.x - pos0d0.x) / countInterval,
           intervalZ0 = (pos1d0.z - pos0d0.z) / countInterval,
           intervalX1 = (pos1d1.x - pos0d1.x) / countInterval,
           intervalZ1 = (pos1d1.z - pos0d1.z) / countInterval;
    for (let i = 0; i <= countInterval; i++) {
        if (flagD0 || flagD1) continue;
        const middlePos0 = {x: pos0d0.x + intervalX0 * i, z: pos0d0.z + intervalZ0 * i};
        const middlePos1 = {x: pos0d1.x + intervalX1 * i, z: pos0d1.z + intervalZ1 * i};
        if      (CheckInsidePos(pos2DArr, middlePos0)) {flagD0 = true;}
        else if (CheckInsidePos(pos2DArr, middlePos1)) {flagD1 = true;}
    }
    if      (flagD0) posPath2D = [pos0d0, pos1d0];
    else if (flagD1) posPath2D = [pos0d1, pos1d1];
    return {posPath2D, pos02D, pos12D};
}

export function GetHighestRidges(lines) {
    const ridgeLines = lines.filter(l => l.type === 'RIDGE');
    ridgeLines.sort((a, b) => Math.max(b.points[0].y, b.points[1].y) - Math.max(a.points[0].y, a.points[1].y));
    const highestRidge = ridgeLines[0];

    if (!highestRidge) {
        return [];
    }

    const ridges = [];
    const getLineVector = (line) => new THREE.Vector3(line.points[1].x - line.points[0].x, line.points[1].y - line.points[0].y, line.points[1].z - line.points[0].z);

    const ridgeDirection = getLineVector(highestRidge);
    for (const line of ridgeLines) {
        const dir = getLineVector(line);
        if (ridgeDirection.angleTo(dir) < Math.PI / 4) {
            ridges.push(line);
        }
    }

    return ridges;
}

export function ShouldAddSetbackToRoof(roofMesh) {
    return roofMesh.size > 52;
}

export function AddPathwayMesh(face, shapeMesh, pos2DArr, self) {
    const {posArr, lines, roofFaceId} = face;
    const lineMat = new THREE.LineBasicMaterial({color: 0x00FF00});

    posArr.forEach((pos, posIdx) => {
        const idxNext = posIdx === posArr.length - 1 ? 0 : posIdx + 1, posNext = posArr[idxNext];
        const points = [{...pos}, {...posNext}];
        const lineInfo = lines.find(line => checkSameLine(points, line.points));
        if (!lineInfo) return;

        const {possiblePathway, setback, type, lineId, active} = lineInfo;
        const ridgeLines = GetHighestRidges(lines);

        if (possiblePathway || setback) {
            const pathW = setback ? setback * inch2m : dePathW;
            const {posPath2D, pos02D, pos12D} = GetPosPath2D(pos2DArr, type, pathW, posIdx, idxNext);
            if (!posPath2D) return;

            if (possiblePathway) {
                posPath2D.push(pos12D, pos02D);
                const testShape = GetShapePath(posPath2D, 'shape');
                const extrudeSettings = {depth: 0.1, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0, bevelSegments: 1};
                const shapeGeo = new THREE.ExtrudeGeometry(testShape, extrudeSettings);
                const shapeMat = new THREE.MeshStandardMaterial({
                    color: active ? 0x00FF00 : 0xFF0000,
                    transparent: true,
                    opacity: 0.7
                });

                const pathwayMesh = new THREE.Mesh(shapeGeo, shapeMat);
                pathwayMesh.pathwayId = lineId;
                pathwayMesh.pathWayRoofId = roofFaceId;
                pathwayMesh.pathwayPosArr = [...posPath2D];
                pos2DArr[posIdx].pathX = posPath2D[0].x;
                pos2DArr[idxNext].pathX = posPath2D[1].x;
                pathwayMesh.name = 'pathway';
                pathwayMesh.meshType = 'pathway';
                pathwayMesh.size = calculateMeshAreaInSquareFeet(pathwayMesh)
                self.meshArr.push(pathwayMesh);
                self.pathwayMeshArr.push(pathwayMesh);
                shapeMesh.add(pathwayMesh);
            } else if (setback && (ridgeLines.find(l => l.lineId === lineInfo.lineId))) {
                if (!ShouldAddSetbackToRoof(face)) {
                    return;
                }

                const linePosArr = [];
                const linePosArr2 = [];
                const linePositions = []
                posPath2D.forEach(pos => {
                    linePosArr.push(new THREE.Vector3(pos.x, pos.z, pos.y));
                    linePositions.push(pos.x, pos.z, pos.y);
                });

                // const lineGeo = new THREE.BufferGeometry().setFromPoints(linePosArr);
                // const setbackMesh = new Line(lineGeo, lineMat);


                // Convert the position array to a Float32Array in the format required by LineGeometry
// Create a LineGeometry
                const lineGeo = new LineGeometry();
                lineGeo.setPositions(linePositions);

// Create a LineMaterial
                const lineMat = new LineMaterial({
                    color: 0x00ff00,  // Set your desired color
                    linewidth: 4 ,// Set your desired line width (this is in world units)
                    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
                });

// Create the Line2 object
                const setbackMesh = new Line2(lineGeo, lineMat);
                setbackMesh.computeLineDistances();
                // setbackMesh.scale.set(1, 1, 1);

                //depth test

                setbackMesh.pathWayRoofId = roofFaceId;
                setbackMesh.pathwayPosArr = [...posPath2D, pos12D, pos02D];
                pos2DArr[posIdx].backZ = posPath2D[0].z;
                pos2DArr[idxNext].backZ = posPath2D[1].z;
                setbackMesh.name = 'setback';
                setbackMesh.meshType = 'setback';
                setbackMesh.setbackId = lineId;
                shapeMesh.lines.forEach(line => {
                    if (line.lineId !== lineInfo.lineId) return;
                    line.setbackW = setback;
                    line.setbackInfo = {pos36: [...linePosArr], pos18: []};
                    const pos18Info = GetPosPath2D(pos2DArr, type, 18 * inch2m, posIdx, idxNext);
                    pos18Info.posPath2D.forEach(pos => {
                        line.setbackInfo.pos18.push(new THREE.Vector3(pos.x, pos.z, pos.y));
                    });
                });
                shapeMesh.add(setbackMesh);


            }
        }
    });
}

export function SetPathwayBtns(type, value) {
    const btnSetback = document.getElementsByClassName('btnVisiblesetback')[0];
    const btnPathway = document.getElementsByClassName('btnVisiblepathway')[0];
    if (type === 'setback') {
        if (value) btnSetback?.classList.remove('toggle');
        else btnSetback?.classList.add('toggle');
    } else {
        if (value) btnPathway?.classList.remove('toggle');
        else btnPathway?.classList.add('toggle');
    }
}

export function SetTogglePathwayValue(self, selPathwayId) {
    const {roofs, roofGroup} = self;
    roofs[0].faces.forEach(face => {
        face.lines.forEach(line => {
            if (line.lineId === selPathwayId) {
                var newStatus = !line.active
                line.active = newStatus;
                roofGroup.traverse(child => {
                    if (child.pathwayId === selPathwayId) {
                        child.pathActive = newStatus;
                        UpdateMaxFillForRoof(self, face.roofFaceId);
                    }
                })
            }
        });
    });
    SetPathwayActiveModule(self, selPathwayId);
}

export function SetPathwayValue(self, selPathwayId, value) {
    const {roofs, roofGroup} = self;
    roofs[0].faces.forEach(face => {
        face.lines.forEach(line => {
            if (line.lineId === selPathwayId) {
                line.active = value;
                roofGroup.traverse(child => {
                    if (child.pathwayId === selPathwayId) {
                        child.pathActive = value;
                        UpdateMaxFillForRoof(self, face.roofFaceId);
                    }
                });
            }
        });
    });
    SetPathwayActiveModule(self, selPathwayId);
}

export function SetPathwayActiveModule(self, selPathwayId) {
    const {roofs, meshArr, moduleMeshArr} = self;
    var pathwayStatus;
    roofs[0].faces.forEach(face => {
        face.lines.forEach(line => {
            if (line.lineId === selPathwayId) {
                pathwayStatus = line.active;
            }
        });
    });
    meshArr.forEach(mesh => {
        if (mesh.pathwayId === selPathwayId) {
            mesh.material.color.setHex(pathwayStatus ? 0x00FF00 : 0xFF0000);
            mesh.scale.z = pathwayStatus ? 1.5 : 1;
            mesh.material.opacity = pathwayStatus ? 1 : 0.7;
        }
    });

    const modulesToDelete = [];
    moduleMeshArr.forEach(module => {
        const {overPathIds} = module;
        if (!overPathIds || !overPathIds.includes(selPathwayId)) return;

        if (pathwayStatus) {
            modulesToDelete.push(module);
        }

        module.material.needsUpdate = true;
        module.pathwayOver = pathwayStatus;
    });

    for (const module of modulesToDelete) {
        const selRoof = self.roofMeshArr.find(r => r.roofFaceId === module.roofId);
        DeleteModule([module], selRoof, self.moduleMeshArr, self);
    }
}

// export function UpdateSetbackDepth(self, type, selDir) {
//     if (type === 'modeCount' && selDir === 'land') return;
//     const {buildingArr, roofMeshArr} = self;
//     buildingArr.forEach(building => {
//         building.modeCount = 0;
//     });
//     roofMeshArr.forEach(roofMesh => {
//         const modules = getRoofModuleMeshes(roofMesh);
//         const selBuilding = buildingArr.find(building => building.name === roofMesh.userData.buildingName);
//         selBuilding.modeCount += modules.length;
//     });
//     buildingArr.forEach(building => {
//         const {modeCount, modeCount33} = building;
//         const mode33Over = modeCount > modeCount33;
//         if (building.mode33Over !== undefined && building.mode33Over !== mode33Over) {
//             // self.viewerAlert({
//             // 	show:true,
//             // 	title:"Setback Update",
//             // 	message:mode33Over?<SetbackUpdateAlert isEighteenInch={false}/>:<SetbackUpdateAlert isEighteenInch={true}/>,
//             // 	messageType:"info",
//             // 	isModal:true
//             // })
//             // setTimeout(() => {
//             // 	self.viewerAlert({ show:false });
//             // }, 2000);
//         }
//         building.mode33Over = mode33Over;
//     });
//     roofMeshArr.forEach(roofMesh => {
//         const {lines, children} = roofMesh;
//         const selBuilding = buildingArr.find(building => {
//             return building.name === roofMesh.userData.buildingName
//         });
//         lines.forEach(line => {
//             if (!line.setback) return;
//             const selSetbackMesh = children.find(item => {
//                 return item.setbackId === line.lineId
//             });
//             if (!selSetbackMesh) return;
//             const {pos36, pos18} = line.setbackInfo,
//                 selSetbackPos = selBuilding.mode33Over ? pos36 : pos18;
//             selSetbackMesh.userData.use18 = !selBuilding.mode33Over;
//             selSetbackMesh.geometry = new THREE.BufferGeometry().setFromPoints([...selSetbackPos]);
//         });
//     });
// }


export function UpdateSetbackDepth(self, type, selDir) {
    if (type === 'modeCount' && selDir === 'land') return;
    const { buildingArr, roofMeshArr } = self;

    buildingArr.forEach(building => {
        building.modeCount = 0;
    });

    roofMeshArr.forEach(roofMesh => {
        const modules = getRoofModuleMeshes(roofMesh);
        const selBuilding = buildingArr.find(building => building.name === roofMesh.userData.buildingName);
        selBuilding.modeCount += modules.length;
    });

    buildingArr.forEach(building => {
        const { modeCount, modeCount33 } = building;
        const mode33Over = modeCount > modeCount33;
        if (building.mode33Over !== undefined && building.mode33Over !== mode33Over) {
            // self.viewerAlert({
            //     show: true,
            //     title: "Setback Update",
            //     message: mode33Over ? <SetbackUpdateAlert isEighteenInch={false} /> : <SetbackUpdateAlert isEighteenInch={true} />,
            //     messageType: "info",
            //     isModal: true
            // });
            // setTimeout(() => {
            //     self.viewerAlert({ show: false });
            // }, 2000);
        }
        building.mode33Over = mode33Over;
    });

    roofMeshArr.forEach(roofMesh => {
        const { lines, children } = roofMesh;
        const selBuilding = buildingArr.find(building => {
            return building.name === roofMesh.userData.buildingName;
        });

        lines.forEach(line => {
            if (!line.setback) return;
            const selSetbackMesh = children.find(item => {
                return item.setbackId === line.lineId;
            });
            if (!selSetbackMesh) return;
            const { pos36, pos18 } = line.setbackInfo,
                selSetbackPos = selBuilding.mode33Over ? pos36 : pos18;
            selSetbackMesh.userData.use18 = !selBuilding.mode33Over;

            // Convert selSetbackPos to Float32Array for LineGeometry
            const setbackPositions = [];
            selSetbackPos.forEach(point => {
                setbackPositions.push(point.x, point.y, point.z);
            });

            // Update the geometry of the Line2 object
            const newLineGeo = new LineGeometry();
            newLineGeo.setPositions(setbackPositions);
            selSetbackMesh.geometry.dispose(); // Dispose of the old geometry to free memory
            selSetbackMesh.geometry = newLineGeo;
        });
    });
}