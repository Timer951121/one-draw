import * as THREE from "three";
import axios from "axios";
import {GetLatLon, SetMapCustomSize} from "./MapControl";
import {Loader} from '@googlemaps/js-api-loader';
import {SetSunVecArr} from "../Sun-Vector-Path/LoadSun";
import sleep from "../../../helpers/sleep";
import { logger } from "../../../services/loggingService";

export const mapSize = 150;

//Use this to set the terrain exaggeration factor
//Higher values will make the terrain will be more flat
//Lower values will make the terrain more mountainous
const terrainExaggerationFactor = 6;

export const pixelCount = 10, lineCount = pixelCount + 1, apiCount = 512, lastNum = pixelCount * pixelCount,
    pixelSize = mapSize / pixelCount;
const settingSize = {min: 10, max: mapSize, step: 0.5,},
    settingRot = {min: 0, max: 360, step: 1,},
    settingScale = {min: 0.02, max: 5, step: .01,},
    settingPos = {min: -mapSize / 2, max: mapSize / 2, step: 1,},
    settingOpa = {min: 0, max: 1, step: 0.1,};

export const customMapSettingList = [
    {title: 'Scale', id: 'Scale', settings: settingScale, label: '', default: 1},
    {title: 'Rotation', id: 'Rotation', settings: settingRot, label: 'deg', default: 0},
    // {title:'Length',	id:'Height',	settings:settingSize, label:'ft', default:150},
    // {title:'Position X',id:'PosX',		settings:settingPos, label:'', default:0},
    // {title:'Position Y',id:'PosY',		settings:settingPos, label:'', default:0},
    // {title:'Opacity',	id:'Opacity',	settings:settingOpa, label:'', default:1},
]

const apiDelayTime = 10;
const apiDelayFailTime = 3000;


export function SetTerrain(self, origin) {
    // var loadCount = 0;
    // const terrainData = [];
    const btnVisibleterrain = document.getElementsByClassName('btnVisibleterrain')[0];
    btnVisibleterrain?.classList.remove('toggle');
    btnVisibleterrain?.classList.add('disabled');

    self.mapCustom.scale.set(1, 1, 1);
    self.mapCustom.visible = false;

    const tempArr = [];
    for (let x = 0; x < lineCount; x++) {
        for (let z = 0; z < lineCount; z++) {
            tempArr.push({x, z, py: 0.1});
        }
    }
    self.nodeArr = [{x: 0, y: 0, z: 0}];
    SetTerrainMapGeo(self, tempArr);
    self.loadingTerrain = true;

    const latlonArr = [];
    for (let z = mapSize / -2; z <= mapSize / 2; z += pixelSize) {
        for (let x = mapSize / -2; x <= mapSize / 2; x += pixelSize) {
            const location = GetLatLon(origin, {x: x || pixelSize, z: z || pixelSize}); // avoid pos 0 value
            latlonArr.push(location);
        }
    }

    const loader = new Loader({
        apiKey: process.env.REACT_APP_GOOGLE_JAVASCRIPT_MAP_API_KEY,
        version: "weekly",
        libraries: ["elevation"]
    });

    loader.load().then((google) => {
        const elevator = new google.maps.ElevationService();
        CallLatLonAPITotal(elevator, self, latlonArr, [], 0);
    }).catch(e => {
        logger.error(e);
        window.alert('failed to load terrain!');
    });

    const {latitude, longitude} = origin;
    axios.get(process.env.REACT_APP_GOOGLE_MAP_INFO_API_URL + "?latlng=" + latitude + ',' + longitude + "&key=" + process.env.REACT_APP_GOOGLE_JAVASCRIPT_MAP_API_KEY).then(res => {
        if (res.status !== 200 || !res.data || !res.data.results || !res.data.results.length) return;
        const addressObj = res.data.results[0].address_components;
        const country = addressObj[6]?.long_name,
            state = addressObj[5]?.long_name,
            city = addressObj[4]?.long_name,
            detail = addressObj[3]?.long_name,
            postalCode = addressObj[7]?.long_name;
        self.addressInfo = {country, state, city, detail, postalCode};
    });
}

async function CallLatLonAPITotal(elevator, self, latlonArr, terrainData) {
    let startNum = 0;

    do {
        try {
            const reqArr = [];
            for (let i = 0; i < apiCount; i++) {
                const location = latlonArr[startNum + i];
                if (!location) continue;
                reqArr.push({lat: location.latitude, lng: location.longitude});
            }

            if (startNum > 0) {
                await sleep(apiDelayTime);
            }

            const res = await elevator.getElevationForLocations({'locations': reqArr});

            res.results.forEach((item, idx) => {
                const nodeNum = startNum + idx;
                const nodeX = nodeNum % lineCount, nodeZ = Math.floor(nodeNum / lineCount);
                terrainData[nodeNum] = {x: nodeX, z: nodeZ, py: item.elevation};
            });
            startNum += apiCount;
        } catch (e) {
            logger.error(e);
            await sleep(apiDelayFailTime);
        }
    } while (startNum + apiCount < lineCount * lineCount);

    const customData = CustomTerrainData(terrainData);
    self.loadingTerrain = false;
    SetTerrainMapGeo(self, customData);
    const btnVisibleterrain = document.getElementsByClassName('btnVisibleterrain')[0];
    btnVisibleterrain?.classList.remove('disabled');
}

function CustomTerrainData(terrainData) {
    const customData = [];
    const minY = Math.min.apply(Math, terrainData.map(function (o) {
            return o.py;
        })),
        maxY = Math.max.apply(Math, terrainData.map(function (o) {
            return o.py;
        })),
        middleY = (minY + maxY) / 2;
    terrainData.forEach(item => {
        const dY = middleY - item.py, customY = middleY - dY / terrainExaggerationFactor;
        customData.push({...item, py: customY})
    });
    return customData;
}

function SetTerrainMapGeo(self, terrainData) {
    const {nodeArr} = self, nodeAltArr = [];
    nodeArr.forEach(node => {
        const nodeAlt = GetAlt(terrainData, node);
        nodeAltArr.push(nodeAlt);
    });
    const buildingAltL = Math.min(...nodeAltArr), buildingAltH = Math.max(...nodeAltArr);

    self.terrainArr = [];
    const planeGeo = new THREE.PlaneGeometry(mapSize, mapSize, pixelCount, pixelCount);
    const customGeo = new THREE.PlaneGeometry(mapSize, mapSize, pixelCount, pixelCount);
    const verPlane = planeGeo.attributes.position.array,
        verCustom = customGeo.attributes.position.array;

    for (let i = 0; i < terrainData.length; i++) {
        const {py} = terrainData[i];
        verPlane[3 * i + 2] = py * 1;
        verCustom[3 * i + 2] = py * 1 + 1;
        const z = Math.floor(i / lineCount), x = i % lineCount, pz = pixelSize * z - mapSize / 2,
            px = pixelSize * x - mapSize / 2;
        self.terrainArr.push({x, z, px, py, pz});
    }
    self.mapMesh.geometry = planeGeo;
    const customScl = self.mapCustom.scale, customWidth = customScl.x * mapSize, customHeight = customScl.y * mapSize;
    SetMapCustomSize(self, 'width', customWidth);
    SetMapCustomSize(self, 'height', customHeight);
    self.buildingAlt = {low: buildingAltL, high: buildingAltH};
    SetSunVecArr(self);
    SetTerrainPosition(self);
}

export function SetTerrainPosition(self) {
    const {treeGroup, terrainArr, terrainView, viewMode, buildingAlt, roofGroup} = self;
    const btnVisibleterrain = document.getElementsByClassName('btnVisibleterrain')[0];
    const nextStatus = btnVisibleterrain?.classList.contains('toggle');
    if (nextStatus) btnVisibleterrain?.classList.remove('toggle');
    else btnVisibleterrain?.classList.add('toggle');
    const terrainFlag = terrainView && viewMode === '3d';
    const deltaBuildingH = buildingAlt.low + 0.2;
    treeGroup.children.forEach(tree => {
        tree.position.y = terrainFlag ? GetAlt(terrainArr, tree.position, deltaBuildingH) : 0; // high
    });

   if(self.mapFormat==="XML"){
       self.mapMesh.scale.z = self.mapCustom.scale.z = terrainFlag ? 0.001 : 0.00001;

   }
   else {
       self.mapMesh.scale.z = self.mapCustom.scale.z = terrainFlag ? 1 : 0.00001;
   }





    self.mapMesh.position.y = self.mapCustom.position.y = terrainFlag ? -deltaBuildingH : 0; // high

    if (!roofGroup.children[0]) return;
    roofGroup.children[0].children.forEach(child => {
        if (child.meshType !== 'floor') return;
        child.scale.z = (buildingAlt.high - buildingAlt.low) * 10;
    });
}

export function GetAlt(terrainArr, pos, delta = 0) {
    const {x, y, z} = pos,
        xn = Math.round((x + mapSize / 2) / pixelSize),
        zn = Math.round((z + mapSize / 2) / pixelSize);
    const terrainNode = terrainArr.find(node => node && node.x === xn && node.z === zn);
    return terrainNode ? terrainNode.py - delta : 0;
}
