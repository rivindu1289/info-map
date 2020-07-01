import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';

import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4geodata_worldLow from "@amcharts/amcharts4-geodata/worldLow";
import am4geodata_worldHigh from "@amcharts/amcharts4-geodata/worldHigh";


import moment from 'moment-timezone';
//var moment = require('moment-timezone');
import tzlookup from 'tz-lookup';
//var tzlookup = require("tz-lookup");

am4core.useTheme(am4themes_animated);

class App extends Component {
  constructor(props){
    super(props);
    this.state = {date: new Date()};
  }

  componentDidMount() {
    this.timerID = setInterval(() => this.tick(), 1000);
    let map = am4core.create("chartdiv", am4maps.MapChart);
    map.geodata = am4geodata_worldHigh;

    map.projection = new am4maps.projections.Orthographic();
    map.panBehavior = "rotateLongLat";
    map.backgroundSeries.mapPolygons.template.polygon.fill = am4core.color("#aadaff");
    map.backgroundSeries.mapPolygons.template.polygon.fillOpacity = 1;
    let polygonSeries = map.series.push(new am4maps.MapPolygonSeries());
    polygonSeries.useGeodata = true;

    // Configure series
    let polygonTemplate = polygonSeries.mapPolygons.template;
    polygonTemplate.fill = am4core.color("#74B266");

    // Create hover state and set alternative fill color
    let hs = polygonTemplate.states.create("hover");
    hs.properties.fill = am4core.color("#367B25");

    // hide antarctica
    //polygonSeries.exclude = ["AQ"];

    var d = [];

    // add population data for country to tooltip on hover
    fetch("https://gist.githubusercontent.com/gwillem/6ca8a81048e6f3721c3bafc803d44a72/raw/4fb66d18178c1a0fdf101fb6b03c4d21929472da/iso2_population.json")
      .then(response => response.json())
      .then(jsonData => {
        for (var x of polygonSeries.data){
          d[d.length] = {id:(x.id), name:(x.name), pop:Number(jsonData[x.id])};
        }
        polygonSeries.data = d;
      });
    polygonTemplate.tooltipText = "{name}\nPopulation: {pop}";

    // set up markers for cities
    let imageSeries = map.series.push(new am4maps.MapImageSeries());       
    let imageSeriesTemplate = imageSeries.mapImages.template;

    let circle = imageSeriesTemplate.createChild(am4core.Circle);
    circle.radius = 4;
    circle.fill = am4core.color("#B27799");
    circle.stroke = am4core.color("#FFFFFF");
    circle.strokeWidth = 2;
    circle.nonScaling = true;
    circle.tooltipText = "{name}\nTime: {time}\nDate: {date}";

    imageSeriesTemplate.propertyFields.latitude = "latitude";
    imageSeriesTemplate.propertyFields.longitude = "longitude";

    // add capitals, plus date and time
    this.dCap = [];
    fetch("https://raw.githubusercontent.com/rivindu1289/capital-cities/master/country-capitals.json")
      .then(response => response.json())
      .then(jsonData => {
        for (var x of jsonData){
          let lat = Number(x.CapitalLatitude);
          let lon = Number(x.CapitalLongitude);
          let timeZone = tzlookup(lat,lon);
          let timeDate = moment.utc(this.state.d).tz(timeZone);

          document.getElementById("data").innerHTML = timeDate;

          let dt =  timeDate.toLocaleString().slice(0,15);
          let t = timeDate.toLocaleString().slice(16,21);

          this.dCap[this.dCap.length] = {name: x.CapitalName, latitude: lat, longitude: lon, time: t, date: dt, tz: timeZone};
        }
        imageSeries.data = this.dCap;
      });

    this.chart = map;
  }

  componentDidUpdate(prevProps, prevState, snapshot){
    if (prevState.date.getMinutes() !== this.state.date.getMinutes()){
      for (var x of this.dCap) {
        let timeDate = moment.utc(this.state.d).tz(x.tz);
        document.getElementById("data").innerHTML = timeDate;
        x.date =  timeDate.toLocaleString().slice(0,15);
        x.time = timeDate.toLocaleString().slice(16,21);
      }
    }
  }

  tick(){
    this.setState({date:new Date()});
  }

  componentWillUnmount() {
    if (this.chart) {
      this.chart.dispose();
    }
    clearInterval(this.timerID);
  }

  render() {
    return (
      <div id="chartdiv" style={{ width: "100%", height: "800px" }}></div>
    );
  }
}

export default App;
