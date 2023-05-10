import * as path from 'node:path';
import { dirname } from 'desm';

import express, { urlencoded } from 'express';

import cors from 'cors';
import Provider from 'oidc-provider';

import { getSismoLink, getSismoAccountId } from './sismoUtils.js';

import configuration from '../config/index.js';

let adapter;
if (process.env.MONGODB_URI) {
  ({ default: adapter } = await import('./mongoAdapter.js'));
  await adapter.connect();
}

// prepare oidc provider with the required configuration
const provider = new Provider(configuration.issuer, { adapter, ...configuration.providerConfiguration });

// wire api to provider
const app = express();
app.use(cors());

// enable tls
if (process.env.VERCEL_ENV === 'production') {
  app.enable('trust proxy');
  provider.proxy = true;
}

// needed for redirect successfully to sismo connect app
const __dirname = dirname(import.meta.url);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const setNoCache = (req, res, next) => {
  res.set('cache-control', 'no-store');
  next();
}

// build a sismo connect request on login and redirect to sismo connect app 
app.get(`${configuration.basePath}/interaction/:uid`, setNoCache, async (req, res, next) => {
  try {
    const {
      uid, prompt, params
    } = await provider.interactionDetails(req, res);

    switch (prompt.name) {
      case 'login': {
        const reqLink = getSismoLink(params.client_id, `${configuration.basePath}/interaction/${uid}/confirm`)          
        // sismo connect app needs http referrer, we cannot redirect, need the browser todo
        return res.render('redirect', {
          redirectUrl: encodeURI(reqLink),
        })
      }
      default:
        return undefined;
    }
  } catch (err) {
    return next(err);
  }
});

// parse the sismo connect proof and create the corresponding oidc data
const body = urlencoded({ extended: false });
app.get(`${configuration.basePath}/interaction/:uid/confirm`, setNoCache, body, async (req, res, next) => {
  try {
    const interactionDetails = await provider.interactionDetails(req, res);

    const accountId = await getSismoAccountId(interactionDetails.params.client_id, req.query.sismoConnectResponseCompressed);

    const { params } = interactionDetails;

    let { grantId } = interactionDetails;
    let grant;

    if (grantId) {
      // we'll be modifying existing grant in existing session
      grant = await provider.Grant.find(grantId);
    } else {
      // we're establishing a new grant
      grant = new provider.Grant({
        accountId,
        clientId: params.client_id,
      });

      grant.addOIDCScope('openid email profile');
      grant.addOIDCClaims([
        'email', 'email_verified',
        'family_name', 'given_name', 'name',
      ]);
    }
    
    grantId = await grant.save();

    const consent = {};
    if (!interactionDetails.grantId) {
      // we don't have to pass grantId to consent, we're just modifying existing one
      consent.grantId = grantId;
    }

    const result = { consent, login: { accountId } };
    await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
  } catch (err) {
    next(err);
  }
});

app.use(configuration.basePath, provider.callback());

export default app;