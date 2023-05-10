const clients =[
    {
        client_id: '0xf9a3cce444b65927a9dd225d6731b341',
        client_secret: 'none',
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code'],
        redirect_uris: ['http://localhost:3000','https://zk-oidc-simple-app.vercel.app'],
    },
    {
        client_id: '0xb4e91393c3b72d02608ed6dc5ee7829d',
        client_secret: 'none',
        token_endpoint_auth_method: 'client_secret_basic',
        grant_types: ['authorization_code'],
        redirect_uris: ['http://localhost:3000','https://zk-forum.discourse.group/auth/oidc/callback'],
    },
];

export default clients;