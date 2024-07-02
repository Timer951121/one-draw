import Papa from "papaparse";
import {SetSunVecArr} from "../Sun-Vector-Path/LoadSun";
import {SetDisplayShadePoints} from "./RefreshShade";
import {getTMY3WeatherCSVFile} from "../../../services/tmy3Service";
import getLocationCode from "../../../services/locationCodeService";
import { useViewerStore } from "../../../store/store";
export const localTest = false;

function rtd(rad) {
    return (180 * rad) / Math.PI
}

function dtr(deg) {
    return (Math.PI * deg) / 180
}

export async function GetTimeZone(self) {
    await SetIrradianceArr(self);
    return new Promise((resolve, reject) => {
        const {lat, lon} = self.sunInfo;
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = (e) => {
            if (e.target.readyState === 4) {
                if (e.target.status === 200) {
                    const res = JSON.parse(e.target.responseText), {offset, timezone_id} = res;
                    self.sunInfo.utcOffset = parseInt(offset);
                    self.sunInfo.timezone = timezone_id;
                    SetSunVecArr(self);
                    ReadyShadeCalculation(self);
                    resolve();
                } else {
                    reject(e.target.status);
                }
            }
        };
        xhttp.open("GET", process.env.REACT_APP_TIMEZONE_API_URL + lat + "," + lon, true);
        xhttp.send();
    });
}

function GetIrradiance(hour, day_of_year, month, day, utc_offset, lat, lon, tilt, azimuth, dni, ghi, alb, dhi, etrn) {

    const year = 2017; // Uses 2017 as reference
    const isLeapYear = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
    let str = '';
    if (dhi === 0 || dni === 0 || ghi === 0 || etrn === 0 || day_of_year > 366 || (day_of_year === 366 && !isLeapYear))
        return { poa_beam: 0, diffuse: 0, poa_ground: 0, diff_reduce_factor: 0 };

    tilt = 18;
    azimuth = 95;
    const declination = rtd(Math.asin(Math.sin(dtr(-23.44)) * Math.cos(dtr((360 / 365.24) * (day_of_year + 10) + (360 / Math.PI) * 0.0167 * Math.sin(dtr((360 / 365.24) * (day_of_year - 2)))))));
    const eotA = (360 / 365.24) * ((day_of_year - 1) + 10); // Equation of time
    const eotB = eotA + 1.914 * Math.sin(dtr((360 / 365.24) * ((day_of_year - 1) - 2)));
    const eotC = (eotA - rtd(Math.atan(Math.tan(dtr(eotB)) / Math.cos(dtr(23.44))))) / 180;
    const eotFinal = 720 * (eotC - Math.floor(eotC + 0.5));
    
    const dls_start = 1489302000 // Daylight saving start- new Date(2017, 3, 12, 2).getTime()/1000;
    const dls_end = 1509865200 // Daylight saving end- new Date(2017, 11, 5, 2).getTime()/1000;

    let current_date = new Date(year, 0, day, hour);
    // let current_date = new Date(year, 0);
    current_date.setDate(day_of_year);
    const est_offset = (current_date.getTimezoneOffset() - 240) * 60 * 1000;
    current_date.setTime(current_date.getTime() - est_offset);
    current_date = current_date.getTime()/1000;

    // Adds 1 hour offset if daylight saving time
    if (dls_start <= current_date && current_date <= dls_end) utc_offset = utc_offset + 1;
    const lstm = 15 * utc_offset; // Local Standard Time Meridian
    const tc = (4 * (lon - lstm)) + eotFinal; // Time Correction Factor
    const lst = hour + (tc / 60); // Local Solar Time
    const hra = 15 * (lst - 12); // Hour Angle
    const solar_zenith = rtd(Math.acos((Math.sin(dtr(lat)) * Math.sin(dtr(declination))) + (Math.cos(dtr(lat)) * Math.cos(dtr(declination)) * Math.cos(dtr(hra)))));
    const sun_elevation = rtd(Math.asin((Math.sin(dtr(lat)) * Math.sin(dtr(declination))) + (Math.cos(dtr(lat)) * Math.cos(dtr(declination)) * Math.cos(dtr(hra)))));

    const null_test = (solar_zenith > 90 || sun_elevation < 0 );
    if (null_test) return {poa_beam: 0, diffuse: 0, poa_ground: 0, diff_reduce_factor: 0};
    const air_mass_ky = 1 / (Math.cos(dtr(solar_zenith)) + 0.50572 * Math.pow(96.07995 - solar_zenith, -1.6364));
    // var air_mass_basic = 1 / Math.cos(dtr(solar_zenith));
    var aoi = rtd(Math.acos(Math.sin(dtr(declination)) * Math.sin(dtr(lat)) * Math.cos(dtr(tilt)) + Math.sin(dtr(declination)) * Math.cos(dtr(lat)) * Math.sin(dtr(tilt)) * Math.cos(dtr(azimuth)) + Math.cos(dtr(declination)) * Math.cos(dtr(lat)) * Math.cos(dtr(tilt)) * Math.cos(dtr(hra)) - Math.cos(dtr(declination)) * Math.sin(dtr(lat)) * Math.sin(dtr(tilt)) * Math.cos(dtr(azimuth)) * Math.cos(dtr(hra)) - Math.cos(dtr(declination)) * Math.sin(dtr(tilt)) * Math.sin(dtr(azimuth)) * Math.sin(dtr(hra))));
    var poa_beam = dni * Math.cos(dtr(aoi)); // Plane of array (POA) beam
    if (aoi > 90) aoi = 0;
    if (poa_beam < 0) poa_beam = 0;
    const poa_ground = ghi * alb * (1 - Math.cos(dtr(tilt))) / 2;
    var diff_delta = (air_mass_ky * dhi) / etrn;
    var diff_epsilon = (Math.floor((dhi + dni) / dhi) + (1.041 * Math.pow(dtr(solar_zenith), 3))) / (1 + (1.041 * Math.pow(dtr(solar_zenith), 3)));
    var diff_epsilon_bin = null;

    if (diff_epsilon >= 1 && diff_epsilon < 1.065) {
        diff_epsilon_bin = 1
    } else if (diff_epsilon >= 1.065 && diff_epsilon < 1.23) {
        diff_epsilon_bin = 2
    } else if (diff_epsilon >= 1.23 && diff_epsilon < 1.5) {
        diff_epsilon_bin = 3
    } else if (diff_epsilon >= 1.5 && diff_epsilon < 1.95) {
        diff_epsilon_bin = 4
    } else if (diff_epsilon >= 1.95 && diff_epsilon < 2.8) {
        diff_epsilon_bin = 5
    } else if (diff_epsilon >= 2.8 && diff_epsilon < 4.5) {
        diff_epsilon_bin = 6
    } else if (diff_epsilon >= 4.5 && diff_epsilon < 6.2) {
        diff_epsilon_bin = 7
    } else if (diff_epsilon >= 6.2 && diff_epsilon < 100) {
        diff_epsilon_bin = 8
    }


    var diff_f11 = null, diff_f12 = null, diff_f13 = null, diff_f21 = null, diff_f22 = null, diff_f23 = null;

    switch (diff_epsilon_bin) {
        case 1:
            diff_f11 = -0.008;
            diff_f12 = 0.588;
            diff_f13 = -0.062;
            diff_f21 = -0.06;
            diff_f22 = 0.072;
            diff_f23 = -0.022;
            break;
        case 2:
            diff_f11 = 0.13;
            diff_f12 = 0.683;
            diff_f13 = -0.151;
            diff_f21 = -0.019;
            diff_f22 = 0.066;
            diff_f23 = -0.029;
            break;
        case 3:
            diff_f11 = 0.33;
            diff_f12 = 0.487;
            diff_f13 = -0.221;
            diff_f21 = 0.055;
            diff_f22 = -0.064;
            diff_f23 = -0.026;
            break;
        case 4:
            diff_f11 = 0.568;
            diff_f12 = 0.187;
            diff_f13 = -0.295;
            diff_f21 = 0.109;
            diff_f22 = -0.152;
            diff_f23 = -0.014;
            break;
        case 5:
            diff_f11 = 0.873;
            diff_f12 = -0.392;
            diff_f13 = -0.362;
            diff_f21 = 0.226;
            diff_f22 = -0.462;
            diff_f23 = 0.001;
            break;
        case 6:
            diff_f11 = 1.132;
            diff_f12 = -1.237;
            diff_f13 = -0.412;
            diff_f21 = 0.288;
            diff_f22 = -0.823;
            diff_f23 = 0.056;
            break;
        case 7:
            diff_f11 = 1.06;
            diff_f12 = -1.6;
            diff_f13 = -0.359;
            diff_f21 = 0.264;
            diff_f22 = -1.127;
            diff_f23 = 0.131;
            break;
        case 8:
            diff_f11 = 0.678;
            diff_f12 = -0.327;
            diff_f13 = -0.25;
            diff_f21 = 0.156;
            diff_f22 = -1.377;
            diff_f23 = 0.251;
            break;
    }


    const diff_f1 = diff_f11 + (diff_f12 * diff_delta) + (dtr(solar_zenith) * diff_f13);
    const diff_f2 = diff_f21 + (diff_f22 * diff_delta) + (dtr(solar_zenith) * diff_f23);
    var diff_a = Math.cos(dtr(aoi));
    if (diff_a < 0) diff_a = 0;
    var diff_b = Math.cos(dtr(solar_zenith));
    if (diff_b < 0.087) diff_b = 0.087;
    const diffuse = dhi * (((1 - diff_f1) * (1 + Math.cos(dtr(tilt))) / 2) + (diff_f1 * diff_a / diff_b) + (diff_f2 * Math.sin(dtr(tilt))));
    const diff_reduce_factor = (dhi * diff_f1 * diff_a / diff_b) / diffuse;
    // diff_reduce_factor = 0 if diff_reduce_factor < 0
    // return [poa_beam, diffuse, poa_ground, diff_reduce_factor]
    return {poa_beam, diffuse, poa_ground, diff_reduce_factor: diff_reduce_factor || 0};
}

export function GetIrradianceMonth(hash) {
    const monthHash = [];
    hash.forEach((month, monthIdx) => {
        monthHash[monthIdx] = [];
        month.forEach(day => {
            day.forEach((hour, hourIdx) => {
                if (!monthHash[monthIdx][hourIdx]) {
                    monthHash[monthIdx][hourIdx] = {annual: 0, monthly: 0};
                }
                monthHash[monthIdx][hourIdx].annual += hour.weight_hash[0];
                monthHash[monthIdx][hourIdx].monthly += hour.weight_hash[1];
            });
        });
    });
    return monthHash;
}

// Downloads TMY3 CSV data for the location and convert to array of [month][day][hour]
async function SetIrradianceArr(self) {
    const {latitude, longitude} = self.mapCoordinates;

    const responseLocationCode = await getLocationCode(latitude, longitude);

    if (responseLocationCode === null) {
        self.viewerAlert({
            show: true,
            title: "Error",
            message: `Location Code could not be fetched. Please try again later. ( Location Code API Failed ) The Irradiance data may not load`,
            messageType: "error",
            isModal: true
        })
    }

    const csvFileNameForFetch = `${responseLocationCode}TYA.CSV`;

    const d = await getTMY3WeatherCSVFile(csvFileNameForFetch);
    if (!d){
        self.viewerAlert({
            show: true,
            title: "Error",
            message: `Weather data could not be fetched. Please try again later. The Irradiance data may not load`,
            messageType: "error",
            isModal: true
        })
    }

    const lastCommaIdx = d.indexOf('Date (MM/DD/YYYY)'), basicStr = d.substring(0, lastCommaIdx),
        basicArr = basicStr.split(','), mainStr = d.substring(lastCommaIdx);
    const name = basicArr[1], utc = parseInt(basicArr[3]), lat = parseFloat(basicArr[4]), lon = parseFloat(basicArr[5]);
    // const key=basicArr[0], state=basicArr[2], elevation=parseFloat(basicArr[6]);

    self.weatherStationName = name.replace(/"/g, '');

    Papa.parse(mainStr, {
        header: true,
        skipEmptyLines: false,
        complete: (results) => {
            const hashKeyArr = [];
            for (let i = 0; i < 12; i++) {
                hashKeyArr[i] = []
                for (let j = 0; j < 31; j++) {
                    hashKeyArr[i][j] = []
                }
            }
            
            function getDayOfYear(date) {
                const isLeapYear  = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
                const dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
                const yr = date.getFullYear(), mn = date.getMonth(), dt = date.getDate();
                let dayOfYear = dayCount[mn] + dt;
                if(mn > 1 && isLeapYear(yr)) dayOfYear++;
                return dayOfYear;
            }

            results.data.forEach(item => {
                const dateStr = item['Date (MM/DD/YYYY)'], 
                    timeStr = item['Time (HH:MM)'],
                    etrn = parseInt(item['ETRN (W/m^2)']), // ETRN - Extraterrestrial normal radiation 
                    ghi = parseInt(item['GHI (W/m^2)']),  // GHI - Global Horizontal Irradiation
                    dni = parseInt(item['DNI (W/m^2)']),  // DNI - Direct Normal Solar Irradiance
                    dhi = parseInt(item['DHI (W/m^2)']),  // DHI - Diffuse Horizontal Irradiance
                    alb = parseFloat(item['Alb (unitless)']);
                if (!dateStr || !timeStr) return;
                const dateArr = dateStr.split('/');
                const year = parseInt(dateArr[2]),  month = parseInt(dateArr[0]), day = parseInt(dateArr[1]); // parseInt(dateArr[2]);
                const timeArr = timeStr.split(':'), hour = parseInt(timeArr[0]);
                const day_of_year = getDayOfYear(new Date(year, month-1, day));
                hashKeyArr[month - 1][day - 1][hour - 1] = {hour, day_of_year, year, month, day, dni, ghi, alb, dhi, etrn}
            });

            hashKeyArr.forEach(monthItem => {
                for (let i = monthItem.length - 1; i >= 0; i--) {
                    if (monthItem[i].length === 0)
                        monthItem.splice(i, 1);
                }
            });
            self.irrCSVDateArr = hashKeyArr;
            self.irrCSVMainData = {utc, lat, lon};
            setIrrCSVData(self);
        },
    });
}

// Get Irradiance Array and Sets irradianceMonth array for each roofs based on angles
function setIrrCSVData(self) {
    const {faces} = self.roofs[0], angleArr = [];
    // Populate angleArr- Array of all roof angles without duplicates : {tilt, azimuth}
    faces.forEach(face => {
        const {azimuth, tilt} = face.oriAng;
        const existAngle = angleArr.find(item => item.azimuth === azimuth && item.tilt === tilt);
        if (!existAngle) angleArr.push({tilt, azimuth});
    });

    // Get Monthly Irradiance array - shade weight hash total for each hour of day : {annual, monthly}
    const irradianceArr = GetIrradianceArr(self, {azimuth:0, tilt :0});
    const irradianceMonth = GetIrradianceMonth(irradianceArr);
    useViewerStore.setState({irradianceMonth: irradianceMonth});
    self.irradianceMonth = irradianceMonth;
    ReadyShadeCalculation(self);
}

function ReadyShadeCalculation(self) {
    const {sunInfo, irrCSVDateArr, irrCSVMainData} = self, {utcOffset, timezone} = sunInfo;
    if (!timezone || !irrCSVDateArr || !irrCSVMainData) return;
    SetDisplayShadePoints(self, 'init');
}

// Calculating irradiance components and monthly & annual shade hash average for face
export function GetIrradianceArr(self, angle) {
    const dateData = [...self.irrCSVDateArr], {utc, lat, lon} = self.irrCSVMainData, {tilt, azimuth} = angle;
    // Calculating irradiance components for each hour using GetIrradiance() function
    // Result: irradianceArr[month][day][hour].data = {poa_beam, diffuse, poa_ground, diff_reduce_factor}
    const irradianceArr = [];
    dateData.forEach((monthItem, monthIdx) => {
        irradianceArr[monthIdx] = [];
        monthItem.forEach((dayItem, dayIdx) => {
            irradianceArr[monthIdx][dayIdx] = [];
            dayItem.forEach((hourItem, hourIdx) => {
                const {hour, day_of_year, month, day, dni, ghi, alb, dhi, etrn} = hourItem;
                const {
                    poa_beam,
                    diffuse,
                    poa_ground,
                    diff_reduce_factor
                } = GetIrradiance(hour, day_of_year, month, day, utc, lat, lon, tilt, azimuth, dni, ghi, alb, dhi, etrn);
                hourItem.data = {poa_beam, diffuse, poa_ground, diff_reduce_factor};
                irradianceArr[monthIdx][dayIdx][hourIdx] = {...hourItem};
            });
        });
    });

    // Calculate monthly & annual total for calculating weight hash average
    const totalPotentialIrr = [];  // Monthly total array
    var allTotalPotentialIrr = 0; // Annual total
    irradianceArr.forEach((month, monthIdx) => {
        totalPotentialIrr[monthIdx] = 0;
        month.forEach((day, dayIdx) => {
            day.forEach((hour, hourIdx) => {
                const {poa_beam, diffuse, poa_ground, diff_reduce_factor} = hour.data;
                const extraValue = poa_beam + diffuse + poa_ground;
                totalPotentialIrr[monthIdx] += extraValue;
                allTotalPotentialIrr += extraValue;
            });
        });
    });

    // Calculate annual & monthly average of weight hash per hour
    // Result: irradianceArr[month][day][hour].weight_hash = [annual, monthly]
    irradianceArr.forEach((month, monthIdx) => {
        month.forEach(day => {
            day.forEach(hour => {
                const {poa_beam, diffuse, poa_ground, diff_reduce_factor} = hour.data;
                const weight_hash = [];
                // Annual weight hash
                weight_hash[0] = poa_beam / allTotalPotentialIrr + (diffuse * diff_reduce_factor / allTotalPotentialIrr);
                // Monthly weight hash
                weight_hash[1] = poa_beam / totalPotentialIrr[monthIdx] + (diffuse * diff_reduce_factor / totalPotentialIrr[monthIdx])
                hour.weight_hash = weight_hash;
            });
        });
    });
    return irradianceArr;
}

