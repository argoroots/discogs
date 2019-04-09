new Vue({
  el: '#app',
  data () {
    return {
      collection: null
    }
  },
  mounted () {
    axios
      .get('https://47vr89cjrd.execute-api.eu-central-1.amazonaws.com/prod')
      .then(response => {
        response.data.map(i => {
          i.active = false
          i.artist = i.artist
          return i
        })
        this.collection = response.data
      })
  }
})
