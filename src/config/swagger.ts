import swaggerJsdoc from 'swagger-jsdoc';

// Build servers list dynamically
const servers = [
  { url: 'http://localhost:3000', description: 'Local Development' },
];

// Add ngrok URL if available
if (process.env['NGROK_URL']) {
  servers.unshift({ url: process.env['NGROK_URL'], description: 'ngrok (Production)' });
}

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Stablestack Backend API',
      version: '1.0.0',
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['src/routes/**/*.ts'],
});
