import type { Core } from '@strapi/strapi';
import { createAccountStore } from '../account-store';

export default ({ strapi }: { strapi: Core.Strapi }) => createAccountStore(strapi);
