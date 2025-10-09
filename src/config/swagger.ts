import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

// Build servers list dynamically
const servers = [
  { url: 'http://localhost:3000', description: 'Local Development' },
];

// Add base URL if different from localhost
const baseUrl = env.BASE_URL as string;
if (baseUrl && !baseUrl.includes('localhost')) {
  servers.unshift({ url: baseUrl, description: 'Public URL' });
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
