'use strict'

// pull in environment variables from .env
require('dotenv').config()

// add aws sdk
const AWS = require('aws-sdk')
const s3 = new AWS.S3()

const promiseS3Delete = (params) => {
  return new Promise((resolve, reject) => {
    s3.deleteObject(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

const s3Destroy = (key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key
  }

  return promiseS3Delete(params)
}

module.exports = s3Destroy
