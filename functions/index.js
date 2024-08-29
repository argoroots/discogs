const http = require('https')
const { S3Client, PutObjectCommand, PutObjectAclCommand, PutObjectTaggingCommand } = require('@aws-sdk/client-s3')

const getDiscogsJson = async (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'api.discogs.com',
      port: 443,
      path: `/users/${process.env.DISCOGS_USER}/${path}?per_page=500&sort=artist&token=${process.env.DISCOGS_TOKEN}`,
      method: 'GET',
      headers: { 'User-Agent': 'AWS Lambda' }
    }
    http.get(options, (response) => {
      let body = ''

      response.on('data', function (d) {
        body += d
      })

      response.on('end', function () {
        const parsed = JSON.parse(body)
        resolve(parsed)
      })
    })
  })
}

const parseData = (data) => {
  const result = {
    id: data.id,
    title: data.basic_information.title,
    year: data.basic_information.year || null,
    artist: data.basic_information.artists[0].name.split(' (')[0],
    picture: data.basic_information.cover_image,
    format: [],
    region: [],
    type: [],
    tag: []
  }

  let tags = []
  if (data.notes) {
    data.notes.filter(n => n.field_id === 4).map(n => n.value).forEach((t) => {
      tags = tags.concat(t.toLowerCase().split(',').map(v => v.trim()))
    })
  }
  tags = tags.filter(v => !!v).map(v => v.toLowerCase())

  let formats = []
  data.basic_information.formats.forEach((f) => {
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

  if (tags.includes('east')) {
    result.region.push('east')
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

async function main (args) {
  const collectionPromise = getDiscogsJson('/collection/folders/0/releases')
  const collection = await collectionPromise
  const collectionResult = collection.releases.map(parseData)

  collectionResult.sort((a, b) => {
    if (a.artist + ' ' + a.year < b.artist + ' ' + b.year) {
      return -1
    }
    if (a.artist + ' ' + a.year > b.artist + ' ' + b.year) {
      return 1
    }

    return 0
  })

  const jsonResult = JSON.stringify({ collection: collectionResult })
  const bucketName = 'argoroots-public'
  const key = 'discogs.json'

  const s3Client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY
    }
  })

  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: jsonResult,
    ContentType: 'application/json'
  }))

  await s3Client.send(new PutObjectAclCommand({
    Bucket: bucketName,
    Key: key,
    ACL: 'public-read'
  }))

  await s3Client.send(new PutObjectTaggingCommand({
    Bucket: bucketName,
    Key: key,
    Tagging: {
      TagSet: [{ Key: 'Project', Value: 'discogs' }]
    }
  }))

  return { ok: true }
}
