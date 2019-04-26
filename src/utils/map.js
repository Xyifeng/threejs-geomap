import * as THREE from 'three'
import {MTLLoader,OBJLoader} from 'three-obj-mtl-loader'
import {TrackballControls} from '@/utils/TrackballControls'
import {axisChange} from '@/utils/axisChange'
import json from '@/json/china.json'
export class Map {
  constructor(container) {
    this.container = container
  }
  // 初始化
  init() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 0.1, 10000)
    this.camera.position.y = -500
    this.camera.position.z = Math.min(this.container.clientWidth, this.container.clientHeight)
    this.controls = new TrackballControls(this.camera, this.container)
    this.controls.rotateSpeed = 1.0
    this.controls.zoomSpeed = 1.2
    this.controls.panSpeed = 0.8
    this.controls.noZoom = false
    this.controls.noPan = false
    this.controls.staticMoving = true
    this.controls.dynamicDampingFactor = 0.3
    this.controls.keys = [165, 83, 68]

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.container.appendChild(this.renderer.domElement)
    this.renderer.setClearAlpha(0)

    this.renderer.shadowMapSoft = true
    this.renderer.shadowCameraNear = 1
    this.renderer.shadowCameraFar = this.camera.far
    this.renderer.shadowCameraFov = 60
    this.renderer.shadowMapBias = 0.0025
    this.renderer.shadowMapDarkness = 0.5
    this.renderer.shadowMapWidth = this.container.clientWidth
    this.renderer.shadowMapHeight = this.container.clientHeight
    // AmbientLight( color : Integer, intensity : Float )
    // color - (参数可选）颜色的rgb数值。缺省值为 0xffffff。
    // intensity - (参数可选)光照的强度。缺省值为 1。
    let light = new THREE.AmbientLight( 0xffffff )
    this.scene.add(light)
    this.geoMap()
  }
  // 渲染
  render () {
    this.renderer.render(this.scene, this.camera)
  }
  // 添加obj模型
  async addObj () {
    let mtlLoader = new MTLLoader();
    let objLoader = new OBJLoader();
    let obj = await new Promise((resolve, reject)=>{
      mtlLoader.load("/static/obj/obj.mtl",(materials)=> {
        materials.preload()
        objLoader.setMaterials(materials)
        objLoader.load('/static/obj/obj.obj', (object) => {
          resolve(object)
        })
      })
    })
    obj.position.x = 0;
    obj.position.y = 0;
    obj.position.z = -120;
    obj.scale.set(0.05, 0.05, 0.05)
    this.scene.add(obj)
  }
  // 添加坐标轴
  addAxis() {
    // x轴红色
    let xMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000
    })
    let xGeometry = new THREE.Geometry()
    xGeometry.vertices.push(
      new THREE.Vector3( 0, 0, 0 ),
      new THREE.Vector3( 100, 0, 0 )
    )
    let xLine = new THREE.Line( xGeometry, xMaterial )
    this.scene.add(xLine)

    // y轴绿色
    let yMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00
    })
    let yGeometry = new THREE.Geometry()
    yGeometry.vertices.push(
      new THREE.Vector3( 0, 0, 0 ),
      new THREE.Vector3( 0, 100, 0 )
    )
    let yLine = new THREE.Line( yGeometry, yMaterial )
    this.scene.add(yLine)

    // z轴蓝色
    let zMaterial = new THREE.LineBasicMaterial({
      color: 0x0000ff
    })
    let zGeometry = new THREE.Geometry()
    zGeometry.vertices.push(
      new THREE.Vector3( 0, 0, 0 ),
      new THREE.Vector3( 0, 0, 100 )
    )
    let zLine = new THREE.Line( zGeometry, zMaterial )
    this.scene.add(zLine)
  }
  // 地理数据处理
  geoMap() {
    let data = []
    let allPointLon = []
    let allPointLat = []
    for(let i in json.features){
      let obj = {
        name:json.features[i].properties.name,
        cp:axisChange(json.features[i].properties.cp),
        data:[]
      }
      if(json.features[i].geometry.type === 'Polygon'){
        for(let j in json.features[i].geometry.coordinates){
          let arr = []
          for(let k in json.features[i].geometry.coordinates[j]){
            let point=axisChange(json.features[i].geometry.coordinates[j][k])
            arr.push(point)
            allPointLon.push(point[0])
            allPointLat.push(point[1])
          }
          obj.data.push(arr)
        }
      }
      else if(json.features[i].geometry.type === 'MultiPolygon'){
        for(let j in json.features[i].geometry.coordinates){
          let arr = []
          for(let k in json.features[i].geometry.coordinates[j][0]){
            let point=axisChange(json.features[i].geometry.coordinates[j][0][k])
            arr.push(point)
            allPointLon.push(point[0])
            allPointLat.push(point[1])
          }
          obj.data.push(arr)
        }
      }
      data.push(obj)
    }
    this.data = data
    // 获取中心点
    this.lonCenter=(Math.max.apply(Math.max,allPointLon)+Math.min.apply(Math.max,allPointLon))/2
    this.latCenter=(Math.max.apply(Math.max,allPointLat)+Math.min.apply(Math.max,allPointLat))/2
    this.addMesh(data,this.lonCenter,this.latCenter)
  }
  // 创建地图区块
  async addMesh(data,lonCenter,latCenter) {
    const loader = new THREE.FontLoader()
    // 字体自行更换 在线转换地址https://gero3.github.io/facetype.js/
    const font = await new Promise((resolve, reject)=>{
      loader.load('/static/font/font.json',(font)=>{
        resolve(font)
      })
    })
    for(let i in data){
      let group = new THREE.Group()
      this.scene.add(group)
      group.name = data[i].name
      for(let j in data[i].data){
        let pointArr = []
        let extrudeSettings = {
          depth:10,
          bevelEnabled:false
        }
        for(let k in data[i].data[j]){
          let x = (data[i].data[j][k][0]-lonCenter)/10000 // 经度
          let y = (data[i].data[j][k][1]-latCenter)/10000 // 纬度
          pointArr.push(new THREE.Vector2(x, y))
        }
        let shape = new THREE.Shape(pointArr)
        let geometry = new THREE.ExtrudeGeometry(shape,extrudeSettings)
        geometry.computeBoundingSphere() // 计算中心
        let material = new THREE.MeshBasicMaterial( {color: 0x203A9A} )
        let mesh = new THREE.Mesh( geometry, material )
        // 添加边缘线
        let edges = new THREE.EdgesGeometry(geometry)
        let line = new THREE.LineSegments(edges,new THREE.LineBasicMaterial({color: 0x000000}))
        mesh.add(line)
        let fontGeometry = new THREE.TextGeometry(data[i].name, {
          font: font,
          size: 5,
          height: 1,
          bevelEnabled: false
        })
        let fontMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 } )
        let fontMesh = new THREE.Mesh( fontGeometry, fontMaterial )
        // 省份标示位置可自行校准 1.json中cp中心点定位偏差  2.文字坐标自身偏差
        fontMesh.position.set((data[i].cp[0]-lonCenter)/10000,(data[i].cp[1]-latCenter)/10000,10)
        group.add(fontMesh)

        group.add(mesh)
      }
    }
  }
}