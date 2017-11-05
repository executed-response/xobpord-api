'use strict'
//
// const multer = require('multer')
// const multerUpload = multer({dest: '/tmp'})

const controller = require('lib/wiring/controller')
const Upload = require('app/models/uploads')
// const s3Upload = require('lib/aws-s3-upload')

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
  const upload = {
    filename: 'filename test',
    description: 'description test',
    url: 'url test',
    tags: 'tag test',
    _owner: req.user._id
  }
  Upload.create(upload)
  .then((upload) => {
    res.status(201).json({upload: upload.toJSON()})
  })
  .catch(next)
}

  // const file = {
  //   path: req.file.path,
  //   name: req.file.originalname,
  //   mimetype: req.file.mimetype
  // }
  // const upload = Object.assign(req.body.upload, {
  //   _owner: req.user._id
  // })

  // something along these lines? How do I get the file path and name?
  // s3Upload(file)
  //   .then((s3Response) => Upload.create({ // .create does return a promise so we don't need to promisify it ourselves; single line functions have implicit returns so don't need offical "return" word in there (if there were curly brackets, then you would need "return")
  //     description: 'hard code me first',
  //     url: s3Response.Location
  //   }))
  //   .then((upload) => {
  //     return res.status(201)
  //         .json({
  //           upload: upload
  //         })
  //   })
  //         .catch(next)

//  req.body is { image: { title: '' } }
// req.file is { fieldname: 'image[file]',
//   originalname: 'TicTacToe-Wireframes.jpg',
//   encoding: '7bit',
//   mimetype: 'image/jpeg',
//   destination: '/tmp',
//   filename: '04d79db8979c862298b488c278a04c73',
//   path: '/tmp/04d79db8979c862298b488c278a04c73',
//   size: 6235651 }

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
  // { method: multerUpload.single('image[file]'), only: ['create'] }, // this creates req.file
  { method: authenticate, except: ['index', 'show'] },
  { method: setModel(Upload), only: ['show'] },
  { method: setModel(Upload, { forUser: true }), only: ['update', 'destroy'] }
] })
