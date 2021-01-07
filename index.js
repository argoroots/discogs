new Vue({
  el: '#app',
  data () {
    return {
      tags: [],
      collection: [],
      wantlist: [],
      activeList: location.hash.replace('#', '') || 'collection',
      q: ''
    }
  },
  mounted () {
    axios
      .get('https://eqhfpmpdde.execute-api.eu-central-1.amazonaws.com')
      .then(response => {
        let tags = {}

        this.collection = response.data.collection.map(i => {
          i.tag.forEach(tag => {
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

      const result = this[this.activeList].filter((item) => {
        const q = this.q.toLowerCase().split(' ')

        for (var i = 0; i < q.length; i++) {
            if (!(item.title.toLowerCase().includes(q[i]) || item.artist.toLowerCase().includes(q[i]) || item.tag.includes(q[i]))) {
                return false
            }
        }

        return true
      })

      return result
    }
  },
  methods: {
    setList (list) {
      this.activeList = list
      location.hash = this.activeList
    },
    filterByTag (tag) {
        let q = this.q.split(' ')

        if (q.includes(tag)) {
            q = q.filter(i => i !== tag)
        } else {
            q.push(tag)
        }

        q.sort()

        this.q = q.join(' ').trim() ? q.join(' ').trim() + ' ' : ''
    },
    isActiveTag (tag) {
        return this.q.split(' ').filter(i => i === tag).length > 0
    }
  }
})
