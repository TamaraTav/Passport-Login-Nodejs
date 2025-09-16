const swaggerJsdoc = require("swagger-jsdoc");

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Passport Auth API",
      version: "1.0.0",
      description: "Authentication and password flows",
    },
    servers: [{ url: process.env.BASE_URL || "http://localhost:3002" }],
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            isVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Token: {
          type: "object",
          properties: {
            token: { type: "string" },
            userId: { type: "string" },
            email: { type: "string" },
            type: { type: "string", enum: ["verification", "reset"] },
            expiresAt: { type: "string", format: "date-time" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string" },
            message: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./routes/authRoutes.js", "./routes/passwordRoutes.js"],
});

module.exports = swaggerSpec;
