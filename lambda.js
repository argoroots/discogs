const http = require('https')

const getDiscogsJson = async (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'api.discogs.com',
      port: 443,
      path: `/users/${process.env.DISCOGS_USER}/${path}?per_page=50&sort=artist&token=${process.env.DISCOGS_TOKEN}`,
      method: 'GET',
      headers: { 'User-Agent': 'AWS Lambda' }
    }
    http.get(options, response => {
      var body = ''

      response.on('data', function(d) {
        body += d
      })

      response.on('end', function() {
        var parsed = JSON.parse(body)
        resolve(parsed)
      })
    })
  })
}

const parseData = (data) => {
  return {
    title: data.basic_information.title,
    year: data.basic_information.year,
    artist: data.basic_information.artists[0].name.replace(' (2)', '').replace(' (3)', '').replace(' (4)', '').replace(' (5)', '').replace(' (6)', ''),
    picture: data.basic_information.cover_image
  }
}

exports.handler = async (event) => {
  const collectionPromise = getDiscogsJson('/collection/folders/0/releases')
  const wantlistPromise = getDiscogsJson('/wants')

  const collection = await collectionPromise
  const wantlist = await wantlistPromise

  const collectionResult = collection.releases.map(parseData)
  const wantlistResult = wantlist.wants.map(parseData)

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'max-age=43200, must-revalidate'
    },
    body: JSON.stringify({
      collection: collectionResult,
      wantlist: wantlistResult
    })
  }

  return response
}
