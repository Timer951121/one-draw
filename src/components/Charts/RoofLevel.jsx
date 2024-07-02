import React, {Component} from "react";
import Chart from "react-apexcharts";

const labelStyle = {
    colors: "var(--textColor)",
    fontSize: "12px",
    fontFamily: "Halvetica, sans-serif",
    fontWeight: "normal"
};
const options = {
    chart: {type: "column", stacked: false,},
    dataLabels: {enabled: false,},
    stroke: {width: [0, 0],},
    xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        labels: {style: labelStyle},
    },
    yaxis: [
        {
            axisTicks: {show: false,},
            axisBorder: {show: false,},
            labels: {
                style: labelStyle,
                formatter: function (value) {
                    return Math.round(value);
                }
            },
            tooltip: {enabled: false,},
            tickAmount: 5,
            min: 0,
            max: 100
        },
    ],
    legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        offsetY: -10,
        fontSize: '12px',
    },
    fill: {opacity: 1,},
    colors: ["#5489bc", "#f8ca8d"],
}

class RoofLevel extends Component {
    constructor(props) {
        super(props);

        const {roofChartIrr, roofChartSolar} = props;

        this.state = {roofChartIrr, roofChartSolar,};
    }

    UNSAFE_componentWillReceiveProps = (nextProps) => {
        ['roofChartIrr', 'roofChartSolar'].forEach(key => {
            if (this.state[key] !== nextProps[key]) {
                this.setState({[key]: nextProps[key]});
            }
        });
    }

    render() {
        const {roofChartIrr, roofChartSolar} = this.state;
        return (
            <>
                <Chart
                    options={options}
                    series={[
                        {name: "Irradiance", data: roofChartIrr, type: 'column',},
                        {name: "Solar Access", data: roofChartSolar, type: 'column',},
                    ]}
                    type="bar"

                    width="100%"
                />
            </>
        );
    }
}

export default RoofLevel;
