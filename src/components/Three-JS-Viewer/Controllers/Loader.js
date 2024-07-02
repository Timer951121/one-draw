import * as parser from 'xml-parser';
import * as THREE from "three";
import axios from 'axios';
import {useViewerStore} from '../../../store/store';

import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import { EmptyGroup, GetDis, GetRadVal, GetRoundNum, getModuleMeshInfo, getRoofModuleMeshes } from './Common';
import {ChangeObstHeight, ChangeObstLength, ChangeObstRadius, ChangeObstShape, ChangeObstSides, ChangeObstWidth, ChangeTreeDelete, ChangeTreeShape, CheckDefaultObst, CustomObstAng, DeleteObst, SetTreeSize} from './ObstructionControl';
import {crownImgArr} from '../Constants/TreeShape';
import {
    AddPathwayMesh,
    apiFlagPathway,
    SetPathway,
    SetPathwayValue,
} from './PathwayControl';
import {GetLatLon, GetXYZ} from './MapControl';
import {mapSize, SetTerrain} from './TerrainControl';
import {AddShadeMesh, AddShadePosArr, CheckInsidePos, GenShadeOnFace, SetShadeFinalResult} from './RefreshShade';
import {GetTimeZone} from './IrradianceControl';
import {SetCloneVirObj} from './PushControls';
import {InitStep} from './StepControl';
import {
    AddIndividualMode,
    GetFaceIdealAPI,
    GetFaceProdAPI,
    SaveEdgeCount,
    SetBuildingModule, SetMaxFillForRoofs,
    SetModuleArr,
    SetModuleGraph,
    SetPreModuleArr
} from './ModuleControl';
import { defaults, ft2m, } from '../Constants/Default';
import {CreateVirFlatPlane} from './FlatRoofControl';
import imgDefaultCrown from '../../../assets/img/tree-types/image-1.png';
import {SetLineSnap} from './LineControl';
import {Line2, LineGeometry, LineMaterial} from 'three-fatline';
import {CreateSunVecArr, SetSunPathGeo} from '../Sun-Vector-Path/LoadSun';
import {roofTextureList} from '../../../pages/ModelSite/Roof/RoofShingles';
import { degToRad } from 'three/src/math/MathUtils';
import { LoadingContext } from '../../../store/loadingMessageStore';
import { ACCESS_MULTIPLIERS, FACE_IDEAL_API, MODULE_GRAPH, SHADE_CALCULATIONS, siteCalculationState } from '../../../services/siteCalculationState';
import sleep from '../../../helpers/sleep';
import { logger } from '../../../services/loggingService';
import { SetMeshOBB, SetWallMeshOBB, UpdateMeshOBB } from './MeshControl';

const testSize = 0.1, pillarW = 0.5;
const testGeo = new THREE.BoxGeometry(testSize, testSize, testSize);
const testMat = new THREE.MeshStandardMaterial({color: 0x00FF00});
export const testMesh = new THREE.Mesh(testGeo, testMat);
export const defaultObsW = 2.5 * ft2m;
const mapDefaultCrown = new THREE.TextureLoader().load(imgDefaultCrown);
mapDefaultCrown.wrapS = mapDefaultCrown.wrapT = THREE.RepeatWrapping;


export function LoadPlane(self) {
    self.mapMesh = GetPlane({x: mapSize, y: mapSize});
    self.mapMesh.receiveShadow = true;
    self.mapMesh.position.y = -0.2;
    self.mapCustom = GetPlane({x: mapSize, y: mapSize});
    self.mapCustom.aspectRatio = 1;
    self.mapCustomWrapper = new THREE.Group();
    self.mapCustomWrapper.add(self.mapCustom);

    self.mapMesh.visible = false;
    self.mapCustom.visible = false;
    self.totalGroup.add(self.mapMesh, self.mapCustomWrapper);
    CreateVirFlatPlane(self);
}

export function Obstruction_Tree_Initial_Setup(self) {
    const obsGeo = new THREE.BoxGeometry(1, 1, 1),
        obsMat = new THREE.MeshStandardMaterial({color: 0xD3D3D3, transparent: false, opacity: 0.5}),
        obsMesh = new THREE.Mesh(obsGeo, obsMat), obsFrame = obsMesh.clone();

    obsMesh.position.y = 0.5;
    obsMesh.shapeNum = 1;
    SetMeshOBB(obsMesh);
    obsFrame.visible = false;
    obsFrame.material = new THREE.MeshBasicMaterial({color: 0xFF0000, wireframe: true});

    self.virObs = new THREE.Group();
    const outGroup = new THREE.Group(), inGroup = new THREE.Group();
    self.virObs.add(outGroup);
    outGroup.add(inGroup);
    inGroup.add(obsMesh, obsFrame);
    self.virObs.visible = false;
    self.virTree = GetTreeObj({x: 0, y: 0}, self.crownModel);
    SetTreeSize(self, self.virTree, {height: 8, crown_radius: 4, crown_height: 5, trunk_radius: 0.5});
    self.virTree.traverse(child => {
        if (child instanceof THREE.Mesh) {
            child.material.opacity = 0.5;
            child.material.transparent = true;
        }
    });
    self.virTree.visible = false;
    self.treeTransMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0
    }));
    self.treeTransMesh.meshType = 'tree';

    const moduleGeo = new THREE.BoxGeometry(1, 0.1, 1);
    const moduleMat = new THREE.MeshStandardMaterial({color: 0x0000FF, transparent: true, opacity: 0.8});
    const moduleMesh = new THREE.Mesh(moduleGeo, moduleMat);

    //add border to module by edge geometry
    const moduleEdgeGeo = new THREE.EdgesGeometry(moduleGeo);
    const moduleEdgeMat = new THREE.LineBasicMaterial({color: 0x000000});
    const moduleEdgeMesh = new THREE.LineSegments(moduleEdgeGeo, moduleEdgeMat);
    moduleMesh.add(moduleEdgeMesh);

    SetMeshOBB(moduleMesh);

    self.virModule = new THREE.Group();
    self.virModule.add(moduleMesh);
    self.virModule.visible = false;

    self.totalGroup.add(self.virObs, self.treeTransMesh, self.virModule);
}

export function GetPlane(size, transparent) {
    const planeGeo = new THREE.PlaneGeometry(size.x, size.y);
    const planeMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent,
        opacity: transparent ? 0 : 1
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.rotation.x = -Math.PI / 2;
    return planeMesh;
}

export function LoadCrownMap(self) {
    crownImgArr.forEach(item => {
        const crownMap = new THREE.TextureLoader().load(item.img);
        crownMap.wrapS = crownMap.wrapT = THREE.RepeatWrapping;
        crownMap.crownKey = item.key;
        self.crownMapArr.push(crownMap);
    });
}

export function LoadTreeModel() {
    return new Promise((resolve, reject) => {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load('https://cdn.statically.io/gh/rohanmaptell/CDN/main/new-tree-1.glb', (treeModel) => {
            resolve(treeModel);
        }, (xhr) => {
        }, (e) => {
            logger.error(e);
            reject(e);
        });
    })
}

export function GetShapePosArr(posArr, pitch, azimuth, lastNode, shapeType) {
    const pos2DArr = [], nodeArr = [], node3dGroup = new THREE.Group();
    posArr.forEach(pos => {
        nodeArr.push({x:pos.x-lastNode.x, y:pos.y-lastNode.y, z:pos.z-lastNode.z});
    });
    nodeArr.forEach(node => {
        const cloneTest = testMesh.clone();
        cloneTest.position.set(node.x, node.y, node.z);
        node3dGroup.add(cloneTest);
    });

    node3dGroup.rotation.x = GetRadVal(pitch);
    node3dGroup.rotation.y = GetRadVal(azimuth);

    node3dGroup.children.forEach(nodeMesh => {
        const wPos = nodeMesh.getWorldPosition(new THREE.Vector3());
        pos2DArr.push({...wPos});
    });
    const custom2DArr = GetCustom2DArr(pos2DArr, shapeType);
    return {pos2DArr: custom2DArr};
}

const maxCrookAngle = 0.02;

function GetCustom2DArr(pos2DArr, shapeType) {
    if (shapeType !== 'roofMesh') return pos2DArr;
    const length = pos2DArr.length, posLast = pos2DArr[length - 1], pos0 = pos2DArr[0], numN = length - 2, posN = pos2DArr[numN];
    if (length < 4) return pos2DArr;
    const d0X = Math.abs(pos0.x), d0Z = Math.abs(pos0.z),
          dNX = Math.abs(posN.x), dNZ = Math.abs(posN.z);
    var axisCrook, curNode = {...posLast}, nodeIdx = 0;

    if      (d0X < d0Z && d0X/d0Z < maxCrookAngle) axisCrook = 'x';
    else if (d0Z < d0X && d0Z/d0X < maxCrookAngle) axisCrook = 'z';
    if (!axisCrook) return pos2DArr;

    while (nodeIdx <= numN && axisCrook) {
        const axisOther = axisCrook==='x'?'z':'x',
            disAxis = Math.abs(curNode[axisCrook] - pos2DArr[nodeIdx][axisCrook]),
            disOther = Math.abs(curNode[axisOther] - pos2DArr[nodeIdx][axisOther]);
        if (disAxis > disOther || disAxis / disOther > maxCrookAngle) {axisCrook = false; break;}

        pos2DArr[nodeIdx][axisCrook] = curNode[axisCrook];
        curNode = {...pos2DArr[nodeIdx]};
        axisCrook = axisCrook==='x'?'z':'x';
        nodeIdx++;
    }
    if (nodeIdx===length-1) {
        if (Math.abs(pos2DArr[numN][axisCrook]) < 0.01)
            pos2DArr[numN][axisCrook] = 0;
    } else {
        axisCrook = false; curNode = {...posLast};
        var endNodeIdx = numN;
        if      (dNX < dNZ && dNX/dNZ < maxCrookAngle) axisCrook = 'x';
        else if (dNZ < dNX && dNZ/dNX < maxCrookAngle) axisCrook = 'z';
        if (!axisCrook) return pos2DArr;

        while (endNodeIdx > nodeIdx && axisCrook) {
            const axisOther = axisCrook==='x'?'z':'x',
                disAxis = Math.abs(curNode[axisCrook] - pos2DArr[endNodeIdx][axisCrook]),
                disOther = Math.abs(curNode[axisOther] - pos2DArr[endNodeIdx][axisOther]);
            if (disAxis > disOther || disAxis / disOther > maxCrookAngle) {axisCrook = false; break;}

            pos2DArr[endNodeIdx][axisCrook] = curNode[axisCrook];
            curNode = {...pos2DArr[endNodeIdx]};
            axisCrook = axisCrook==='x'?'z':'x';
            endNodeIdx--;
        }
    }
    return pos2DArr;
}

function GetWallMesh(pos3DArr, houseId, meshArr, ppInfo) {
    const posArr = pos3DArr.map(pos => ({...pos, y: pos.y + ppInfo.h}));
    const pos0 = posArr[0], pos1 = posArr[1], inGroup = new THREE.Group(), outGroup = new THREE.Group();
    outGroup.add(inGroup);
    const posOrder = [{...pos0, y: 0}, {...pos0}, {...pos1}, {...pos1, y: 0}], firstPos = posOrder[0];
    for (let i = 0; i < 4; i++) {
        const clonePos = testMesh.clone();
        const selPos = posOrder[i];
        clonePos.position.set(selPos.x - firstPos.x, selPos.y, selPos.z - firstPos.z);
        inGroup.add(clonePos);
    }
    const dz = pos1.z - pos0.z, dx = pos0.x - pos1.x;
    const rotY = Math.atan2(dx, dz);
    inGroup.rotation.y = rotY;
    outGroup.rotation.z = Math.PI / 2;

    const pos2DArr = [];
    inGroup.children.forEach(pos => {
        const posW = pos.getWorldPosition(new THREE.Vector3());
        pos2DArr.push(posW);
    });

    const wallShape = new THREE.Shape(), firstVer = pos2DArr[0];
    wallShape.moveTo(firstVer.x, firstVer.z);
    pos2DArr.forEach(ver => {
        wallShape.lineTo(ver.x, ver.z);
    });
    const extrudeSettings = {depth: 0.04, bevelEnabled: false,};
    const wallGeo = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);
    const wallMat = new THREE.MeshStandardMaterial({color: 0xCCCCCC});

    const frameMat = new THREE.MeshBasicMaterial({color: 0xFF0000, wireframe: true});

    const wallMesh = new THREE.Mesh(wallGeo, wallMat), wallFrame = new THREE.Mesh(wallGeo, frameMat);
    wallFrame.visible = false;
    wallMesh.houseId = houseId;
    wallMesh.meshType = 'roof';
    wallMesh.name = 'wallMesh' + GetIdStr(6);
    wallMesh.rotation.x = wallFrame.rotation.x = Math.PI / 2;
    wallMesh.castShadow = true;
    wallMesh.userData.positions = pos2DArr;
    wallMesh.userData.depth = ppInfo.w;

    const center = new THREE.Vector3((pos1.x + pos0.x) / 2, Math.max(pos0.y, pos1.y) / 2, (pos1.z + pos0.z) / 2);
    wallMesh.updateWorldMatrix(true, false);
    SetWallMeshOBB(wallMesh, center, firstPos);

    meshArr.push(wallMesh);

    const wallInGroup = new THREE.Group(), wallOutGroup = new THREE.Group();
    wallInGroup.add(wallMesh, wallFrame);
    wallInGroup.rotation.z = Math.PI / -2;
    wallOutGroup.add(wallInGroup);
    wallOutGroup.rotation.y = -rotY;
    wallOutGroup.position.set(firstPos.x, 0, firstPos.z);
    wallMesh.worldPos = {x: firstPos.x, z: firstPos.z};
    return wallOutGroup;
}

function GetPillarMesh(pos2D, pos3D, acPos, azimuth) {
    const {x, y, z} = pos2D,
        pillarGeo = new THREE.BoxGeometry(pillarW, y, pillarW),
        pillarMat = new THREE.MeshStandardMaterial({color: 0xEEEEEE}),
        pillarMesh = new THREE.Mesh(pillarGeo, pillarMat),
        pillarGroup = new THREE.Group();
    pillarGroup.position.set(pos3D.x - acPos.x, 0, pos3D.y - acPos.z);
    pillarGroup.rotation.y = azimuth;
    pillarGroup.add(pillarMesh);
    pillarMesh.position.set(x, y / 2, z);
    return pillarGroup;
}

function GetPosArr(nodeArr, idxArr) {
    const posArr = [];
    idxArr.forEach(idx => {
        posArr.push({...nodeArr[idx]});
    });
    return posArr;
}

function GetXMLFacePosArr(lineArr, strArr) {
    var posArr = [], selLineArr = [];
    strArr.forEach((lineId, idx) => {
        const lineItem = lineArr.find(item => item.id === lineId);
        selLineArr.push({...lineItem});
    });
    posArr.push(selLineArr[0].posArr[0], selLineArr[0].posArr[1]);
    selLineArr[0].pass = true;
    while (posArr.length < strArr.length) {
        const lastPosId = posArr[posArr.length - 1].id;
        var nextLine = selLineArr.find(item => (item.posArr[0].id === lastPosId || item.posArr[1].id === lastPosId) && item.pass !== true);
        if (!nextLine) {
            if (lastPosId === posArr[0].id) posArr.pop();
            break;
        }
        nextLine.pass = true;
        const pos0 = nextLine.posArr[0], pos1 = nextLine.posArr[1];
        posArr.push(pos0.id === lastPosId ? pos1 : pos0);
    }

    const repeatArr = [], customArr = [];
	for (let i = 0; i < posArr.length-3; i++) {
		for (let j = i+2; j < posArr.length-1; j++) {
			if (posArr[i].id === posArr[j].id) {
				repeatArr.push({ start: i, end: j });
				break;
			}
		}
	}

	if (repeatArr.length>0) {
		const areaArr = [], area0 = [], repeat0 = repeatArr[0];
		var maxLengthNum = -1, maxLength = -Infinity;
		for (let i = 0; i < repeatArr.length-1; i++) {
			const repeat = repeatArr[i], area = [];
			for (let j = repeat.start; j < repeat.end; j++) {
				area.push(posArr[j]);
			}
			areaArr.push(area);
		}
		for (let i = 0; i < repeat0.start; i++) {
			area0.push(posArr[i]);
		}
		for (let i = repeat0.end; i < posArr.length; i++) {
			area0.push(posArr[i]);
		}
		areaArr.push(area0);
		areaArr.forEach((area, aIdx) => {
			var areaLength = 0;
			for (let i = 0; i < area.length-1; i++) {
				areaLength += GetDis(area[i], area[i+1]);
			}
			if (areaLength>maxLength) {
				maxLength = areaLength;
				maxLengthNum = aIdx;
			}
		});
		if (maxLengthNum!==-1) {
			areaArr[maxLengthNum].forEach(node => {
				customArr.push(node);
			});
		} else {
			posArr.forEach(node => {
				customArr.push(node);
			});
		}
	} else {
		posArr.forEach(node => {
			customArr.push(node);
		});
	}
    return customArr;
}

export function GetIdStr(strLength = 10) {
    const oriStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890-=!@#$%^&*()_+';
    var idStr = '';
    for (let i = 0; i < strLength; i++) {
        idStr += oriStr[Math.floor(oriStr.length * Math.random())]
    }
    return idStr;
}

export function GetShapePath(pos2DArr, type) {
    const shapePath = type === 'shape' ? new THREE.Shape() : new THREE.Path(), lastPos = pos2DArr[pos2DArr.length - 1];
    shapePath.moveTo(lastPos.x, lastPos.z);
    pos2DArr.forEach(pos => {
        shapePath.lineTo(pos.x, pos.z);
    });
    return shapePath;
}

function GetShapeMesh(posArr, meshType, holes = [], manual, pitch, azimuth, shapeType) {
    const lastNode = posArr[posArr.length - 1], holeArr = [];
    const {pos2DArr} = GetShapePosArr(posArr, pitch, azimuth, lastNode, shapeType);
    const testShape = GetShapePath(pos2DArr, 'shape');
    if (holes && holes.length) {
        holes.forEach(holeItem => {
            if (!holeItem.posArr || !holeItem.posArr.length) return;
            const {pos2DArr} = GetShapePosArr(holeItem.posArr, pitch, azimuth, lastNode);
            holeArr.push(pos2DArr);
        });
    }
    const extrudeSettings = {depth: 0.1, bevelEnabled: false};
    const shapeGeo = new THREE.ExtrudeGeometry(testShape, extrudeSettings),
        shapeMat = new THREE.MeshStandardMaterial({color: defaults.ROOF_FACE_COLOR}),
        shapeMesh = new THREE.Mesh(shapeGeo, shapeMat);

    if (manual) shapeMesh.roofFaceId = GetIdStr();
    if (meshType === 'roof') AddShadeMesh(shapeMesh, pos2DArr, holeArr, pitch);
    return {shapeMesh, lastNode, pos2DArr};
}

function GetBlackLineEdge(posArr) {
    const positionsArray = []
    posArr.forEach(pos => {
        positionsArray.push(pos.x, pos.y, pos.z)
    });

    const edgeGeo = new LineGeometry().setPositions(positionsArray);
    const edgeMat = new LineMaterial({
        color: 0x000000,
        linewidth: 3,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
    });

    const edgeMesh = new Line2(edgeGeo, edgeMat);
    edgeMesh.userData.positions = positionsArray;
    return edgeMesh;
}

function GetRoofGroup(houseId = GetIdStr(), edges, faces, manual, self) {
    const roofGroup = new THREE.Group(), meshArr = [], roofMeshArr = [], edgeMeshArr = [], roofBoundArr = [];
    roofGroup.houseId = houseId;
    edges.forEach(edge => {
        if (edge.type === 'ridge' || edge.carport) return;

        // eave, rake, eave(side-diagram) , rake(front), valley(diagram), ridge(interval), hip(middle-rise of mountain)
        const selFace = faces.find(face => face.roofFaceId === edge.roofFaceId);
        const ppInfo = (selFace && selFace.ppInfo) ? selFace.ppInfo : {h: 0, w: 0};
        const wallOutGroup = GetWallMesh(edge.posArr, houseId, meshArr, ppInfo);
        wallOutGroup.userData.flat = edge.flat;
        wallOutGroup.userData.carport = edge.carport;
        roofGroup.add(wallOutGroup);
    });

    const carportArr = faces.filter(face => face.carport === true);
    carportArr.forEach(carport => {
        const {scl, pos, posArr, azimuth, acPos} = carport;
        const pos2DArr = [
            {x: -scl.x / 2 + pillarW / 2, y: posArr[1].y - 0.2, z: -scl.y / 2 + pillarW},
            {x: -scl.x / 2 + pillarW / 2, y: posArr[0].y, z: +scl.y / 2 - pillarW},
            {x: +scl.x / 2 - pillarW / 2, y: posArr[3].y, z: +scl.y / 2 - pillarW},
            {x: +scl.x / 2 - pillarW / 2, y: posArr[2].y - 0.2, z: -scl.y / 2 + pillarW}
        ];

        const cloneTest = testMesh.clone();
        cloneTest.userData.flat = true;
        cloneTest.userData.carport = true;
        cloneTest.position.set(pos.x - acPos.x, 0, pos.y - acPos.z);
        roofGroup.add(cloneTest);

        pos2DArr.forEach(pos2D => {
            const wallOutGroup = GetPillarMesh(pos2D, pos, acPos, azimuth);
            wallOutGroup.userData.flat = true;
            wallOutGroup.userData.carport = true;
            roofGroup.add(wallOutGroup);
        });
    });

    let lastUsedRoofTagIndex = 1;

    faces.forEach((face, fIdx) => {
        const {posArr, pitch, azimuth, holes, lines, flat, buildingName, carport} = face;
        if (!carport) {
            const floorPosArr = [];
            posArr.forEach(item => {
                floorPosArr.push({...item, y: 0});
            });
        }

        const {
            shapeMesh,
            lastNode,
            pos2DArr
        } = GetShapeMesh(posArr, 'roof', holes, manual, pitch, azimuth, 'roofMesh', fIdx===3);

        shapeMesh.rotation.x = Math.PI / 2;
        shapeMesh.receiveShadow = true;
        shapeMesh.houseId = houseId;
        shapeMesh.rotX = GetRadVal(-pitch);
        shapeMesh.rotY = GetRadVal(-azimuth);
        shapeMesh.meshType = 'roof';
        shapeMesh.posArr = posArr;
        shapeMesh.oriMap = shapeMesh.material.map;
        shapeMesh.oriColor = shapeMesh.material.color.getHex();
        shapeMesh.oriAng = face.oriAng;
        shapeMesh.flatRoof = flat;
        shapeMesh.lines = lines || [];
        shapeMesh.userData.buildingName = buildingName;
        shapeMesh.userData.questionableRoof = face.questionableRoof;
        shapeMesh.userData.initialHeight = lastNode.y;
        self.wallHData = shapeMesh.userData.initialHeight;
        self.wallHEdit = shapeMesh.userData.initialHeight;

        useViewerStore.setState({
            wallInitialHeight: shapeMesh.userData.initialHeight,
            wallEditedHeight: shapeMesh.userData.initialHeight
        })

        if (face.textureId) {
            self.setMeshTexture([shapeMesh], roofTextureList.find(t => t.alt === face.textureId).img, "roof", face.textureId);
        } else if (face.color) {
            self.setMeshMaterialColor([shapeMesh], face.color);
        }

        // else{
        //     const roofTotalAreaInnSqFt =  calculateMeshAreaInSquareFeet(shapeMesh)
        //     roofArea = roofTotalAreaInnSqFt / 10.764
        //     if (shapeMesh.holeArr.length) {
        //         shapeMesh.holeArr.forEach(hole => {
        //             holeArea += CalcPolygonArea(hole);
        //         });
        //     }
        // }



        const areaInSqInches = face.size * 144;
        const areaInMeters = face.size / 10.764;

        shapeMesh.size = shapeMesh.userData.roof_area = face.size
        shapeMesh.sizeM = face.sizeM = areaInMeters;
        shapeMesh.sizeInSqInches = face.sizeInSqInches = areaInSqInches;


        if(areaInSqInches < 5200){
            shapeMesh.userData.roof_size_type = "small_face"
        }
        else{
            shapeMesh.userData.roof_tag_id = lastUsedRoofTagIndex
            lastUsedRoofTagIndex++
            shapeMesh.userData.roof_size_type = "normal_face"
        }

        meshArr.push(shapeMesh);
        roofMeshArr.push(shapeMesh);

        const parTest = new THREE.Group();
        roofGroup.add(parTest);
        parTest.parentName = 'parent';
        parTest.userData.flat = flat;
        const subTest = new THREE.Mesh();
        parTest.add(subTest);
        subTest.add(shapeMesh);
        subTest.rotation.x = shapeMesh.rotX;
        parTest.rotation.y = shapeMesh.rotY;
        parTest.position.set(lastNode.x, lastNode.y, lastNode.z);
        shapeMesh.worldPos = {x: lastNode.x, z: lastNode.z};

        if (manual) {
            face.roofFaceId = shapeMesh.roofFaceId;
        } else {
            shapeMesh.roofFaceId = face.roofFaceId;
            if (lines
                && !carport
                && !face.surfaceMount
                && shapeMesh.userData.roof_size_type === 'normal_face'
                && !useViewerStore.getState().accessoryBuildingList.includes(face.buildingName)
            ) {
                AddPathwayMesh(face, shapeMesh, pos2DArr, self);
            }
        }
        AddShadePosArr(face, shapeMesh);
    });
    const boundMesh = GetHouseBound(roofGroup);
    return {roofGroup, boundMesh, meshArr, roofMeshArr, edgeMeshArr, roofBoundArr, newFaceArr: faces};
}

export function CalcPolygonArea(posArr) {
    var total = 0;
    for (var i = 0, l = posArr.length; i < l; i++) {
        const addX = posArr[i].x;
        const addY = posArr[i == posArr.length - 1 ? 0 : i + 1].z;
        const subX = posArr[i == posArr.length - 1 ? 0 : i + 1].x;
        const subY = posArr[i].z;

        total += (addX * addY * 0.5);
        total -= (subX * subY * 0.5);
    }
    return Math.abs(total);
}

function GetHouseBound(roofGroup) {
    const cloneRoof = roofGroup.clone();
    for (let i = cloneRoof.children.length - 1; i >= 0; i--) {
        const child = cloneRoof.children[i];
        if (child.pathName || child.userData.pathName || child.userData.flat) cloneRoof.remove(child);
    }
    const vPos = new THREE.Box3().setFromObject(cloneRoof), {max, min} = vPos;
    const vSize = {x: max.x - min.x, y: max.y - min.y, z: max.z - min.z};
    const boundR = Math.max(vSize.x, vSize.z);
    const boundGeo = new THREE.CylinderGeometry(boundR / 2, boundR / 2, 1, 32);
    const boundMat = new THREE.MeshStandardMaterial({color: 0xFF0000, transparent: true, opacity: 0.4});
    const boundMesh = new THREE.Mesh(boundGeo, boundMat);
    const cPos = {x: (max.x + min.x) / 2, y: (max.y + min.y) / 2, z: (max.z + min.z) / 2};
    boundMesh.houseId = roofGroup.houseId;
    boundMesh.visible = false;
    roofGroup.disY = vSize.y;
    roofGroup.scale.y = 1 / vSize.y;

    roofGroup.sclY = 1;
    roofGroup.children.forEach(child => {
        if (child.userData.flat) return;
        ['x', 'z'].forEach(axis => {
            child.position[axis] -= cPos[axis];
        });
    });
    boundMesh.position.set(cPos.x, 0, cPos.z);
    boundMesh.oriPos = {...boundMesh.position};
    roofGroup.position.set(cPos.x, 0, cPos.z);
    return boundMesh;
}

const crownGeo = new THREE.SphereGeometry(0.5, 32, 32),
    crwonMat = new THREE.MeshStandardMaterial({color: 0x90EE90}),
    crownDefault = new THREE.Mesh(crownGeo, crwonMat);
crownDefault.crownScl = {x: 1, y: 1, z: 1};

function GetTreeObj(treeInfo, crownModel) {
    const {x, y} = treeInfo, obstId = GetIdStr(), normalCrown = crownModel || crownDefault,
        crownMesh = normalCrown.clone();
    const {map, color, transparent} = crownMesh.material;
    crownMesh.material = new THREE.MeshStandardMaterial({color: 0x90EE90, map, transparent, depthWrite: true, side: 1});
    crownMesh.crownScl = {...normalCrown.crownScl};
    crownMesh.mapSrc = normalCrown.material.map;
    const treeGroup = new THREE.Group(),
        trunkGeo = new THREE.CylinderGeometry(1, 1, 1),
        crownColor = crownMesh.material.color,
        trunkColor = new THREE.Color(0.6 + Math.random() * 0.4, 0.2 + Math.random() * 0.2, 0),
        trunkMat = new THREE.MeshStandardMaterial({color: trunkColor}),
        trunkMesh = new THREE.Mesh(trunkGeo, trunkMat),
        wrapperGeo = new THREE.CylinderGeometry(1, 1, 1, 8),
        wrapperMat = new THREE.MeshBasicMaterial({color: 0xFFFFFF, transparent: true, wireframe: true}),
        wrapperMesh = new THREE.Mesh(wrapperGeo, wrapperMat);
    wrapperMesh.obstId = crownMesh.obstId = trunkMesh.obstId = treeGroup.obstId = obstId;
    wrapperMesh.meshType = crownMesh.meshType = trunkMesh.meshType = 'tree';
    wrapperMesh.visible = false;
    wrapperMesh.treeFrame = true;
    crownMesh.oriColor = crownColor.getHex();
    trunkMesh.oriColor = trunkColor.getHex();
    treeGroup.add(crownMesh, trunkMesh, wrapperMesh);
    treeGroup.position.set(x, 0, y);
    wrapperMesh.worldPos = {x, z: y};
    return treeGroup;
}

function ModelLoadInit(self) {
    self.setTopView(false);
    self.setAutoRotate(false);
    self.irradianceData = null;
    self.viewMode = '3d';
    self.camera.position.set(0, 100, 80);
    self.setCameraView('3d',true);
    SaveEdgeCount(self.roofs[0].edges);
    self.selTypeMeshArr = [];
    self.flagModulePathway = true;
    self.flagLineSnap = true;
    self.houseTransPos = {x: 0, z: 0};
}

function InitStateValue(self) {
    useViewerStore.setState({
        roofCircleSolar: 0,
        roofCircleTOF: 0,
        roofCircleTSRF: "Calculating...",
        roofIrradiance: 0,
        utilityWattage: 0,
        roofAreaSize: 0,
        totalSystemSize: 0,
        modeCircleSolar: 0,
        modeCircleTOF: 0,
        modeCircleTSRF: 0,
        modeIrradiance: 0,
        actualWattage: 0,
        modeCount: 0,
        modeCount33Arr: [],
        efficiency: "Calculating...",
        roofChartSolar: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        roofChartIrr: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        modeChartSolar: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        modeChartIrr: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        roofInfoArr: [],
        roofIrrArr: [],
        multiplier: "Calculating...",
        localMultiplier: 0,
        localModeInfo: [],
        localLocation: {},
        localFaceIdStr: [],
        localHoleInfo: [],
        localEdgeCount: {},
        localAngIdeal: [],
        localFacePtHash: [],
        localAngMultiplierArr: [],
        epcPriceData:[],
        ppwValue:0,
        freezePPW: false,
        initialPPWReady: false,
        epcValue:0,
        pricingType : 'PPW',
        pricingValue : "",
        escalatorValue : '2.9',
        annualUsage : '0',
        epcEstimatedProduction : '',
        epcMessage : '',
        epcCalculatedPrice: '- Quote Not Run -',
        totalSunnovaEPCWithTrees: '- Quote Not Run -',
        settingsSolarRate:undefined,
        moduleMultiplierAverage: 0,
    });
    self.irrCSVDateArr = null;
    self.irrCSVMainData = null;
    self.sunVecArr = null;
    self.buildingAlt = null;
    self.meshArr = [];
    self.buildingArr = [];
    self.moduleDir = 'both';
    InitStep(self);
}

export function calculateMeshAreaInSquareFeet(mesh) {
    // Ensure that the geometry is a BufferGeometry for ease of processing
    let geometry = mesh.geometry.isBufferGeometry ? mesh.geometry : new THREE.BufferGeometry().fromGeometry(mesh.geometry);

    // Check if the geometry has a defined index (for indexed BufferGeometry)
    const isIndexed = geometry.index !== null;
    const vertices = geometry.attributes.position.array;
    let totalArea = 0;

    const calculateTriangleArea = (a, b, c) => {
        // Simplified area calculation for 2D triangles
        return 0.5 * Math.abs(a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
    };

    if (isIndexed) {
        const indices = geometry.index.array;
        for (let i = 0; i < indices.length; i += 3) {
            const a = new THREE.Vector3().fromArray(vertices, indices[i] * 3);
            const b = new THREE.Vector3().fromArray(vertices, indices[i + 1] * 3);
            const c = new THREE.Vector3().fromArray(vertices, indices[i + 2] * 3);
            totalArea += calculateTriangleArea(a, b, c);
        }
    } else {
        for (let i = 0; i < vertices.length; i += 9) {
            const a = new THREE.Vector3(vertices[i], vertices[i + 1], 0);
            const b = new THREE.Vector3(vertices[i + 3], vertices[i + 4], 0);
            const c = new THREE.Vector3(vertices[i + 6], vertices[i + 7], 0);
            totalArea += calculateTriangleArea(a, b, c);
        }
    }

    // Convert to square feet if needed, assuming 1 unit = 1 foot
    return totalArea * 5.38156348687479
}

async function LoadTree(self) {
    let object = await LoadTreeModel(self);

    object = object.scene.children[0];
    object.material.transparent = true;
    object.material.map = mapDefaultCrown;
    object.material.side = 0;
    const vPos = new THREE.Box3().setFromObject(object), vSize = vPos.getSize(new THREE.Vector3());
    object.crownScl = {x: 1 / vSize.x, y: 1 / vSize.y, z: 1 / vSize.z};
    self.crownModel = object;
    self.virTree = GetTreeObj({x: 0, y: 0}, object);
    self.virTree.visible = false;
    SetTreeSize(self, self.virTree, {height: 8, crown_radius: 4, crown_height: 5, trunk_radius: 0.4});
    self.totalGroup.add(self.virTree);

    LoadCrownMap(self);
}

export async function LoadModelJson(self, testRoofJson, modelType) {

    if (testRoofJson === null || testRoofJson === "" || !testRoofJson) return;

    siteCalculationState.reset();

    const loadingContext = new LoadingContext();
    loadingContext.setDefaultTitle('Drawing Site...');

    try {
        loadingContext.setMessage({ message: 'Getting Tree Model...' });
        await LoadTree(self);

    } catch (err) {
        logger.error(err, 'Some error occurred while loading tree model');
        loadingContext.dispose();
        self.viewerAlert({
            show: true,
            title: "Tree Model Error",
            message: `Some error occurred while loading tree model`,
            messageType: "error",
            isModal: true
        })
        return
    }
    self.mapFormat = 'JSON';

    loadingContext.setMessage({ message: 'Parsing Data...' });

    const {
        buildings,
        roofs,
        trees,
        obstructions,
        origin,
        sunInfo,
        irrCSVMainData,
        irradianceMonth,
        localAngIdealArr,
        localFacePtHashArr,
        localAngMultiplierInfo,
        weatherStationName,
        mapPosition
    } = testRoofJson, {latitude, longitude} = origin;

    InitStateValue(self);

    const activeModuleName = roofs[0].faces.flatMap(f => f.moduleArr?.map(m => m.selSize.text) ?? [])[0];
    if (activeModuleName) {
        const moduleList = useViewerStore.getState().moduleList;
        const activeModule = moduleList.find(m => m.text === activeModuleName);
        if (activeModule) {
            useViewerStore.setState({activeModule: activeModule});
        }
    }

    SetTerrain(self, origin);

    self.mapCoordinates = self.modelGroup.mapLocation = origin;
    self.weatherStationName = weatherStationName;
    useViewerStore.setState({localLocation: origin});

    if (modelType === 'glb') {
        self.sunInfo = sunInfo;
        self.sunVecArr = CreateSunVecArr(sunInfo);
        self.irrCSVMainData = irrCSVMainData;
        useViewerStore.setState({
            localAngIdeal: localAngIdealArr,
            localFacePtHash: localFacePtHashArr,
            localAngMultiplierArr: localAngMultiplierInfo,
        });
    } else {
        self.sunInfo.lat = latitude;
        self.sunInfo.lon = longitude;
        self.sunInfo.utcOffset = null;
        self.sunInfo.timezone = null;
    }

    self.fetchMapImageAndLoadOnPlane('google')

    roofs.forEach(building => {
        building.roofSize = 0;
        building.faces.forEach(face => {
            building.roofSize += face.sq_footage || 0;
        });
    });

    roofs.sort((a, b) => b.roofSize - a.roofSize);

    var minVal = Infinity, nodeCount = 0;
    roofs.forEach((roof, idx) => {
        const {nodes, edges, faces} = roof;
        nodes.forEach(pos => {
            pos.Y *= -1;
            if (pos.Z < minVal) minVal = pos.Z;
        });
        const buildingName = idx + 1

        faces.forEach((face) => {
            if (!face.buildingName) {
                face.buildingName = buildingName;
            }
        });

        if (idx > 0) {
            faces.forEach(face => {
                for (let i = 0; i < face.shell.length; i++) {
                    face.shell[i] += nodeCount;
                }
                if (face.holes && face.holes.length) {
                    face.holes.forEach(hole => {
                        for (let i = 0; i < hole.length; i++) {
                            hole[i] += nodeCount;
                        }
                    });
                }
            });
            edges.forEach(edge => {
                for (let i = 0; i < edge.nodes.length; i++) {
                    edge.nodes[i] += nodeCount;
                }
            });

            roofs[0].nodes.push(...nodes);
            roofs[0].faces.push(...faces);
            roofs[0].edges.push(...edges);
        }
        nodeCount += nodes.length;
    });

    const {nodes, faces, edges} = roofs[0];
    const nodeArr = nodes.map(pos => ({x: pos.X, y: pos.Z, z: pos.Y, oldY: pos.Z}));

    edges.forEach(edge => {
        edge.posArr = GetPosArr(nodeArr, edge.nodes);
    });
    const holeInfoArr = [], angArr = [];
    faces.forEach((face, idx) => {
        const {shell, sq_footage, holes, pitch, azimuth} = face, facePosArr = GetPosArr(nodeArr, shell);
        const existAng = angArr.find(item => item.tilt === GetRoundNum(pitch,2) && item.azimuth === GetRoundNum(azimuth,4));
        if (!existAng) angArr.push({tilt: GetRoundNum(pitch,2), azimuth : GetRoundNum(azimuth,4)});
        face.oriAng = {tilt: GetRoundNum(pitch,2), azimuth: GetRoundNum(azimuth,4)};
        face.posArr = facePosArr;
        face.sq_footage_from_aurora = sq_footage;
        face.size = sq_footage;


        var faceHole = 'null';
        if (holes && holes.length) {
            faceHole = [];
            holes.forEach(holeItem => {
                holeItem.posArr = GetPosArr(nodeArr, holeItem);
                faceHole.push({posArr: holeItem.posArr});
            });
        }
        holeInfoArr.push(faceHole);
    });

    useViewerStore.setState({localHoleInfo: holeInfoArr});
    self.roofs = roofs;

    self.wallHData = minVal;
    self.wallHEdit = minVal;

    useViewerStore.setState({
        wallInitialHeight: minVal,
        wallEditedHeight: minVal
    });

    self.roofRotY = null;

    siteCalculationState.registerCalculation(SHADE_CALCULATIONS, async ({needsUpdate}) => {
        const {roofs} = self;
        const faces = needsUpdate.some(n => n === undefined || n === true)
            ? roofs[0].faces
            : roofs[0].faces.filter(f => needsUpdate.includes(f.roofFaceId));
        await GenShadeOnFace(faces, self);
    }, { needsUpdate: true });
    siteCalculationState.addUpdatedListener(SHADE_CALCULATIONS, async () => {
        siteCalculationState.needsUpdate(MODULE_GRAPH);
        await siteCalculationState.useCalculations(MODULE_GRAPH);
    });

    siteCalculationState.registerCalculation(ACCESS_MULTIPLIERS, async ({needsUpdate}) => {
        const activeRoofMeshArr = [], angArr = [], location = useViewerStore.getState().localLocation;
        const faces = self.roofs[0].faces;

        self.modelGroup.children[0].traverse(child => {
            if (child.roofFaceId === undefined || child.disableModule || activeRoofMeshArr.length === faces.length) return;
            const face = faces.find(f => f.roofFaceId === child.roofFaceId);
            child.oriAng = {...face.oriAng};
            const existAng = angArr.find(item => item && GetRoundNum(item.tilt, 2) === GetRoundNum(child.oriAng.tilt, 2) && GetRoundNum(item.azimuth, 4) === GetRoundNum(child.oriAng.azimuth, 4));
            if (!existAng) {
                angArr.push({ ...face.oriAng });
            } else {
                angArr.push(null);
            }
            activeRoofMeshArr.push(child);
        });

        await GetFaceProdAPI(location, angArr, activeRoofMeshArr, Math.min(...needsUpdate));
    }, { needsUpdate: 0 });
    siteCalculationState.addUpdatedListener(ACCESS_MULTIPLIERS, async () => {
        siteCalculationState.needsUpdate(FACE_IDEAL_API);
        await siteCalculationState.useCalculations(FACE_IDEAL_API);
    });

    siteCalculationState.registerCalculation(MODULE_GRAPH, async () => {
        SetModuleGraph(self.roofMeshArr);
    }, { needsUpdate: true });

    siteCalculationState.registerCalculation(FACE_IDEAL_API, async () => {
        // await siteCalculationState.useCalculations(ACCESS_MULTIPLIERS);
        const activeRoofMeshArr = [], angArr = [], location = useViewerStore.getState().localLocation;
        self.modelGroup.children[0].traverse(child => {
            if (child.roofFaceId === undefined || child.disableModule || activeRoofMeshArr.length === faces.length) return;
            const face = faces.find(f => f.roofFaceId === child.roofFaceId);
            child.oriAng = {...face.oriAng};
            const existAng = angArr.find(item => item && GetRoundNum(item.tilt, 2) === GetRoundNum(child.oriAng.tilt, 2) && GetRoundNum(item.azimuth, 4) === GetRoundNum(child.oriAng.azimuth, 4));
            if (!existAng) {
                angArr.push({ ...face.oriAng });
            }
            activeRoofMeshArr.push(child);
        });
        await GetFaceIdealAPI(location, angArr);
    }, { needsUpdate: true });
    siteCalculationState.addUpdatedListener(FACE_IDEAL_API, async () => {
        siteCalculationState.needsUpdate(SHADE_CALCULATIONS);
        await siteCalculationState.useCalculations(SHADE_CALCULATIONS);
    });

    self.roofJson = null;

    CreateRoof(self, 'init', modelType);
    EmptyGroup(self.obstGroup);
    CreateObstructions(self, obstructions);
    if (modelType === 'glb') {
        /**** For calculating irradiancemonth for saved data ***********/
        const oldIrradianceMonth = roofs[0]?.faces[0]?.irradianceMonth;
        if(!irradianceMonth || irradianceMonth === undefined || irradianceMonth.length === 0){
            if(oldIrradianceMonth){
                useViewerStore.setState({irradianceMonth: oldIrradianceMonth});
                self.irradianceMonth = oldIrradianceMonth;
            } else {
                await GetTimeZone(self);
            }
        } else {
            useViewerStore.setState({irradianceMonth: irradianceMonth});
            self.irradianceMonth = irradianceMonth;
        }

        /**** For calculating irradinacemonth for saved data ***********/
        SetSunPathGeo(self.sunGroup, self.sunVecArr, sunInfo);
    } else {
        loadingContext.setMessage({ message: 'Getting Time Zone and Shade...' });
        await GetTimeZone(self);
    }

    EmptyGroup(self.treeGroup);
    trees.forEach(treeInfo => {
        return;
        treeInfo.y *= -1;
        treeInfo.crown_radius *= 2;
        const treeGroup = GetTreeObj(treeInfo, self.crownModel);
        treeGroup.children.forEach(child => {
            self.meshArr.push(child);
            child.castShadow = true;
        });
        treeGroup.select = false;
        if (modelType === 'glb' && treeInfo.incrossArr) {
            treeGroup.children[2].incrossArr = treeInfo.incrossArr;
        }

        if (treeInfo.delStatus !== undefined) {
            ChangeTreeDelete(treeGroup, treeInfo.delStatus);
        }

        if (treeInfo.crownKey) {
            ChangeTreeShape(self, treeGroup, treeInfo.crownKey);
        }

        self.treeGroup.add(treeGroup);
        SetTreeSize(self, treeGroup, treeInfo);
    });

    ModelLoadInit(self);

    self.visibleInfo.modules = true;

    SetLineSnap(self, true);
    self.reLabelTreeGroup();

    self.obstGroup.children.forEach(obst => {
        if (obst.children[0].children[0].children[0].userData.delStatus) {
            DeleteObst(obst, self.modelGroup, self);
        }
    });

    if (mapPosition) {
        self.mapMesh.position.set(mapPosition.x, self.mapMesh.position.y, mapPosition.z);
    }

    setTimeout(() => {
        if (buildings && buildings[0].wallHeight) {
            self.setWallSize(buildings[0].wallHeight);
            self.wallHData = buildings[0].wallHeight;
        }
    }, 200);

    siteCalculationState.needsUpdate(ACCESS_MULTIPLIERS, 0);
    siteCalculationState.useCalculations(ACCESS_MULTIPLIERS);

    sleep(1000).then(async () => {
        // renderer does not fully load if document is not in focus, causing shade calculations to be incorrect
        // rerun shade calculations if document was not focused

        const focused = document.hasFocus();
        while (!document.hasFocus()) {
            await sleep(250);
        }

        if (!focused) {
            siteCalculationState.needsUpdate(SHADE_CALCULATIONS);
        }

        await siteCalculationState.useCalculations(SHADE_CALCULATIONS);
    });
    useViewerStore.setState({loadingCompleted: true})

    loadingContext.dispose();
}

function CreateObstructions(self, obstructions) {
    obstructions.forEach((item) => {
        const normal_top = item.normal_top || {X: 0, Y: 0, Z: 1}, posArr = [],
            zReverse = self.mapFormat === 'XML' ? 1 : -1,
            {nodes, type} = item,
            virObsMesh = self.virObs.children[0].children[0].children[0];
        const originalNodes = JSON.parse(JSON.stringify(nodes));
        self.pushMode = true;
        self.virObs.visible = true;

        if (type === 'polygon' || type === 'obst-cube') {

            //Log if width and heigth is NaN
            if(isNaN(item.width) || isNaN(item.length)){
               console.log(item)

            }

            if (item.width && item.height && item.length) {
                const oldY = item.y * -1;
                item.y = item.z;
                item.z = oldY;

                nodes.forEach(node => {
                    const oldY = node.Y * zReverse;
                    node.Y = node.Z;
                    node.Z = oldY;
                });
            } else {
                var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxY = -Infinity;
                nodes.forEach(node => {
                    const oldY = node.Y * zReverse;
                    node.Y = node.Z;
                    node.Z = oldY;
                    if (minX > node.X) minX = node.X;
                    if (maxX < node.X) maxX = node.X;
                    if (minZ > node.Z) minZ = node.Z;
                    if (maxZ < node.Z) maxZ = node.Z;
                    if (maxY < node.Y) maxY = node.Y;
                    posArr.push({x: node.X, y: node.Y, z: node.Z});
                });

                if (normal_top.x !== 0 || normal_top.y !== 0) {
                    nodes.forEach((node, idxN) => {
                        const posN = idxN===nodes.length-1?nodes[0]:nodes[idxN+1];
                        const dX = Math.abs(node.X - posN.X), dZ = Math.abs(node.Z - posN.Z);
                        if (dX > dZ) {
                            item.groundRotY = -Math.atan2(node.Z - posN.Z, node.X - posN.X);
                            item.width = GetDis(node, posN, true);
                        } else {
                            item.length = GetDis(node, posN, true);
                        }
                    });

                    if (isNaN(item.width) || isNaN(item.length) || (item.width === undefined || item.length === undefined)) {
                        const side1 = GetDis(nodes[0], nodes[1], true);
                        const side2 = GetDis(nodes[1], nodes[2], true);

                        if (isNaN(item.width)  || (item.width === undefined || item.length === undefined) ) {
                            item.width = Math.abs(item.length - side1) < Math.abs(item.length - side2) ? side2 : side1;
                        }
                        if (isNaN(item.length) || (item.width === undefined || item.length === undefined) ) {
                            item.length = Math.abs(item.width - side1) < Math.abs(item.width - side2) ? side2 : side1;
                        }
                    }
                } else {
                    item.width = maxX - minX;
                    item.length = maxZ - minZ;
                }

                if (item.width === 0 || item.height === 0) {
                    return;
                }

                item.x = (minX + maxX) / 2;
                item.z = (minZ + maxZ) / 2;
                item.y = maxY;
            }
        } else {
            const oldY = item.y * -1;
            item.y = item.z;
            item.z = oldY;
            item.width = item.radius * 2;
            item.length = item.radius * 2;
        }

        virObsMesh.sides = 8;
        SetVirObst(self, item);
        self.virObs.visible = true;
        virObsMesh.userData.delStatus = item.delStatus;
        virObsMesh.userData.initialHeight = self.virObs.position.y;
        virObsMesh.userData.nodes = originalNodes;

        SetCloneVirObj(self, nodes || true, normal_top.X === 0 && normal_top.Y === 0);
    });

    SetDefaultObst(self);
}

function SetDefaultObst(self) {
    self.pushMode = true;
    self.virObs.visible = true;

    ChangeObstShape(self, 1);
    ChangeObstWidth(self, defaultObsW);
    ChangeObstLength(self, defaultObsW);
    ChangeObstHeight(self, defaultObsW);
    ChangeObstSides(self, 6);
    ChangeObstRadius(self, defaultObsW);

    setTimeout(() => {
        self.pushMode = false;
        self.virObs.visible = false;
    }, 0);
    if (!apiFlagPathway) SetPathway(self);
}

function SetVirObst(self, info) {
    const {virObs, roofMeshArr, mapMesh} = self, {x, y, z, type, radius, width, length, height, groundRotY} = info;
    const virMesh = virObs.children[0].children[0].children[0];

    let shape;
    if (type === 'polygon' || type === 'obst-cube') {
        shape = 1;
    } else if (type === 'circle' || type === 'obst-polygon') {
        shape = 2;
    } else if (type === 'cube' || type === 'obst-cylinder' || type === 'cylinder') {
        shape = 3;
    }

    ChangeObstShape(self, shape);

    if (shape === 2 || shape == 3) {
        ChangeObstRadius(self, radius * 2, true);
    } else {
        ChangeObstWidth(self, width);
        ChangeObstLength(self, length);
    }

    const arrowOrigin = new THREE.Vector3(x, y, z);
    const arrowDir = new THREE.Vector3(0, -1, 0);
    const raycaster = new THREE.Raycaster(arrowOrigin, arrowDir);
    const intersects = raycaster.intersectObjects([...roofMeshArr, mapMesh], false);
    const intersect = intersects.find(i => i.object.meshType === 'roof') ?? intersects[0];
    const vHeight = height || (y - Math.max(0, intersect?.point.y ?? 0));
    ChangeObstHeight(self, vHeight);
    virObs.position.set(x, y - vHeight, z);
    if (!intersect) return;

    const {object, point} = intersect;
    const {rotX, rotY} = object;

    virMesh.rotX = rotX || 0;
    virMesh.rotY = rotY || 0;

    if (object.meshType === 'roof') {
        virObs.roofId = virMesh.roofId = object.roofFaceId;
    } else {
        virObs.roofId = virMesh.roofId = null;
        virMesh.roofPos = null;
        if (shape===1 && groundRotY) {
            virMesh.rotY = groundRotY;
        }
    }
    virMesh.roofPos = {x: point.x, y: point.y, z: point.z};
}

export function CreateRoof(self, type, modelType) {
    const oldRoof = self.roofGroup.children[0];
    let oldHouseId = oldRoof ? oldRoof.houseId : undefined;
    self.meshArr = self.meshArr.filter(mesh => mesh.meshType === 'tree' || mesh.meshType === 'obst');

    EmptyGroup(self.roofGroup);
    if (!self.roofs) return;
    self.mapMesh.visible = true;
    const {nodes, faces, edges} = self.roofs[0], nodeArr = [], nodeRoofArr = [];

    if (faces[0].houseId) oldHouseId = faces[0].houseId;

    const {
        roofGroup,
        boundMesh,
        meshArr,
        roofMeshArr,
        newFaceArr
    } = GetRoofGroup(oldHouseId, edges, faces, type === 'init', self);
    roofGroup.scale.y = roofGroup.sclY;
    roofGroup.rotation.y = self.roofRotY || 0;
    roofGroup.userData.originalPosition = roofGroup.position;
    self.roofGroup.add(roofGroup);

    useViewerStore.setState({localFaceIdStr: newFaceArr.map(face => face.roofFaceId)});

    self.nodeArr = [];
    self.nodeRoofArr = [];

    for (const node of self.roofs[0].nodes) {
        self.nodeArr.push({x: node.X, y: 0, z: node.Y});
        self.nodeRoofArr.push({x: node.X, y: node.Z, z: node.Y});
    }

    if (type === 'init') {
        if (apiFlagPathway) {
            if (modelType !== 'glb') {
                const apiCount = Math.ceil(nodes.length / 99), latlonStrArr = [];
                for (let i = 0; i < apiCount; i++) {
                    const lastNum = 99 * (i + 1) < nodes.length ? 99 : nodes.length - 99 * i;
                    var latlonStr = i === 0 ? self.mapCoordinates.latitude + ',' + self.mapCoordinates.longitude + '|' : '';
                    for (let j = 0; j < lastNum; j++) {
                        const nodeNum = i * 99 + j, node = nodes[nodeNum];
                        if (!node.X && !node.Y) {
                            node.X = node.x;
                            node.Y = node.z;
                            node.Z = node.y;
                        }
                        const location = GetLatLon(self.mapCoordinates, {x: node.X, z: node.Y});
                        if (j > 0) latlonStr += '|';
                        latlonStr += location.latitude + ',' + location.longitude;
                    }
                    latlonStrArr.push(latlonStr);
                    if (latlonStrArr.length === apiCount) {
                        GetNearRoadPoint(self, latlonStrArr).then(nearPoint => {
                            self.roadNearPoint = nearPoint;
                            SetPathway(self, modelType);
                        });
                    }
                }
            } else {
                SetPathway(self, modelType);
            }
        } else {
            nodes.forEach(pos => {
                nodeArr.push({x: pos.X, y: 0, z: pos.Y});
                nodeRoofArr.push({x: pos.X, y: pos.Z, z: pos.Y})
            });
            self.nodeArr = nodeArr;
            self.nodeRoofArr = nodeRoofArr;
        }

        self.roofs[0].faces = [...newFaceArr];
        self.boundGroup.add(boundMesh);
    }

    self.meshArr.push(...meshArr);
    self.roofMeshArr = roofMeshArr;
    self.wallMeshArr = meshArr.filter(mesh => mesh.name.includes('wallMesh'));

    for (const roof of self.roofs) {
        if (roof.building_usage_type === 'accessory') {
            self.preSelRoofId = roof.faces[0].roofFaceId;
            SetBuildingModule(self, true);
            self.preSelRoofId = undefined;
        }
    }

    if (type === 'pathway') {
        self.roofLines = GetRoofLines(self.roofMeshArr);
        if (modelType === 'glb') {
            SetPreModuleArr(self);
            self.modelGroup.totalShadeCount = 0;
            self.roofMeshArr.forEach((shapeMesh, rIdx) => {
                const selFace = faces[rIdx];
                const shadeArr = shapeMesh.children.filter(item => item.shadePoint === true);
                shadeArr.forEach((shade, sIdx) => {
                    if (sIdx >= selFace.shadeInfo.length) return;
                    const {onModule, monthArr, ptHashVal} = selFace.shadeInfo[sIdx];
                    shade.onModule = onModule;
                    shade.monthArr = [...(monthArr ?? [])];
                    shade.ptHashVal = ptHashVal ?? 0;
                });
            });
            self.roofMeshArr.forEach((shapeMesh, rIdx) => {
                if (shapeMesh.disableModule) return;
                self.modelGroup.totalShadeCount++;
                const selFace = faces[rIdx];
                const modules = [];
                const moduleArr = selFace.moduleArr ?? [];

                // make sure no duplicate modules are loaded
                for (const module of moduleArr) {
                    if (modules.find(m => m.moduleId === module.moduleId)) {
                        continue;
                    }

                    modules.push(module);
                }

                shapeMesh.moduleArr = modules;
                shapeMesh.userData.moduleCount = {...selFace.moduleCount};

                //Recalculate the max fill for the roof
                SetMaxFillForRoofs(self)

                self.hideObject("GhostObst", true);

                const showLabel = useViewerStore.getState().isModuleMultiplierLabelVisible;

                modules.forEach((item) => {
                    AddIndividualMode(shapeMesh, item, true, self.moduleMeshArr, self.meshArr, showLabel);
                });
            });
            SetShadeFinalResult(self);
        } else {
            CheckDefaultObst(self.obstGroup.children);
            SetModuleArr(self, 'moduleCount', null, 'port');
            SetModuleArr(self, 'moduleCount', null, 'land');
            SetModuleArr(self, 'moduleCount', null, 'both');
        }

        for (const obst of self.obstGroup.children) {
            CustomObstAng(obst);
        }
    }
    if (type !== 'init') {
        if (modelType !== 'glb') {
            CheckDefaultObst(self.obstGroup.children);
            SetModuleArr(self, 'oldMode');
            const cloneRoofArr = [];
            roofMeshArr.forEach((roofMesh, rIdx) => {
                const {roofFaceId, size, posArr} = roofMesh;
                cloneRoofArr.push({roofFaceId, size})
            });

            SetPathwaysForBuildings(self, roofMeshArr);
        } else {
            const roofModules = [];

            roofMeshArr.forEach(roof => {
                roofModules.push({
                    roofFaceId: roof.roofFaceId,
                    moduleArr: getRoofModuleMeshes(roof).map(m => getModuleMeshInfo(m))
                });
                roof.children.forEach(child => {
                    if (child.pathwayId) {
                        SetPathwayValue(self, child.pathwayId, !!roof.lines.find(l => l.lineId === child.pathwayId)?.active);
                    }
                });
            });

            useViewerStore.setState({localModeInfo: roofModules});
        }
        // console.log(roofMeshArr);
        // const cloneRoofArr = [];
        // roofMeshArr.forEach((roofMesh, rIdx) => {
        //     const {roofFaceId, size, posArr} = roofMesh;
        //     cloneRoofArr.push({roofFaceId, size, posArr, rIdx});
        // });
        // cloneRoofArr.sort((a, b) => a.size - b.size);
        // console.log(cloneRoofArr);

        const roofPos = roofGroup.position, edgeMeshArr = [];
        roofMeshArr.forEach(roofMesh => {
            const {pos2DArr} = roofMesh, pos3DArr = [];
            pos2DArr.forEach(pos2D => {
                const cloneTest = testMesh.clone();
                cloneTest.position.set(pos2D.x, pos2D.z, pos2D.y);
                roofMesh.add(cloneTest);
                const wPos = cloneTest.getWorldPosition(new THREE.Vector3());
                pos3DArr.push({...wPos});
                roofMesh.remove(cloneTest);
            });
            const posFirst= pos3DArr[0];
            pos3DArr.push(posFirst);
            const edgeMesh = GetBlackLineEdge(pos3DArr);
            edgeMesh.position.set(-roofPos.x, 0, -roofPos.z);
            edgeMeshArr.push(edgeMesh);
            roofGroup.add(edgeMesh);
        });
        self.edgeMeshArr = edgeMeshArr;
    }
}

function GetRoofLines(roofMeshArr) {
    const roofLines = [];
    roofMeshArr.forEach(roofMesh => {
        const {posArr} = roofMesh;
        posArr.forEach((pos, idx) => {
            roofLines.push({start: pos, end: posArr[idx + 1] ?? posArr[0]});
        });
    });
    return roofLines;
}

async function GetNearRoadPoint(self, latlonStrArr) {
    const apiDataArr = [];
    let latlong;

    for (let apiNum = 0; apiNum < latlonStrArr.length; apiNum++) {
        const latlonStr = latlonStrArr[apiNum];
        const res = await axios.get(`${process.env.REACT_APP_GOOGLE_NEAREST_ROAD_API_URL}?points=${latlonStr}&key=${process.env.REACT_APP_GOOGLE_NEAREST_ROAD_API_KEY}`);
        if (res.status !== 200 || !res.data || !res.data.snappedPoints) {
            return undefined;
        }

        res.data.snappedPoints.forEach(resItem => {
            apiDataArr.push({...resItem, apiPartNum: apiNum});
        });

        if (apiNum === latlonStrArr.length - 1) {
            latlong = {...res.data.snappedPoints[0].location};
        }
    }

    apiDataArr.forEach(nearRoad => {
        const {originalIndex, location, apiPartNum} = nearRoad;
        if (originalIndex === 0 && apiPartNum === 0) {
            latlong = location;
        }
    });

    return GetXYZ(self.mapCoordinates, latlong);
}

export async function LoadModelXML(self, testRoofXml) {
    self.mapFormat = 'XML';
    self.sunInfo.utcOffset = null;
    self.sunInfo.timezone = null;

    InitStateValue(self);

    siteCalculationState.reset();

    const loadingContext = new LoadingContext();
    loadingContext.setDefaultTitle('Drawing Site...');

    await LoadTree(self);
    await parseXML(testRoofXml,self);
}

function pitchOn12ToDegrees(pitchOn12) {
    return Math.atan(pitchOn12 / 12) * (180 / Math.PI);
}

function GetGroupDeltaY(group) {
    const pos2DArr = [];
    group.children.forEach(node => {
        const wPos = node.getWorldPosition(new THREE.Vector3());
        pos2DArr.push({...wPos});
    });
    const minY = Math.min(...pos2DArr.map(pos => pos.y)),
        maxY = Math.max(...pos2DArr.map(pos => pos.y));
    return maxY - minY;
}

function GetXMLPitchVal(posArr, azimuth, pitch) {
    const pitchVal = pitchOn12ToDegrees(parseFloat(pitch));
    const outGroup = new THREE.Group();
    posArr.forEach(pos => {
        const cloneTest = testMesh.clone();
        cloneTest.position.set(pos.x, pos.y, pos.z);
        cloneTest.scale.multiplyScalar(3);
        outGroup.add(cloneTest);
    });
    outGroup.rotation.set(GetRadVal(pitchVal), GetRadVal(azimuth), 0);
    if (GetGroupDeltaY(outGroup) < 0.01) return pitchVal;
    const angRange = 3, stepCount = 30, angUnit = angRange / stepCount;
    var minDeltaY = Infinity, newPitchVal = pitchVal;
    for (let i = pitchVal - angRange; i <= pitchVal + angRange; i+=angUnit) {
        outGroup.rotation.x = GetRadVal(i);
        if (GetGroupDeltaY(outGroup) < minDeltaY) {
            minDeltaY = GetGroupDeltaY(outGroup);
            newPitchVal = i;
        }
    }
    return newPitchVal;
}

async function parseXML(xml, self) {
    const result = parser(xml);
    if (!result || !result.root) return;

    const location = result.root.children.find(child => child.name === 'LOCATION').attributes;
    const {
        lat,
        long,
        address,
        city,
        state
    } = location;

    self.mapCoordinates = self.modelGroup.mapLocation = {latitude: lat, longitude: long}
    useViewerStore.setState({localLocation: {latitude: lat, longitude: long}});

    self.sunInfo.lat = Number(lat);
    self.sunInfo.lon = Number(long);

    SetTerrain(self, self.mapCoordinates);

    const stateName = state.split('-')[0].trim();

    useViewerStore.setState({ siteAddress: `${address}, ${city}, ${stateName}`});

    self.fetchMapImageAndLoadOnPlane('mapbox');

    const mainChild = result.root.children.find(child => child.name === 'STRUCTURES');

    if (!mainChild) return;

    var minVal = Infinity;
    const roofs = [], obstructions = [];
    const rotation = -degToRad(parseFloat(mainChild.attributes.northorientation));
    mainChild.children.forEach(group => {
        if (group.name !== 'ROOF') return;
        const nodeData = group.children.find(item => item.name === 'POINTS');
        const lineData = group.children.find(item => item.name === 'LINES');
        const faceData = group.children.find(item => item.name === 'FACES');
        if (!nodeData || !lineData || !faceData) return;

        const nodes = [], edges = [], faces = [];
        var minPos = {}, maxPos = {};
        nodeData.children.forEach(child => {
            const {attributes} = child, {id, data} = attributes, strArr = data.split(',');
            const origX = parseFloat(strArr[0]) * 0.33,
                y = parseFloat(strArr[2]) * 0.33,
                origZ = parseFloat(strArr[1]) * -0.33;

            const x = origX * Math.cos(rotation) + origZ * Math.cos(rotation + (Math.PI / 2));
            const z = origX * Math.sin(rotation) + origZ * Math.sin(rotation + (Math.PI / 2));

            if (minPos.x === undefined) {
                minPos = {x, y, z};
                maxPos = {x, y, z};
            } else {
                if (minPos.x > x) minPos.x = x; else if (maxPos.x < x) maxPos.x = x;
                if (minPos.y > y) minPos.y = y; else if (maxPos.y < y) maxPos.y = y;
                if (minPos.z > z) minPos.z = z; else if (maxPos.z < z) maxPos.z = z;
            }
            nodes.push({id, x, y, z});
        });
        const deltaPos = {
            x: (minPos.x + maxPos.x) / -2,
            y: 0,
            z: (minPos.z + maxPos.z) / -2
        }
        if (minPos.y < 3) deltaPos.y = 3 - minPos.y;
        minVal = Math.max(3, minPos.y);
        nodes.forEach(item => {
            item.x += deltaPos.x;
            item.y += deltaPos.y;
            item.z += deltaPos.z;
            item.oldY = item.y;
        });
        lineData.children.forEach(child => {
            const {id, path, type} = child.attributes, strArr = path.split(',');
            var lineItem = {id, type: type.toLowerCase(), posArr: []}
            strArr.forEach(nodeId => {
                lineItem.posArr.push(nodes.find(item => item.id === nodeId));
            });
            edges.push(lineItem);
        });

        faceData.children.forEach((child, idx) => {
            const {type} = child.attributes;
            const {id, path, orientation, pitch, size} = child.children[0].attributes,
                strArr = path.split(',');
            const posArr = GetXMLFacePosArr(edges, strArr);
            if (type === 'ROOF') {
                const azimuth = parseFloat(orientation),
                    pitchVal = GetXMLPitchVal(posArr, azimuth, pitch),
                    irrDir = {tilt: pitchVal, azimuth};
                faces.push({
                    id,
                    posArr,
                    pitch: pitchVal,
                    azimuth,
                    size,
                    holes: null,
                    irrDir,
                    oriAng: {azimuth, tilt: pitchVal}
                });
            } else if (type === 'ROOFPENETRATION') {
                obstructions.push({
                    normal_top: {X: 0.5, Y: 0.5, Z: 1},
                    nodes: [...posArr],
                    radius: 0,
                    type: 'polygon'
                });
            }
        });
        roofs.push({nodes, edges, faces});
    });

    useViewerStore.setState({localHoleInfo: []});
    self.roofs = roofs;

    siteCalculationState.registerCalculation(SHADE_CALCULATIONS, async ({needsUpdate}) => {
        const {roofs} = self;
        const faces = needsUpdate.some(n => n === undefined || n === true)
            ? roofs[0].faces
            : roofs[0].faces.filter(f => needsUpdate.includes(f.roofFaceId));
        await GenShadeOnFace(faces, self);
    }, { needsUpdate: true });
    siteCalculationState.addUpdatedListener(SHADE_CALCULATIONS, async () => {
        siteCalculationState.needsUpdate(MODULE_GRAPH);
        await siteCalculationState.useCalculations(MODULE_GRAPH);
    });

    siteCalculationState.registerCalculation(ACCESS_MULTIPLIERS, async ({needsUpdate}) => {
        const activeRoofMeshArr = [], angArr = [], location = useViewerStore.getState().localLocation;
        const faces = self.roofs[0].faces;

        self.modelGroup.children[0].traverse(child => {
            if (child.roofFaceId === undefined || child.disableModule || activeRoofMeshArr.length === faces.length) return;
            const face = faces.find(f => f.roofFaceId === child.roofFaceId);
            child.oriAng = {...face.oriAng};
            const existAng = angArr.find(item => item && item.tilt === child.oriAng.tilt && item.azimuth === child.oriAng.azimuth);
            if (!existAng) {
                angArr.push({...face.oriAng});
            } else {
                angArr.push(null);
            }
            activeRoofMeshArr.push(child);
        });

        await GetFaceProdAPI(location, angArr, activeRoofMeshArr, Math.min(...needsUpdate));
    }, { needsUpdate: 0 });
    siteCalculationState.addUpdatedListener(ACCESS_MULTIPLIERS, async () => {
        siteCalculationState.needsUpdate(FACE_IDEAL_API);
        await siteCalculationState.useCalculations(FACE_IDEAL_API);
    });

    siteCalculationState.registerCalculation(MODULE_GRAPH, async () => {
        SetModuleGraph(self.roofMeshArr);
    }, { needsUpdate: true });

    siteCalculationState.registerCalculation(FACE_IDEAL_API, async () => {
        const activeRoofMeshArr = [], angArr = [], location = useViewerStore.getState().localLocation, faces = self.roofs[0].faces;;
        // const {localLocation, localAngMultiplierArr} = useViewerStore.getState();
        self.modelGroup.children[0].traverse(child => {
            if (child.roofFaceId === undefined || child.disableModule || activeRoofMeshArr.length === faces.length) return;
            const face =  faces.find(f => f.roofFaceId === child.roofFaceId);
            child.oriAng = {...face.oriAng};
            const existAng = angArr.find(item => item && GetRoundNum(item.tilt, 2) === GetRoundNum(child.oriAng.tilt, 2) && GetRoundNum(item.azimuth, 4) === GetRoundNum(child.oriAng.azimuth, 4));
            if (!existAng) {
                angArr.push({ ...face.oriAng });
            } else {
                angArr.push(null);
            }
            activeRoofMeshArr.push(child);
        });
        // await siteCalculationState.useCalculations(ACCESS_MULTIPLIERS);
        await GetFaceIdealAPI(location, angArr);
    }, { needsUpdate: true });
    siteCalculationState.addUpdatedListener(FACE_IDEAL_API, async () => {
        siteCalculationState.needsUpdate(MODULE_GRAPH);
        await siteCalculationState.useCalculations(MODULE_GRAPH);
    });

    self.wallHData = minVal;
    self.wallHEdit = minVal;

    CreateRoof(self, 'init');
    CreateObstructions(self, obstructions);
    await GetTimeZone(self);
    ModelLoadInit(self);
    SetDefaultObst(self);
}

export function LoadStreetView(self) {
    if (self.mapCoordinates.latitude === null && self.mapCoordinates.longitude === null) return;

    let streetViewContainer = document.getElementById("google-street-view-container");
    streetViewContainer.classList.remove('no-pointer-events');


    let streetViewIframe = document.querySelector(".street-view-iframe");
    let heading = 360 - parseInt(self.compassHeading)
    streetViewIframe.src = `${process.env.REACT_APP_GOOGLE_STREET_VIEW_API_URL}?key=${process.env.REACT_APP_GOOGLE_STREET_VIEW_API_KEY}&location=${self.mapCoordinates.latitude},${self.mapCoordinates.longitude}&heading=${heading}&pitch=10`;

    let canvasContainer = document.getElementById('canvasContainer')


    if(canvasContainer.classList.contains('canvas-expanded')) {
        canvasContainer.classList.remove('canvas-expanded')
    }
    if(canvasContainer.classList.contains('canvas-collapsed')) {
        canvasContainer.classList.remove('canvas-collapsed')
    }
    if (!canvasContainer.classList.contains('canvas-street-view-split')) {
        canvasContainer.classList.add('canvas-street-view-split')
    }


    self.isViewerInSplitMode = true;

    self.cSize.w = window.innerWidth / 2;

    self.resizeCanvas()

    streetViewContainer.appendChild(streetViewIframe);
    streetViewContainer.style.display = "block";
}

function SetPathwaysForBuildings(self, roofMeshArr) {
    const minPathwayCountPerBuilding = 2;
    const minPathwayCountBuildingRear = 1;

    const roofsByBuilding = {};
    const accessoryBuildingList = useViewerStore.getState().accessoryBuildingList;

    roofMeshArr.forEach(roofMesh => {
        const buildingName = roofMesh.userData.buildingName;
        if (accessoryBuildingList.includes(buildingName)) return;

        if (!roofsByBuilding[buildingName]) {
            roofsByBuilding[buildingName] = [];
        }

        roofsByBuilding[buildingName].push(roofMesh);
    });

    const isVectorBetween = (a, b, x) => {
        const line = a.clone().sub(b);
        const projected = x.clone().sub(b).projectOnVector(line).add(b);

        return Math.abs(a.distanceTo(projected) + b.distanceTo(projected) - line.length()) < 1;
    };

    let nearPoint;
    if (self.roadNearPoint) {
        nearPoint = new THREE.Vector3(self.roadNearPoint.x, self.roadNearPoint.y, self.roadNearPoint.z);
    }

    // for each building
    Object.keys(roofsByBuilding).forEach(buildingName => {
        const roofs = roofsByBuilding[buildingName];
        const roofsByHeight = {};
        const roofMeta = {};
        let pathwaysSet = 0;
        let rearPathwaysSet = 0;

        const buildingCenter = GetBuildingCenter(roofMeshArr, buildingName);

        // roof data setup
        for (const roof of roofs) {
            const height = GetRoofHeight(roof);

            let added = false;
            for (const otherHeight of Object.keys(roofsByHeight)) {
                // check if heights are similar
                if (Math.abs(height - otherHeight) < 0.05) {
                    roofsByHeight[otherHeight].push(roof);
                    added = true;
                    break;
                }
            }

            const roofCenter = GetRoofCenter(roof);

            roofMeta[roof.roofFaceId] = {
                center: roofCenter,
                isFront: !nearPoint || isVectorBetween(buildingCenter, nearPoint, roofCenter),
                distanceToRoad: nearPoint ? roofCenter.distanceTo(nearPoint) : null,
            };

            if (!added) {
                roofsByHeight[height] = [roof];
            }
        }

        const setIdealPathway = (roof) => {
            const pathway = GetRoofIdealPathway(roof);
            if (!pathway) {
                return undefined;
            }

            SetPathwayValue(self, pathway.pathwayId, true);
            pathwaysSet++;

            if (!roofMeta[roof.roofFaceId].isFront) {
                rearPathwaysSet++;
            }
            return pathway;
        };

        // for each roof level
        for (const height of Object.keys(roofsByHeight)) {
            const roofs = roofsByHeight[height];
            let selectedRoof = roofs[0];

            if (nearPoint && roofs.length > 1) {
                selectedRoof = [...roofs].sort((a, b) => {
                    const aMeta = roofMeta[a.roofFaceId];
                    const bMeta = roofMeta[b.roofFaceId];

                    if (!aMeta.isFront && !bMeta.isFront) {
                        return b.size - a.size;
                    }

                    if (aMeta.isFront && !bMeta.isFront) {
                        return -1;
                    }

                    if (!aMeta.isFront && bMeta.isFront) {
                        return 1;
                    }

                    return aMeta.distanceToRoad - bMeta.distanceToRoad;
                })[0];
            } else {
                selectedRoof = roofs[0];
            }

            setIdealPathway(selectedRoof);
        }

        if (pathwaysSet < minPathwayCountPerBuilding) {
            // if the pathways set is below minimum
            const roofsSorted = [...roofs].sort((a, b) => b.size - a.size);

            for (let idx = 0; idx < roofsSorted.length && pathwaysSet < minPathwayCountPerBuilding; idx++) {
                const roof = roofsSorted[idx];
                if (!RoofHasPathwaySelected(roof)) {
                    setIdealPathway(roof);
                }
            }
        }

        if (rearPathwaysSet < minPathwayCountBuildingRear) {
            // if the rear pathways set is below minimum
            const roofsSorted = roofs.filter(r => !roofMeta[r.roofFaceId].isFront).sort((a, b) => b.size - a.size);

            for (let idx = 0; idx < roofsSorted.length && rearPathwaysSet < minPathwayCountBuildingRear; idx++) {
                const roof = roofsSorted[idx];
                if (!RoofHasPathwaySelected(roof)) {
                    setIdealPathway(roof);
                }
            }
        }
    });
}

function GetRoofCenter(roofMesh) {
    const roofCenter = new THREE.Vector3();

    const posArr = roofMesh.geometry.attributes.position.array;
    for (let i = 0; i < posArr.length; i += 3) {
        roofCenter.x += posArr[i];
        roofCenter.y += posArr[i + 1];
        roofCenter.z += posArr[i + 2];
    }

    roofCenter.divideScalar(posArr.length / 3);
    roofCenter.applyMatrix4(roofMesh.matrixWorld);
    return roofCenter;
}

function GetBuildingCenter(roofMeshArr, buildingName) {
    const center = new THREE.Vector3();
    let roofCount = 0;

    for (const roof of roofMeshArr) {
        if (roof.userData.buildingName?.toString() === buildingName) {
            center.add(GetRoofCenter(roof));
            roofCount++;
        }
    }

    if (roofCount > 0) {
        center.divideScalar(roofCount);
    }

    return center;
}

function GetRoofNodes(roofMesh) {
    const nodes = [];
    const posArr = roofMesh.geometry.attributes.position.array;

    for (let i = 0; i < posArr.length; i += 3) {
        nodes.push(new THREE.Vector3(posArr[i], posArr[i + 1], posArr[i + 2]).applyMatrix4(roofMesh.matrixWorld));
    }

    return nodes;
}

function GetRoofHeight(roofMesh) {
    let maxHeight = 0;
    for (const node of GetRoofNodes(roofMesh)) {
        if (node.y > maxHeight) {
            maxHeight = node.y;
        }
    }

    return maxHeight;
}

function GetRoofIdealPathway(roofMesh) {
    const pathwayMeshes = roofMesh.children.filter(child => child.pathwayId);

    if (pathwayMeshes.length === 0) {
        return undefined;
    }

    const biggestPathway = pathwayMeshes.reduce((prev, current) => {
        return prev.size > current.size ? prev : current
    });

    return biggestPathway;
}

function RoofHasPathwaySelected(roofMesh) {
    return roofMesh.children.some(child => child.pathwayId && child.pathActive);
}
