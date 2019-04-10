new Vue({
  el: '#app',
  data () {
    return {
      collection: null,
      q: ''
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
  },
  computed: {
    filteredCollection () {
      if (!this.q) {
        return this.collection
      }

      return this.collection.filter((i) => {
        return i.title.toLowerCase().includes(this.q.toLowerCase()) || i.artist.toLowerCase().includes(this.q.toLowerCase())
      })
    }
  }
})
