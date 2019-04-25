import proj4 from 'proj4'
function axisChange(lonlat){
  let firstProjection = proj4('EPSG:4326')
  let secondProjection = proj4('EPSG:3857')
  return proj4(firstProjection,secondProjection,lonlat);
}
export{
  axisChange
}