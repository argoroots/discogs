const http = require('https')

const getDiscogsJson = async (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'api.discogs.com',
      port: 443,
      path: `/users/${process.env.DISCOGS_USER}/${path}?per_page=250&sort=artist&token=${process.env.DISCOGS_TOKEN}`,
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
  let result = {
    title: data.basic_information.title,
    year: data.basic_information.year,
    artist: data.basic_information.artists[0].name.replace(' (2)', '').replace(' (3)', '').replace(' (4)', '').replace(' (5)', '').replace(' (6)', ''),
    picture: data.basic_information.cover_image,
    format: [],
    tags: []
  }

  if(data.basic_information.formats[0].name) {
    result.format.push(data.basic_information.formats[0].name)
  }
  if(data.basic_information.formats[0].text) {
    result.format.push(data.basic_information.formats[0].text)
  }
  if(data.basic_information.formats[0].descriptions) {
    result.format = result.format.concat(data.basic_information.formats[0].descriptions)
  }

  if (result.format.length > 0) {
    result.format = [...new Set(result.format)]
    result.format.sort()

    if (result.format.includes('7"')) {
      result.tags.push('7"')
    } else if (result.format.includes('10"')) {
      result.tags.push('10"')
    } else if (result.format.includes('LP') || result.format.includes('12"')) {
      result.tags.push('12"')
    }

    if (result.format.includes('CD')) {
      result.tags.push('cd')
    }
  }

  if (data.notes) {
      const tags = data.notes.filter(n => n.field_id === 4).map(n => n.value)
      for (var i = 0; i < tags.length; i++) {
          result.tags = result.tags.concat(tags[i].toLowerCase().split(',').map(v => v.trim()))
      }
  }

  if (result.tags.length > 0) {
    result.tags = [...new Set(result.tags)]
    result.tags.sort()
  }

  return result
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
