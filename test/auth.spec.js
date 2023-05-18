/* eslint-disable linebreak-style */
/* global describe, it, expect,beforeAll,afterAll */

require('dotenv').config();
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { JWT_SIGNATURE_KEY } = require('../config/application');
const app = require('../app');
const models = require('../app/models');
const { WrongPasswordError, EmailNotRegisteredError, EmailAlreadyTakenError } = require('../app/errors');

let token;
let server;

const decodeToken = (token) => jwt.verify(token, JWT_SIGNATURE_KEY);

const user = {
  name: 'test123',
  email: 'test123@test.com',
  password: '123456',
};

beforeAll(() => {
  server = app.listen(1337);
});

// register
describe('POST /v1/auth/register', () => {
  it('should response with 201 status code', async () => (
    request(server)
      .post('/v1/auth/register')
      .send(user)
      .set('Accept', 'application/json')
      .then((res) => {
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual(
          expect.objectContaining({
            accessToken: expect.any(String),
          }),
        );
      })
  ));
  it('should response with 401 status code', async () => (
    request(server)
      .post('/v1/auth/register')
      .send(user)
      .set('Accept', 'application/json')
      .then((res) => {
        expect(res.statusCode).toBe(422);
        expect(res.body).toEqual(
          expect.objectContaining(new EmailAlreadyTakenError()),
        );
      })
  ));
});

// login
describe('POST /v1/auth/login', () => {
  const { email, password } = user;

  it('should response with 201 status code', async () => (
    request(server)
      .post('/v1/auth/login')
      .send({ email, password })
      .set('Accept', 'application/json')
      .then((res) => {
        if (res.body.accessToken) {
          token = res.body.accessToken;
        }
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual(
          expect.objectContaining({
            accessToken: expect.any(String),
          }),
        );
      })
  ));
  it('should response with 401 status code', async () => (
    request(server)
      .post('/v1/auth/login')
      .send({ email, password: '512213' })
      .set('Accept', 'application/json')
      .then((res) => {
        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual(
          expect.objectContaining(new WrongPasswordError()),
        );
      })
  ));
  it('should response with 404 status code', async () => {
    const email = 'johnn@binar.co.id';
    const password = '192745';

    return request(server)
      .post('/v1/auth/login')
      .send({ email, password })
      .set('Accept', 'application/json')
      .then((res) => {
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual(
          expect.objectContaining(new EmailNotRegisteredError(email).toJSON()),
        );
      });
  });
});

// whoami
describe('GET /v1/auth/whoami', () => {
  it('should response with 200 status code', async () => (
    request(server)
      .get('/v1/auth/whoami')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .then((res) => {
        const decodedToken = decodeToken(token);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(
          expect.objectContaining({
            id: decodedToken.id,
            email: decodedToken.email,
            name: decodedToken.name,
          }),
        );
      })
  ));
  it('should response with 401 status code', async () => (
    request(server)
      .get('/v1/auth/whoami')
      .set('Accept', 'application/json')
      .then((res) => {
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty(['error']);
      })
  ));
});

// menghapus user dan close koneksi sequelize

afterAll(async () => {
  await models.User.destroy({
    where: {
      email: user.email,
    },
  });
  models.sequelize.close();
  server.close();
});
