export interface TokenBase { iss: string; sub: string; }
export interface TokenWithEmail extends TokenBase { email: string; }
export interface TokenWithName extends TokenBase { name: string; email?: string; }
export type Token = TokenWithEmail | TokenWithName;

export interface User {
    id: string;
    displayName: string;
    email?: string;
}

const isTokenWithName = (token: Token): token is TokenWithName => !!(token as TokenWithName).name;
const ensureUser = (token: Token): Promise<User> => {
    const tokenWithName = isTokenWithName(token) ? token : { ...token, name: token.email };
    // TODO: Create local user with unique id
    return Promise.resolve<User>({
        id: tokenWithName.sub, // TODO: Make sure to always return the local id
        displayName: tokenWithName.name,
        email: tokenWithName.email,
    });
};

export { ensureUser };