// noinspection LanguageDetectionInspection

import * as THREE from "three";
import {CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {useViewerStore} from "../../../store/store";
import {EmptyGroup, GetDegVal, GetDis, GetRoundNum} from "./Common";
import {GetShapePath, testMesh} from "./Loader";
import {CreateFlatRoofMesh, SetupFlatRoof} from "./FlatRoofControl";
import {m2ft} from "../Constants/Default";
import {SetManualZoneModules} from "./ManualZoneControl";
import { FOOT, METER, METER_SQUARE } from "../../../contexts/UnitContext";
import {getPathnameIncludes} from "../../../helpers/getPathname";
import {Line2, LineGeometry, LineMaterial} from "three-fatline";
import { GetVerArr } from "./ModuleControl";

const minSnapDis = 2;

export function CreateLineMesh(self) {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0)]),
        lineMat = new THREE.LineBasicMaterial({
            color: 0x00FF00,
            depthTest: false,
            depthWrite: false,
            transparent: false
        });
    self.lineMesh = new THREE.Line(lineGeo, lineMat);
    self.autoAlignLine1 = new THREE.Line(lineGeo, lineMat);
    self.autoAlignLine2 = new THREE.Line(lineGeo, lineMat);
    self.totalGroup.add(self.lineMesh);
    self.totalGroup.add(self.autoAlignLine1);
    self.totalGroup.add(self.autoAlignLine2);
}

export function AddPointLine(self, pos, roofId) {
    const {linePosArr, lineMesh, nodeArr, viewMode, flagLineSnap, disLineSnap, guideLineGroup, roofMeshArr} = self, lineLength = linePosArr.length;
    const {close, posSnap} = GetSnapPos(nodeArr, {
        x: pos.x,
        y: viewMode === '2d' ? 0 : pos.y,
        z: pos.z
    }, undefined, undefined, flagLineSnap, disLineSnap, linePosArr, []);
    if (lineLength === 1) {
        linePosArr[0] = {x: posSnap.x, y: posSnap.y, z: posSnap.z};
        const inputMeasureAreaSize = document.getElementById('inputMeasureAreaSize');
        if (inputMeasureAreaSize) inputMeasureAreaSize.value = 0;
    }
    const addPosInfo = {x: posSnap.x, y: posSnap.y, z: posSnap.z, roofId};
    linePosArr.push(addPosInfo);
    if (lineLength >= 1) SetGuideLine(addPosInfo, guideLineGroup, roofMeshArr);

    if (lineMesh.close) {
        self.setDrawMode(false);
        lineMesh.close = false;
    } else SetupFlatRoof(self);
}

export function AddAutoAlignPoint(self, pos) {
    const {linePosArr, lineMesh, nodeArr, viewMode, flagLineSnap, disLineSap, autoScaleParams:scaleParams} = self, lineLength = linePosArr.length;
    // const {close, posSnap} = GetSnapPos(nodeArr, { x: pos.x, y: pos.y, z: pos.z}, undefined, undefined,
    //     flagLineSnap, disLineSnap, linePosArr);
    console.log('lineLength: ',lineLength);
    if (lineLength === 1) {
        linePosArr[0] = {x: pos.x, y: pos.y, z: pos.z};
        if (scaleParams.current = 'map'){
            scaleParams.mapRef = { pointArray: [linePosArr[0]]};
        }  else if (scaleParams.current = 'model'){
            scaleParams.modelRef = { pointArray: [linePosArr[0]]};
        }
    } else if(lineLength == 2){
        const p1=  linePosArr[0], p2=  linePosArr[1];

        // Calculating distance between points
        const dx = p1.x - p2.x, dy = p1.y - p2.y, dz = p1.z - p2.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        console.log('Point Distance:', dist);

        // Calculating angle with X-Axis
        const p0 ={ x:p1.x-100, y:p1.y, z:p1.z }; // Point along P1 parallel to X-axis
        const angle = GetAngle(p0, p1, p2); // Angle with X-axis
        console.log('Line Angle:', angle);

        var params = {pointArr: [p1, p2], distance : dist, angle : angle};
        if (scaleParams.current = 'map'){
            scaleParams.mapRef = params;
            console.log('=====map');
            // scaleParams.mapRef.line =   new THREE.Line(geometry, material);
            // scaleParams.mapRef.line.geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            // self.totalGroup.add(scaleParams.mapRef.line);
            self.autoAlignLine1.geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            scaleParams.current = 'model';

        } else if (scaleParams.current = 'model'){
            scaleParams.modelRef = params;
            console.log('=====model');
            // scaleParams.modelRef.line =   new THREE.Line(geometry, material);
            // scaleParams.modelRef.line.geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            // self.totalGroup.add(scaleParams.modelRef.line);
            self.autoAlignLine2.geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            scaleParams.currentLine = '';
        }

        // self.setAutoAlignMode(false);
        self.linePosArr = [];
        // lineMesh.close = true;
    }

    console.log('lineLength:',lineLength);
    linePosArr.push({x: pos.x, y: pos.y, z: pos.z});
}

export function ResetLineMesh(self, type) {
    const {lineGroup, lineMesh, linePosArr, viewMode, selectType} = self;
    const manualZone = useViewerStore.getState().manualZone;
    if (type === 'pause') {
        if (linePosArr.length > 2) {
            linePosArr.pop();
            SetLineMesh(self);
            if (lineMesh.close) {
                const areaValue = SetAreaSizeUI(linePosArr);
                if (viewMode !== '2d') {
                    setLineTemp(self, type);
                    return;
                }
                if (manualZone) {
                    SetManualZoneModules(self, linePosArr);
                    setLineTemp(self, type);
                    return;
                }
                if (selectType === 'surface') {
                    CreateFlatRoofMesh(self, areaValue);
                    setLineTemp(self, type);
                    return;
                }
                const testShape = GetShapePath(linePosArr, 'shape'),
                    extrudeSettings = {depth: 1, bevelEnabled: false},
                    shapeGeo = new THREE.ExtrudeGeometry(testShape, extrudeSettings),
                    shapeMat = new THREE.MeshStandardMaterial(),
                    shapeMesh = new THREE.Mesh(shapeGeo, shapeMat);
                shapeMesh.rotation.x = Math.PI / 2;
                shapeMesh.scale.z = -0.2;

                shapeMesh.material.transparent = true;
                shapeMesh.material.opacity = 0.5;
                shapeMesh.material.depthTest = false;
                shapeMesh.material.depthWrite = false;
                lineGroup.add(shapeMesh);
                const areaDiv = document.createElement('div');
                areaDiv.className = 'measure-line-label measure-area-label';
                areaDiv.textContent = GetRoundNum(areaValue * 10.7639, 2);
                const areaLabelObj = new CSS2DObject(areaDiv);
                var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
                linePosArr.forEach(pos => {
                    if (minX > pos.x) minX = pos.x;
                    if (maxX < pos.x) maxX = pos.x;
                    if (minZ > pos.z) minZ = pos.z;
                    if (maxZ < pos.z) maxZ = pos.z;
                });
                areaLabelObj.position.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
                lineGroup.add(areaLabelObj);
            }
        }
    }
    setLineTemp(self, type);
}

export function resetAutoScale(self){
    self.linePosArr = [{x:0,y:0,z:0}];
    self.lineMesh.geometry = new THREE.BufferGeometry().setFromPoints(self.linePosArr);
}

function setLineTemp(self, type) {
    self.linePosArr = [{x: 100, z: 100}];
    if (type === 'stop') SetLineMesh(self);
}

export function DrawLine(self, pos) {
    const {lineMesh, linePosArr, roofLines, nodeArr, nodeRoofArr, viewMode, flagLineSnap, disLineSnap, moduleMeshArr, guideLineGroup} = self,
        lineLength = linePosArr.length,
        posFirst = linePosArr[0],
        posLast = linePosArr[lineLength - 1],
        posBefore = linePosArr[lineLength - 2],
        snapNodeArr = viewMode === '2d' ? nodeArr : [...nodeArr, ...nodeRoofArr];
    const snapLineArr = [...roofLines, ...guideLineGroup.line3DArr] ;
    moduleMeshArr.forEach(moduleMesh => {
        if (!moduleMesh.wPos) {
            moduleMesh.wPos = moduleMesh.getWorldPosition(new THREE.Vector3());
        }
        const {wPos, verInfo, edgeLineArr} = moduleMesh;
        const dis = GetDis(wPos, posLast);
        if (dis < (verInfo.dX+verInfo.dZ)/2) {
            edgeLineArr.forEach(edgeLine => {
                snapLineArr.push(edgeLine);
            });
        }
    });

    const { close, posSnap } = GetSnapPos(snapNodeArr, pos, posBefore, lineLength > 2 ? posFirst : null, flagLineSnap, disLineSnap, linePosArr, snapLineArr);
    if (!posLast) return;
    posLast.x = posSnap.x;
    posLast.z = posSnap.z;
    posLast.y = viewMode === '2d' ? 0 : posSnap.y; // + 0.1
    lineMesh.close = close;


    // if (lineLength > 2) {
    // 	if (posLast.x === linePosArr[0].x && posLast.z === linePosArr[0].z) {lineMesh.close = true;}
    // }
    SetLineMesh(self);
}

export function DrawAutoAlignLine(self, pos) {
    // console.log('DrawAutoAlignLine');
    const {lineMesh, linePosArr, lineGroup} = self,
        lineLength = linePosArr.length,
        posLast = linePosArr[lineLength - 1];
    if (!posLast) return;

    if(self.autoScaleParams.current = 'map'){
        self.viewerAlert({
            show: true,
            title: "Select two points on map",
            message: 'Select two points on the map to align with the building',
            messageType: "info",
            isModal: false
        })
    } else if (self.autoScaleParams.current = 'model'){
        self.viewerAlert({
            show: true,
            title: "Select two points on the model",
            message: 'Select two corresponding points of the building to align with line on map',
            messageType: "info",
            isModal: false
        });
    }

    var pointArr = [new THREE.Vector3(posLast.x, posLast.y, posLast.z), new THREE.Vector3(pos.x, pos.y, pos.z)];
    lineMesh.geometry = new THREE.BufferGeometry().setFromPoints(pointArr);
}

const disZoneSnap = 2, disEdgeSnap = 0.1;

function GetSnapPos(nodeArr, pos, posBefore, posFirst, flagLineSnap, disLineSnap, linePosArr, roofLines) {
    const drawRoofMode = getPathnameIncludes('surface-draw');
    if (!drawRoofMode && !flagLineSnap) return {close: false, posSnap: pos};
    if (posFirst) {
        const disFirst = GetLength(posFirst, pos);
        if (disFirst < disLineSnap) return {close: true, posSnap: posFirst};
    }
    if (drawRoofMode) {
        posSnap = {...pos};
        linePosArr.forEach((linePos, idx) => {
            if (idx === linePosArr.length - 1) return;
            if (Math.abs(linePos.x - pos.x) < disZoneSnap) posSnap.x = linePos.x;
            if (Math.abs(linePos.z - pos.z) < disZoneSnap) posSnap.z = linePos.z;
        });
        return {close: false, posSnap};
    }
    var disMax = Infinity, posSnap;
    const manualZone = useViewerStore.getState().manualZone;
    if (manualZone) {
    } else {
        roofLines.forEach(roofLine => {
            const pos0 = roofLine.start, pos1 = roofLine.end;
            const nearPos = findNearestPointOnLine(pos.x, pos.z, pos0.x, pos0.z, pos1.x, pos1.z);
            nearPos.y = (pos1.y - pos0.y) * (nearPos.x - pos0.x) / (pos1.x - pos0.x) + pos0.y;
            const disEdge = GetDis(pos, nearPos, true);
            if (disEdgeSnap > disEdge) {
                disMax = disEdge;
                posSnap = nearPos;
            }
        });
        nodeArr.forEach(node => {
            if (posBefore && node.x === posBefore.x && node.y === posBefore.y && node.z === posBefore.z) return;
            const disSnap = GetLength(node, pos);
            if (disMax > disSnap) {
                disMax = disSnap;
                posSnap = node;
            }
        });
        posSnap = disMax < disLineSnap ? posSnap : pos;
    }
    return {close: false, posSnap}
}

function findNearestPointOnLine(px, pz, ax, az, bx, bz) {
    const atob = { x: bx - ax, z: bz - az };
    const atop = { x: px - ax, z: pz - az };
    const len = (atob.x * atob.x) + (atob.z * atob.z);
    let dot = (atop.x * atob.x) + (atop.z * atob.z);
    const t = Math.min(1, Math.max(0, dot / len));
    dot = ((bx - ax) * (pz - az)) - ((bz - az) * (px - ax));
    return { x: ax + (atob.x * t), z: az + (atob.z * t) };
}

function SetLineMesh(self) {
    const {lineMesh, linePosArr, lineGroup, viewMode} = self;
    const {unit, convertQuantityToUnit, convertTypeQuantityToUnit, renderUnit} = useViewerStore.getState().unitContext;

    const linePosGeo = new LineGeometry();
    const positions = [0, 0, 0, 5 / self.camera.zoom, 5 / self.camera.zoom, 5 / self.camera.zoom]; // Start and end points
    linePosGeo.setPositions(positions);

    const linePosMat = new LineMaterial({
        color: 0x00FF00,
        linewidth: 5, // Line width in pixels
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 1.0,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
    });

    const linePosMesh = new Line2(linePosGeo, linePosMat);
    linePosMesh.computeLineDistances();
    linePosMesh.scale.set(1, 1, 1);

    const pointArr = [];
    var totalDis = 0;
    EmptyGroup(lineGroup);

    const manualZone = useViewerStore.getState().manualZone;

    linePosArr.forEach((item, idx) => {
        const posY = viewMode === '2d' ? 0 : item.y
        pointArr.push(new THREE.Vector3(item.x, posY, item.z));
        const clonePosMesh = linePosMesh.clone();
        clonePosMesh.position.set(item.x, posY, item.z);
        lineGroup.add(clonePosMesh);

        if (idx === 0 || manualZone) return;
        const pos0 = linePosArr[idx - 1];

        const disX = pos0.x - item.x, disY = pos0.y - item.y, disZ = pos0.z - item.z,
            dis = Math.sqrt(disX * disX + disY * disY + disZ * disZ);

        const pointNumLabel = document.createElement('div');
        pointNumLabel.className = 'measure-line-label';

        const feetValue = GetRoundNum(convertQuantityToUnit(dis, METER, FOOT), 2);

        pointNumLabel.textContent = `${GetRoundNum(convertTypeQuantityToUnit(null, dis, METER), 2)} ${renderUnit(unit)}`
        pointNumLabel.style.pointerEvents = 'none';

        const pointLabel = new CSS2DObject(pointNumLabel);
        pointLabel.position.set((pos0.x + item.x) / 2, viewMode === '2d' ? 0 : (pos0.y + item.y) / 2, (pos0.z + item.z) / 2);
        lineGroup.add(pointLabel);
        pointLabel.layers.set(0);

        function GetAngle(p1, p2, p3) {
            var v1 = new THREE.Vector3(p1.x - p2.x, p1.z - p2.z, 0);
            var v2 = new THREE.Vector3(p3.x - p2.x, p3.z - p2.z, 0);

            var angle = v1.angleTo(v2);
            return GetDegVal(angle, true);
        }

        //show angle between two lines as we draw
        if (idx > 1) {

            //get the angle between the two lines
            const pos1 = linePosArr[idx - 2];
            const pos2 = linePosArr[idx - 1];
            const pos3 = linePosArr[idx];
            const angle = GetAngle(pos1, pos2, pos3);

            const angleLabel = GetRoundNum(angle, 2);
            const angleNumLabel = document.createElement('div');
            angleNumLabel.className = 'measure-angle-label';
            angleNumLabel.textContent = `${angleLabel}°`
            angleNumLabel.style.pointerEvents = 'none';
            const angleLabelObj = new CSS2DObject(angleNumLabel);
            angleLabelObj.position.set(pos2.x, viewMode === '2d' ? 0 : pos2.y, pos2.z);
            lineGroup.add(angleLabelObj);
            angleLabelObj.layers.set(0);
        }

        totalDis += feetValue;
    });

    lineMesh.geometry = new THREE.BufferGeometry().setFromPoints(pointArr);

    const inputMeasureLineLength = document.getElementById('inputMeasureLineLength');
    if (inputMeasureLineLength) inputMeasureLineLength.value = GetRoundNum(convertTypeQuantityToUnit(null, totalDis, FOOT), 2);
}

function SetGuideLine(addPosInfo, guideLineGroup, roofMeshArr) {
    const {x, y, z, roofId} = addPosInfo,
        guideOut = guideLineGroup.children[0],
        guideInit = guideOut.children[0];

    guideLineGroup.line3DArr = [];
    if (roofId) {
        const selRoof = roofMeshArr.find(roof => roof.roofFaceId === roofId),
            {rotX, rotY, parent, pos2DArr, moduleArr} = selRoof,
            {position} = parent.parent, roofGroupPos = parent.parent.parent.position;
        guideInit.rotation.x = rotX;
        guideOut.rotation.y = rotY;
        const interPos = selRoof.worldToLocal(new THREE.Vector3(x, y, z)),
            localPos = {x: interPos.x, z: interPos.y};

        var max2DPosX = Math.max(...pos2DArr.map(pos => pos.x)),
            min2DPosX = Math.min(...pos2DArr.map(pos => pos.x)),
            max2DPosZ = Math.max(...pos2DArr.map(pos => pos.z)),
            min2DPosZ = Math.min(...pos2DArr.map(pos => pos.z)),
            disXMin = Math.abs(localPos.x - min2DPosX),
            disXMax = Math.abs(localPos.x - max2DPosX),
            disZMin = Math.abs(localPos.z - min2DPosZ),
            disZMax = Math.abs(localPos.z - max2DPosZ),
            flagModuleIn = false;
        
        moduleArr.forEach(module => {
            const {selSize, dir} = module,
                {x0, x1, z0, z1} = GetVerArr({x:module.x, z:module.z}, selSize, dir);
            if (localPos.x > x0 && localPos.x < x1 && localPos.z > z0 && localPos.z < z1) {
                min2DPosX = x0; max2DPosX = x1; min2DPosZ = z0; max2DPosZ = z1;
                flagModuleIn = true;
            }
        });

        if (!flagModuleIn) {
            moduleArr.forEach(module => {
                const {selSize, dir} = module,
                    {x0, x1, z0, z1} = GetVerArr({x:module.x, z:module.z}, selSize, dir);
                if (localPos.z > z0 && localPos.z < z1) {
                    if (localPos.x < x0 && disXMin > Math.abs(localPos.x - x0)) {
                        max2DPosX = x0; disXMax = Math.abs(localPos.x - x0);
                    }
                    if (localPos.x > x1 && disXMax > Math.abs(localPos.x - x1)) {
                        min2DPosX = x1; disXMin = Math.abs(localPos.x - x1);
                    }
                }
                if (localPos.x > x0 && localPos.x < x1) {
                    if (localPos.z < z0 && disZMin > Math.abs(localPos.z - z0)) {
                        max2DPosZ = z0; disZMax = Math.abs(localPos.z - z0);
                    }
                    if (localPos.z > z1 && disZMax > Math.abs(localPos.z - z1)) {
                        min2DPosZ = z1; disZMin = Math.abs(localPos.z - z1);
                    }
                }
            });
        }

        ['x', 'z'].forEach((axis, aIdx) => {
            const guideLinePosArr = [],
                line3DItem = {},
                minVal = axis === 'x' ? min2DPosX : min2DPosZ,
                maxVal = axis === 'x' ? max2DPosX : max2DPosZ;
            [-1, 1].forEach(dir => {
                const nodeVal = dir === -1 ? minVal : maxVal,
                    nodePosX = axis === 'x' ? nodeVal : localPos.x,
                    nodePosZ = axis === 'z' ? nodeVal : localPos.z;
                guideLinePosArr.push( new THREE.Vector3(nodePosX, 0, nodePosZ) );
                const cloneTest = testMesh.clone();
                cloneTest.position.set(nodePosX, nodePosZ, 0);
                selRoof.add(cloneTest);
                const wPos = cloneTest.getWorldPosition(new THREE.Vector3());
                line3DItem[dir===-1?'start':'end'] = {x:wPos.x, y:wPos.y, z:wPos.z};
                selRoof.remove(cloneTest);
            });
            guideInit.children[aIdx].geometry = new THREE.BufferGeometry().setFromPoints(guideLinePosArr);
            guideLineGroup.line3DArr.push(line3DItem);
        });
        guideLineGroup.position.set(position.x+roofGroupPos.x, position.y+roofGroupPos.y, position.z+roofGroupPos.z);
    } else {
        guideInit.rotation.x = 0;
        guideOut.rotation.y = 0;
        ['x', 'z'].forEach((axis, aIdx) => {
            const guideLinePosArr = [], line3DItem = {};
            [-1, 1].forEach(dir => {
                const nodePosX = axis === 'x' ? x + dir * 100 : x,
                      nodePosZ = axis === 'z' ? z + dir * 100 : z;
                guideLinePosArr.push( new THREE.Vector3( nodePosX, y, nodePosZ ) );
                line3DItem[dir===-1?'start':'end'] = {x:nodePosX, y, z:nodePosZ};
            });
            guideInit.children[aIdx].geometry = new THREE.BufferGeometry().setFromPoints(guideLinePosArr);
            guideLineGroup.line3DArr.push(line3DItem);
        });
    }
}

//GetAngle function
function GetAngle(p1, p2, p3) {
    var v1 = new THREE.Vector3(p1.x - p2.x, p1.z - p2.z, 0);
    var v2 = new THREE.Vector3(p3.x - p2.x, p3.z - p2.z, 0);

    var angle = v1.angleTo(v2);
    var pi = Math.PI;
    var angleDegrees = angle * (180 / pi);
    return angleDegrees;
}

function SetAreaSizeUI(arr) {
    const {unit, convertTypeQuantityToUnit} = useViewerStore.getState().unitContext;

    const inputMeasureAreaSize = document.getElementById('inputMeasureAreaSize');
    const areaSize = GetAreaSize(arr), areaLabel = GetRoundNum(convertTypeQuantityToUnit(null, areaSize, METER_SQUARE));
    if (inputMeasureAreaSize) {
        inputMeasureAreaSize.value = areaLabel;
    }
    return areaLabel;
}

function GetLength(pos0, pos1) {
    const disX = pos0.x - pos1.x, disY = pos0.y - pos1.y, disZ = pos0.z - pos1.z;
    return Math.sqrt(Math.pow(disX, 2) + Math.pow(disY, 2) + Math.pow(disZ, 2));
}

function GetAreaSize(posArr) {
    if (!posArr) return 0;
    let area = 0;
    for (let i = 0; i < posArr.length; i++) {
        const pos0 = posArr[i];
        const pos1 = posArr[(i + 1) % posArr.length];
        area += pos0.x * pos1.z - pos1.x * pos0.z;
    }
    return Math.abs(area) / 2;
}

export function SetLineSnap(self, flag) {
    self.flagLineSnap = flag;
    ShowLineSnapSwitch(self);
}

export function ShowLineSnapSwitch(self) {
    const {flagLineSnap, disLineSnap} = self;
    const switchLineSnapping = document.getElementById('switchLineSnapping'),
        rangeLineSnap = document.getElementById('rangeLineSnap'),
        rangeDisLineSnap = document.getElementById('rangeDisLineSnap'),
        inputDisLineSnap = document.getElementById('inputDisLineSnap');
    if (switchLineSnapping) {
        if (flagLineSnap) {
            switchLineSnapping.classList.add('active');
            rangeLineSnap.classList.remove('hide');
            rangeDisLineSnap.value = inputDisLineSnap.value = GetRoundNum(disLineSnap * m2ft, 2);
        } else {
            switchLineSnapping.classList.remove('active');
            rangeLineSnap.classList.add('hide');
        }
    }
}