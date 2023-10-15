const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "AUTHENTICATION SERVICE",
      version: "1.0.0",
    },
  },
  apis: ["auth-service.js"],
};

const additionalOption = {
  explorer: true,
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Akara-API-docs",
  customfavIcon: "../assets/favicon.ico",
};

module.exports = {
  swaggerOptions,
  additionalOption,
};
