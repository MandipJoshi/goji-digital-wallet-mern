const request = require('supertest');
const app = require('../index');

describe('User API', () => {
  const timestamp = Date.now();
  const testUser = {
    full_name: 'Test User',
    email: `testuser_${timestamp}@example.com`,
    phone: `10000${Math.floor(Math.random() * 89999)}`,
    password: 'TestPassword123!',
  };

  let userToken;

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send(testUser);

    expect([201, 409]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('id');
      userId = res.body.user.id;
    }
  });

  it('should not register with duplicate email', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ ...testUser, phone: `555${Math.floor(Math.random() * 10000000)}` });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Email already registered/i);
  });

  it('should not register with duplicate phone', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ ...testUser, email: `other_${Date.now()}@example.com` });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Phone number already registered/i);
  });

  it('should not register with missing fields', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'missing@example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    userToken = res.body.token;
  });

  it('should not login with wrong password', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: testUser.email, password: 'WrongPassword!' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid credentials/i);
  });

  it('should not login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'nonexistent@example.com', password: 'TestPassword123!' });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/User not found/i);
  });

  it('should not update password without token', async () => {
    const res = await request(app)
      .patch('/api/user/update-password')
      .send({ oldPassword: testUser.password, newPassword: 'NewPassword123!' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should update password with correct old password', async () => {
    const res = await request(app)
      .patch('/api/user/update-password')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ oldPassword: testUser.password, newPassword: 'NewPassword123!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should not update password with wrong old password', async () => {
    const res = await request(app)
      .patch('/api/user/update-password')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ oldPassword: 'WrongPassword!', newPassword: 'AnotherNewPassword123!' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Old password is incorrect/i);
  });
});
