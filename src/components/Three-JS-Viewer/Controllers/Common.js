import * as THREE from "three";
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter';
import {GetHighestRidges, ShouldAddSetbackToRoof, checkSameLine} from "./PathwayControl";
import {testMesh} from "./Loader";
import {CheckInsidePos} from "./RefreshShade";
import {inch2m} from "../Constants/Default";
import {useViewerStore} from "../../../store/store";
import JSZip from "jszip";
import {GetLatLon, SetMapMesh} from "./MapControl";
import {SetTerrainPosition} from "./TerrainControl";
import { withLoadingMessage } from "../../../store/loadingMessageStore";
import { ACCESS_MULTIPLIERS, SHADE_CALCULATIONS, siteCalculationState } from "../../../services/siteCalculationState";
import { iterateCircular } from "../../../helpers/arrayIterate";
import { logger } from "../../../services/loggingService";

let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();

export function isMobile() {
    var check = false;
    (function(a){
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))
        check = true;
    })(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

export function GetDis(pos0, pos1, dis3D = false) {
    if (pos0.X && !pos0.x) {pos0.x = pos0.X; pos0.y = pos0.Y; pos0.z = pos0.Z;}
    if (pos1.X && !pos1.x) {pos1.x = pos1.X; pos1.y = pos1.Y; pos1.z = pos1.Z;}
    const disX = pos0.x - pos1.x, disY = pos0.y - pos1.y, disZ = pos0.z - pos1.z;
    if (dis3D) return Math.sqrt(Math.pow(disX, 2) + Math.pow(disY, 2) + Math.pow(disZ, 2));
    else return Math.sqrt(Math.pow(disX, 2) + Math.pow(disZ, 2));
}

export function GetClickObj(e, arr, camera, cSize) {
    const {posX, posY} = GetMousePos(e);
    mouse.x = (posX / cSize.w) * 2 - 1;
    mouse.y = -(posY / cSize.h) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const interInfo = raycaster.intersectObjects(arr, false)[0];
    return interInfo;
}

export function EmptyGroup(group) {
    for (let i = group.children.length - 1; i >= 0; i--) {
        group.remove(group.children[i]);
    }
}

export function  getCenterPoint(mesh) {
    var geometry = mesh.geometry;
    geometry.computeBoundingBox();
    var center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    mesh.localToWorld(center);
    return center;
}


export function SetVisibleGroup(self, type, value) {

    const { visibleInfo, roofMeshArr, obstGroup, treeGroup, roofGroup, mapMesh, mapCustom } = self;

    visibleInfo[type] = value;

    let meshArrayToHide = [];

    switch (type) {
        case 'roof':
            const floorArr = roofGroup.children[0]?.children.filter(child => child.meshType === 'floor') || [];
            meshArrayToHide = [...roofMeshArr, ...floorArr];
            break
        case 'pathway':
        case 'setback':
            roofGroup.children[0]?.traverse(child => {
                if (child.meshType === type) meshArrayToHide.push(child);
            });
            break
        case 'modules':
            roofGroup.traverse(child => {
                if (child.module) meshArrayToHide.push(child);
            });
            break
        case 'obstruction':
            meshArrayToHide = obstGroup.children;
            break
        case 'tree':
            useViewerStore.setState({ isTreeLayerOn: value });
            meshArrayToHide = treeGroup.children;
            break;
        case 'maps':
            self.mapView = value;
            SetMapMesh(self)
            break
        case 'customImagery':
            meshArrayToHide = [mapCustom];
            break
        case 'terrain':
            self.terrainView = value;
            SetTerrainPosition(self);
            break
        default:
            logger.warn(`Unknown type: ${type}`);
            break;
    }

    meshArrayToHide.forEach(mesh => mesh.visible = value);
}

export function GetRadVal(deg) {
    return Math.PI / 180 * deg;
}

export function GetDegVal(rad, float = false) {
    if (float) return 180 / Math.PI * rad;
    else return Math.round(180 / Math.PI * rad);
}

export function GetRoundNum(val, num) {
    if (!num) num = 0;
    return Math.round(val * Math.pow(10, num)) / Math.pow(10, num);
}

export function GetDateVal(date) {
    const day = date.getDate(), month = date.getMonth() + 1, year = date.getFullYear();
    return new Date(`${year}-${month}-${day}`);
}

export function GetParentTool(e) {
    const {target} = e;
    const parentTool = target.closest('.canvas__toolbar');
    const controlTool = target.closest('.canvas-control-wrapper');
    return (parentTool || controlTool) ? true : false;
}

export function sortFacePosArr(posArr, azimuth) {
    var minY = Infinity;
    const lowPosArr = [];
    posArr.forEach(pos => {
        if (pos.y < minY) minY = pos.y;
    });
    posArr.forEach(pos => {
        if (pos.y < minY + 0.2) lowPosArr.push(pos)
    });
    var lastPos, minVal = Infinity, maxVal = -Infinity;
    lowPosArr.forEach(lowPos => {
        if (azimuth > 45 && azimuth <= 135 && lowPos.z > maxVal) {
            maxVal = lowPos.z;
            lastPos = lowPos;
        } else if (azimuth > 135 && azimuth <= 225 && lowPos.x < minVal) {
            minVal = lowPos.x;
            lastPos = lowPos;
        } else if (azimuth > 225 && azimuth <= 275 && lowPos.z < minVal) {
            minVal = lowPos.z;
            lastPos = lowPos;
        } else if ((azimuth > 275 || azimuth <= 45) && lowPos.x > maxVal) {
            maxVal = lowPos.x;
            lastPos = lowPos;
        }
    });
    const lastIdx = posArr.findIndex(pos => {
        return pos.x === lastPos.x && pos.y === lastPos.y && pos.z === lastPos.z
    });
    const newPosArr = [];
    for (let i = lastIdx + 1; i <= lastIdx + posArr.length; i++) {
        newPosArr.push(posArr[i % posArr.length]);
    }
    return newPosArr;
}

export function SetControlIcon(infoArr) {
    const btnIcons = {
        topView: document.getElementById('btnTopView'),
        rotate: document.getElementById('btnAutoRotate'),
        view2d: document.getElementById('2DViewBtn'),
        view3d: document.getElementById('3DViewBtn'),
        btnMeasure: document.getElementById('btnMeasure'),
    };
    const maskMeasure = document.getElementById('maskMeasure');
    infoArr.forEach(item => {
        const {key, add, name} = item, selBtn = btnIcons[key];
        if (!selBtn) return;
        if (add) selBtn.classList.add(name);
        else selBtn.classList.remove(name);
        if ((item.key === 'view2d' || item.key === 'view3d') && name === 'disable') {
            if (add) selBtn.setAttribute('disabled', true);
            else selBtn.removeAttribute('disabled');
        }

        if (item.key === 'btnMeasure' && name === 'disable') {
            if (add) {
                maskMeasure?.classList.add('active');
            } else {
                maskMeasure?.classList.remove('active');
            }
        }
    });
}

export function Get2DPos(obj, cWidth, cHeight, camera) {
    var vector = new THREE.Vector3();
    var widthHalf = 0.5 * cWidth;
    var heightHalf = 0.5 * cHeight;
    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);
    vector.x = (vector.x * widthHalf) + widthHalf;
    vector.y = -(vector.y * heightHalf) + heightHalf;
    return {x: vector.x, y: vector.y};
}



export async function DownloadGLTF(self) {
    await siteCalculationState.useCalculations(SHADE_CALCULATIONS, ACCESS_MULTIPLIERS);

    const {scene} = self, exporter = new GLTFExporter();
    const mapJson = GetMapJson(self); // return;

    scene.traverse(child => {
        if (child.name === 'plane') child.visible = false;
    })
    scene.userData = {...mapJson};

    const options = {
        onlyVisible: true,
        truncateDrawRange: true,
        binary: false,
        maxTextureSize: 4096
    };

    exporter.parse(scene, (gltf) => {
        if (gltf instanceof ArrayBuffer) {
            saveArrayBuffer(gltf, 'scene.glb');
        } else {
            withLoadingMessage(async () => {
                const output = JSON.stringify(gltf), gltfName = 'OneDraw.gltf', zipName = 'OneDraw.zip';
                const zip = new JSZip();
                zip.file(gltfName, output);
                const content = await zip.generateAsync({type:"blob", compression: "DEFLATE", compressionOptions: { level: 9 }});
                save(content, zipName);
            }, { title: 'Exporting...' });
        }
        scene.traverse(child => {
            if (child.name === 'plane') child.visible = false;
        });
    }, error => {
        logger.error(error);
    }, options);
}


export function getGLBFile(self, filename) {
    return new Promise((resolve, reject) => {

        const {scene} = self, exporter = new GLTFExporter();
        const mapJson = GetMapJson(self);
        scene.traverse(child => {
            if (child.name === 'plane') child.visible = false;
        })
        scene.userData = {...mapJson};

        const options = {
            onlyVisible: true,
            truncateDrawRange: true,
            binary: false,
            maxTextureSize: 4096
        };



        exporter.parse(scene, (gltf) => {


                if (gltf instanceof ArrayBuffer) {
                    const blob = new Blob([gltf], {type: 'application/octet-stream'})
                    resolve(new File([blob], filename))
                }
                else {

                    const output = JSON.stringify(gltf), gltfName = 'OneDraw.gltf'
                    const zip = new JSZip();
                    zip.file(gltfName, output);
                    zip.generateAsync({type:"blob", compression: "DEFLATE", compressionOptions: { level: 9 }}).then(function(content) { // see FileSaver.js
                        //create a file from the content

                        const file = new File([content], filename, {type: 'application/octet-stream'});
                        resolve(file)
                    });


                }


            }, (error) => {
                logger.error(error);
                reject(error)
            },
            options);
    })
}

export async function ExportGen(self, getJson) {
    if (!self.hasCapability('.GEN')) return;
    await siteCalculationState.useCalculations(SHADE_CALCULATIONS, ACCESS_MULTIPLIERS);
    const genJson = GetGenJson(self);
    if (!genJson) return;
    if (getJson){
        return genJson;
    }
    const jsonStr = EncryptJsonStr(JSON.stringify(genJson));
    return new Blob([jsonStr], {type: 'text/plain;charset=utf-8'});
}

function save(blob, filename) {
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    setTimeout(() => {
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }, 100);
}

function saveArrayBuffer(buffer, filename) {
    save(new Blob([buffer], {type: 'application/octet-stream'}), filename);
}

export function CheckContact(obj0, box1) {
    const box0 = new THREE.Box3().setFromObject(obj0);
    return box0.intersectsBox(box1);
}

export function CheckContactArr(objArr, obj, key) {
    var contactObj;
    const boxObj = new THREE.Box3().setFromObject(obj);
    objArr.forEach(item => {
        if (item.visible === false || contactObj) return;
        if (key && obj[key] && item[key] === obj[key]) return;
        if (CheckContact(item, boxObj)) contactObj = item;
    });
    return contactObj;
}

export function CheckOverObstArr(obstGroup, moduleMeshArr, roofId, verInfo) {
    const roofItemArr = [];
    moduleMeshArr.forEach(item => {
        if (item.roofId !== roofId) return;
        const {wPosArr} = item;
        roofItemArr.push([wPosArr[0], wPosArr[1], wPosArr[3], wPosArr[2]]);
    });
    obstGroup.children.forEach(item => {
        if (item.children[0].children[0].children[0].roofId !== roofId) return;
        roofItemArr.push([...item.children[0].children[0].children[0].verPosArr]);
    });
    var flag = false;
    roofItemArr.forEach(item => {
        if (flag) return;
        item.forEach(pos => {
            if (CheckInsidePos(verInfo, pos)) flag = true;
        });
    });
    if (flag) return true;
    verInfo.forEach(ver => {
        if (flag) return;
        roofItemArr.forEach(item => {
            if (CheckInsidePos(item, ver)) flag = true;
        });
    });
    return flag;
}

export function GetVerPosArr(obst) {
    const obsMesh = obst.children[0].children[0].children[0], verPosArr = [];
    [{x: -1, z: -1}, {x: -1, z: 1}, {x: 1, z: 1}, {x: 1, z: -1}].forEach(dir => {
        const cloneTest = testMesh.clone();
        cloneTest.position.set(dir.x / 2, 0, dir.z / 2);
        obsMesh.add(cloneTest);
        const wPos = cloneTest.getWorldPosition(new THREE.Vector3());
        verPosArr.push(wPos);
        obsMesh.remove(cloneTest);
    });
    return verPosArr;
}

export function GetRangeKey(rangeKey) {
    var realKey = ''
    if (rangeKey.includes('customImage')) {
        const subKey = rangeKey.substring(11);
        const firstStr = subKey.substring(0, 1), otherStr = subKey.substring(1);
        realKey = firstStr.toLowerCase() + otherStr;
    } else if (rangeKey.includes('Obst')) {
        realKey = rangeKey.substring(4).toLowerCase();
    } else if (rangeKey.includes('Tree')) {
        if (rangeKey === 'TreeTotalHeight') realKey = 'height';
        else if (rangeKey === 'TreeCrownRadius') realKey = 'crown_radius';
        else if (rangeKey === 'TreeCrownHeight') realKey = 'crown_height';
        else if (rangeKey === 'TreeTrunkRadius') realKey = 'trunk_radius';
    }
    return realKey
}


export function SortArray(arr, key) {
    function sortKey(a, b) {
        if (a[key] < b[key]) {
            return -1;
        }
        if (a[key] > b[key]) {
            return 1;
        }
        return 0;
    }

    return arr.sort(sortKey);
}

function GetNodeArr(posArr, nodes) {
    const nodeArr = [];
    posArr.forEach(pos => {
        const nodeIdx = nodes.findIndex(node => {
            return node.X === pos.x && node.Y === -pos.z && node.Z === pos.y
        });
        nodeArr.push(nodeIdx);
    });
    return nodeArr;
}

export function getRoofModuleMeshes(roof) {
    return roof.children.filter(c => isModuleMesh(c));
}

export function getModuleMeshInfo(module) {
    return {
        dir: module.dir,
        moduleId: module.moduleId,
        overPathIds: module.overPathIds,
        selSize: module.selSize,
        x: module.position.x,
        z: module.position.y,
    };
}

export function getRoofModuleCount(roof) {
    return roof.children.reduce((p, c) => p + isModuleMesh(c), 0);
}

export function isModuleMesh(mesh) {
    return mesh.module === true;
}

export function GetMapJson(self) {
    const {roofs, wallHEdit, treeGroup, roofMeshArr, obstGroup, mapCoordinates, sunInfo, irrCSVMainData} = self;
    if (!roofs || !roofs[0]) return;
    const irradianceMonth = self.irradianceMonth;// this is drawn from store. Earlier it was read from face;
    const {nodes, edges, faces} = roofs[0];
    const nodeArr = [], edgeArr = [], faceArr = [], obstArr = [], treeArr = [];
    const buildings = {};
    nodes.forEach(node => {
        const {X, Y, Z} = node;
        nodeArr.push({X, Y: -Y, Z: Z});
    });
    edges.forEach(edge => {
        const {posArr, type} = edge;
        edgeArr.push({nodes: GetNodeArr(posArr, nodeArr), type});
    });

    faces.forEach((face, idx) => {
        const {posArr, oriAng, size, holes, lines, ptHashArr, ptHashAverage, ptHashMonth, roofFaceId} = face, {azimuth, tilt} = oriAng;
        const selRoof = roofMeshArr[idx], {userData} = selRoof, moduleCount = userData.moduleCount || {land:0, port:0, both:0}; // , obstArr, oriCol, oriMap, worldPos

        const shadeInfo = [];
        selRoof.children.forEach(child => {
            if (!child.shadePoint) return;
            const {onModule, monthArr, ptHashVal} = child;
            shadeInfo.push({onModule, monthArr, ptHashVal});
        });

        const modules = getRoofModuleMeshes(selRoof);

        buildings[selRoof.userData.buildingName] = {
            houseId: selRoof.houseId,
            name: selRoof.userData.buildingName,
            wallHeight: wallHEdit,
        };

        const faceItem = {
            shell: GetNodeArr(posArr, nodeArr),
            azimuth,
            pitch: tilt,
            sq_footage: size,
            holes: null,
            moduleArr: modules.map(m => getModuleMeshInfo(m)),
            moduleCount,
            lines,
            ptHashArr,
            ptHashAverage,
            ptHashMonth,
            shadeInfo,
            roofFaceId,
            roof_tag_id: userData.roof_tag_id,
            houseId: selRoof.houseId,
            buildingName: selRoof.userData.buildingName,
            textureId: userData.textureId,
            color: userData.color,
            questionableRoof: userData.questionableRoof,
            height: userData.initialHeight + wallHEdit,
        }; //irradianceMonth removed from here

        if (holes && holes.length) {
            faceItem.holes = [];
            holes.forEach(hole => {
                faceItem.holes.push(GetNodeArr(hole.posArr, nodeArr));
            });
        }
        faceArr.push(faceItem);
    });
    obstGroup.children.forEach(obst => {
        const {position, children, roofId} = obst;
        const {shapeNum, radius, verFloor, height, width, length} = children[0].children[0].children[0];
        const normal_top = verFloor ? {X: 0, Y: 0, Z: 1} : {X: 0.5, Y: 0.5, Z: 0.5};
        let type;
        const pos = {x: position.x, y: position.y + height, z: position.z};
        var nodes = children[0].children[0].children[0].userData.nodes;

        if (shapeNum === 1) {
            type = 'polygon';
        } else if (shapeNum === 2) {
            type = 'circle';
        } else if (shapeNum === 3) {
            type = 'cylinder';
        }

        const roof = roofMeshArr.find(roof => roof.roofFaceId === obst.roofId) || roofMeshArr[0];
        const roofGroup = roof.parent.parent.parent;
        const diff = new THREE.Vector3(
            roofGroup.position.x - roofGroup.userData.originalPosition.x,
            roofGroup.position.y - roofGroup.userData.originalPosition.y,
            roofGroup.position.z - roofGroup.userData.originalPosition.z
        );

        obstArr.push({
            radius: radius / 2,
            type,
            x: pos.x - diff.x,
            y: -pos.z - diff.z,
            z: pos.y - diff.y,
            height,
            width,
            length,
            normal_top,
            nodes,
            roofId,
            delStatus: obst.children[0].children[0].children[0].delStatus,
        });
    });
    treeGroup.children.forEach((tree, treeIdx) => {
        const {position, children, userData} = tree, crownMesh = children[0], trunkMesh = children[1], {incrossArr} = children[2];
        // const {crownScl} = crownMesh;
        const crown_radius = userData.crown_radius / 2; // crownMesh.scale.x / crownScl.x / 2;
        const crown_height = userData.crown_height; // crownMesh.scale.y / crownScl.y;
        const trunk_radius = userData.trunk_radius; // trunkMesh.scale.x
        const height = tree.totalH;
        const {latitude, longitude} = GetLatLon(self.mapCoordinates, {x: position.x, z: position.z});
        treeArr.push({
            crown_radius: crown_radius,
            crown_height,
            trunk_radius,
            height,
            type: 'ellipsoid',
            x: position.x,
            y: -position.z,
            latitude: latitude,
            longitude: longitude,
            incrossArrLength: incrossArr?.length ?? 0,
            delStatus: tree.delStatus,
            crownKey: crownMesh.userData.crownKey,
        });
    });

    const localAngIdealArr = useViewerStore.getState().localAngIdeal;
    const localFacePtHashArr = useViewerStore.getState().localFacePtHash;
    const localAngMultiplierInfo = useViewerStore.getState().localAngMultiplierArr;

    const mapJson = {
        location: null,
        mapPosition: {
            x: self.mapMesh.position.x,
            z: self.mapMesh.position.z,
        },
        obstructions: obstArr,
        origin: {...mapCoordinates},
        buildings: Object.values(buildings),
        roofs: [{nodes: nodeArr, edges: edgeArr, faces: faceArr}],
        trees: treeArr,
        sunInfo,
        weatherStation: self.weatherStationName,
        irrCSVMainData,
        irradianceMonth,
        localAngIdealArr,
        localFacePtHashArr,
        localAngMultiplierInfo
    } //irradianceMonth added here as a general data
    return mapJson;
}

function GetNearPosIdx(ptArr, pos) {
    var minDis = Infinity, selIdx = -1;
    ptArr.forEach((pt, ptIdx) => {
        const dis = GetDis(pt.pos, pos, true);
        if (dis < minDis) {minDis = dis; selIdx = ptIdx;}
    });
    return selIdx;
}

const verCountTree = 8, angUnitTree = Math.PI * 2 / verCountTree, verNorArr = [];
for (let i = 0; i < verCountTree; i++) {
    const ang = angUnitTree * i;
    verNorArr.push({x: Math.cos(ang), z: Math.sin(ang)});
}

function GetSizePosArr(posArr) {
    var minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    posArr.forEach(pos => {
        const {x, y, z} = pos;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
    });
    const size = {x: maxX - minX, y: maxY - minY, z: maxZ - minZ},
        cPos = {x: (maxX + minX) / 2, y: (maxY + minY) / 2, z: (maxZ + minZ) / 2},
        norPos = new THREE.Vector3(cPos.x, cPos.y, cPos.z).normalize();
    return {size, cPos, norPos};
}

export function doLinesIntersect(a, b, c, d, segmentAB, segmentCD, maxDistance) {
    const epsilon = 0.01;

    const s = (c.y * b.x - c.y * a.x - a.y * b.x + a.y * a.x - c.x * b.y + c.x * a.y + a.x * b.y - a.x * a.y)
        / ((d.x - c.x) * (b.y - a.y) - (d.y - c.y) * (b.x - a.x));
    const t = b.y !== a.y
        ? (c.y + s * (d.y - c.y) - a.y) / (b.y - a.y)
        : (c.x + s * (d.x - c.x) - a.x) / (b.x - a.x);

    const rx = a.x + t * (b.x - a.x);
    const ry = a.y + t * (b.y - a.y);
    const rz = a.z + t * (b.z - a.z);

    const qx = c.x + s * (d.x - c.x);
    const qy = c.y + s * (d.y - c.y);
    const qz = c.z + s * (d.z - c.z);

    const dx = rx - qx;
    const dy = ry - qy;
    const dz = rz - qz;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist < maxDistance) {
        if ((!segmentAB || t >= -epsilon && t <= 1 + epsilon) && (!segmentCD || s >= -epsilon && s <= 1 + epsilon)) {
            return new THREE.Vector3(qx, qy, qz);
        }
    }

    return null;
}

function GetGenJson(self) {
    const {
        roofs,
        roofGroup,
        treeGroup,
        obstGroup,
        mapCoordinates,
        buildingAlt,
        addressInfo,
        roofMeshArr,
        moduleMeshArr,
        csvFileName,
        sunInfo,
        sunVecArr,
        map64Binary,
        irradianceMonth
    } = self; //for removing redundancy in irradianceMonth
    const {latitude, longitude} = mapCoordinates, sunAngles = {};
    const {state, city, detail, postalCode} = addressInfo;
    const angMultiplierArr = useViewerStore.getState().localAngMultiplierArr;
    const idealProdMulti = useViewerStore.getState().localMultiplier;

    const realModuleMeshArr = moduleMeshArr.filter(module => module.material.opacity === 1);

    //get points of setback mesh
    const setbackPts = []

    const {edges, faces} = roofs[0];
    const edgeObj = {EAVE: 0, HIP: 0, RAKE: 0, RIDGE: 0, STEPFLASH: 0, VALLEY: 0}, moduleCountObj = {};
    const moduleList = useViewerStore.getState().moduleList;
    const selModuleInfo = useViewerStore.getState().activeModule || {};
    const selModuleIdx = moduleList.findIndex(m => m.text === selModuleInfo.text);
    Object.keys(edgeObj).forEach(key => {
        edgeObj[key] = edges.filter(edge => edge.type === key.toLocaleLowerCase()).length;
    });
    const {EAVE, HIP, RAKE, RIDGE, STEPFLASH, VALLEY} = edgeObj;
    realModuleMeshArr.forEach(module => {
        const moduleIdx = module.selSize.key;
        if (!moduleCountObj[moduleIdx]) moduleCountObj[moduleIdx] = 0;
        moduleCountObj[moduleIdx]++;
    });

    sunVecArr.forEach((month, mIdx) => {
        sunAngles[(mIdx + 1).toString()] = {};
        month.forEach((day, dIdx) => {
            sunAngles[(mIdx + 1).toString()][(dIdx + 1).toString()] = {};
            day.forEach((hour, hIdx) => {
                const norPos = new THREE.Vector3(hour.x, hour.y, hour.z).normalize();
                sunAngles[(mIdx + 1).toString()][(dIdx + 1).toString()][hIdx.toString()] = [norPos.x, -norPos.z, norPos.y];
            });
        });
    });

    roofMeshArr.forEach((roofMesh, rIdx) => {
        const {posArr} = roofMesh;
        const testPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        testPlane.setFromCoplanarPoints(
            new THREE.Vector3(posArr[0].x, posArr[0].y, posArr[0].z),
            new THREE.Vector3(posArr[1].x, posArr[1].y, posArr[1].z),
            new THREE.Vector3(posArr[2].x, posArr[2].y, posArr[2].z),
        );
        roofMesh.planeNor = testPlane.normal;
        var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxY = -Infinity;
        posArr.forEach(pos => {
            if (pos.x < minX) minX = pos.x; if (pos.x > maxX) maxX = pos.x;
            if (pos.z < minZ) minZ = pos.z; if (pos.z > maxZ) maxZ = pos.z;
            if (pos.y > maxY) maxY = pos.y;
        });
        const centerPos = {x:(minX+maxX)/2, y:maxY, z:(minZ+maxZ)/2};
        roofMesh.roofTagPt = {x:centerPos.x/inch2m, y:-centerPos.z/inch2m, z:centerPos.y/inch2m};
    });

    roofMeshArr.forEach(roofMesh => {
        roofMesh.genPosArr = []; roofMesh.appPosArr = [];
        roofMesh.pos2DArr.forEach(pos2D => {
            const cloneTest = testMesh.clone();
            cloneTest.position.set(pos2D.x, pos2D.z, pos2D.y);
            roofMesh.add(cloneTest);
            const wPos = cloneTest.getWorldPosition(new THREE.Vector3());
            const roundPos = {x:GetRoundNum(wPos.x, 4), y:GetRoundNum(wPos.y, 4), z:GetRoundNum(wPos.z, 4)}
            roofMesh.genPosArr.push({...roundPos});
            roofMesh.appPosArr.push({...roundPos});
            roofMesh.remove(cloneTest);
        });
    });

    roofMeshArr.forEach((roofMesh, rIdx) => {
        if (rIdx === roofMeshArr.length - 1) return;
        roofMesh.genPosArr.forEach((selPos, sIdx) => {
            if (selPos.close===true) return;
            const nearPosArr = [{...selPos, rIdx, pIdx:sIdx}];
            for (let i = rIdx + 1; i < roofMeshArr.length; i++) {
                roofMeshArr[i].genPosArr.forEach((otherPos, oIdx) => {
                    if (otherPos.close===true) return;
                    const dis = GetDis(selPos, otherPos, true);
                    if (dis < 0.05) {
                        otherPos.close = true; selPos.close = true;
                        nearPosArr.push({...otherPos, rIdx:i, pIdx:oIdx});
                    }
                });
            }
            if (selPos.close && nearPosArr.length>1) {
                const nearCount = nearPosArr.length;
                var tPos = {x:0, y:0, z:0};
                nearPosArr.forEach(nearPos => {
                    ['x', 'y', 'z'].forEach(axis => {
                        tPos[axis] += nearPos[axis];
                    });
                });
                const cPos = {x:tPos.x/nearCount, y:tPos.y/nearCount, z:tPos.z/nearCount};

                const cloneTest = testMesh.clone();
                cloneTest.position.set(cPos.x, cPos.y, cPos.z);
                roofGroup.add(cloneTest);
                nearPosArr.forEach(nearPos => {
                    const {rIdx, pIdx} = nearPos;
                    ['x', 'y', 'z'].forEach(axis => {
                        roofMeshArr[rIdx].genPosArr[pIdx][axis] = cPos[axis];
                    });
                });
                roofGroup.remove(cloneTest);
            }
        });
    });

    const ROOFS = {}, FACES = {}, LINES = {}, PTS = {}, TREES = {}, OBSTRUCTIONS = {}, MODULES = {}, facesArr = [],
        lineArr = [], ptArr = [];

    faces.forEach((face, faceIdx) => {
        const {
            oriAng,
            pos2DArr,
            roofFaceId,
            shadePosArr,
            ptHashArr,
            ptHashAverage,
            lines,
            size, azimuth, pitch
        } = face, selRoofMesh = roofMeshArr[faceIdx], {userData, roofTagPt, genPosArr} = selRoofMesh, MODULES = [],
        LAYOUTS = {base_pts: [], portrait: [], landscape: []}, SHADE_PTS = {}, PRODUCTION_MULTIPLIER = {},
        SHADE_WEIGHTS = {}, faceIdxStr = faceIdx.toString(), FACE = 'F' + faceIdxStr;

        getRoofModuleMeshes(selRoofMesh).forEach((module) => {
            const moduleIdx = realModuleMeshArr.findIndex(item => module.moduleId === item.moduleId);
            const worldPos = module.getWorldPosition(new THREE.Vector3());
            const dirKey = module.dir === 'port' ? 'portrait' : 'landscape';
            const dirKeyShort = module.dir === 'port' ? 'port' : 'land';
            MODULES.push('M' + moduleIdx);
            LAYOUTS[dirKey].push( [ [ worldPos.x/inch2m, -worldPos.z/inch2m, worldPos.y/inch2m ], dirKeyShort ] );
        });

        const pos2DSize = GetSizePosArr(pos2DArr).size, WIDTH = pos2DSize.x / inch2m, HEIGHT = pos2DSize.z / inch2m;
        shadePosArr.forEach((shadePos, shadeIdx) => {
            const {x, y, z} = shadePos, inchX = x / inch2m, inchY = y / inch2m, inchZ = z / inch2m,
                shadeKey = JSON.stringify([inchX, inchY, inchZ]);
            SHADE_PTS[shadeKey] = ptHashArr[shadeIdx];
        });
        const selMultipliers = angMultiplierArr.find(item => item.azimuth === oriAng.azimuth && item.tilt === oriAng.tilt);
        if (selMultipliers && selMultipliers.multipliers) {
            selMultipliers.multipliers.forEach(item => {
                const {access, multiplier} = item;
                if (!access) return;
                PRODUCTION_MULTIPLIER[access.toString()] = multiplier;
            });
            const selMultiArr = selMultipliers.multipliers.find(item => item.access === Math.round(ptHashAverage));
            PRODUCTION_MULTIPLIER.default = selMultiArr ? selMultiArr.multiplier : 0;
        }
        irradianceMonth.forEach((month, monthIdx) => {
            SHADE_WEIGHTS[(monthIdx + 1).toString()] = {}
            month.forEach((hour, hourIdx) => {
                SHADE_WEIGHTS[(monthIdx + 1).toString()][(hourIdx + 1).toString()] = {...hour};
            });
        });

        const roof_ID = userData.roof_tag_id;
        const rooftagPointAsArray = [roofTagPt.x, roofTagPt.y, roofTagPt.z];

        //ROOF
        ROOFS['R' + faceIdx] = {
            DESIGNATION: roof_ID,
            FACE,
            MODULES,
            LAYOUTS,
            WIDTH,
            HEIGHT,
            AZIMUTH: azimuth,
            TILT: pitch,
            SALESFORCE_ROOF_OBJECT_ID: roofFaceId,
            PRODUCTION_MULTIPLIER,
            SHADE_PTS,
            SHADE_WEIGHTS,
            TAG_PT: rooftagPointAsArray,
        }

        const faceLineArr = [], facePtArr = [];
        const uniquePts = {};
        genPosArr.forEach(pos => {
            let ptKey = uniquePts[`${pos.x}${pos.y}${pos.z}`];
            if (!ptKey) {
                ptKey = `P${ptArr.length}`;
                ptArr.push({ptKey: ptKey, pos: {x: pos.x, y: pos.y, z: pos.z}});

                uniquePts[`${pos.x}${pos.y}${pos.z}`] = ptKey;
            }

            facePtArr.push(ptKey);
        });

        lines.forEach(line => {
            line.realPoints = [];
            line.points.forEach(linePos => {
                const existPosIdx = GetNearPosIdx(ptArr, linePos);
                line.realPoints.push(ptArr[existPosIdx].pos);
            });
        });
        lines.forEach(line => {
            const {realPoints, streetSide, enforcedPathway} = line;
            var existLineKey = false;
            lineArr.forEach(line => {
                if (existLineKey) return;
                if (checkSameLine(realPoints, line.posArr)) existLineKey = line.lineKey;
            });
            if (!existLineKey) {
                const lineKey = 'L' + lineArr.length, ptKeyArr = [];
                realPoints.forEach(newLinePos => {
                    const existPosIdx = GetNearPosIdx(ptArr, newLinePos);
                    ptKeyArr.push(ptArr[existPosIdx].ptKey)
                });
                const newLineItem = { lineKey, posArr:realPoints, ptKeyArr, STREET_SIDE: streetSide, ENFORCED_PATHWAY: enforcedPathway, ENFORCED_ROOFS: null, TYPE: null }
                lineArr.push(newLineItem);
                existLineKey = lineKey;
            }
            faceLineArr.push(existLineKey);
        });
        selRoofMesh.children.filter(child=>child.pathActive===true).forEach(child => {
            const selLineItem = lines.find(line=>line.lineId===child.pathwayId);
            const {points, realPoints} = selLineItem;
            var posDelta = {x:0, y:0, z:0};
            points.forEach((pos, posIdx) => {
                ['x', 'y', 'z'].forEach(axis => {
                    posDelta[axis] += realPoints[posIdx][axis] - points[posIdx][axis];
                });
            });
            const wPosArr = [], newPtKeyArr = [];
            [0, 1].forEach(posIdx => {
                const pos = child.pathwayPosArr[posIdx];
                const cloneTest = testMesh.clone();
                cloneTest.position.set(pos.x, pos.z, pos.y);
                selRoofMesh.add(cloneTest);
                const wPos = cloneTest.getWorldPosition(new THREE.Vector3());
                wPosArr.push(wPos);
                selRoofMesh.remove(cloneTest);
            });
            wPosArr.forEach(wPos => {
                const newPtKey = 'P' + ptArr.length;
                facePtArr.push(newPtKey);
                ptArr.push({ptKey: newPtKey, pos: {x: wPos.x, y: wPos.y, z: wPos.z}});
                newPtKeyArr.push(newPtKey);
            });
            const newLineKey = 'L' + lineArr.length;
            const newLineItem = { lineKey:newLineKey, posArr:wPosArr, ptKeyArr:newPtKeyArr, STREET_SIDE: false, ENFORCED_PATHWAY: false, ENFORCED_ROOFS: null, TYPE: null } // points
            lineArr.push(newLineItem);
            faceLineArr.push(newLineKey);
        });
        facesArr.push({faceLineArr, posArr:genPosArr, size, facePtArr});
    });

    //TREE
    // treeGroup.children.forEach((tree, treeIdx) => {
    //     const treeFaceKeyArr = [];
    //     for (let i = 0; i < verCountTree + 2; i++) {
    //         treeFaceKeyArr.push('F' + (facesArr.length + i))
    //     }
    //     const {newFaceArr, newLineArr, newPtArr} = GetTreeInfo(tree, facesArr.length, lineArr.length, ptArr.length);
    //     facesArr.push(...newFaceArr);
    //     lineArr.push(...newLineArr);
    //     ptArr.push(...newPtArr);
    //     TREES['Tg' + treeIdx] = {FACES: treeFaceKeyArr}
    // });

    //OBSTRUCTION
    var obstNum = 0;
    obstGroup.children.forEach((obst) => {
        const {children, roofId} = obst, selRoof = roofMeshArr.find(roof => roof.roofFaceId===roofId);
        const {newFaceArr, newLineArr, newPtArr} = GetObstInfo(children[0].children[0].children[0], lineArr.length, ptArr.length, selRoof);
        newFaceArr.forEach((item) => {
            facesArr.push(item);
            OBSTRUCTIONS['O' + obstNum] = {FACE: "F" + parseInt(facesArr.length - 1)};
            obstNum++;
        });
        lineArr.push(...newLineArr);
        ptArr.push(...newPtArr);
    });

    //MODULES
    realModuleMeshArr.forEach((module, idx) => {
        const {wPosArr, irrPro, dir, multiplier, efficiency, roofId, position} = module, CORNER_PTS = [];
        const parentRoof = roofMeshArr.find(roofMesh => roofMesh.roofFaceId===roofId) || {};
        const planeNor = parentRoof.planeNor || {};
        wPosArr.forEach(wPos => {
            const {x, y, z} = wPos; CORNER_PTS.push([x/inch2m, -z/inch2m, y/inch2m]);
        });

        const cloneTest = testMesh.clone();
        cloneTest.position.set(position.x, position.y, position.z);
        parentRoof.add(cloneTest);
        const worldPos = cloneTest.getWorldPosition(new THREE.Vector3());
        parentRoof.remove(cloneTest);
        const CENTER_PT = [
            GetRoundNum(worldPos.x/inch2m, 4),
            GetRoundNum(-worldPos.z/inch2m, 4),
            GetRoundNum(worldPos.y/inch2m, 4)
        ];

        const NORMAL = [planeNor.x, -planeNor.z, planeNor.y];

        MODULES['M' + idx] = {
            CENTER_PT,
            CORNER_PTS,
            NORMAL,
            SOLAR_ACCESS: irrPro,
            ORIENTATION: dir === 'port' ? 'port' : 'land',
            EFFICIENCY: efficiency || 0,
            PRODUCTION_MULTIPLIER: multiplier || 0,
            PLANE: null
        }
    });

    //FACES
    facesArr.forEach((faceItem, faceIdx) => {
        const {faceLineArr, posArr, size, facePtArr} = faceItem;
        const {norPos} = GetSizePosArr(posArr);
        FACES['F' + faceIdx] = {
            LINES: faceLineArr,
            NORMAL: [norPos.x, norPos.z, norPos.y],
            PLANE: [],
            AREA: size,
            PATH: facePtArr,
            WALL: null,
            STREET_SIDE: null
        };
    });

    //LINES
    lineArr.forEach(line => {
        const {lineKey, TYPE, ptKeyArr, STREET_SIDE, ENFORCED_PATHWAY, ENFORCED_ROOFS} = line;
        LINES[lineKey] = {TYPE, PTS: ptKeyArr, STREET_SIDE, ENFORCED_PATHWAY, ENFORCED_ROOFS};
    });

    //PTS
    ptArr.forEach(pt => {
        const {ptKey, pos} = pt;
        PTS[ptKey] = [
            GetRoundNum(pos.x / inch2m, 4),
            GetRoundNum(-pos.z / inch2m, 4),
            GetRoundNum(pos.y / inch2m, 4)
        ];
    });

    //SETBACKS
    self.roofMeshArr.forEach((roofMesh) => {
        const {lines} = roofMesh;
        const ridgeLines = GetHighestRidges(lines);

        if (!ShouldAddSetbackToRoof(roofMesh)) {
            return;
        }

        lines.forEach((line, lineIdx) => {
            const {setback, setbackInfo} = line;

            if (!setback || !setbackInfo || !setbackInfo[`pos${setback}`] || !ridgeLines.find(l => l.lineId === line.lineId)) {
                return;
            }

            const setbackMesh = roofMesh.children.find(c => c.setbackId === line.lineId);
            const points = line.points;
            let setbackDis = setback * inch2m;

            if (setbackMesh.userData.use18) {
                setbackDis = 18 * inch2m;
            }

            const lineStart = toVector(points[0]);
            const lineEnd = toVector(points[1]);
            const lineVector = new THREE.Vector3().subVectors(lineStart, lineEnd);

            const previousLine = lineIdx !== 0 ? lines[lineIdx - 1] : lines[lines.length - 1];

            const previousLineDir = toVector(previousLine.points[0]).sub(lineStart).normalize();
            const planeNormal = new THREE.Vector3().crossVectors(lineVector, previousLineDir);
            if (planeNormal.y < 0) {
                planeNormal.negate();
            }

            const direction = new THREE.Vector3().crossVectors(planeNormal, lineVector).normalize().multiplyScalar(setbackDis);
            if (direction.y > 0) {
                direction.negate();
            }

            const origSetbackLineStart = lineStart.clone().add(direction);
            const origSetbackLineEnd = lineEnd.clone().add(direction);

            const findIntersectingLine = (referencePoint, incrementIterate) => {
                let count = 0;
                let direction = 0;
                let intersectLine;
                let intersectPoint;
                let maxDistanceSquared = 0;

                for (const {item} of iterateCircular(lines, lineIdx, incrementIterate)) {
                    if (count === 0) {
                        count++;
                        continue;
                    }

                    const p0 = toVector(item.points[0]);
                    const p1 = toVector(item.points[1]);

                    if (count === 1) {
                        direction = Math.sign(p0.clone().sub(p1).y);
                    }

                    count++;

                    if (Math.sign(p0.clone().sub(p1).y) !== direction) {
                        // only compare lines that are in the same direction
                        break;
                    }

                    const intersect = doLinesIntersect(
                        origSetbackLineStart,
                        origSetbackLineEnd,
                        p0,
                        p1,
                        true,
                        true,
                        0.12
                    );
                    if (intersect) {
                        const distSqr = intersect.distanceToSquared(referencePoint);
                        if (distSqr > maxDistanceSquared) {
                            intersectLine = item;
                            intersectPoint = intersect;
                            maxDistanceSquared = distSqr;
                        }
                    }
                }

                if (!intersectLine) {
                    return null;
                }

                return {
                    line: intersectLine,
                    point: intersectPoint,
                };
            }

            let setbackLineStart = origSetbackLineStart;
            let setbackLineEnd = origSetbackLineEnd;

            const intersectStart = findIntersectingLine(origSetbackLineEnd, false);
            if (intersectStart) {
                setbackLineStart = intersectStart.point;
            }

            const intersectEnd = findIntersectingLine(origSetbackLineStart, true);
            if (intersectEnd) {
                setbackLineEnd = intersectEnd.point;
            }

            setbackPts.push([
                [setbackLineStart.x / inch2m, -setbackLineStart.z / inch2m, setbackLineStart.y / inch2m],
                [setbackLineEnd.x / inch2m, -setbackLineEnd.z / inch2m, setbackLineEnd.y / inch2m]
            ]);
        });
    });

    const genJson = {
        SITE_INFO: {
            GeoReference: {
                GeoReferenceNorthAngle: 0,
                Latitude: latitude,
                Longitude: longitude,
                LocationSource: "Manual",
                Map: "terrain",
                ModelTranslationX: null, // -18871519.616960514,
                ModelTranslationY: null, // -174402260.58333763,
                PeakHeight: buildingAlt.high,
                UsesGeoReferencing: false
            },
            temp: {temp: 0},
            Box: {
                acc_aurora_id: null,
                acc_root_id: null,
                opp_root_id: null,
                opp_site_info_designs_id: null,
                opp_site_info_documents_id: null
            }, // "162919310082"
            Location: {
                address: useViewerStore.getState().siteAddress,
                city: city,
                "full address": useViewerStore.getState().siteAddress,
                lat: latitude,
                lon: longitude,
                "north orientation": "0",
                postal: postalCode,
                state: state
            },
            Eagleview: {
                house_center: [0, 0, buildingAlt.high],
                includes_trees: false
            },
            Genesis: {version: "Genesis 2"},
            Genesis_Entities: {Protected_IDs: [ /* ... integer array */]},
            Setbacks: {EAVE, HIP, RAKE, RIDGE, STEPFLASH, VALLEY},
            Module_Info: {
                Depth: selModuleIdx,
                Height: selModuleInfo.h / inch2m,
                Wattage: selModuleInfo.power,
                Width: selModuleInfo.w / inch2m
            },
            TMY2: {
                city,
                distance: null,
                elev: null,
                lat: latitude,
                location: detail,
                lon: longitude,
                solar_resource_file: "14737.tm2",
                state,
                tz: sunInfo.utcOffset
            },
            TMY3: {
                city,
                distance: null,
                elev: null,
                lat: latitude,
                location: detail,
                lon: longitude,
                solar_resource_file: csvFileName,
                state,
                tz: sunInfo.utcOffset
            },
            PVWatts: {"ideal_prod_multiplier": idealProdMulti},
            Utility: {api_names: null, api_rate: null},
            Sun_Angles: {hash: sunAngles},
            NSRDB: {"Updated": null},
            GSU_ContributorsInfo: {"LastModifiedByKey": "", "VersionKey": null,}, // 1000
            Sunnova: {"LID": null},
            RSA: {"modified_by": {}, "status": null, "verified": null},
            Walls: {"driveway selected": true, "front facing selected": true},
            Salesforce: {
                "Account Name": null, // "9613 Viceroy Lane  Breinigsville  PA",
                "Annual Usage": null, // 16301,
                "Customer Email": null, // "12tinkpeter@gmail.com",
                "Customer First Name": null, // "Suzanne",
                "Customer Last Name": null, // "Gohn-Nafus",
                "Customer Phone": null, // "(610) 809-4845",
                "Mod Picklist": moduleList.reduce((p, c) => {
                    p[c.value] = c.power;
                    return p;
                }, {}),
                "Module Type": selModuleInfo.value,
                "Opportunity Id": sessionStorage.getItem('SalesForceId'), // "0065b00000v547qAAA",
                "Opportunity Name": sessionStorage.getItem('opportunityName'), // "Gohn  Suzanne-",
                "Owner": null, // "Trinity Direct",
                "Postal Code": postalCode,
                "RSA Picklist": null,
                "Setback Info": {
                    "Eave__c": null,
                    "Valley__c": null,
                    "Hip__c": null,
                    "Rake__c": null,
                    "Ridge__c": null,
                    "All_Roofs__c": null,
                    "Setback_Notes__c": null,
                    "Designer_Needed__c": null,
                    "Front_of_Home__c": false,
                    "Doors__c": false,
                    "Single_Ridge__c": false,
                    "Alternate_Venting__c": false,
                    "X24_Access_Roof__c": false,
                    "Perimeter__c": false,
                    "Street_Side_Pathway__c": true
                },
                "Site Assessment": null, // "Remote",
                "Stage": null, // "5",
                "System Productions Id": null, // "a5v5b0000012qojAAA",
                "Township Name": null, // "Upper Macungie Township, PA",
                "Utility Name": null, // "PPL Electric Utilities"
            }
        },
        ROOFS, FACES, LINES, PTS, TREES, OBSTRUCTIONS, MODULES, SETBACKS: {"PTS": setbackPts},
        TERRAIN: {
            img_bins: {"terrain.jpg": map64Binary, "snap.jpg": null}, // ,
            "uvs": {"terrain.jpg": map64Binary, "snap.jpg": null}
        }
    }
    return genJson;
}

function toVector(v) {
    return new THREE.Vector3(v.x, v.y, v.z);
}

function GetObstInfo(obst, endL, endP, selRoof) {
    const {worldPos, shapeNum, verPosArr, radius, height, verFloor} = obst, {x, y, z} = worldPos;
    const verArr = { bottom:[], ceiling:[] };
    if (verFloor) {
        const verPlaneArr = [], interYArr = [];
        if (shapeNum===1) {
            verPosArr.forEach(wPos => {
                verPlaneArr.push({
                    x: GetRoundNum(wPos.x, 4),
                    z: GetRoundNum(wPos.z, 4)
                });
            });
        } else {
            verNorArr.forEach(verNor => {
                verPlaneArr.push({
                    x: GetRoundNum(x + verNor.x * radius/1.6, 4),
                    z: GetRoundNum(z + verNor.z * radius/1.6, 4)
                });
            });
        }
        verPlaneArr.forEach(verPlane => {
            if (!selRoof) { interYArr.push(0); return; }
            const posStart = new THREE.Vector3(verPlane.x, y + 10, verPlane.z),
                  posTarget = new THREE.Vector3(verPlane.x, y - 10, verPlane.z),
                  sunLineVec = new THREE.Vector3();
            sunLineVec.subVectors(posTarget, posStart);
            sunLineVec.normalize();
            const raycaster = new THREE.Raycaster();
            raycaster.set(posStart, sunLineVec);
            const rayIntersect = raycaster.intersectObjects([selRoof], false)[0];
            var interY = y;
            if (!rayIntersect) { }
            else {
                const {point} = rayIntersect;
                interY = GetRoundNum(point.y, 4);
            }
            interYArr.push(interY);
        });
        [0, height].forEach(h => {
            const alt = h + y;
            verPlaneArr.forEach((verPlane, verIdx) => {
                var posY = alt;
                if (interYArr && h===0) {
                    posY = interYArr[verIdx];
                }
                const ptPos = {x: verPlane.x, y: posY, z: verPlane.z}, sideKey = h===0?'bottom':'ceiling';
                verArr[sideKey].push(ptPos);
            });
        });
    } else {
        const norArr = shapeNum===1?[{x:-1, z:-1}, {x:-1, z:1}, {x:1, z:1}, {x:1, z:-1}]:verNorArr;
        [-1, 1].forEach(h => {
            norArr.forEach((nor, norIdx) => {
                const cloneTest = testMesh.clone();
                cloneTest.position.set(nor.x*0.5, h*0.5, nor.z*0.5);
                obst.add(cloneTest);
                const wPos = cloneTest.getWorldPosition(new THREE.Vector3()), sideKey = h===-1?'bottom':'ceiling';
                const wPosCut = {x:GetRoundNum(wPos.x, 4), y:GetRoundNum(wPos.y, 4), z:GetRoundNum(wPos.z, 4) };
                verArr[sideKey].push(wPosCut);
                obst.remove(cloneTest);
            });
        });
    }
    return GetPolygonVerArr(verArr, endL, endP);
}

function GetPolygonVerArr(verArr, endL, endP) {
    const fixEndP = endP, fixEndL = endL;
    const newFaceArr = [], newLineArr = [], newPtArr = [], verCount = verArr.bottom.length;
    ['bottom', 'ceiling'].forEach(sideKey => {
        const udFaceLineKeyArr = [], udFacePosArr = [], udFacePtKeyArr = [];
        verArr[sideKey].forEach((verItem, verIdx) => {
            const lastVer = verIdx === verCount - 1;
            const ptKey = 'P' + endP, nextPtKey = lastVer ? 'P' + (endP - verCount + 1) : 'P' + (endP + 1); //  - 1
            const nextIdx = lastVer ? 0 : verIdx + 1, nextVer = verArr[sideKey][nextIdx];
            newPtArr.push({ptKey, pos: {...verItem}});
            endP++;
            const ptKeyArr = [ptKey, nextPtKey], lineKey = 'L' + endL;
            const points = [ {...verItem}, {...nextVer} ];
            newLineArr.push({ENFORCED_PATHWAY:false, ENFORCED_ROOFS: [], STREET_SIDE: false, TYPE: false, lineKey, ptKeyArr, posArr: points});
            endL++;
            udFaceLineKeyArr.push(lineKey);
            udFacePosArr.push({...verItem});
            udFacePtKeyArr.push(ptKey);
        });
        newFaceArr.push({faceLineArr: udFaceLineKeyArr, posArr: udFacePosArr, size: null, facePtArr: udFacePtKeyArr});
    });

    verArr.bottom.forEach((verPlane, verIdx) => {
        const linePillarKey = 'L' + endL,
            linePtKeyArr = [
                'P' + parseInt(fixEndP+verIdx),
                'P' + parseInt(fixEndP+verIdx + verCount)
            ],
            linePoints = [
                {...verArr.ceiling[verIdx]},
                {...verArr.bottom[verIdx]}
            ];
        newLineArr.push({ENFORCED_PATHWAY:false, ENFORCED_ROOFS: [], STREET_SIDE: false, TYPE: false, lineKey: linePillarKey, ptKeyArr: linePtKeyArr, posArr: linePoints});
        endL++;
    });

    verArr.bottom.forEach((verPlane, verIdx) => {
        const lastVer = verIdx === verCount - 1;
        var pos0 = newPtArr[verIdx], pos1 = newPtArr[verIdx+1], pos2 = newPtArr[verIdx+verCount+1], pos3 = newPtArr[verIdx+verCount];
        var line0 = newLineArr[verIdx], line1 = newLineArr[verIdx+verCount*2+1], line2 = newLineArr[verIdx+verCount], line3 = newLineArr[verIdx+verCount*2];
        if (lastVer) {
            pos1 = newPtArr[0]; pos2 = newPtArr[verCount];
            line1 = newLineArr[verIdx+verCount+1];
        }
        const facelineKeyArr = [line0.lineKey, line1.lineKey, line2.lineKey, line3.lineKey];
        const facePoints = [pos0.pos, pos1.pos, pos2.pos, pos3.pos],
            facePtKeyArr = [pos0.ptKey, pos1.ptKey, pos2.ptKey, pos3.ptKey];
        newFaceArr.push({faceLineArr: facelineKeyArr, posArr: facePoints, size: null, facePtArr: facePtKeyArr});
    });

    return {newFaceArr, newLineArr, newPtArr};
}

export function SetMatEmissive(selectArr, mainType, selType, mouseType) {
    const availableTypeArr = ['tree', 'obst'];
    if (!availableTypeArr.includes(mainType)) return;
    const selMeshArr = selectArr.filter(item => {
        return item.meshType === mainType
    });
    selMeshArr.forEach(item => {
        if (!item.isMesh) return;
        var emissiveCol = 0x000000;
        if (mainType === 'tree') {
        }
        else {
            if (selType === 'allSelected') {
                if (mainType === 'obst') emissiveCol = 0xff0000;
            }
            item.material.emissive.set(emissiveCol);
        }
    });
}

function EncryptJsonStr(text) {
    const symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()_-+={}[]|:;'<>,.?/ ".split("");
    const encSymbols = "@F_3y4X%eBjxVU{5<(,RdKf#=IPDJLA9'} Ho[|iThrN^ngv+sSWE*C6m)t-b?O2]qk8z>:Qwc0!Y;&la7uMp1$.Z/G".split("");
    let hash = {};
    for (let i = 0; i < symbols.length; i++) {
        hash[symbols[i]] = encSymbols[i];
    }
    let newStr = "";
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        let newChar = hash[char];
        if (newChar) {
            newStr += newChar;
        } else {
            newStr += char;
        }
    }
    return newStr;
}

export function GetMousePos(e) {
    var posX, posY;
    const {touches, changedTouches, offsetX, offsetY} = e;
    const deltaTop = 60;
    if (offsetX && offsetY) {
        posX = offsetX;
        posY = offsetY;
    } else if (touches && touches[0]) {
        posX = touches[0].clientX;
        posY = touches[0].clientY - deltaTop;
    } else if (changedTouches && changedTouches[0]) {
        posX = changedTouches[0].clientX;
        posY = changedTouches[0].clientY - deltaTop;
    }
    return {posX, posY};
}

export function random(min, max) {
    return Math.random() * (max - min) + min;
}
