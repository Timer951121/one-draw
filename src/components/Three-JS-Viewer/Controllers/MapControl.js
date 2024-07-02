import * as THREE from "three";
import * as geolib from 'geolib';
import {customMapSettingList, lineCount, mapSize, pixelCount, pixelSize} from "./TerrainControl";

export function ChangeMapMesh(self, img) {
    let map = new THREE.TextureLoader().load(img);
    //Improve texture quality
    map.minFilter = THREE.LinearFilter;
    map.magFilter = THREE.LinearFilter;
    map.anisotropy = self.renderer.capabilities.getMaxAnisotropy();

    //Increase texture sharpness
    map.generateMipmaps = false;
    map.needsUpdate = true;

    self.mapTexture = map;
    self.map64Binary = img.replace(/^data:image\/(png|jpg);base64,/, "")
    SetMapMesh(self);
}

export function SetMapMesh(self) {
    const {mapTexture, mapView} = self;

    if(mapView){
        self.mapMesh.material.map = mapTexture;
    }
    else {
        //set white color
        const whiteBackgroundMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: false,
            opacity: 1
        });
        self.mapMesh.material = whiteBackgroundMaterial;
    }

    self.mapMesh.material.needsUpdate = true;
}

export function setCustomImagery(self, img) {
    const {mapCustom, mapCustomWrapper } = self;
    let map = new THREE.TextureLoader().load(img.src);
    self.mapTexture = map;

    map.minFilter = THREE.LinearFilter;
    map.magFilter = THREE.LinearFilter;
    map.anisotropy = self.renderer.capabilities.getMaxAnisotropy();
    map.generateMipmaps = false;
    map.needsUpdate = true;

    //increase texture sharpness,brightness.
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1, 1);
    map.offset.set(0, 0);

    //color white
    map = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: map,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1
    });
    mapCustom.material = map;
    let aspectRatio = img.width / img.height;
    mapCustom.aspectRatio = aspectRatio;
    mapCustom.scale.x = aspectRatio;
    mapCustom.scale.y = 1;
    mapCustom.visible = true;
    mapCustom.rotation.z = 0;
    mapCustomWrapper.position.x = 0;
    mapCustomWrapper.position.z = 0;
    // self.mapCustom.material.map = map;
    mapCustom.material.needsUpdate = true;

    customMapSettingList.forEach(item => {
        SetInputRangeVal(item.id, item.default);
    });
}

export function SetMapCustomSize(self, type, value) {
    const {mapCustom, mapCustomWrapper, terrainArr} = self, {scale} = mapCustom;
    const newScl = parseInt(value) / mapSize;
    const aspectRatio = self.mapCustom.aspectRatio;
    if (type === 'scale'){
        scale.y = value;
        scale.x = value * aspectRatio;
    } else if (type === 'height' || type === 'width') {
        scale.y = newScl;
        scale.x = newScl * aspectRatio;
    } else if (type === 'rotation') mapCustom.rotation.z = Math.PI / 180 * value;
    else if (type === 'posX') {
        mapCustomWrapper.position.x = value;
    } else if (type === 'posY') {
        mapCustomWrapper.position.z = value;
    } else if (type === 'opacity') {
        //change opacity and transparency
        self.mapCustom.material.opacity = value;
        self.mapCustom.material.transparent = value < 1;
        self.mapCustom.material.needsUpdate = true;
    }

    const rot = mapCustom.rotation.z;
    const dx = mapCustomWrapper.position.x, dy = mapCustomWrapper.position.z;
    mapCustom.scale.set(scale.x, scale.y, 1);
    const planeGeo = new THREE.PlaneGeometry(mapSize, mapSize, pixelCount, pixelCount);
    const verPlane = planeGeo.attributes.position.array;
    for (let x = 0; x < lineCount; x++) {
        for (let y = 0; y < lineCount; y++) {
            const cx = (mapSize / -2 + pixelSize * x) * scale.x;
            const cy = (mapSize / -2 + pixelSize * y) * scale.y;
            const tan = Math.atan2(cy, cx), newTan = tan - rot, dis = Math.sqrt(cx * cx + cy * cy);
            const rx = Math.cos(newTan) * dis + dx, ry = Math.sin(newTan) * dis + dy;
            var xpn = Math.round((rx + mapSize / 2) / pixelSize);
            var ypn = Math.round((ry + mapSize / 2) / pixelSize);
            if (xpn < 0) xpn = 0;
            if (xpn >= lineCount) xpn = lineCount - 1;
            if (ypn < 0) ypn = 0;
            if (ypn >= lineCount) ypn = lineCount - 1;
            const tn = ypn * lineCount + xpn, cn = y * lineCount + x;
            const {py} = terrainArr[tn];
            verPlane[3 * cn + 2] = py * 1 + 1;
        }
    }
    self.mapCustom.geometry = planeGeo;
}

export function ViewAlertLatLon(self, point) {
    const offsetPoint = GetLatLon(self.mapCoordinates, point);

    self.viewerAlert({
        show: true,
        isModal: false,
        title: 'Lat-Long Position',
        message: `Latitude: ${offsetPoint.latitude.toFixed(5)} \n Longitude: ${offsetPoint.longitude.toFixed(5)}`,
    })
}

export function FetchMapImage(self, vendor) {
    let apiURL;
    const {latitude, longitude} = self.mapCoordinates
    const sizeGoogle = 4 * mapSize, sizeMapbox = Math.round(5.8 * mapSize);

    if (vendor === "google") {
        apiURL = `${process.env.REACT_APP_GOOGLE_STATIC_IMAGE_API_URL}?center=${latitude},${longitude}&zoom=19&size=${sizeGoogle}x${sizeGoogle}&maptype=satellite&key=${process.env.REACT_APP_GOOGLE_STATIC_IMAGE_API_KEY}`
    } else if (vendor === "mapbox") {
        apiURL = `${process.env.REACT_APP_MAPBOX_API_URL}${longitude},${latitude},18.7,0/${sizeMapbox}x${sizeMapbox}@2x?access_token=${process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}`
    } else if (vendor === "nearmap") {
        apiURL = `${process.env.REACT_APP_NEAR_MAP_STATIC_IMAGERY_API_URL}?center=${latitude},${longitude}&size=${sizeGoogle}x${sizeGoogle}&zoom=19&apikey=${process.env.REACT_APP_NEAR_MAP_API_KEY}`
    }


    fetch(apiURL)
        .then(res => {
                if (res.ok) {
                    return res.blob();
                } else {
                    throw new Error();
                }
            }
        )
        .then(blob => {
                const reader = new FileReader();
                reader.onload = () => {
                    const dataURL = reader.result;
                    ChangeMapMesh(self, dataURL);
                };
                reader.readAsDataURL(blob);
            }
        )
        .catch((e) => {
            self.viewerAlert({
                show: true,
                isModal: true,
                messageType: 'error',
                title: 'Error- Something went wrong',
                message: `${vendor.toUpperCase()} Map API did not return a image.Either the API is down or it is a invalid request. Site may load but the map will not be visible or persist the previous vendor image.Try a different vendor.`,
            })
        })
}

export function GetLatLon(mapCoordinates, point) {
    //point.z positive to negative and vice versa
    if (point.z < 0) {
        point.z = Math.abs(point.z);
    } else {
        point.z = -Math.abs(point.z);
    }

    // Define the offset distance in meters
    //calculate the distance from the center of the earth to the point on the plane
    const offsetDistance = Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.z, 2));


    //Define bearing
    let bearing;

    //calculate the bearing
    if (point.x >= 0 && point.z >= 0) {
        bearing = Math.atan(point.x / point.z);
    } else if (point.x >= 0 && point.z < 0) {
        bearing = Math.atan(point.x / point.z) + Math.PI;
    } else if (point.x < 0 && point.z < 0) {
        bearing = Math.atan(point.x / point.z) + Math.PI;
    } else if (point.x < 0 && point.z >= 0) {
        bearing = Math.atan(point.x / point.z) + 2 * Math.PI;
    }

    //bearing value to high precision
    bearing = bearing * 180 / Math.PI;
    bearing = Math.round(bearing * 1000000) / 1000000;

    // Calculate the latitude and longitude of the offset point
    return geolib.computeDestinationPoint(mapCoordinates, offsetDistance, bearing);
}


export function GetXYZ(mapCoordinates, latLon) {
    // Calculate the distance and bearing from the map reference point to the given lat/lon
    const distance = geolib.getDistance(mapCoordinates, latLon);
    const bearing = geolib.getGreatCircleBearing(mapCoordinates, latLon);

    // Convert bearing to radians
    const bearingRadians = bearing * Math.PI / 180;

    // Calculate the x and z coordinates (assuming y is up/down and ignoring elevation)
    const x = Math.sin(bearingRadians) * distance;
    const z = Math.cos(bearingRadians) * distance;

    // Assuming a flat Earth projection, y would be 0 or at sea level
    // If elevation is needed, it can be calculated separately
    const y = 0;

    // Invert z coordinate to match the original function's convention
    const zInverted = -z;

    // Return the 3D Cartesian coordinates
    return {x: x, y: y, z: zInverted};
}

export function DragMapCustom(self, interPos) {
    const {posPlaneDown, posMapDown } = self;
    const deltaDis = {x: interPos.x - posPlaneDown.x, z: interPos.z - posPlaneDown.z};
    const newPosX = posMapDown.x + deltaDis.x,
        newPosZ = posMapDown.z + deltaDis.z;
    if ( Math.abs (newPosX) < mapSize / 2 ) {
        // SetInputRangeVal('PosX', newPosX);
        SetMapCustomSize(self, 'posX', newPosX);
    }
    if ( Math.abs(newPosZ) < mapSize / 2 ) {
        // SetInputRangeVal('PosY', newPosZ);
        SetMapCustomSize(self, 'posY', newPosZ);
    }
}

function SetInputRangeVal(key, value) {
    const inputEle = document.getElementById('inputcustomImage' + key),
        rangeEle = document.getElementById('rangecustomImage' + key);
    if (!inputEle || !rangeEle) return;
    inputEle.value = value;
    rangeEle.value = value;
}