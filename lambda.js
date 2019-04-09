const http = require('https')


const getDiscogsJson = async () => {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'api.discogs.com',
      port: 443,
      path: `/users/${process.env.DISCOGS_USER}/collection/folders/0/releases?per_page=50&sort=artist&token=${process.env.DISCOGS_TOKEN}`,
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
        resolve(parsed.releases)
      })
    })
  })
}


exports.handler = async (event) => {
  const posts = await getDiscogsJson()
  const result = posts.map(p => {
    return {
      id: p.id,
      title: p.basic_information.title,
      year: p.basic_information.year,
      artist: p.basic_information.artists[0].name.replace('(2)', '').replace('(3)', '').replace('(4)', '').replace('(5)', '').replace('(6)', ''),
      picture: p.basic_information.cover_image,
      url: p.basic_information.resource_url
    }
  })

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'max-age=43200, must-revalidate'
    },
    body: JSON.stringify(result)
  }

  return response
}
