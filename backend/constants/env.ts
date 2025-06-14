// ENVIRONMENT
export enum Environment {
  DEVELOPMENT = "development",
  PRODUCTION = "production",
}
export const ENV = process.env.NODE_ENV || Environment.DEVELOPMENT;