/* eslint-disable linebreak-style */
const ApplicationError = require('./ApplicationError');

class EmailAlreadyTakenError extends ApplicationError {
  constructor() {
    super('Email is already taken!');
  }
}

module.exports = EmailAlreadyTakenError;
