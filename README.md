<div align="center">
  <img width="150" alt="" src="https://github.com/holipoly/auth-sdk/assets/1338731/c90a73d0-5ef1-4d09-9347-c5d02cd7244d">
</div>

<div align="center">
  
# Holipoly Auth SDK

Holipoly Auth SDK integrates secure and customizable authentication and authorization into storefronts using Holipoly.


<br/>

<div align="center">


</div>

## Usage

### Next.js App Router

Next.js 13+ App Router is the recommended way to use the Holipoly Auth SDK. It is the easiest to set up and provides the best user experience.

In order to use Holipoly Auth SDK in React Server Components, the client needs to be created in the following way:

```ts
import { createHolipolyAuthClient } from "@holipoly/auth-sdk";
import { getNextServerCookiesStorage } from "@holipoly/auth-sdk/next/server";

const getServerAuthClient = () => {
  const nextServerCookiesStorage = getNextServerCookiesStorage();
  return createHolipolyAuthClient({
    holipolyApiUrl: "…",
    refreshTokenStorage: nextServerCookiesStorage,
    accessTokenStorage: nextServerCookiesStorage,
  });
};
```

Logging in can be implemented via Server Actions:

```tsx
<form
  className="bg-white shadow-md rounded p-8"
  action={async (formData) => {
    "use server";

    await getServerAuthClient().signIn(
      {
        email: formData.get("email").toString(),
        password: formData.get("password").toString(),
      },
      { cache: "no-store" },
    );
  }}
>
  {/* … rest of the form … */}
</form>
```

Then, you can use `holipolyAuthClient.fetchWithAuth` directly for any queries and mutations.

For a full working example, see the [Holipoly Auth SDK example](https://github.com/holipoly/example-auth-sdk/tree/app/ssr/page.tsx).

### Next.js Pages Router with [Apollo Client](https://www.apollographql.com/docs/react/)

When using Next.js (Pages Router) along with [Apollo Client](https://www.apollographql.com/docs/react/), there are two essential steps to setting up your application. First, you have to surround your application's root with two providers: `<HolipolyAuthProvider>` and `<ApolloProvider>`.

`<HolipolyAuthProvider>` comes from our React.js-auth package, located at `@holipoly/auth-sdk/react`, and it needs to be set up with the Holipoly auth client instance.

The `<ApolloProvider>` comes from `@apollo/client` and it needs the live GraphQL client instance, which is enhanced with the authenticated `fetch` that comes from the Holipoly auth client.

Lastly, you must run the `useAuthChange` hook. This links the `onSignedOut` and `onSignedIn` events.

Let's look at an example:

```tsx
import { AppProps } from "next/app";
import { ApolloProvider, ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { createHolipolyAuthClient } from "@holipoly/auth-sdk";
import { HolipolyAuthProvider, useAuthChange } from "@holipoly/auth-sdk/react";

const holipolyApiUrl = "<your Holipoly API URL>";

// Holipoly Client
const holipolyAuthClient = createHolipolyAuthClient({ holipolyApiUrl });

// Apollo Client
const httpLink = createHttpLink({
  uri: holipolyApiUrl,
  fetch: holipolyAuthClient.fetchWithAuth,
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default function App({ Component, pageProps }: AppProps) {
  useAuthChange({
    holipolyApiUrl,
    onSignedOut: () => apolloClient.resetStore(),
    onSignedIn: () => {
      apolloClient.refetchQueries({ include: "all" });
    },
  });

  return (
    <HolipolyAuthProvider client={holipolyAuthClient}>
      <ApolloProvider client={apolloClient}>
        <Component {...pageProps} />
      </ApolloProvider>
    </HolipolyAuthProvider>
  );
}
```

Then, in your register, login and logout forms you can use the auth methods (`signIn`, `signOut`, `isAuthenticating`) provided by the `useHolipolyAuthContext()`. For example, `signIn` is usually triggered when submitting the login form credentials.

```tsx
import React, { FormEvent } from "react";
import { useHolipolyAuthContext } from "@holipoly/auth-sdk/react";
import { gql, useQuery } from "@apollo/client";

const CurrentUserDocument = gql`
  query CurrentUser {
    me {
      id
      email
      firstName
      lastName
      avatar {
        url
        alt
      }
    }
  }
`;

export default function LoginPage() {
  const { signIn, signOut } = useHolipolyAuthContext();

  const { data: currentUser, loading } = useQuery(CurrentUserDocument);

  const submitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await signIn({
      email: "admin@example.com",
      password: "admin",
    });

    if (result.data.tokenCreate.errors) {
      // handle errors
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      {currentUser?.me ? (
        <>
          <div>Display user {JSON.stringify(currentUser)}</div>
          <button className="button" onClick={() => signOut()}>
            Log Out
          </button>
        </>
      ) : (
        <div>
          <form onSubmit={submitHandler}>
            {/* You must connect your inputs to state or use a form library such as react-hook-form */}
            <input type="email" name="email" placeholder="Email" />
            <input type="password" name="password" placeholder="Password" />
            <button className="button" type="submit">
              Log In
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
```

### Next.js (Pages Router) with [urql](https://formidable.com/open-source/urql/)

When using Next.js (Pages Router) along with [urql](https://formidable.com/open-source/urql/) client, there are two essential steps to setting up your application. First, you have to surround your application's root with two providers: `<HolipolyAuthProvider>` and `<Provider>`.

`<HolipolyAuthProvider>` comes from our React.js-auth package, located at `@holipoly/auth-sdk/react`, and it needs to be set up with the Holipoly auth client.

The `<Provider>` comes from `urql` and it needs the GraphQL client instance, which is enhanced with the authenticated `fetch` that comes from the Holipoly auth client.

Lastly, you must run the `useAuthChange` hook. This links the `onSignedOut` and `onSignedIn` events and is meant to refresh the GraphQL store and in-flight active GraphQL queries.

Let's look at an example:

```tsx
import { AppProps } from "next/app";
import { Provider, cacheExchange, fetchExchange, ssrExchange } from "urql";
import { HolipolyAuthProvider, useAuthChange } from "@holipoly/auth-sdk/react";

const holipolyApiUrl = "<your Holipoly API URL>";

const holipolyAuthClient = createHolipolyAuthClient({ holipolyApiUrl });

const makeUrqlClient = () =>
  createClient({
    url: holipolyApiUrl,
    fetch: holipolyAuthClient.fetchWithAuth,
    exchanges: [cacheExchange, fetchExchange],
  });

export default function App({ Component, pageProps }: AppProps) {
  // https://github.com/urql-graphql/urql/issues/297#issuecomment-504782794
  const [urqlClient, setUrqlClient] = useState<Client>(makeUrqlClient());

  useAuthChange({
    holipolyApiUrl,
    onSignedOut: () => setUrqlClient(makeUrqlClient()),
    onSignedIn: () => setUrqlClient(makeUrqlClient()),
  });

  return (
    <HolipolyAuthProvider client={holipolyAuthClient}>
      <Provider value={urqlClient}>
        <Component {...pageProps} />
      </Provider>
    </HolipolyAuthProvider>
  );
}
```

Then, in your register, login and logout forms you can use the auth methods (`signIn`, `signOut`) provided by the `useHolipolyAuthContext()`. For example, `signIn` is usually triggered when submitting the login form credentials.

```tsx
import React, { FormEvent } from "react";
import { useHolipolyAuthContext } from "@holipoly/auth-sdk/react";
import { gql, useQuery } from "urql";

const CurrentUserDocument = gql`
  query CurrentUser {
    me {
      id
      email
      firstName
      lastName
      avatar {
        url
        alt
      }
    }
  }
`;

export default function LoginPage() {
  const { signIn, signOut } = useHolipolyAuthContext();

  const [{ data: currentUser, fetching: loading }] = useQuery({
    query: CurrentUserDocument,
    pause: isAuthenticating,
  });

  const submitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await signIn({
      email: "admin@example.com",
      password: "admin",
    });

    if (result.data.tokenCreate.errors) {
      // handle errors
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      {currentUser?.me ? (
        <>
          <div>Display user {JSON.stringify(currentUser)}</div>
          <button className="button" onClick={() => signOut()}>
            Log Out
          </button>
        </>
      ) : (
        <div>
          <form onSubmit={submitHandler}>
            {/* You must connect your inputs to state or use a form library such as react-hook-form */}
            <input type="email" name="email" placeholder="Email" />
            <input type="password" name="password" placeholder="Password" />
            <button className="button" type="submit">
              Log In
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
```

### Next.js (Pages Router) with OpenID Connect

Setup `_app.tsx` as described above. In your login component trigger the external auth flow using the following code:

```tsx
import { useHolipolyAuthContext, useHolipolyExternalAuth } from "@holipoly/auth-sdk/react";
import { ExternalProvider } from "@holipoly/auth-sdk";
import Link from "next/link";
import { gql, useQuery } from "@apollo/client";

export default function Home() {
  const {
    loading: isLoadingCurrentUser,
    error,
    data,
  } = useQuery(gql`
    query CurrentUser {
      me {
        id
        email
        firstName
        lastName
      }
    }
  `);
  const { authURL, loading: isLoadingExternalAuth } = useHolipolyExternalAuth({
    holipolyApiUrl,
    provider: ExternalProvider.OpenIDConnect,
    redirectURL: "<your Next.js app>/api/auth/callback",
  });

  const { signOut } = useHolipolyAuthContext();

  if (isLoadingExternalAuth || isLoadingCurrentUser) {
    return <div>Loading...</div>;
  }

  if (data?.me) {
    return (
      <div>
        {JSON.stringify(data)}
        <button onClick={() => signOut()}>Logout</button>
      </div>
    );
  }
  if (authURL) {
    return (
      <div>
        <Link href={authURL}>Login</Link>
      </div>
    );
  }
  return <div>Something went wrong</div>;
}
```

You also need to define the auth callback. In `pages/api/auth` create the `callback.ts` with the following content:

```ts
import { ExternalProvider, HolipolyExternalAuth } from "@holipoly/auth-sdk";
import { createHolipolyExternalAuthHandler } from "@holipoly/auth-sdk/next";

const externalAuth = new HolipolyExternalAuth("<your Holipoly instance URL>", ExternalProvider.OpenIDConnect);

export default createHolipolyExternalAuthHandler(externalAuth);
```

## FAQ

## How do I reset password?

The `HolipolyAuthClient` class provides you with a reset password method. If the reset password mutation is successful, it will log you in automatically, just like after a regular sign-in. The [`onSignIn` method of `useAuthChange` hook](#how-do-i-tell-my-graphql-client-to-refresh-queries-on-signin--signout) will also be triggered.

```javascript
const { resetPassword } = useHolipolyAuthContext();

const response = await resetPassword({
  email: "example@mail.com",
  password: "newPassword",
  token: "apiToken",
});
```
