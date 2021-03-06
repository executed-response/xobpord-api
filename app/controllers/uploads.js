'use strict'

const multer = require('multer')
const multerUpload = multer({dest: '/tmp', limits: {fileSize: 15728640}})

const controller = require('lib/wiring/controller')
const Upload = require('app/models/uploads')
const s3Upload = require('lib/aws-s3-upload')
const s3Destroy = require('lib/aws-s3-destroy')

const authenticate = require('./concerns/authenticate')
const setUser = require('./concerns/set-current-user')
const setModel = require('./concerns/set-mongoose-model')

const index = (req, res, next) => {
  Upload.find()
    .then(uploads => res.json({
      uploads: uploads.reduce(function (uploadsToReturn, upload) {
        if (upload._owner.toString() !== req.user._id.toString()) {
          return uploadsToReturn
        } else {
          return uploadsToReturn.concat(upload.toJSON())
        }
      }, [])
    }))
    .catch(next)
}

const show = (req, res) => {
  if (req.upload.toJSON().private === false) {
    return res.json({
      upload: req.upload.toJSON()
    })
  }
  if (req.user === null) {
    const resultStatusCode = 404
    return res.status(resultStatusCode).json({})
  }
  if (req.upload._owner.toString() !== req.user._id.toString() && (req.upload.toJSON().private === true)) {
    const resultStatusCode = 404
    return res.status(resultStatusCode).json({})
  } else {
    return res.json({
      upload: req.upload.toJSON()
    })
  }
}

const create = (req, res, next) => {
  const fileUploadPromises = []
  const uploadedFiles = []
  const failedFiles = []
  // handle when no files given in the future
  // handle partial success (upload all but failed)
  req.files.forEach(function (fileToMakePromiseFrom) {
    const file = {
      path: fileToMakePromiseFrom.path,
      name: fileToMakePromiseFrom.originalname,
      mimetype: fileToMakePromiseFrom.mimetype
    }
    fileUploadPromises.push(
      s3Upload(file)
      .then((s3Response) => Upload.create({
        filename: fileToMakePromiseFrom.originalname,
        _url: s3Response.Location,
        _owner: req.user._id,
        _key: s3Response.Key,
        _filesize: fileToMakePromiseFrom.size,
        private: req.user.private
      }))
      .then(() => {
        return uploadedFiles.push(fileToMakePromiseFrom.originalname)
      })
      .catch(() => {
        failedFiles.push(fileToMakePromiseFrom.originalname)
      }))
  })
  Promise.all(fileUploadPromises)
    .then(() => {
      let resultStatusCode = 500
      resultStatusCode = failedFiles.length === 0 ? 201 : 500
      return res.status(resultStatusCode)
          .json({
            uploadedFiles,
            failedFiles
          })
    })
    .catch(next)
}

const update = (req, res, next) => {
  delete req.body.upload._owner  // disallow owner reassignment.
  if (req.upload._owner.toString() !== req.user._id.toString()) {
    const resultStatusCode = 404
    return res.status(resultStatusCode).json({})
  } else {
    req.upload.update(req.body.upload)
      .then(() => res.sendStatus(204))
      .catch(next)
  }
}

const destroy = (req, res, next) => {
  req.upload.remove()
    .then(() => s3Destroy(req.upload._key))
    .then(() => res.sendStatus(204))
    .catch(next)
}

module.exports = controller({
  index,
  show,
  create,
  update,
  destroy
}, { before: [
  { method: setUser, only: ['index', 'show'] },
  { method: multerUpload.array('file', 20), only: ['create'] }, // this creates req.file
  { method: authenticate, except: ['show'] },
  { method: setModel(Upload), only: ['show'] },
  { method: setModel(Upload, { forUser: true }), only: ['update', 'destroy'] }
] })
