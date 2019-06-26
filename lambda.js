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
    region: [],
    type: [],
    tag: []
  }

  let tags = []
  if (data.notes) {
    data.notes.filter(n => n.field_id === 4).map(n => n.value).forEach(t => {
      tags = tags.concat(t.toLowerCase().split(',').map(v => v.trim()))
    })
  }
  tags = tags.filter(v => !!v).map(v => v.toLowerCase())

  let formats = []
  data.basic_information.formats.forEach(f => {
    formats.push(f.name)
    formats.push(f.text)
    formats = formats.concat(f.descriptions)
  })
  formats = formats.filter(v => !!v).map(v => v.toLowerCase())

  if (formats.includes('7"')) {
    result.format.push('7"')
  } else if (formats.includes('10"')) {
    result.format.push('10"')
  } else if (formats.includes('lp') || formats.includes('12"')) {
    result.format.push('12"')
  }

  if (formats.includes('cd') || tags.includes('cd')) {
    result.format.push('cd')
  }

  if (formats.includes('dvd') || tags.includes('dvd')) {
    result.format.push('dvd')
  }

  if (formats.includes('cassette') || tags.includes('cassette')) {
    result.format.push('cassette')
  }

  if (tags.includes('est')) {
    result.region.push('est')
  }

  if (tags.includes('west')) {
    result.region.push('west')
  }

  if (tags.includes('music')) {
    result.type.push('music')
  }

  if (tags.includes('spoken')) {
    result.type.push('spoken')
  }

  if (tags.includes('compilation')) {
    result.type.push('compilation')
  }

  result.tag.push(...result.format)
  result.tag.push(...result.region)
  result.tag.push(...result.type)

  if (result.format.length > 0) {
    result.format = [...new Set(result.format)]
    result.format.sort()
  }
  if (result.region.length > 0) {
    result.region = [...new Set(result.region)]
    result.region.sort()
  }
  if (result.type.length > 0) {
    result.type = [...new Set(result.type)]
    result.type.sort()
  }
  if (result.tag.length > 0) {
    result.tag = [...new Set(result.tag)]
    result.tag.sort()
  }

  return result
}

exports.handler = async (event) => {
  const collectionPromise = getDiscogsJson('/collection/folders/0/releases')
  // const wantlistPromise = getDiscogsJson('/wants')

  const collection = await collectionPromise
  // const wantlist = await wantlistPromise

  const collectionResult = collection.releases.map(parseData)
  // const wantlistResult = wantlist.wants.map(parseData)

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'max-age=43200, must-revalidate'
    },
    body: JSON.stringify({
      collection: collectionResult,
      wantlist: [] // wantlistResult
    })
  }

  return response
}
