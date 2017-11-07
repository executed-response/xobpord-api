'use strict'

const mongoose = require('mongoose')

const uploadSchema = new mongoose.Schema({
  filename: {
    type: String
  },
  description: {
    type: String
  },
  _url: {
    type: String,
    required: true
  },
  tags: {
    type: String
  },
  _owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  _key: {
    type: String,
    required: true
  },
  _filesize: {
    type: String,
    requires: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret, options) {
      const userId = (options.user && options.user._id) || false
      ret.editable = userId && userId.equals(doc._owner)
      return ret
    }
  }
})

const Upload = mongoose.model('Upload', uploadSchema)

module.exports = Upload
