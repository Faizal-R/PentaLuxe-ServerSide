import { it, describe, expect } from "vitest";
import request from "supertest";
import { app } from "../../../src/server.js";
import { statusCodes } from "../../../src/constant/statusCodes.js";


describe("Register API", () => {
  const endpoint = "/api/user/register";

  const userPayload = {
    username: "tester-bob",
    email: `bobby@gmail.com`,
    password: "testerbob@123",
    phone: "1234567890",
  };

  it("should register a user", async () => {
    const response = await request(app).post(endpoint).send(userPayload);

    expect(response.status).toBe(statusCodes.CREATED);

    expect(response.body.data).toMatchObject({
      email: userPayload.email,
      username: userPayload.username,
      phone: Number(userPayload.phone),
    });

    expect(response.body.data._id).toBeDefined();
  });

  it("should return 409 for duplicates", async () => {
    await request(app)
      .post(endpoint)
      .send(userPayload)
      .expect(statusCodes.CREATED);

    await request(app)
      .post(endpoint)
      .send(userPayload)
      .expect(statusCodes.CONFLICT);
  });
});
