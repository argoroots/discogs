new Vue({
  el: '#app',
  data () {
    return {
      tags: [],
      collection: null,
      wantlist: null,
      activeList: location.hash.replace('#', '') || 'collection',
      q: ''
    }
  },
  mounted () {
    axios
      .get('https://47vr89cjrd.execute-api.eu-central-1.amazonaws.com/prod')
      .then(response => {
        let tags = {}

        this.collection = response.data.collection.map(i => {
          i.tags.forEach(tag => {
              tags[tag] = false
          })
          i.active = false
          return i
        })

        this.tags = Object.keys(tags)
        this.tags = this.tags.sort()

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
          console.log(this.tags);
        return i.title.toLowerCase().includes(this.q.toLowerCase()) || i.artist.toLowerCase().includes(this.q.toLowerCase()) || i.tags.includes(this.q.toLowerCase())
      })

      return result
    },
    // tags () {
    //     if (!this.collection) { return [] }
    //
    //     let tags = {}
    //
    //     this.collection.forEach(item => {
    //         item.tags.forEach(tag => {
    //             tags[tag] = true
    //         })
    //     })
    //
    //     let keys = Object.keys(tags)
    //     keys.sort()
    //
    //     return keys
    // }
  },
  methods: {
    setList (list) {
      this.activeList = list
      location.hash = this.activeList
    }
  }
})
