
mapboxgl.accessToken = 'pk.eyJ1IjoiamFja2FieXRlIiwiYSI6ImNsZW12OWRieDAxZm4zc21tOWN6N252Y2kifQ.ctvp-xVG8reOpqtKqDf4VA';

navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {enableHighAccuracy: true})

//Mapbox uses Longitude then Latitude
function successLocation(position){
  posMap([position.coords.longitude, position.coords.latitude])
}

//Cordinates for Dublin if the location is an error.
function errorLocation(){
  posMap([6.26, 53.34])

}

function posMap(center){
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: center,
    zoom: 15,
    cooperativeGestures: true
        });


//Allows zoom in, zoom out and rotation
const nav = new mapboxgl.NavigationControl();
map.addControl(nav);


//Allows for Directions system.
var directions = new MapboxDirections({
  accessToken: 'pk.eyJ1IjoiamFja2FieXRlIiwiYSI6ImNsZW12OWRieDAxZm4zc21tOWN6N252Y2kifQ.ctvp-xVG8reOpqtKqDf4VA',
});

map.addControl(directions, 'top-right');
}


