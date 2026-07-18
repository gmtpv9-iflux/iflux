'use strict';

function buildOpenApiSpec(config) {
  const port = config.PORT;
  return {
    openapi: '3.0.3',
    info: {
      title: 'iFlux API',
      version: '0.1.0',
      description: 'Bootstrap foundation — Contract path namespace /v1'
    },
    servers: [{ url: `http://localhost:${port}/v1`, description: `${config.APP_ENV} server` }],
    tags: [
      { name: 'Health', description: 'Health & readiness probes' },
      { name: 'Auth', description: 'Legacy auth (pre-feature module)' }
    ],
    paths: {
      '/health/live': {
        get: {
          tags: ['Health'],
          summary: 'Liveness probe',
          responses: { 200: { description: 'Service is alive' } }
        }
      },
      '/health/ready': {
        get: {
          tags: ['Health'],
          summary: 'Readiness probe (DB + Redis)',
          responses: { 200: { description: 'Ready' }, 503: { description: 'Degraded' } }
        }
      },
      '/health/info': {
        get: {
          tags: ['Health'],
          summary: 'Runtime info',
          responses: { 200: { description: 'Info' } }
        }
      },
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register (legacy response shape)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Token + user' } }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login (legacy response shape)',
          responses: { 200: { description: 'Token + user' } }
        }
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Current user profile',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Profile' } }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  };
}

module.exports = { buildOpenApiSpec };
