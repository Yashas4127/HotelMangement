export const isProductionEnvironment = process.env.NODE_ENV === 'production'
  || process.env.RENDER === 'true';
