import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { stytchClient } from '../stytchClient';

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_API_URL || 'http://localhost:4000/graphql',
});

const authLink = new ApolloLink((operation, forward) => {
  const stytchUser = stytchClient.user.getSync();
  const userId = import.meta.env.VITE_DEV_USER_ID || stytchUser?.user_id;
  const email = import.meta.env.VITE_DEV_USER_EMAIL || stytchUser?.emails?.[0]?.email;

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(userId ? { 'x-user-id': userId } : {}),
      ...(email ? { 'x-user-email': email } : {}),
    },
  }));

  return forward(operation);
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
