'use strict'

// pull in environment variables from .env
require('dotenv').config()
// add node built-in packages
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// add aws sdk
const AWS = require('aws-sdk')
const s3 = new AWS.S3()

const promiseRandomBytes = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, buf) => {
      if (err) {
        reject(err)
      } else {
        resolve(buf.toString('hex'))
      }
    })
  })
}

const promiseS3Upload = (params) => {
  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

const s3Upload = (file) => {
  file.contentType = file.mimeType
  file.ext = path.extname(file.name)
  file.stream = fs.createReadStream(file.path, {})

  const params = {
    ACL: 'public-read',
    Bucket: process.env.AWS_BUCKET_NAME,
    Body: file.stream,
    ContentType: file.contentType
  }

  return promiseRandomBytes()
    .then((randomString) => {
      params.Key = `${randomString}${file.ext}`
      return params
    })
    .then(promiseS3Upload)
}

module.exports = s3Upload
