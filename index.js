new Vue({
  el: '#app',
  data () {
    return {
      collection: null,
      wantlist: null,
      activeList: 'collection',
      q: ''
    }
  },
  mounted () {
    axios
      .get('https://47vr89cjrd.execute-api.eu-central-1.amazonaws.com/prod')
      .then(response => {
        this.collection = response.data.collection.map(i => {
          i.active = false
          return i
        })
        this.wantlist = response.data.wantlist.map(i => {
          i.active = false
          return i
        })
      })
  },
  computed: {
    filteredCollection () {
      if (!this.q) {
        return this[this.activeList]
      }

      const result = this[this.activeList].filter((i) => {
        return i.title.toLowerCase().includes(this.q.toLowerCase()) || i.artist.toLowerCase().includes(this.q.toLowerCase())
      })

      return result
    }
  }
})
