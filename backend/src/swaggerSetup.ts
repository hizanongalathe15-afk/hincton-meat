import swaggerUi from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'

const swaggerDefinition: swaggerJSDoc.SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Hincton Meat Products API',
    version: '1.0.0',
    description: 'API documentation for Hincton Meat Products backend',
  },
  servers: [
    {
      url: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
}

const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: ['src/routes/*.ts', 'src/controllers/*.ts'],
})

export const swaggerUiSetup = swaggerUi.serve

export { swaggerSpec }
