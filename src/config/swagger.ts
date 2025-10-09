import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

// Build servers list dynamically
const servers = [
  { url: 'http://localhost:3000', description: 'Local Development' },
];

// Add base URL if different from localhost
if (env.BASE_URL && !env.BASE_URL.includes('localhost')) {
  servers.unshift({ url: env.BASE_URL, description: 'Public URL' });
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
