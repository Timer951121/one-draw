import React, {Component} from "react";
import Chart from "react-apexcharts";

const labelStyle = {
    colors: "var(--textColor)",
    fontSize: "12px",
    fontFamily: "Halvetica, sans-serif",
    fontWeight: "normal",
}

const options = {
    chart: {
        type: "column",
        stacked: false,
    },
    dataLabels: {
        enabled: false,
    },
    stroke: {
        width: [0, 0],
    },
    xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        labels: {
            style: labelStyle,
        },
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
        offsetY: -20,
        fontSize: '12px',
    },
    fill: {
        opacity: 1,
    },
    colors: ["#5489bc", "#f8ca8d"],
}

class ModuleLevel extends Component {
    constructor(props) {
        super(props);
        const {modeChartSolar, modeChartIrr} = props;
        this.state = {modeChartSolar, modeChartIrr};
    }

    UNSAFE_componentWillReceiveProps = (nextProps) => {
        ['modeChartIrr', 'modeChartSolar'].forEach(key => {
            if (this.state[key] !== nextProps[key]) {
                this.setState({[key]: nextProps[key]});
            }
        });
    }

    render() {
        const {modeChartSolar, modeChartIrr} = this.state;
        return (
            <>
                <Chart
                    options={options}
                    series={[
                        {
                            name: "Irradiance",
                            data: modeChartIrr,
                            type: 'column',
                        },
                        {
                            name: "Solar Access",
                            data: modeChartSolar,
                            type: 'column',
                        },
                    ]}
                    type="bar"
                    width="100%"
                />
            </>
        );
    }
}

export default ModuleLevel;
