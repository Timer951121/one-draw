import * as THREE from "three";
import {spa_calculate} from "./NREL";
import {GetDateVal, GetRadVal, GetRoundNum} from "../Controllers/Common";

export const radiusOut = 120, radiusSun = 5;

export function LoadSunGroup(sunGroup) {
    const sunGeo = new THREE.SphereGeometry(radiusSun, 32, 32),
        sunMat = new THREE.MeshLambertMaterial({color: 0xFDB813, emissive: 0xFDB813}),
        sunMesh = new THREE.Mesh(sunGeo, sunMat),
        sunLight = new THREE.PointLight(0xFFFFFF, 1);

    sunLight.name = 'sunLight';

    sunLight.add(sunMesh);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = sunLight.shadow.mapSize.height = 1024;
    sunGroup.add(sunLight);
    sunGroup.scale.z = -1;
}

export const labelMonthArr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function SetSunVecArr(self) {
    const {sunInfo, buildingAlt} = self;
    if (!sunInfo.utcOffset || !buildingAlt || buildingAlt.low === 0.1) return;
    const {low, high} = buildingAlt, elevation = (low + high) / 2;
    sunInfo.elevation = elevation;

    self.sunVecArr = CreateSunVecArr(sunInfo);
    SetSunPathGeo(self.sunGroup, self.sunVecArr, sunInfo);
}

export function CreateSunVecArr(sunInfo) {
    const year = new Date().getFullYear();
    const sunVecArr = [], dateFirst = new Date(year, 0), countDecimal = 5;

    for (let i = 1; i < 366; i++) {
        const dateNew = new Date(dateFirst);
        dateNew.setDate(i);
        sunInfo.date = GetDateVal(dateNew);
        const day = dateNew.getDate() - 1, month = dateNew.getMonth();
        if (!sunVecArr[month]) sunVecArr[month] = [];

        sunVecArr[month][day] = [];
        for (let j = 0; j < 24; j++) {
            sunInfo.time = j;
            const timeInfo = {year: year, month: month + 1, day: day + 1, hour: j == 23 ? 0 : j + 1, min: 55}
            const {x, y, z} = SetSunPos(null, sunInfo, timeInfo, 'init');
            sunVecArr[month][day].push({
                x:GetRoundNum(x, countDecimal),
                y:GetRoundNum(y, countDecimal),
                z:GetRoundNum(z, countDecimal)
            });
        }
    }

    return sunVecArr;
}

export function SetSunPathGeo(sunGroup, sunVecArr, info) {
    const oldSunPathMesh = sunGroup.children.find(child => child.name === 'sunPath');
    if (oldSunPathMesh) sunGroup.remove(oldSunPathMesh);
    const sunPathGeo = new THREE.BufferGeometry(),
        sunPathMat = new THREE.LineBasicMaterial({color: 0x3250b4});

    const mainVerArr = [], analemmaMat = new THREE.LineDashedMaterial({color: 0xff9b75, linewidth: 0.5});
    const analemmaLineArr = [];

    const {date} = info;
    const year = new Date().getFullYear();
    for (let t = 0; t < 24; t++) {
        const timeVal = new Date(date.setHours(t, 0)), month = timeVal.getMonth(), day = timeVal.getDate() - 1;
        const vector = sunVecArr[month][day][t];
        mainVerArr.push(vector.x, vector.y, vector.z);

        const analemmaGeo = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 1; i < 366; i++) {
            const subTimeVal = new Date(year, 0);
            subTimeVal.setDate(i);
            const subMonth = subTimeVal.getMonth(), subDay = subTimeVal.getDate() - 1;
            const vector = sunVecArr[subMonth][subDay][t];
            vertices.push(vector.x, vector.y, vector.z);
        }
        analemmaGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        const analemmaLine = new THREE.LineLoop(analemmaGeo, analemmaMat);
        analemmaLine.computeLineDistances();
        analemmaLineArr.push(analemmaLine);
    }

    sunPathGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(mainVerArr), 3));
    const sunPathMesh = new THREE.LineLoop(sunPathGeo, sunPathMat);
    sunPathMesh.visible = false;
    sunPathMesh.name = 'sunPath';
    analemmaLineArr.forEach(line => {
        sunPathMesh.add(line);
    });
    sunGroup.add(sunPathMesh);
    const labelSunDate = document.getElementById('sunDate');
    if (labelSunDate) labelSunDate.textContent = 'Select Date:' + date.getDate() + ' / ' + labelMonthArr[date.getMonth()] + ' / ' + date.getFullYear();
}

function SetSunPos(sunGroup, info, timeInfo, type) {
    // const axisDir = -1;
    // const {date, time, lat, lon, utcOffset} = info, hour = Math.floor(time), min = Math.floor((time-hour)*60);
    // const timeVal = new Date(date.setHours(hour, min));
    // const localOffset = timeVal.getTimezoneOffset();
    // const {altitude, azimuth} = SunCalc.getPosition(timeVal.getTime() - utcOffset*3600*1000 - localOffset*60*1000, lat, lon);

    const axisDir = 1;
    const {utcOffset, lat, lon, elevation} = info;
    const {year, month, day, hour, min} = timeInfo;
    const spa = {
        year,
        month,
        day,
        hour,
        min,
        timezone: utcOffset,
        longitude: lon,
        latitude: lat,
        elevation,
        pressure: 1013,
        temperature: 11,
        slope: 0,
        azm_rotation: 0,
        atmos_refract: 0.5667,
        delta_ut1: 0,
        delta_t: 64.797
    }
    const {d_azimuth, d_zenith} = spa_calculate(spa), azimuth = GetRadVal(d_azimuth),
        altitude = GetRadVal(90 - d_zenith);

    const x = radiusOut * (Math.cos(altitude)) * (Math.sin(azimuth)) * axisDir;
    const z = radiusOut * (Math.cos(altitude)) * (Math.cos(azimuth)) * axisDir * -1;
    const y = radiusOut * (Math.sin(altitude));

    if (type === 'init') {
        return {x: x, y: y, z: z};
    } else if (sunGroup) {
        const sunLight = sunGroup.children.find(child => child.name === 'sunLight');
        sunLight.position.set(x, y, -z);
        const labelSunTime = document.getElementById('labelSunTime');

        let hour = timeInfo.hour;
        let min = timeInfo.min;
        let ampm = hour >= 12 ? 'pm' : 'am';
        hour = hour % 12;
        hour = hour ? hour : 12;
        min = min < 10 ? '0' + min : min;
        hour = hour < 10 ? '0' + hour : hour;
        //update time label
        if(labelSunTime) labelSunTime.textContent = 'Select Time : ' + hour + ' : ' + min + ' ' + ampm;


        //update date label
        const labelSunDate = document.getElementById('sunDate');
        if (labelSunDate) labelSunDate.textContent = 'Select Date :  ' + day + ' / ' + labelMonthArr[month - 1] + ' / ' + year;


    }
}

export function SetSunGroupPos(sunGroup, sunInfo) {
    const {date, time} = sunInfo;
    const year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate();
    const hour = Math.floor(time), min = Math.floor((time - hour) * 60);
    const timeInfo = {year, month, day, hour, min};
    SetSunPos(sunGroup, sunInfo, timeInfo);
}

export function CheckSunTimePlay(self) {
    const btnSunTimePlay = document.getElementsByClassName('btn-sun-time-play')[0];
    const rangeSunTime = document.getElementById('rangeSunTime');
    if (!btnSunTimePlay || !rangeSunTime) return;
    const active = btnSunTimePlay.classList.contains('active');
    if (!active) return;
    var newTime = self.sunInfo.time + 1 / 60;
    if (newTime >= 24) newTime = 0;
    self.sunInfo.time = newTime;
    rangeSunTime.value = newTime;
    SetSunGroupPos(self.sunGroup, self.sunInfo);
}
