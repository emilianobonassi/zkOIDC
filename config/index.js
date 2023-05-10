import clients from "./clients.js";
import { interactionPolicy } from 'oidc-provider';

// add clients metadata
const configuration = {
    providerConfiguration: {
        clients,
        features: {
            devInteractions: {
                enabled: false,
            },
        }
    }
} 

// issuer configuration
//needed to run on vercel, should be the same in vercel.json
const basePath = '/oidc';
configuration.basePath = basePath;

let ISSUER = '';
if (process.env.ISSUER) {
    ISSUER = process.env.ISSUER;
} else if (process.env.PRODUCTION_URL) {
    ISSUER = `${process.env.PRODUCTION_URL}${basePath}`;
} else {
    const { PORT = 3000 } = process.env;
    ISSUER = `https://localhost:${PORT}${basePath}`;
}

configuration.issuer = ISSUER;

// interaction url
configuration.providerConfiguration.interactions = {
    url: (ctx, interaction) => {
        return `${basePath}/interaction/${interaction.uid}`;
    }
}

// disable pkce
configuration.providerConfiguration.pkce = {
    required: (ctx, client) => false,
}

// enable client credentials
configuration.providerConfiguration.features.clientCredentials = {
    enabled: true,
}

// account wrapping and claim configuration
configuration.providerConfiguration.findAccount = async (ctx, id) => {
    console.log('zzz '+ id);
    return {
        accountId: id,
        claims: async (use, scope) => {
            console.log({use, scope})
        return { 
            sub: id,
            email: `${id}@sismo.local`,
            email_verified: true,
            family_name: id,
            given_name: id,
            name: id,
        }},
    }
}

//claims configuration
configuration.providerConfiguration.claims =  {
    email: ['email', 'email_verified'],
    profile: ['family_name', 'given_name', 'name'],
}
configuration.providerConfiguration.conformIdTokenClaims = false;

export default configuration;