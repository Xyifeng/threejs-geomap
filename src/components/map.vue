<template>
  <div id="container" class="map"></div>
</template>

<script>
import {Map} from '@/utils/map'
export default {
  name: 'mapBox',
  data () {
    return {
      map:null
    }
  },
  mounted () {
    let self = this
    this.map= new Map(document.getElementById('container'))
    this.map.init()
    this.render()
  },
  methods: {
    render(){
      this.map.render()
      this.map.controls.update()
      requestAnimationFrame(this.render)
    }
  }
}
</script>

<style lang="scss" scoped>
.map{
  position: absolute;
  height: 100vh;
  width: 100vw;
}
</style>

