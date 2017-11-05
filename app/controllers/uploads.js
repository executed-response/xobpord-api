'use strict'

const multer = require('multer')
const multerUpload = multer({dest: '/tmp'})

const controller = require('lib/wiring/controller')
const Upload = require('app/models/uploads')
const s3Upload = require('lib/aws-s3-upload')

const authenticate = require('./concerns/authenticate')
const setUser = require('./concerns/set-current-user')
const setModel = require('./concerns/set-mongoose-model')

const index = (req, res, next) => {
  Upload.find()
    .then(uploads => res.json({
      uploads: uploads.map((e) =>
        e.toJSON({ virtuals: true, user: req.user }))
    }))
    .catch(next)
}

const show = (req, res) => {
  res.json({
    upload: req.upload.toJSON()
  })
}

const create = (req, res, next) => {
  const file = {
    path: req.file.path,
    name: req.file.originalname,
    mimetype: req.file.mimetype
  }
  s3Upload(file)
    .then((s3Response) => Upload.create({
      filename: 'filename test',
      description: 'description test',
      url: s3Response.Location,
      tags: 'tag test',
      _owner: req.user._id
    }))
    .then((upload) => {
      return res.status(201)
          .json({
            upload: upload
          })
    })
    .catch(next)
}

const update = (req, res, next) => {
  delete req.body.upload._owner  // disallow owner reassignment.

  req.upload.update(req.body.upload)
    .then(() => res.sendStatus(204))
    .catch(next)
}

const destroy = (req, res, next) => {
  req.upload.remove()
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
  { method: multerUpload.single('file'), only: ['create'] }, // this creates req.file
  { method: authenticate, except: ['index', 'show'] },
  { method: setModel(Upload), only: ['show'] },
  { method: setModel(Upload, { forUser: true }), only: ['update', 'destroy'] }
] })
