import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;

  // NATS - Transporter
  NATS_SERVERS: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_ENDPOINT_SECRET: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
}

// validate envs with joi schema
const envsSchema = joi
  .object({
    PORT: joi.number().required(), // ya lo parsea a number
    DATABASE_URL: joi.string().required(),

    // NATS - Transporter
    NATS_SERVERS: joi.array().items(joi.string()).required(),

    // Stripe
    STRIPE_SECRET_KEY: joi.string().required(),
    STRIPE_ENDPOINT_SECRET: joi.string().required(),
    STRIPE_SUCCESS_URL: joi.string().required(),
    STRIPE_CANCEL_URL: joi.string().required(),
  })
  .unknown(true); // allow other envs not defined in schema - process.env

const { error, value } = envsSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env?.NATS_SERVERS?.split(','),
});
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envsVars: EnvVars = value;

export const envs = {
  PORT: envsVars.PORT,
  DATABASE_URL: envsVars.DATABASE_URL, // aunq no se use fuera d prisma, lo incluimos para q se valide

  // NATS - Transporter
  NATS_SERVERS: envsVars.NATS_SERVERS,

  // Stripe
  STRIPE_SECRET_KEY: envsVars.STRIPE_SECRET_KEY,
  STRIPE_ENDPOINT_SECRET: envsVars.STRIPE_ENDPOINT_SECRET,

  STRIPE_SUCCESS_URL: envsVars.STRIPE_SUCCESS_URL,
  STRIPE_CANCEL_URL: envsVars.STRIPE_CANCEL_URL,
};
