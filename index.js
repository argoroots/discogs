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
      .then(response => (this.collection = response.data))
  }
})
